# Memento — Full Roadmap (proposal, awaiting owner approval)

Status: **plan only. Nothing here is built until approved.** Date: 2026-09-28.
Monetization rules come from [MONETIZATION.md](MONETIZATION.md) (owner's strategy, source of truth).

Today the app has the core loop only (Home shelf → Jar → Memory, 3-tap capture, local storage). This roadmap takes it to a sellable app: **Free + Premium ($3.99/mo, $29.99/yr) + Founder's Lifetime ($59.99)**, with ads only around the collection.

---

## Account ("profile") and payment: how they fit

| Need | How it works | Login? |
|---|---|---|
| Paying (Android) | Google Play Billing charges the Google account already on the phone | No |
| Paying (iPhone) | Apple In-App Purchase with the phone's Apple ID | No |
| Premium on a new phone | Store restores it ("Restore purchases") | No |
| **Backup, Sync, Shared Jars** | **Sign in with Google** (Apple sign-in also on iPhone). This is the profile: name, photo, Premium status in Settings | **Yes, only when using these** |

The core app never requires sign-in (Capture → Collect → Remember stays instant).

---

## Phase 1 — Everyday basics (Free)

| # | Feature |
|---|---|
| 1.1 | **Settings screen** (⚙ on Home): profile/account, Premium status, backup, privacy, support, version |
| 1.2 | **New jar** button on Home (jars can currently only be made while saving a photo) |
| 1.3 | Long-press jar → Rename / Delete |
| 1.4 | Memory: **Move to another jar**, **Set as cover**, **Share** photo/video out |
| 1.5 | Settings: collection stats, storage used, **Delete all data** |
| 1.6 | First-run intro (1 screen: "One photo opens the whole memory") |

## Phase 2 — Monetization foundation

| # | Feature | Notes |
|---|---|---|
| 2.1 | **Free plan limit: 3 Jars** | Memories stay unlimited |
| 2.2 | **Fourth Jar paywall** | Copy from MONETIZATION.md §7 |
| 2.3 | **Premium monthly/yearly + Founder's Lifetime** | RevenueCat on Google Play Billing / Apple IAP. Free under $2.5k monthly revenue, then 1% |
| 2.4 | Paywall screen | Yearly highlighted as recommended; Founder's Lifetime shown only while "Early Access" is on (remote switch in RevenueCat, no app update needed) |
| 2.5 | **Never lock memories** | If Premium lapses, every jar/memory stays viewable and editable; only *creating a 4th+ jar* is blocked |
| 2.6 | Restore purchases | Settings |
| 2.7 | **AdMob adaptive banner** at the bottom of Home and Jar only (Free users) | None in Capture/Memory/Viewer/editing. No interstitial/app-open/rewarded ads |
| 2.8 | Ad consent (Google UMP) for EU/UK users | Legally required with AdMob |
| 2.9 | **Privacy policy + store forms update** | Ads change the story: the policy today says "no ads, no tracking". AdMob uses the advertising ID, so the Play Data safety form must declare it. Recommendation: *non-personalized ads* to keep tracking minimal |

## Phase 3 — Protect: Cloud Backup (Premium)

| # | Feature | Notes |
|---|---|---|
| 3.1 | Sign in with Google (+ Apple on iPhone) | The profile |
| 3.2 | **Backup to the user's own Google Drive** (hidden app folder) | **No server, no storage bill for us**; `drive.appdata` is a non-sensitive scope, so Google verification is simple |
| 3.3 | Automatic backup (daily/weekly on Wi-Fi) + Restore on new phone | Premium trigger = paywall (§6) |
| 3.4 | Free fallback: manual **export file** | Optional. Say if you'd rather keep all backup Premium-only |

## Phase 4 — Rediscover (Free basic + Premium advanced)

| # | Feature | Plan |
|---|---|---|
| 4.1 | Basic Rediscovery: "Remember this?" card on Home | Free |
| 4.2 | Advanced: "2 years ago today", "This week in 2027", optional reminder notification | Premium |
| 4.3 | **Yearly Recap** "Your 2027 in Memories", built from the user's chosen covers | Premium |

All local and on the phone, with no server cost.

## Phase 5 — Smart Memory Organization (Premium)

| # | Feature | Notes |
|---|---|---|
| 5.1 | "You took 8 other photos around this time and place. Add them?" | Done **on the phone** from photo time + location (no AI server, so no per-use cost and no photos uploaded). An AI model can come later if the simple version isn't good enough |
| 5.2 | Permission | This is the only feature that needs **photo library access**. It is asked only when the user taps it, never at install |

## Phase 6 — Together: Device Sync + Shared Jars (Premium) — needs a server

These two features cannot work with "everything on the phone". They need a cloud backend.

| Item | Proposal |
|---|---|
| Backend | Supabase (database + auth + realtime) + Cloudflare R2 for photos/videos (no download fees) |
| Cost model | Free tiers during testing. At scale roughly **$0.015/GB-month** of stored media plus ~$25/mo base. E.g. 1,000 Premium users × 2 GB ≈ $55/mo, against ≈ $25k/yr revenue |
| Shared Jars | Premium owner invites by link; **Free users can join** (MONETIZATION §3) |
| Privacy | Media is encrypted at rest and access-controlled, never public URLs. Privacy policy updated with what is uploaded and how deletion works |
| Approval | **Needs your OK for recurring cost** before I turn anything paid on (masterplan §31) |

## Phase 7 — Polish & trust

- Dark mode, **Korean + English**, haptics, accessibility, app lock (fingerprint/face; recommendation: add to Premium).
- Crash reporting (Sentry free tier, no photos or personal data), only if you approve.

## Phase 8 — Store launch

| Step | Detail |
|---|---|
| Google Play Console | $25 one-time + payments profile (needed to sell) |
| **Closed test** | New personal Play accounts must run a closed test with **12+ testers for 14 days** before production |
| AdMob account | Free, linked to the app |
| RevenueCat account | Free |
| Production | Listing (RELEASE.md), Data safety (now includes ads/account data), content rating |
| Apple | $99/yr → EAS iOS build → TestFlight → App Review |

---

## Build order, and what I need from you

| Order | Work | I do alone? | Needs from you |
|---|---|---|---|
| 1 | Phase 1 basics | ✅ | — |
| 2 | Phase 7 polish (dark mode, Korean) | ✅ | — |
| 3 | Phase 4 rediscovery + recap (local) | ✅ | — |
| 4 | Phase 2 paywall, 3-jar limit, ads code | Code ✅ | Play Console ($25), AdMob + RevenueCat accounts (free) |
| 5 | Phase 3 Google sign-in + Drive backup | Mostly | Create a free Google Cloud OAuth client (I guide you, ~5 min) |
| 6 | Phase 5 smart organization | ✅ | — |
| 7 | Phase 6 sync + shared jars | Not started (design only) | **Approval of server costs** |
| 8 | Phase 8 launch | Partly | 12 testers; Apple $99/yr for iPhone |

Every step is tested on the emulator, committed, and published as a new downloadable APK.

## Things you should know before approving

1. **Ads end the "no tracking" promise.** The current privacy page and store answers ("Data not collected") must change once AdMob is in. Non-personalized ads soften this.
2. **Shared Jars / Sync mean photos leave the phone** (to our encrypted storage) and create a monthly bill. Backup alone does not: it goes to the user's own Drive.
3. **Testing gets heavier.** Billing, ads and Google sign-in don't run in Expo Go. Every test uses a real APK (GitHub Actions already builds them).
4. **Masterplan tension.** The masterplan said to validate the core idea *before* Shared Jars and AI. Your strategy supersedes it; I'd still build in the order above so the free core is proven while the paid parts come online.
