import Constants, { ExecutionEnvironment } from 'expo-constants';
import { File, Paths, UploadType } from 'expo-file-system';
import { buildBackup, importBackupFile } from './backup';
import { config } from './config';
import type { DB } from './db';
import { filesToDelete, latestComplete, type DriveFile } from './drivesets';

// Premium: backups go to the hidden app folder of the user's OWN Google Drive (drive.appdata scope).
// Memento has no server; only this app, signed in as the user, can read that folder.
const SCOPE = 'https://www.googleapis.com/auth/drive.appdata';
const API = 'https://www.googleapis.com/drive/v3';
const UPLOAD = 'https://www.googleapis.com/upload/drive/v3';

type GoogleSignInModule = typeof import('@react-native-google-signin/google-signin');
const inExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
// eslint-disable-next-line @typescript-eslint/no-require-imports -- native module, absent in Expo Go
const load = (): GoogleSignInModule | null => (inExpoGo ? null : require('@react-native-google-signin/google-signin'));

/** False in Expo Go and until the Google Cloud OAuth client is configured (config.google.webClientId). */
export const driveAvailable = () => !inExpoGo && !!config.google.webClientId;

let configured = false;
function gs() {
  const m = load();
  if (!m || !config.google.webClientId) throw new Error('Google Drive backup is not set up in this build');
  if (!configured) {
    m.GoogleSignin.configure({ webClientId: config.google.webClientId, scopes: [SCOPE] });
    configured = true;
  }
  return m;
}

export type DriveUser = { name: string | null; email: string };

/** Interactive sign-in (asks for Drive app-folder access). Null if the user cancels. */
export async function connectDrive(): Promise<DriveUser | null> {
  const { GoogleSignin, isSuccessResponse } = gs();
  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  const r = await GoogleSignin.signIn();
  if (!isSuccessResponse(r)) return null;
  if (!r.data.scopes.includes(SCOPE) && !(await GoogleSignin.addScopes({ scopes: [SCOPE] }))) return null;
  return { name: r.data.user.name, email: r.data.user.email };
}

/** Restores the session without UI (used by automatic backup). */
async function ensureSignedIn() {
  const { GoogleSignin } = gs();
  if (GoogleSignin.getCurrentUser()) return;
  const r = await GoogleSignin.signInSilently();
  if (r.type !== 'success') throw new Error('Not signed in to Google');
}

export async function disconnectDrive() {
  const { GoogleSignin } = gs();
  await GoogleSignin.revokeAccess().catch(() => {}); // removes Memento's Drive permission too
  await GoogleSignin.signOut();
}

async function authHeader() {
  await ensureSignedIn();
  const { accessToken } = await gs().GoogleSignin.getTokens();
  return { Authorization: `Bearer ${accessToken}` };
}

async function api(path: string, init: RequestInit = {}) {
  const res = await fetch(`${API}${path}`, { ...init, headers: { ...(await authHeader()), ...init.headers } });
  if (!res.ok) throw new Error(`Drive ${init.method ?? 'GET'} ${path}: ${res.status} ${await res.text()}`);
  return res;
}

export async function listBackups(): Promise<DriveFile[]> {
  const q = 'spaces=appDataFolder&pageSize=1000&fields=files(id,name,createdTime,size,appProperties)';
  return (await (await api(`/files?${q}`)).json()).files ?? [];
}

/**
 * Builds the backup and uploads every part (resumable upload; the file streams natively, so large
 * backups never sit in JS memory). Older backup sets are removed only after the new one is complete.
 */
export async function backupToDrive(
  db: DB,
  onProgress?: (label: 'prepare' | 'upload', done: number, total: number) => void,
) {
  const parts = await buildBackup(db, (d, t) => onProgress?.('prepare', d, t));
  const set = String(Date.now());
  try {
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      const init = await fetch(`${UPLOAD}/files?uploadType=resumable`, {
        method: 'POST',
        headers: {
          ...(await authHeader()),
          'Content-Type': 'application/json; charset=UTF-8',
          'X-Upload-Content-Type': 'application/zip',
          'X-Upload-Content-Length': String(part.size ?? 0),
        },
        body: JSON.stringify({
          name: part.name,
          parents: ['appDataFolder'],
          appProperties: { set, part: String(i + 1), parts: String(parts.length) },
        }),
      });
      const session = init.headers.get('location');
      if (!init.ok || !session) throw new Error(`Drive upload start failed: ${init.status}`);
      const res = await part.upload(session, {
        httpMethod: 'PUT',
        uploadType: UploadType.BINARY_CONTENT,
        headers: { 'Content-Type': 'application/zip' },
        onProgress: ({ bytesSent, totalBytes }) =>
          onProgress?.('upload', i * 100 + (100 * bytesSent) / (totalBytes || 1), parts.length * 100),
      });
      if (res.status >= 300) throw new Error(`Drive upload failed: ${res.status} ${res.body}`);
    }
    for (const f of filesToDelete(await listBackups(), set)) await api(`/files/${f.id}`, { method: 'DELETE' });
  } finally {
    parts.forEach((p) => p.exists && p.delete());
  }
  return parts.length;
}

/** Downloads the newest complete backup set and merges it into this phone (safe to repeat). */
export async function restoreFromDrive(db: DB) {
  const set = latestComplete(await listBackups());
  if (!set) return null;
  let jars = 0;
  let memories = 0;
  for (const f of set.files) {
    const dest = new File(Paths.cache, `drive-${f.id}.zip`);
    if (dest.exists) dest.delete();
    await File.downloadFileAsync(`${API}/files/${f.id}?alt=media`, dest, { headers: await authHeader() });
    try {
      const r = await importBackupFile(db, dest);
      jars += r.jars;
      memories += r.memories;
    } finally {
      dest.delete();
    }
  }
  return { jars, memories, createdTime: set.createdTime };
}

/** Removes every Memento backup from the user's Drive (offered when disconnecting). */
export async function deleteDriveBackups() {
  for (const f of await listBackups()) await api(`/files/${f.id}`, { method: 'DELETE' });
}
