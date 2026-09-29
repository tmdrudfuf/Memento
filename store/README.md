# Store package

Everything Google Play asks for, ready to paste or upload. Regenerate images with the scripts in `scripts/`.

| Play Console field | File |
|---|---|
| App icon (512×512) | `icon-512.png` |
| Feature graphic (1024×500) | `android/en/feature-graphic.png`, `android/ko/feature-graphic.png` |
| Phone screenshots (1080×1920, 6 each) | `android/en/phone-1..6.png`, `android/ko/phone-1..6.png` |
| Title, short and full description | `listing-en.md`, `listing-ko.md` |
| Data safety, content rating, ads, target audience, app access | `play-forms.md` |
| App bundle | GitHub Release `memento-N.aab` (Actions → Android release) |

**Screenshot order:**
1. One photo opens the whole memory (Home)
2. Save a moment in 3 taps (capture)
3. Pin your memories to boards (board)
4. Photos, videos and a note (memory)
5. Look back on your year (recap)
6. Private, dark mode

**How they were made:**
- Illustrated demo photos: `scripts/make_demo_art.py`
- Demo collection: `scripts/demo_seed.py en|ko`, loaded into a QA build on the emulator
- Screens captured with `adb`, then composed: `scripts/make_store_images.py RAW_DIR`
- To use real photos instead, replace the art files and rerun.

**Upload steps (after the Play Console account exists):**
1. Create the app → default language English (United States); add Korean (ko-KR) under Store listing → Translations.
2. Store listing: paste the text; upload the icon, feature graphic and screenshots per language.
3. App content: answer each form from `play-forms.md`.
4. Testing → Closed testing: upload the AAB, add the testers (see `closed-test.md`).
