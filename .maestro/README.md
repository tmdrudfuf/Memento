# End-to-end tests (Maestro)

Real taps on a real build, covering the core loop plus the risky paths.

| Flow | Checks |
|---|---|
| `01-first-memory` | Fresh install → welcome → one photo → first board (3 taps + name) |
| `02-memory-details` | Title/note autosave, related photos, survive restart, viewer swipe |
| `03-free-board-limit` | 4th board → paywall; existing boards stay open |
| `04-backup-export` | Export builds a zip and reaches the share sheet |
| `05-delete` | Delete memory, then board → empty shelf |

## Run
1. **Install Maestro:** unzip the `maestro.zip` from github.com/mobile-dev-inc/maestro/releases into your home folder.
2. **Start an Android emulator** that has a few photos in its gallery (the picker picks the newest ones).
3. **Turn off stylus handwriting**, which otherwise hijacks typing: `adb shell settings put secure stylus_handwriting_enabled 0`
4. **Install a QA build** (release build of this repo, `com.tmdrudfuf.memento`).
5. **Run:** `npm run e2e`

Every flow starts with `clearState`, so they are independent and can run in any order.
