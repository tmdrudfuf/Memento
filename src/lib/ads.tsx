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

// 'pending' until consent/initialization resolves, then 'ready' or 'off' (no ads allowed/available).
type AdsStatus = 'pending' | 'ready' | 'off';
type AdsState = { status: AdsStatus; ready: boolean; privacyOptionsRequired: boolean; showPrivacyOptions: () => void };
const Ctx = createContext<AdsState>({
  status: 'off',
  ready: false,
  privacyOptionsRequired: false,
  showPrivacyOptions: () => {},
});

export function AdsProvider({ children }: { children: ReactNode }) {
  const { isPremium } = usePremium();
  const [status, setStatus] = useState<AdsStatus>(load() ? 'pending' : 'off');
  const ready = status === 'ready';
  const [privacyOptionsRequired, setPrivacyOptionsRequired] = useState(false);

  useEffect(() => {
    const ads = load();
    if (!ads || isPremium || ready) return;
    (async () => {
      try {
        // EU/UK consent (Google UMP) must be gathered before any ad request.
        const info = await ads.AdsConsent.gatherConsent();
        setPrivacyOptionsRequired(info.privacyOptionsRequirementStatus === 'REQUIRED');
        if (!info.canRequestAds) return setStatus('off');
        await ads.default().initialize();
        setStatus('ready');
      } catch (e) {
        console.warn('Ads unavailable', e); // no ads is always an acceptable outcome
        setStatus('off');
      }
    })();
  }, [isPremium, ready]);

  const showPrivacyOptions = () => {
    load()
      ?.AdsConsent.showPrivacyOptionsForm()
      .catch((e) => console.warn(e));
  };

  return <Ctx.Provider value={{ status, ready, privacyOptionsRequired, showPrivacyOptions }}>{children}</Ctx.Provider>;
}

export const useAds = () => useContext(Ctx);

/**
 * Bottom adaptive banner. Its space is reserved while ads are pending or loaded, so the capture
 * buttons above never jump when an ad arrives (a jump right before a tap causes accidental taps).
 * Renders nothing for Premium users, in Expo Go, or when ads are off (e.g. consent not given).
 */
export function AdBanner() {
  const { isPremium } = usePremium();
  const { status } = useAds();
  const ads = load();
  if (!ads || isPremium || status === 'off') return null;
  const real = Platform.OS === 'ios' ? config.admob.iosBanner : config.admob.androidBanner;
  const unitId = __DEV__ || !real ? ads.TestIds.ADAPTIVE_BANNER : real;
  const { BannerAd, BannerAdSize } = ads;
  return (
    // Gap above keeps the ad clear of the capture buttons.
    <View style={{ alignItems: 'center', paddingTop: 6, minHeight: 56 }}>
      {status === 'ready' && (
        <BannerAd
          unitId={unitId}
          // ponytail: ANCHORED_ADAPTIVE_BANNER is deprecated in favor of LARGE_; kept for the smaller footprint.
          size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
          requestOptions={{ requestNonPersonalizedAdsOnly: true }}
          onAdFailedToLoad={(e) => console.warn('Ad failed', e.message)}
        />
      )}
    </View>
  );
}
