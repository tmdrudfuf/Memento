# Memento — UX Flow (Phase 2)

Guiding test for every element: **does it make Capture → Collect → Remember better?**

## Screens (4 routes + 1 viewer)

The masterplan's IA listed "04 Memory (add content)" and "05 Memory Detail (view)" as two screens. They are merged here. Viewing and adding happen in the same place, so a second screen is only an extra hop.

```
Home (shelf of Jars) ──tap jar──▶ Jar (cover cards) ──tap card──▶ Memory ──tap media──▶ Viewer
   │  + / camera                     │  + / camera                   │ + photos/videos, note, title, date
   ▼                                 ▼                               │ delete memory
 system picker/camera ──▶ Capture sheet: [photo] + jar chips ── tap jar = SAVE ──▶ Jar (new card settles in)
```

| Route | Purpose |
|---|---|
| `/` Home | Jars as a shelf. Each jar shows its 3 most recent covers fanned like a stack, plus name and count. Primary buttons: **+ (library)** and **camera**. A quiet footer shows counts (the local success-signal readout). |
| `/jar/[id]` | Memories as polaroid-style cover cards (2 columns), newest memory date first. The caption shows the title if set, otherwise the date. Rename/delete the jar via the header menu. The + and camera buttons here preselect this jar. |
| `/capture` | Modal after the photo is chosen. It shows a large preview and a row of jar chips, with the last-used/current jar first and highlighted. **Tapping a chip saves.** "+ New jar" turns into an inline name field, and Enter creates the jar and saves. |
| `/memory/[id]` | The cover is the hero at full width. Below it: title (placeholder "Add a title"), date, note (a few lines, autosaved on blur), then related photos/videos with an **Add** tile. Delete is in the header menu. |
| `/viewer` | Full-screen photo or video playback. |

## Capture path (interaction count)

1. Tap **+** (Home or Jar) → system photo picker opens directly (no intermediate screen)
2. Tap a photo → Capture sheet
3. Tap a jar chip → **saved**; the app navigates to that jar and the new card drops in

**3 taps, 0 keystrokes.** The camera path is identical: camera → shutter → use photo → jar, which is 4 taps because the OS requires the confirm step.

First launch (no jars): the Capture sheet shows only the "+ New jar" field, already focused. Tap + → pick → type a name → Enter. That is 3 taps + a name, needed exactly once.

Nothing else is asked at capture. Title, note, date and related media all live on the Memory screen, to be done later.

## Defaults that remove steps

- **Memory date** = the photo's EXIF `DateTimeOriginal` when available, otherwise the save time. It can be edited on the Memory screen.
- **Jar preselection:** when capturing from inside a jar, that jar comes first. From Home, the last-used jar comes first.
- **Title:** optional. Cards fall back to the formatted date, so an untitled memory still looks complete (the Family scenario).

## Remember (rediscovery in the MVP)

- Opening the app lands on the shelf of covers, so the first thing seen is memories, not a file list.
- Opening a Memory increments `openCount` / `lastOpenedAt`. This measures H1 and is not surfaced as gamification.
- "On this day" and "Remember this?" prompts are deferred until there is data worth rediscovering (masterplan §36).

## Visual direction

The choice is a **shelf of polaroid stacks**, not glass jars. Reasons:

- A jar illustration is cute but hides the covers.
- The emotional property is "I am collecting", which a growing, fanned stack of the user's own photos conveys better than a generic icon.

Style:

- Warm paper background (`#F4EFE6`), white polaroid frames, and a soft shadow.
- Slight random rotation (±2°), deterministic per memory id, so the collection feels hand-placed rather than a grid.

The "settle" animation is a short drop plus scale-in, under 400 ms. It runs *after* the save has already been persisted, so it never blocks capture.

## Edit / delete paths

- **Rename jar / delete jar** (header menu on the Jar screen). Deleting asks for confirmation, says how many memories go with it, and removes their files.
- **Edit title / date / note** inline on the Memory screen.
- **Remove a related item:** long-press it → confirm.
- **Delete memory:** header menu → confirm.
- **Change cover:** deferred. The symbolic photo is chosen deliberately at capture. Add this if testers ask for it.

## Error / permission paths

- **Picker cancelled:** return silently.
- **Camera permission denied:** alert with an "Open Settings" option. The library path still works, because the system picker needs no permission.
- **Copy failure** (disk full, or an iCloud-only asset): alert "Couldn't save this photo". No partial memory is written.
- **A media file missing at render:** show a neutral placeholder tile, not a crash.
