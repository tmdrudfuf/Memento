# Memento

> One photo opens the whole memory.

(Working name in the original brief: "Photo Catcher".)

Pick one symbolic photo — a meal, a ticket, a view — and it becomes the cover of a Memory that holds related photos, videos and a note. Memories collect in Jars. Capture → Collect → Remember.

- Product reasoning: [PRODUCT_ASSESSMENT.md](PRODUCT_ASSESSMENT.md)
- Screens and capture flow: [UX_FLOW.md](UX_FLOW.md)
- Technical decisions: [ARCHITECTURE.md](ARCHITECTURE.md)
- Original brief: [masterplan.md](masterplan.md)

- Website / support: https://tmdrudfuf.github.io/Memento/ · Android test build: [Releases](https://github.com/tmdrudfuf/Memento/releases)

## Run

```bash
npm install --legacy-peer-deps
npx expo start          # scan the QR code with Expo Go (Android / iOS)
```

## Check

```bash
npm run check           # tsc + eslint + db tests (node:test on node:sqlite, Node ≥ 22.13)
```

## Privacy

Everything stays on the device: SQLite database + copied media in the app's documents folder. No accounts, no server, no analytics. See ARCHITECTURE.md → Privacy.
