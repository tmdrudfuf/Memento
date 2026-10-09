import { useSQLiteContext } from 'expo-sqlite';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Platform } from 'react-native';
import Purchases, { type CustomerInfo, type PurchasesOffering, type PurchasesPackage } from 'react-native-purchases';
import { config } from './config';
import { getSetting, setSetting } from './db';

type Premium = {
  isPremium: boolean;
  /** True once the store is configured and offerings loaded (false in builds without store keys). */
  storeReady: boolean;
  offering: PurchasesOffering | null;
  /** Store page to manage or cancel an active subscription (null for Lifetime or Free). */
  manageUrl: string | null;
  purchase: (pkg: PurchasesPackage) => Promise<boolean>;
  restore: () => Promise<boolean>;
  /** QA only: flip Premium without a store, to test gated screens. */
  devOverride: boolean;
  setDevOverride: (on: boolean) => void;
};

const Ctx = createContext<Premium | null>(null);

/** Debug builds and QA APKs (built with EXPO_PUBLIC_QA=1) can flip Premium without a store. */
export const QA = __DEV__ || process.env.EXPO_PUBLIC_QA === '1';

const apiKey = Platform.OS === 'ios' ? config.revenueCat.iosKey : config.revenueCat.androidKey;
const entitled = (info: CustomerInfo) => info.entitlements.active[config.revenueCat.entitlement] !== undefined;

export function PremiumProvider({ children }: { children: ReactNode }) {
  const db = useSQLiteContext();
  const [storePremium, setStorePremium] = useState(false);
  const [manageUrl, setManageUrl] = useState<string | null>(null);
  const apply = useCallback((info: CustomerInfo) => {
    setStorePremium(entitled(info));
    setManageUrl(info.managementURL);
    return entitled(info);
  }, []);
  const [offering, setOffering] = useState<PurchasesOffering | null>(null);
  const [storeReady, setStoreReady] = useState(false);
  const [devOverride, setDev] = useState(false);

  useEffect(() => {
    if (QA) getSetting(db, 'devPremium').then((v) => setDev(v === '1'));
  }, [db]);

  useEffect(() => {
    if (!apiKey) return; // not set up yet: everyone is Free, paywall explains purchases aren't available
    let alive = true;
    const onInfo = (info: CustomerInfo) => alive && apply(info);
    (async () => {
      try {
        Purchases.configure({ apiKey });
        Purchases.addCustomerInfoUpdateListener(onInfo);
        onInfo(await Purchases.getCustomerInfo());
        const offerings = await Purchases.getOfferings();
        if (alive) {
          setOffering(offerings.current);
          setStoreReady(!!offerings.current);
        }
      } catch (e) {
        console.warn('Purchases unavailable', e); // offline or store issue: stay on last known state
      }
    })();
    return () => {
      alive = false;
      Purchases.removeCustomerInfoUpdateListener(onInfo);
    };
  }, [apply]);

  const purchase = useCallback(
    async (pkg: PurchasesPackage) => {
      try {
        const { customerInfo } = await Purchases.purchasePackage(pkg);
        return apply(customerInfo);
      } catch (e) {
        if ((e as { userCancelled?: boolean }).userCancelled) return false;
        throw e;
      }
    },
    [apply],
  );

  const restore = useCallback(async () => apply(await Purchases.restorePurchases()), [apply]);

  const setDevOverride = useCallback(
    (on: boolean) => {
      setDev(on);
      setSetting(db, 'devPremium', on ? '1' : '0');
    },
    [db],
  );

  const value = useMemo(
    () => ({
      isPremium: storePremium || (QA && devOverride),
      storeReady,
      offering,
      manageUrl,
      purchase,
      restore,
      devOverride,
      setDevOverride,
    }),
    [storePremium, devOverride, storeReady, offering, manageUrl, purchase, restore, setDevOverride],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function usePremium() {
  const v = useContext(Ctx);
  if (!v) throw new Error('usePremium outside PremiumProvider');
  return v;
}
