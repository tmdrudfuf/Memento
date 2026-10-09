import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, Linking, Pressable, ScrollView, Text, View } from 'react-native';
import type { PurchasesPackage } from 'react-native-purchases';
import { config } from '../lib/config';
import { t } from '../lib/i18n';
import type { PaywallReason } from '../lib/plan';
import { usePremium } from '../lib/premium';
import { makeStyles, useChrome } from '../lib/theme';
import { Button, haptic, useColors } from '../lib/ui';

// Shown only at the moment a Premium feature is needed (MONETIZATION.md §6). Never at launch.
const COPY: Record<PaywallReason, { title: string; body: string }> = {
  jars: { title: t.paywallJarsTitle, body: t.paywallJarsBody },
  rediscover: { title: t.paywallRediscoverTitle, body: t.paywallRediscoverBody },
  recap: { title: t.paywallRecapTitle, body: t.paywallRecapBody },
  backup: { title: t.paywallBackupTitle, body: t.paywallBackupBody },
  settings: { title: t.paywallGenericTitle, body: t.paywallGenericBody },
};

type PlanKey = 'annual' | 'monthly' | 'lifetime';

// Store prices come from Google Play / App Store; these are shown only when the store isn't set up.
const FALLBACK: Record<PlanKey, string> = { annual: '$29.99', monthly: '$3.99', lifetime: '$59.99' };

export default function Paywall() {
  const chrome = useChrome();
  const styles = useStyles();
  const c = useColors();
  const { reason = 'settings' } = useLocalSearchParams<{ reason?: PaywallReason }>();
  const { offering, storeReady, purchase, restore } = usePremium();
  const [plan, setPlan] = useState<PlanKey>('annual');
  const [busy, setBusy] = useState(false);
  const copy = COPY[reason] ?? COPY.settings;

  // Founder's Lifetime appears only while it is in the store offering (switchable in RevenueCat).
  const plans: PlanKey[] = storeReady
    ? (['annual', 'monthly', 'lifetime'] as PlanKey[]).filter((k) => offering?.[k])
    : ['annual', 'monthly', 'lifetime'];
  const pkg = (k: PlanKey): PurchasesPackage | null => offering?.[k] ?? null;
  const price = (k: PlanKey) => pkg(k)?.product.priceString ?? FALLBACK[k];

  async function buy() {
    const p = pkg(plan);
    if (!p) return;
    setBusy(true);
    try {
      if (await purchase(p)) {
        haptic.done();
        Alert.alert(t.welcomePremium);
        router.back();
      }
    } catch (e) {
      console.warn(e);
      Alert.alert(t.purchaseFailed, t.tryAgainBody);
    } finally {
      setBusy(false);
    }
  }

  async function doRestore() {
    setBusy(true);
    try {
      const ok = await restore();
      Alert.alert(ok ? t.restored : t.nothingToRestore);
      if (ok) router.back();
    } catch (e) {
      console.warn(e);
      Alert.alert(t.purchaseFailed, t.tryAgainBody);
    } finally {
      setBusy(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.wrap}>
      <Stack.Screen options={{ ...chrome, title: '' }} />
      <Text style={styles.title} accessibilityRole="header">
        {copy.title}
      </Text>
      <Text style={styles.body}>{copy.body}</Text>

      <View style={styles.benefits}>
        {[t.benefitJars, t.benefitAds, t.benefitBackup, t.benefitRediscover, t.benefitRecap].map((b) => (
          <Text key={b} style={styles.benefit}>
            ✓ {b}
          </Text>
        ))}
      </View>

      <View style={{ gap: 10 }}>
        {plans.map((k) => (
          <Pressable
            key={k}
            onPress={() => setPlan(k)}
            style={[styles.plan, plan === k && styles.planOn]}
            accessibilityRole="radio"
            accessibilityState={{ selected: plan === k }}
          >
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={styles.planName}>
                {k === 'annual' ? t.planYearly : k === 'monthly' ? t.planMonthly : t.planLifetime}
                {k === 'annual' ? <Text style={styles.badge}>{'  ' + t.bestValue}</Text> : null}
              </Text>
              {k === 'lifetime' ? <Text style={styles.planNote}>{t.lifetimeNote}</Text> : null}
            </View>
            <Text style={styles.price}>
              {k === 'annual' ? t.perYear(price(k)) : k === 'monthly' ? t.perMonth(price(k)) : t.oneTime(price(k))}
            </Text>
          </Pressable>
        ))}
      </View>

      {storeReady ? (
        busy ? (
          <ActivityIndicator color={c.ink} style={{ padding: 14 }} />
        ) : (
          <Button label={t.continue} onPress={buy} />
        )
      ) : (
        <Text style={styles.unavailable}>{t.storeUnavailable}</Text>
      )}

      <Text style={styles.keep}>{t.keepAccess}</Text>

      <View style={styles.links}>
        {storeReady && (
          <Pressable onPress={doRestore} disabled={busy} accessibilityRole="button">
            <Text style={styles.link}>{t.restore}</Text>
          </Pressable>
        )}
        <Pressable onPress={() => Linking.openURL(config.links.terms)} accessibilityRole="link">
          <Text style={styles.link}>{t.terms}</Text>
        </Pressable>
        <Pressable onPress={() => Linking.openURL(config.links.privacy)} accessibilityRole="link">
          <Text style={styles.link}>{t.privacyPolicy}</Text>
        </Pressable>
      </View>
      <Text style={styles.fine}>{t.subsDisclosure}</Text>
      <Pressable onPress={() => router.back()} style={{ alignSelf: 'center', padding: 12 }} accessibilityRole="button">
        <Text style={[styles.link, { color: c.muted }]}>{t.notNow}</Text>
      </Pressable>
    </ScrollView>
  );
}

const useStyles = makeStyles((c) => ({
  wrap: { padding: 24, gap: 18, paddingBottom: 48 },
  title: { fontSize: 28, fontWeight: '700', color: c.ink, lineHeight: 34 },
  body: { fontSize: 16, color: c.muted, lineHeight: 22 },
  benefits: { gap: 8, backgroundColor: c.card, borderRadius: 14, padding: 16 },
  benefit: { fontSize: 16, color: c.ink },
  plan: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: c.line,
    backgroundColor: c.card,
  },
  planOn: { borderColor: c.accent },
  planName: { fontSize: 17, fontWeight: '600', color: c.ink },
  badge: { fontSize: 13, fontWeight: '600', color: c.accent },
  planNote: { fontSize: 13, color: c.muted },
  price: { fontSize: 16, color: c.ink },
  unavailable: { textAlign: 'center', color: c.muted, padding: 12 },
  keep: { textAlign: 'center', color: c.muted, fontSize: 14 },
  links: { flexDirection: 'row', justifyContent: 'center', gap: 20, flexWrap: 'wrap' },
  link: { color: c.accent, fontSize: 14 },
  fine: { fontSize: 12, color: c.muted, textAlign: 'center', lineHeight: 17 },
}));
