import { Directory, File, Paths } from 'expo-file-system';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as Sharing from 'expo-sharing';
import { Alert, Linking } from 'react-native';
import { parseExifDate, type MediaKind } from './db';

// Media lives in Documents/media; the DB stores only file names, because the
// iOS container path can change across app updates.
const dir = () => new Directory(Paths.document, 'media');

export const mediaUri = (name: string) => new File(dir(), name).uri;

export type Picked = { file: string; kind: MediaKind; date: number | null };

const options = (multiple: boolean, videos: boolean): ImagePicker.ImagePickerOptions => ({
  mediaTypes: videos ? ['images', 'videos'] : ['images'],
  allowsMultipleSelection: multiple,
  quality: 0.8, // re-encode to JPEG: bounded size, HEIC becomes portable
  exif: !multiple, // only the cover needs its date
  // Non-passthrough export avoids iOS's full-library permission prompt for videos.
  videoExportPreset: ImagePicker.VideoExportPreset.H264_1920x1080,
  shouldDownloadFromNetwork: true,
});

async function keep(assets: ImagePicker.ImagePickerAsset[]): Promise<Picked[]> {
  const d = dir();
  if (!d.exists) d.create({ intermediates: true });
  const out: Picked[] = [];
  try {
    for (const a of assets) {
      const kind: MediaKind = a.type === 'video' ? 'video' : 'photo';
      const src = new File(a.uri);
      const ext = src.extension || (kind === 'video' ? '.mp4' : '.jpg');
      const name = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
      await src.copy(new File(d, name));
      out.push({ file: name, kind, date: parseExifDate(a.exif?.DateTimeOriginal ?? a.exif?.DateTime) });
    }
  } catch (e) {
    removeFiles(out.map((p) => p.file)); // no partial saves
    throw e;
  }
  return out;
}

/** System picker: no photo-library permission needed. Returns [] if cancelled. */
export async function pickFromLibrary({ multiple = false, videos = false } = {}) {
  const r = await ImagePicker.launchImageLibraryAsync(options(multiple, videos));
  return r.canceled ? [] : keep(r.assets);
}

/** Camera: permission requested only here, only when used. */
export async function takeWithCamera({ videos = false } = {}) {
  const perm = await ImagePicker.requestCameraPermissionsAsync();
  if (!perm.granted) {
    Alert.alert(
      'Camera access is off',
      'You can still choose a photo from your library, or allow camera access in Settings.',
      [{ text: 'OK' }, { text: 'Open Settings', onPress: () => Linking.openSettings() }],
    );
    return [];
  }
  const r = await ImagePicker.launchCameraAsync(options(false, videos));
  return r.canceled ? [] : keep(r.assets);
}

export function removeFiles(names: string[]) {
  for (const n of names) {
    try {
      const f = new File(dir(), n);
      if (f.exists) f.delete();
    } catch {
      // an orphaned file is harmless; a dangling DB row is not (see ARCHITECTURE.md)
    }
  }
}

export function saveFailed(e: unknown) {
  console.warn(e);
  Alert.alert("Couldn't save this", 'Please try again. If the photo is only in iCloud, check your connection.');
}

/** + / Camera → copy the symbolic photo → Capture sheet (choose a jar = saved). */
export async function startCapture(camera: boolean, jarId?: number) {
  try {
    const [p] = camera ? await takeWithCamera() : await pickFromLibrary();
    if (!p) return;
    router.push({
      pathname: '/capture',
      params: { file: p.file, date: p.date ? String(p.date) : '', jarId: jarId ? String(jarId) : '' },
    });
  } catch (e) {
    saveFailed(e);
  }
}

/** Opens the system share menu for one of our media files. */
export async function shareFile(name: string) {
  try {
    await Sharing.shareAsync(mediaUri(name));
  } catch (e) {
    console.warn(e);
    Alert.alert("Couldn't share this", 'Please try again.');
  }
}

/** Bytes used by all copied photos and videos. */
export function storageUsed() {
  const d = dir();
  if (!d.exists) return 0;
  return d.list().reduce((sum, f) => sum + (f instanceof File ? (f.size ?? 0) : 0), 0);
}

/** Removes every media file (used by "Delete all data"). */
export function removeAllMedia() {
  const d = dir();
  if (d.exists) d.delete();
}
