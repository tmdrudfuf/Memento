// Public identifiers (safe to ship in the app; none of these are secrets).
// Empty values = not set up yet: purchases show as unavailable, ads use Google's test units.
export const config = {
  revenueCat: {
    androidKey: '', // RevenueCat → Project → API keys → Google Play public SDK key (goog_...)
    iosKey: '', // RevenueCat → Project → API keys → App Store public SDK key (appl_...)
    entitlement: 'premium', // one entitlement unlocked by monthly, yearly and Founder's Lifetime
  },
  admob: {
    androidBanner: '', // AdMob → Apps → Memento (Android) → Ad units → banner (ca-app-pub-.../...)
    iosBanner: '',
  },
  google: {
    // Google Cloud → APIs & Services → Credentials → OAuth client (Web application) → Client ID.
    // Android also needs an "Android" OAuth client with package com.tmdrudfuf.memento + signing SHA-1s
    // (no value goes here for that one). iOS: set app.json google-signin iosUrlScheme too.
    webClientId: '284177643745-r3s3cbcoqlpvhss1jdikthg68184jtru.apps.googleusercontent.com',
  },
  links: {
    site: 'https://tmdrudfuf.github.io/Memento/',
    privacy: 'https://tmdrudfuf.github.io/Memento/privacy.html',
    terms: 'https://tmdrudfuf.github.io/Memento/terms.html',
    support: 'https://github.com/tmdrudfuf/Memento/issues',
  },
};
