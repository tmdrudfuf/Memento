# Memento — Release & QA

## QA record (Android emulator, API 35, Expo Go 57.0.9 — 2026-09-27)

| Case | Result |
|---|---|
| First launch, empty shelf | ✅ empty state + capture bar |
| Library capture: no permission prompt (system picker, "can only access the photos you select") | ✅ |
| First memory: inline first-jar naming | ✅ + → photo → name → Enter |
| Capture into existing jar | ✅ **3 taps** (+ → photo → jar chip) |
| Memory date from EXIF `DateTimeOriginal` | ✅ (Mar 10 photo → "Mar 10, 2026") |
| Last-used jar preselected / sorted first | ✅ |
| Title/note save as you type; leaving without blur | ✅ persisted |
| Related photos (multi-select) / video | ✅ copied into app storage (.jpeg / .mp4) |
| Viewer: photo, video playback | ✅ |
| Android date dialog edit | ✅ persists |
| Force-stop + relaunch | ✅ jars, memories, title, note, media intact |
| Camera: deny → explanatory alert with Settings | ✅ |
| Camera: allow → capture → save | ✅ |
| Abandoned capture (back out of the sheet) | ✅ copied file removed (5 → 4) |
| Remove item / delete memory / delete jar | ✅ exactly the right files removed (4, 6→5, 5→4) |
| Rename jar | ✅ |
| Large images (3000×4000 JPEG) | ✅ re-encoded at q0.8, ~95 KB for test images |
| Multiple jars & memories, stack shows latest covers | ✅ |

### Big-collection QA (QA APK, emulator, 12 boards / 500 memories / 1,090 photos / 1.3 GB, 2026-09-29)

| Check | Result |
|---|---|
| Cold start | ~1.2–1.4 s |
| Board with 47 memories: fling scroll | 2.4% janky frames (emulator renders in software; its GPU floor is 18 ms) |
| Yearly recap, 77 prints | before: 13.6% janky, 27 slow UI frames, 320 MB → **after virtualizing: 5.4%, 5, 252 MB** |
| DB migration v2 → v3 on 500 memories | ✅ |
| Font size / activity recreation while open | **bug found and fixed**: "database is locked" → error screen. WAL now set once; busy_timeout 5 s |
| Export 1.3 GB backup | 199 s, peak 248 MB (streaming holds); zip verified on PC: 1,591 entries, CRC OK |
| Backups over 4 GB | **risk found and fixed**: the zip lib has no Zip64 → now split into parts under 3.5 GB |
| Large text (150%) | Settings/Home OK; rediscovery captions now wrap instead of truncating |
| Viewer | Opens on the tapped item, swipes through cover + items (3/6 → 4/6) |
| Arrange boards | ▲▼ order saved; Home uses it; new boards go first |

### Backup QA (Expo Go, emulator, 2026-09-28)

| Case | Result |
|---|---|
| Export: zip streamed to cache, share sheet offers Drive/Gmail/etc. | ✅ |
| Zip is standard (Python `zipfile`: CRC OK; memento.json + media/) | ✅ |
| Delete all data → Restore from backup → jars, memories, titles, dates, photos back | ✅ |
| Restore the same file again → nothing duplicated | ✅ |
| Untrusted zip: `../` and nested paths never extracted (unit test) | ✅ |

### Monetization QA (QA release APK, emulator, 2026-09-28)

| Case | Result |
|---|---|
| Free: test adaptive banner at bottom of Home and Jar only (not Capture/Memory/Viewer/Paywall) | ✅ |
| 4th jar (Home tile and capture "+ New jar") → "Your memories are growing." paywall | ✅ |
| Paywall without store keys: static prices, "Purchases aren't available in this build yet." | ✅ |
| Premium: no ads, 4th jar allowed, recap unlocked | ✅ |
| Premium off with 4 jars: all jars open; 5th jar → paywall | ✅ |
| Weekly reminder: permission asked only on enable; alarm registered for Sunday 19:00 | ✅ |

### Home-screen widget QA (QA release APK, emulator, 2026-09-29)

| Case | Result |
|---|---|
| Widget picker: "Memento", 2×2, cork/polaroid preview | ✅ |
| Added to home: shows the "Remember this?" memory (least recently opened, rotates daily) | ✅ |
| Tap → opens that memory; Back → Home (not out of the app) | ✅ |
| Memory opened → next refresh shows a different one; all data deleted → "Pin one photo…" card | ✅ |
| App going to background (photo picker, share sheet) while a widget exists: no DB errors, Maestro 5/5 | ✅ (fixed: the widget now uses its own SQLite connection) |
| Tap after the app was *force-stopped* does nothing until the app is opened once | Android rule for stopped apps, not a bug |

### Standalone release APK (local build, emulator, 2026-09-27)

| Case | Result |
|---|---|
| Declared permissions (`aapt2 dump permissions`) | ✅ only CAMERA + RECORD_AUDIO are dangerous permissions; no storage/media |
| Launch, first memory + new jar | ✅ |
| Camera prompt | ✅ a single system prompt titled "Memento" (the double prompt was Expo Go-only) |
| Force-stop + relaunch | ✅ intact |
| Reinstall over existing install (Android update path) | ✅ jars, memories, images intact |

Build it yourself: `npx expo prebuild -p android` → `cd android` → `./gradlew assembleRelease`. The local APK is signed with the **debug** key, so it is for sideloading and testing only. Store builds are signed with the upload key in GitHub Actions (see Upload key below).

**Not yet verified:** iOS (no Mac, no iPhone here), a real Android phone, the iOS compact date picker, iCloud-only assets (`shouldDownloadFromNetwork`), and survival across an app *update* (needs two store/EAS builds).

## Owner device test

**Android phone (easiest):** install the newest APK from https://github.com/tmdrudfuf/Memento/releases/latest

**iPhone (Expo Go):** sign in to Expo Go with the same Expo account as this PC (`tmdrudfuf`). iOS requires this. Then follow these steps:

1. Install **Expo Go** from the App Store / Play Store.
2. On this PC, run `npx expo start --tunnel` in the project folder and scan the QR code.
3. Tap **Add a memory**, pick a real photo, type a jar name ("Hawaii"), then press Enter.
4. Open the memory, add 2 photos + 1 video, and type a note.
5. Swipe the app away completely, then reopen it through Expo Go.
6. Report: is everything still there? Did any system dialog appear that you didn't expect?

## Release steps

Blocked items need the owner (masterplan §26).

| Step | Command / action | Status |
|---|---|---|
| Expo account | logged in as `tmdrudfuf` | ✅ |
| Link project | `@tmdrudfuf/memento` (projectId in app.json). The older `@tmdrudfuf/photo-catcher` project is unused and can be deleted from expo.dev | ✅ |
| Android cloud build (signed AAB + APK) | GitHub → Actions → **Android release** → Run workflow, or push a `v*` tag, which also attaches files to a GitHub release. Signed with the upload key (SHA-256 `A6:68:13:A0:…:F8:83`) | ✅ |
| iOS build | `npx eas-cli@latest build -p ios --profile production`. Needs an Apple Developer account ($99/yr) | **owner decision** |
| Google Play listing | Play Console ($25 one-time) → internal testing track | **owner decision** |
| Support URL | https://tmdrudfuf.github.io/Memento/ | ✅ |
| Privacy policy URL | https://tmdrudfuf.github.io/Memento/privacy.html (GitHub Pages from `/docs`; contact = repo Issues) | ✅ |
| Bundle ID | `com.tmdrudfuf.memento` (iOS + Android). Permanent after the first store upload | ✅ decided |

## Monetization setup (owner accounts needed)

Code is done and verified with Google test ads plus a QA Premium switch. Real money needs these, in order:

1. **Google Play Console** ($25): create app `com.tmdrudfuf.memento`, set up a payments profile, upload `memento-*.aab` to Internal testing (Play requires an uploaded build before in-app products can be created).
2. **Play products** — **done 2026-10-02** (monthly $3.99 → KRW 5,900; yearly $29.99 → KRW 44,000; lifetime $59.99, purchase option `lifetime`):
   - Subscription `premium` with base plans `monthly` ($3.99) and `yearly` ($29.99).
   - One-time product `founders_lifetime` ($59.99).
3. **RevenueCat** (free) — **done 2026-10-02** (service account `revenuecat@memento-510208.iam.gserviceaccount.com` invited to Play Console with view app info, view financial data, manage orders and subscriptions; JSON key uploaded; credentials **valid** 2026-10-03). Real-time developer notifications connected 2026-10-03: service account has Pub/Sub Admin in Cloud IAM, topic `projects/memento-510208/topics/Play-Store-Notifications` (created by RevenueCat), Play Console → Monetization setup → RTDN on, content = subscriptions, voided purchases, all one-time products; test notification received): project `b8941d55`, Play app, products `premium:monthly` (backwards compatible), `premium:yearly`, `founders_lifetime`, entitlement `premium`, offering `default` ($rc_monthly/$rc_annual/$rc_lifetime), public key in config.ts:
   - Create a project, add the Play app, and link a Google service-account JSON.
   - Create entitlement `premium` and attach all 3 products.
   - Create offering `default` with packages Monthly, Annual and Lifetime.
   - Remove Lifetime from the offering whenever Founder's sales should end. No app update is needed.
   - Paste the public SDK key (`goog_…`) into `src/lib/config.ts`.
4. **AdMob** (free) — **done 2026-09-29**: app `ca-app-pub-3024928824650244~6018206834`, banner unit `.../9722567991`, GDPR message "Memento GDPR" published (Do-not-consent on). Payment profile done. Still to do after the Play listing is live: link the app to the store listing, and host `app-ads.txt`.
   - Create app Memento (Android) and one banner ad unit.
   - Replace the Google test app ID in `app.json` (plugin + top-level `react-native-google-mobile-ads`) and put the unit ID in `src/lib/config.ts`.
   - Create the GDPR consent message (Privacy & messaging).
5. **Play Data safety form:**
   - Ads: device or other IDs, collected and shared with Google for advertising (non-personalized) and fraud prevention.
   - Purchase history: collected by RevenueCat and Google Play.
   - No photos, videos or notes are collected.

QA builds: `EXPO_PUBLIC_QA=1` before the Gradle build shows a "Premium (debug build only)" switch. Store and CI builds never set it.

## Google Drive backup setup (owner, free, ~10 min)

**Status (2026-09-29): steps 1–5 done** in Cloud project `memento-510208` (Testing mode, test user tmdrudfuf@gmail.com). Play App Signing client added 2026-10-01 (SHA-1 `B1:C1:C2:FE:91:A0:FB:D6:CB:4D:ED:16:39:BD:BD:34:F0:F5:35:51`). Consent screen published to production 2026-10-03 (branding: home/privacy/terms on tmdrudfuf.github.io, authorized domain tmdrudfuf.github.io, no logo so no verification).

The code is done: sign-in, resumable upload to the `drive.appdata` folder, weekly Wi-Fi auto backup, restore, and disconnect-and-delete. It needs a Google Cloud OAuth client, which must be created under your Google account.

1. **Create the project.** https://console.cloud.google.com → New project **Memento**.
2. **Enable the API.** APIs & Services → Library → **Google Drive API** → Enable.
3. **Set up the consent screen.** OAuth consent screen (Google Auth Platform) → **External**. App name: Memento. Support email: yours.
   - Add the scope `.../auth/drive.appdata`. It is non-sensitive, so verification stays simple.
   - Under **Test users**, add your Gmail and your testers until the app is published.
4. **Create the Android client.** Credentials → Create OAuth client → **Android**. Package `com.tmdrudfuf.memento`, SHA-1 `17:0F:C4:A3:F2:1C:F6:33:39:A0:59:31:E6:33:B2:00:C8:FC:97:07` (upload key).
   - Create a second Android client for QA/debug builds with SHA-1 `5E:8F:16:06:2E:A3:CD:2C:4A:0D:54:78:76:BA:A6:F3:8C:AB:F6:25`.
   - After Play Console setup, add a third with the **Play App Signing** SHA-1 (Play Console → Test and release → App integrity).
5. **Create the Web client.** Credentials → Create OAuth client → **Web application** → copy its Client ID into `src/lib/config.ts` → `google.webClientId`.
6. **(iOS, later) Create the iOS client.** Bundle `com.tmdrudfuf.memento`; put its reversed client ID in `app.json` → google-signin → `iosUrlScheme`.

## Upload key (Android)

- Upload key: `%USERPROFILE%\.memento-keys\upload.jks` plus `upload.properties` (passwords). It is also in GitHub Secrets. **Back up this folder somewhere safe** (e.g. a password manager).
- The Play Console uses *Play App Signing*: Google holds the real app-signing key, and this is only the upload key. If it is lost, Google can reset it, but that takes days.
- Local signed build: set `MEMENTO_UPLOAD_STORE_FILE` and the passwords from `upload.properties`, then `npx expo prebuild -p android` → `cd android && ./gradlew bundleRelease`.

## Store listing draft

- **Name:** Memento (home-screen name). Store titles must be unique on iOS, so if "Memento" is taken use e.g. "Memento: Memory Jars"
- **Subtitle:** One photo opens the whole memory
- **Category:** Lifestyle (alt: Photo & Video)
- **Short description (Play, 80 chars):** Keep moments, not photos. One symbolic photo opens the whole memory.
- **Description:**
  > Your camera roll has 20,000 photos. The moments you'd want to relive are buried in there.
  >
  > Memento keeps only the ones you choose. Pick one photo that brings a moment back: the ramen you had in Tokyo, a train ticket, the dinner table. That photo becomes the cover of a memory. Inside, keep the related photos, a short video, the date and a line of text.
  >
  > Pin memories to boards: "Japan 2026", "Us", "Family", "College". Over time your wall of boards becomes a collection of your life.
  >
  > • Save a memory in 3 taps. No typing required.
  > • Add details later, whenever you like.
  > • Private by design: everything stays on your phone. No account, no cloud, no ads, no tracking.
  > • Only sees the photos you pick. Never your whole library.
- **Keywords (iOS):** memories,journal,scrapbook,keepsake,photo diary,travel,moments,collection
- **App Privacy (iOS) / Data safety (Play):** *Data Not Collected*. No data shared, no data collected, no encryption-in-transit questions apply (no network use).
- **Content rating:** Everyone / 4+. No user-generated content is shared, no ads.
- **Screenshots needed:** Home shelf, capture sheet (jar chips), a jar of polaroids, a memory with note + items. Take them from a device with real photos.

## Closed test plan (14 days, ~2026-09-30 → 10-13)

Google asks at production-access time what changed based on testing, so each update records what it fixed.

| Update | Date | Version | Scope |
|---|---|---|---|
| 1 | 10-02 | v1.0.6 | Pre-launch report / vitals fixes, Korean widget description, Drive sign-in for testers (publish consent screen), easier feedback |
| 2 | 10-08 | v1.0.7 | Tester feedback, Play products + RevenueCat verified with license testers, polish |
| 3 | 10-10 | v1.0.8 | Fixes from the owner's real-purchase test on 1.0.7; haptics on 8 actions (save, move, set cover, delete memory/item/board/all, reorder, purchase); TalkBack button roles on memory cover and tiles, name-dialog backdrop hidden from TalkBack (888ade3) |
| 4 | 10-12 | v1.0.9 | App lock (fingerprint/face, phone PIN fallback), Premium, off by default (Roadmap phase 7) |
| Apply | ~10-14 | | production access questionnaire (draft answers from the change log below) |

Submit each update only after the previous one is approved: a new release on the track replaces one still in review.
Not in the test window on purpose: photo suggestions (Roadmap 5.1, needs full photo-library access, a restricted Play permission) and shared boards (needs a server).

### Change log for the production questionnaire
- v1.0.5 (closed test start): first Play build, real AdMob + Google sign-in IDs.
- v1.0.7 (submitted to closed test 2026-10-08, versionCode 20): fixed a first-launch error ("table jars already exists") when the home-screen widget and the app set up a fresh database at the same moment (found by automated tests); real purchases on (RevenueCat key, Play products, license tester); Settings → Manage subscription (store page for active subscriptions); removed "coming to Premium" promise from the paywall. Tester feedback so far: 1 review, 5★ (Galaxy Z Flip); 0 crashes/ANRs in Android vitals.
- v1.0.6 (submitted to closed test 2026-10-02; closed test countries also widened KR → KR+US+CA): in-app "Send feedback" (email with version/device prefilled; testers had only a GitHub link), Korean widget picker text, correct version name (Play showed 1.0.0).
