import Constants, { ExecutionEnvironment } from 'expo-constants';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { Platform, View } from 'react-native';
import { config } from './config';
import { usePremium } from './premium';

// Ads: Free users only, Home + Jar only, one bottom banner, non-personalized (MONETIZATION.md §2, §8–9).
// The native SDK is absent in Expo Go, so it is required lazily and skipped there.
type AdsModule = typeof import('react-native-google-mobile-ads');
const inExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
// eslint-disable-next-line @typescript-eslint/no-require-imports -- must not load in Expo Go
const load = (): AdsModule | null => (inExpoGo ? null : require('react-native-google-mobile-ads'));

type AdsState = { ready: boolean; privacyOptionsRequired: boolean; showPrivacyOptions: () => void };
const Ctx = createContext<AdsState>({ ready: false, privacyOptionsRequired: false, showPrivacyOptions: () => {} });

export function AdsProvider({ children }: { children: ReactNode }) {
  const { isPremium } = usePremium();
  const [ready, setReady] = useState(false);
  const [privacyOptionsRequired, setPrivacyOptionsRequired] = useState(false);

  useEffect(() => {
    const ads = load();
    if (!ads || isPremium || ready) return;
    (async () => {
      try {
        // EU/UK consent (Google UMP) must be gathered before any ad request.
        const info = await ads.AdsConsent.gatherConsent();
        setPrivacyOptionsRequired(info.privacyOptionsRequirementStatus === 'REQUIRED');
        if (!info.canRequestAds) return;
        await ads.default().initialize();
        setReady(true);
      } catch (e) {
        console.warn('Ads unavailable', e); // no ads is always an acceptable outcome
      }
    })();
  }, [isPremium, ready]);

  const showPrivacyOptions = () => {
    load()
      ?.AdsConsent.showPrivacyOptionsForm()
      .catch((e) => console.warn(e));
  };

  return <Ctx.Provider value={{ ready, privacyOptionsRequired, showPrivacyOptions }}>{children}</Ctx.Provider>;
}

export const useAds = () => useContext(Ctx);

/** Bottom adaptive banner. Renders nothing for Premium users or before consent/initialization. */
export function AdBanner() {
  const { isPremium } = usePremium();
  const { ready } = useAds();
  const ads = load();
  if (!ads || isPremium || !ready) return null;
  const real = Platform.OS === 'ios' ? config.admob.iosBanner : config.admob.androidBanner;
  const unitId = __DEV__ || !real ? ads.TestIds.ADAPTIVE_BANNER : real;
  const { BannerAd, BannerAdSize } = ads;
  return (
    // Gap above keeps the ad clear of the capture buttons (avoids accidental taps).
    <View style={{ alignItems: 'center', paddingTop: 6 }}>
      <BannerAd
        unitId={unitId}
        // ponytail: ANCHORED_ADAPTIVE_BANNER is deprecated in favor of LARGE_; kept for the smaller footprint.
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        requestOptions={{ requestNonPersonalizedAdsOnly: true }}
        onAdFailedToLoad={(e) => console.warn('Ad failed', e.message)}
      />
    </View>
  );
}
