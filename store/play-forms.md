# Play Console forms — prepared answers

Draft answers, matching the app as built (v1.0.x) and `docs/privacy.html`. The owner submits them; Google may ask follow-ups.
Re-check if cloud backup, sync or shared boards are added later: those change the Data safety answers.

## App content → Privacy policy
`https://tmdrudfuf.github.io/Memento/privacy.html`

## App content → App access
**All functionality is available without special access.** There is no login, and the Free plan works fully. (Premium is a normal in-app purchase; reviewers don't need credentials.)

## App content → Ads
**Yes, my app contains ads.** Google AdMob, non-personalized, a bottom banner on two screens, Free plan only.

## App content → Target audience and content
- **Target age groups:** 13–15, 16–17, 18 and over. Do **not** select under-13 groups: that would place the app under the Families policy, which restricts ad SDKs.
- **Appeals to children?** No.

## App content → Content rating (IARC questionnaire)
- **Category:** All other app types (not a game, not social, not news).
- **Violence, sexuality, language, controlled substances, gambling:** No to all.
- **Users can interact or exchange content with other users?** **No.** Sharing a photo out through the system share sheet is not in-app user interaction.
- **Shares the user's physical location with others?** No.
- **Allows users to purchase digital goods?** **Yes** (Premium subscription, Founder's Lifetime).
- **Unrestricted internet access (e.g. browser)?** No.
- **Expected result:** Everyone / PEGI 3 / 전체이용가 (GRAC).

## App content → Data safety

**Overview**
- **Does your app collect or share any of the required user data types?** Yes (through the Google AdMob and RevenueCat SDKs; photos, videos and notes never leave the device).
- **Is all of the user data collected by your app encrypted in transit?** Yes (the SDKs use HTTPS).
- **Do you provide a way for users to request that their data is deleted?** Yes. In-app data: Settings → Delete all data, or uninstall. SDK data: see Google's and RevenueCat's policies. There are no accounts.

**Data types**

| Data type | Collected | Shared | Optional? | Purposes | Source |
|---|---|---|---|---|---|
| Device or other IDs (advertising ID) | Yes | Yes (Google AdMob) | No (Free plan) | Advertising, Fraud prevention/security, Analytics | AdMob |
| Approximate location (from IP) | Yes | Yes (Google AdMob) | No (Free plan) | Advertising, Fraud prevention | AdMob |
| App interactions (ad impressions/clicks) | Yes | Yes (Google AdMob) | No (Free plan) | Advertising, Analytics | AdMob |
| Crash logs / Diagnostics | Yes | Yes (Google AdMob) | No | Analytics, Fraud prevention | AdMob |
| Purchase history | Yes | No (RevenueCat is a service provider) | Only if the user buys | App functionality | RevenueCat + Google Play |

**Not collected:** photos, videos, notes, names, email, contacts, precise location, messages, files. Memories are processed only on the device, which under Play's definition is not "collection".

## App content → Financial features / Health / News / Government / COVID
None / None / No / No / No.

## Store settings
- **Category:** Lifestyle
- **Contact details:** email (required, shown publicly) and website `https://tmdrudfuf.github.io/Memento/`

## Monetization → Products
See `RELEASE.md` → Monetization setup (subscription `premium`: `monthly` $3.99, `yearly` $29.99; one-time `founders_lifetime` $59.99).
