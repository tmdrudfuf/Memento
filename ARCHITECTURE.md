# Memento — Architecture & Decisions (Phase 3)

Principle: the smallest architecture that can test H1 (see PRODUCT_ASSESSMENT.md).

## Decisions

| # | Decision | Chosen | Alternatives considered | Why |
|---|---|---|---|---|
| D1 | Mobile framework | **Expo SDK 57 (React Native 0.86, TypeScript)** | Flutter, native Swift + Kotlin | One codebase for iOS and Android. It runs on real devices through Expo Go with no local Xcode or Android SDK (none exists on this dev machine). EAS handles cloud builds and store submission. |
| D2 | Navigation | **expo-router** (file routes in `src/app/`) | react-navigation directly | The Expo default; the least wiring. |
| D3 | Persistence | **Local-first, on-device SQLite (expo-sqlite)** | AsyncStorage JSON, cloud DB | Relational data (jar → memory → media), cascading deletes, atomic writes. Works in Expo Go. |
| D4 | Media | **Copy picked or captured files into `Paths.document/media/`. The DB stores filenames only.** | Reference library asset ids | Picker URIs live in the cache (which the OS can purge). Referencing library ids needs full photo-library permission, and the keepsake would break if the user deleted the original. The iOS container path can change across app updates, so absolute URIs are never stored; `mediaUri(name)` resolves them at render. |
| D5 | Image size | Picker `quality: 0.8` (JPEG re-encode). Videos use iOS `H264_1920x1080` export. | Store originals | Bounds storage. It also avoids the iOS permission prompt that the `Passthrough` video preset triggers, and HEIC becomes a portable JPEG. |
| D6 | Backend | **None** | Supabase, Firebase | H1 is single-user and offline. A backend adds cost, auth, a privacy surface and ops, and none of it tests the hypothesis. |
| D7 | Auth / accounts | **None** | Email/OAuth | No backend means no accounts. The account-deletion requirement is N/A: uninstalling deletes everything. |
| D8 | Analytics | **None (no SDK).** Local counters: `openCount` and `lastOpenedAt` per memory, plus totals on Home | Firebase Analytics, PostHog | Privacy (§30). 5–10 testers are measured by reading the counters and by interview. |
| D9 | Permissions | Library access via the **system picker, which needs no permission**. **Camera** is requested only when the camera button is used. Microphone is on for camera video. No full media-library read. | Full library access | Minimum permissions (§14). |
| D10 | Location | **Deferred** | EXIF GPS | Android needs `ACCESS_MEDIA_LOCATION` plus library permission, which breaks D9. |
| D11 | IDs | SQLite `INTEGER PRIMARY KEY` | UUIDs | No sync exists. Switch to UUIDs if sync or sharing ever lands. |
| D12 | Tests | `node:test` + the built-in `node:sqlite` running the real SQL from `src/lib/db.ts`, plus `tsc`, `expo lint`, `expo export` (bundle build) and `expo-doctor` | Jest + mocks | Zero added test dependencies, and the real schema and queries are exercised. UI and media are validated on a device (Expo Go). |
| D13 | Distribution | **Android: GitHub Actions** builds a signed AAB and APK (`.github/workflows/android-release.yml`, upload key in repo secrets, `plugins/withReleaseSigning.js`). **iOS: EAS Build** (cloud build, no Mac needed) | EAS for both | EAS's free Android quota ran out, and GitHub Actions is free and unmetered for public repos. The same upload key can be uploaded to EAS later if we switch back. |

## Data model

```sql
jars     (id INTEGER PK, name TEXT NOT NULL, createdAt INT, updatedAt INT)
memories (id INTEGER PK, jarId INT → jars ON DELETE CASCADE, cover TEXT NOT NULL,
          title TEXT, note TEXT, memoryDate INT NOT NULL, createdAt INT, updatedAt INT,
          openCount INT DEFAULT 0, lastOpenedAt INT)
media    (id INTEGER PK, memoryId INT → memories ON DELETE CASCADE,
          file TEXT NOT NULL, kind TEXT CHECK (kind IN ('photo','video')), createdAt INT)
```

Migrations use `PRAGMA user_version` in `migrate()` (`src/lib/db.ts`). `foreign_keys = ON` is set on every open.

## Deletion semantics

1. Collect the filenames the rows reference (the cover plus media).
2. Delete the rows. The cascade handles children.
3. Delete the files.

If step 3 fails, the only result is an orphaned file, never a row pointing at a missing file. The renderer still tolerates missing files.

## Privacy & data location (§14, §30)

- **What leaves the device:** nothing. There is no network code, no SDKs and no telemetry.
- **Where data lives:** the app sandbox, as `SQLite/memento.db` plus `Documents/media/*`.
- **Backups:** the OS default applies.
  - **iOS:** the Documents directory is included in the user's own iCloud or computer backup.
  - **Android:** Auto Backup to the user's Google account covers app data up to 25 MB and skips it beyond that.
  - No data is ever sent to our servers, because there are none.
- **Deletion:** in-app deletes remove the files. Uninstalling removes everything.
- **Encryption:** relies on OS data protection (iOS file protection, Android FBE). Extra app-level encryption is deferred. It adds key-management risk (a lost key means lost memories) with little gain on a locked device.
- **Known limitation:** a new phone without a backup restore means the memories are lost. Export/backup is the top candidate after H1 is validated.

## Structure

```
src/app/_layout.tsx         SQLiteProvider + Stack
src/app/index.tsx           Home (shelf)
src/app/jar/[id].tsx        Jar
src/app/capture.tsx         Capture sheet (modal)
src/app/memory/[id].tsx     Memory
src/app/viewer.tsx          Full-screen photo/video
src/lib/db.ts               schema, migrations, queries (pure, tested)
src/lib/media.ts            pick / capture / copy / delete files
src/lib/ui.tsx              shared visual components
test/db.test.ts             node:test against node:sqlite
```

## Deferred (with trigger)

| Item | Add when |
|---|---|
| Share-sheet "Add to Memento" (needs a dev build and a native share extension) | First, if testers report "the photo is in Photos, opening another app is friction" |
| Export / backup | H1 passes |
| Change cover, location, map, timeline, sharing, AI | Per masterplan §36 |
