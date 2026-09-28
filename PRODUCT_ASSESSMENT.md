# Memento — Product Assessment (Phase 1)

Date: 2026-09-27. Scope: masterplan §17–§21, §35.

## 1. The hard question

> Why use Memento instead of an album in Apple Photos / Google Photos?

### Strongest counterargument (stated honestly)

- **The structure already exists.** Apple Photos has Folder → Album → Key Photo. That is structurally Jar → Memory → Symbolic Photo. Google Photos albums have a cover photo, text captions and location blocks.
- **The content side already exists.** Apple Journal has multiple journals, and each entry holds photos, videos, location, audio and "suggested moments". Day One adds encryption, multiple journals and rich metadata.
- **The jar metaphor is taken.** Journal Jar, Memory Jar (memory-jar.app) and Lumhaa ("Memory Jar & Gratitude") all use it.

**Conclusion: neither "a cover photo on a collection" nor "jars" is a differentiator.** If Memento only offers these, it fails.

### What survives the critique

Three things are *not* offered by any of the above in combination:

1. **The unit is one memory, and it is cheap.** In Photos, the natural unit is the album. Making an album per dinner costs a name, a selection and a key-photo change, so nobody does it. Albums end up per trip, not per moment. A journal entry is text-first, so it asks you to write. Memento's unit is *one moment*, created in ~3 taps with zero text.

   | Action | Memento | Apple Photos album per moment | Apple Journal entry |
   |---|---|---|---|
   | Start | tap **+** | Albums → **+** → New Album | tap **+** |
   | Required text | none | **album name (required)** | none, but the empty text body is the focus |
   | Pick photo | pick 1 | select photos | pick photos |
   | Choose container | tap jar (last-used preselected) | album must also be dragged into a folder | journal picker |
   | Cover | automatic (the picked photo *is* the cover) | … → Make Key Photo (extra 2–3 taps) | n/a (grid) |
   | **Taps, typical** | **3** | **8–12 + typing** | 4–5 + a text prompt |

2. **A curated space, separate from the camera roll.** Photos shows 20,000 images. Its Albums tab mixes intentional albums with auto-created ones (Screenshots, WhatsApp, Recents). Memento contains *only things the user deliberately kept*. It is quiet by construction.

3. **Cover-first browsing.** Inside a jar you see covers only: one icon per memory, not every photo. A jar of 30 memories reads as 30 moments. In Photos, 30 albums in a folder look like a filing list, and opening one drops you into a grid.

**Refined positioning:** Memento is the fastest way to turn a moment into a named-by-picture keepsake, kept apart from the noise of the camera roll.

## 2. Reasons it could fail (and mitigation)

| Risk | Why real | Mitigation in MVP |
|---|---|---|
| "I could just make an album" | Structure is replicable | Win on capture cost (3 taps) + curated space; test explicitly (kill signal below) |
| Users never return (write-only) | Common journaling failure | Home shows covers, so opening the app *is* the rediscovery. Measure revisits. Rediscovery prompts are deferred until usage exists |
| Capture moment is in the Photos app, not ours | Users shoot with the system camera | MVP: in-app picker (no permission needed). **Top deferred item: share-sheet "Add to Memento"** (needs native share extension / dev build) |
| Duplicated storage | We copy media | Copies are the point (keepsake survives camera-roll cleanup). Covers compressed; show size in docs; revisit if complaints |
| Cold start: empty app is sad | No content day 1 | Capture creates a jar inline; first memory in < 10 s |
| Metaphor overload ("jar") | Cute ≠ useful | Keep the word "Jar" but render as a shelf of cover-stacks, not glass illustrations |

## 3. User scenarios (walked against the flow)

Flow: **+ → pick photo → tap jar → saved (toast)**. Add-more happens later.

1. **Travel (ramen, Japan).** At dinner, the photo is already in the camera roll. Later that night: + → pick ramen → "Japan 2026" (preselected, last used) → saved. Days later, on the train: open Ramen Night → add restaurant + friend photos, a 5-s video, the note "the place with no English menu". *Unnecessary step found:* forcing a title would add friction, so the title is optional and defaults to the date.
2. **Relationship (ordinary date).** Cover = the dessert they shared. Jar "Us". The note is one line. *Found:* the date should default to the photo's own date (EXIF) when available, not the save time. The picker exposes EXIF, so no permission is needed.
3. **College (multi-year).** Jar "College" grows to 80 memories over 4 years. *Found:* memories must sort newest-first by memory date. The jar must stay readable at 80 covers, so use a 3-column cover grid with titles shown only when set.
4. **Family (no journaling).** A parent adds a dinner-table photo weekly and never writes. *Found:* zero-text must be first-class. A memory without title or note must still look complete (cover + date).
5. **Cooking.** Cover = the finished dish. Inside: ingredient photos + a note of the recipe tweak. *Found:* the note needs a few lines of text, but not a rich editor.

Steps removed because of the scenarios: required title, a separate "confirm" screen, and a separate "create jar first" screen.

## 4. Competitors (concrete, not marketing)

| Product | Same interaction? | Gap Memento targets |
|---|---|---|
| Apple Photos (albums, folders, key photo, Memories) | Structurally yes | Album-per-moment is too costly; Memories covers are auto-picked and **cannot be chosen** by the user |
| Google Photos (albums, covers, text blocks) | Partly | Same cost problem; lives inside the full library |
| Apple Journal / Day One / Journey | Content yes | Text-first entries; no cover-as-entrance browsing; Day One free tier = 1 photo/entry |
| Polarsteps / Journi / FindPenguins | Trip-scoped | Travel-only, map/route-first, social/photobook upsell |
| Journal Jar / Memory Jar / Lumhaa | Metaphor yes | Text/gratitude-first, photos secondary or paid; Lumhaa is shared/social |

No product found makes **one chosen photo the cover and entrance of a small per-moment album, captured in about 3 taps, in a space separate from the library**. The gap is narrow but real, and it is testable.

## 5. Core hypothesis (falsifiable)

> H1: When creating a keepsake costs ≤ 3 taps and no text, users will create per-moment Memories that they would not have created as Photos albums, and will reopen them.

**MVP success criteria (5–10 testers, 2 weeks):**

- ≥ 60% of testers create ≥ 5 Memories in week 1.
- ≥ 50% create a 2nd Jar.
- Median capture time ≤ 10 s (+ tap → saved).
- ≥ 40% of Memories are reopened ≥ 7 days after creation.
- When asked "Would you have made a Photos album for this?", the majority of answers are "no".

**Kill signal:** testers say "I could just make an album" *and* their reopen rate after 7 days is < 20%. If so, stop or pivot the unit (e.g. toward share-sheet-only capture).

**Measurement:** no analytics SDK (privacy). Measure from local counters (memories, jars, openCount / lastOpenedAt per memory). Testers read these from an in-app "Stats" line or report them in interviews.

## 6. Definitions (MVP)

- **Memory:** a cover photo (required) + optional title, note, memoryDate, and related photos/videos. It has one cover and belongs to one jar.
- **Memory Jar:** a name + its memories. Visually it is a stack of its latest covers, not a folder icon.
- Location is **deferred.** EXIF GPS needs media-library permission on Android, which violates minimum-permission. The date covers most of the "when/where" recall value.

## Sources

- Apple Photos key photo / Memories cover limits: https://discussions.apple.com/thread/253998404, https://www.imore.com/how-to-pick-cover-photo-memories-does-not-work
- Google Photos albums: https://support.google.com/photos/answer/6128849
- Apple Journal: https://support.apple.com/guide/iphone/add-formatting-photos-and-more-iph492ee70a8/ios
- Journal apps compared: https://www.journohq.com/blog/best-travel-journal-apps/, https://zapier.com/blog/best-journaling-apps/
- Jar apps: https://apps.apple.com/fi/app/journal-jar-collect-memories/id6753973692, https://memory-jar.app/, https://apps.apple.com/us/app/lumhaa-the-memory-jar-app/id1391471458
