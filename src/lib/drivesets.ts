// Which Google Drive backup files belong together, which set to restore, which to delete.
// A backup "set" is 1..N zip parts uploaded together; appProperties carry set id and part numbers.

export type DriveFile = {
  id: string;
  name: string;
  createdTime: string; // RFC 3339
  size?: string;
  appProperties?: { set?: string; part?: string; parts?: string };
};

export type BackupSet = { id: string; createdTime: string; files: DriveFile[] };

export function groupSets(files: DriveFile[]): BackupSet[] {
  const sets = new Map<string, BackupSet>();
  for (const f of files) {
    const id = f.appProperties?.set;
    if (!id) continue;
    const s = sets.get(id) ?? { id, createdTime: f.createdTime, files: [] };
    s.files.push(f);
    if (f.createdTime > s.createdTime) s.createdTime = f.createdTime;
    sets.set(id, s);
  }
  for (const s of sets.values())
    s.files.sort((a, b) => Number(a.appProperties?.part ?? 0) - Number(b.appProperties?.part ?? 0));
  return [...sets.values()].sort((a, b) => b.createdTime.localeCompare(a.createdTime));
}

/** A set is complete when every part 1..N is present (an interrupted upload leaves gaps). */
export function isComplete(s: BackupSet) {
  const parts = Number(s.files[0]?.appProperties?.parts ?? 0);
  if (!parts || s.files.length !== parts) return false;
  return s.files.every((f, i) => Number(f.appProperties?.part) === i + 1);
}

/** Newest complete set: what "Restore from Google Drive" uses. */
export function latestComplete(files: DriveFile[]): BackupSet | null {
  return groupSets(files).find(isComplete) ?? null;
}

/** Everything except the set we keep (older sets and leftovers of failed uploads). */
export function filesToDelete(files: DriveFile[], keepSetId: string): DriveFile[] {
  return files.filter((f) => f.appProperties?.set !== keepSetId);
}
