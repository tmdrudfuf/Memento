import Constants from 'expo-constants';
import { router, Stack, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { useAds } from '../lib/ads';
import { exportBackup, importBackup, NotABackupError } from '../lib/backup';
import { config } from '../lib/config';
import { deleteAllData, getSetting, setSetting, stats } from '../lib/db';
import { removeAllMedia, storageUsed } from '../lib/media';
import { t } from '../lib/i18n';
import { QA, usePremium } from '../lib/premium';
import { disableWeeklyReminder, enableWeeklyReminder } from '../lib/reminder';
import { makeStyles, useChrome } from '../lib/theme';
import { useColors } from '../lib/ui';

const { site: SITE, privacy: PRIVACY, support: SUPPORT } = config.links;

const formatBytes = (b: number) =>
  b < 1024 * 1024
    ? `${Math.max(1, Math.round(b / 1024))} KB`
    : `${(b / 1024 / 1024).toFixed(b < 100 * 1024 * 1024 ? 1 : 0)} MB`;

export default function Settings() {
  const db = useSQLiteContext();
  const chrome = useChrome();
  const styles = useStyles();
  const [s, setS] = useState({ memories: 0, jars: 0, revisited: 0 });
  const [bytes, setBytes] = useState(0);
  const [reminder, setReminder] = useState(false);
  const c = useColors();
  const premium = usePremium();
  const [busy, setBusy] = useState<string | null>(null);

  async function doExport() {
    setBusy(t.preparingBackup(0, 0));
    try {
      await exportBackup(db, (done, total) => setBusy(t.preparingBackup(done, total)));
    } catch (e) {
      console.warn(e);
      Alert.alert(t.backupFailed, t.tryAgainBody);
    } finally {
      setBusy(null);
    }
  }

  function doImport() {
    Alert.alert(t.restoreTitle, t.restoreBody, [
      { text: t.cancel, style: 'cancel' },
      {
        text: t.continue,
        onPress: async () => {
          setBusy(t.restoring);
          try {
            const r = await importBackup(db);
            if (r) Alert.alert(r.memories || r.jars ? t.restoreDone(r.jars, r.memories) : t.restoreNothing);
            load();
          } catch (e) {
            console.warn(e);
            Alert.alert(e instanceof NotABackupError ? t.notABackup : t.backupFailed);
          } finally {
            setBusy(null);
          }
        },
      },
    ]);
  }
  const ads = useAds();

  const load = useCallback(() => {
    stats(db).then(setS);
    setBytes(storageUsed());
    getSetting(db, 'weeklyReminder').then((v) => setReminder(v === '1'));
  }, [db]);

  async function toggleReminder(on: boolean) {
    setReminder(on);
    try {
      if (on && !(await enableWeeklyReminder())) {
        setReminder(false);
        Alert.alert(t.notifDeniedTitle, t.notifDeniedBody, [
          { text: t.ok },
          { text: t.openSettings, onPress: () => Linking.openSettings() },
        ]);
        return;
      }
      if (!on) await disableWeeklyReminder();
      await setSetting(db, 'weeklyReminder', on ? '1' : '0');
    } catch (e) {
      console.warn(e);
      setReminder(!on);
    }
  }
  useFocusEffect(load);

  function confirmDeleteAll() {
    Alert.alert(t.deleteAllTitle, t.deleteAllBody, [
      { text: t.cancel, style: 'cancel' },
      {
        text: t.continue,
        style: 'destructive',
        onPress: () =>
          Alert.alert(t.cannotUndo, t.photosUnaffected, [
            { text: t.cancel, style: 'cancel' },
            {
              text: t.deleteEverything,
              style: 'destructive',
              onPress: async () => {
                await deleteAllData(db);
                removeAllMedia();
                router.dismissAll();
              },
            },
          ]),
      },
    ]);
  }

  return (
    <ScrollView contentContainerStyle={styles.wrap}>
      <Stack.Screen options={chrome} />
      <Modal visible={!!busy} transparent animationType="fade">
        <View style={styles.busy}>
          <View style={styles.busyCard}>
            <ActivityIndicator color={c.ink} />
            <Text style={styles.label}>{busy}</Text>
          </View>
        </View>
      </Modal>
      <Section title={t.premium}>
        <Row label={premium.isPremium ? t.planPremium : t.planFree} value={premium.isPremium ? '✓' : undefined} />
        {!premium.isPremium && (
          <Row
            label={t.upgrade}
            onPress={() => router.push({ pathname: '/paywall', params: { reason: 'settings' } })}
          />
        )}
        {premium.storeReady && (
          <Row
            label={t.restore}
            onPress={() =>
              premium
                .restore()
                .then((ok) => Alert.alert(ok ? t.restored : t.nothingToRestore))
                .catch(() => Alert.alert(t.purchaseFailed, t.tryAgainBody))
            }
          />
        )}
        {ads.privacyOptionsRequired && !premium.isPremium && (
          <Row label={t.adPrivacy} onPress={ads.showPrivacyOptions} />
        )}
        {QA && (
          <View style={styles.row}>
            <Text style={styles.label}>{t.devPremium}</Text>
            <Switch value={premium.devOverride} onValueChange={premium.setDevOverride} />
          </View>
        )}
      </Section>

      <Section title={t.yourCollection}>
        <Row label={t.memoriesLabel} value={String(s.memories)} />
        <Row label={t.jarsLabel} value={String(s.jars)} />
        <Row label={t.revisited} value={String(s.revisited)} />
        <Row label={t.storageUsed} value={formatBytes(bytes)} />
        <Row label={t.yearlyRecap} onPress={() => router.push('/recap')} last />
      </Section>

      <Section title={t.backup}>
        <Text style={styles.note}>{t.backupNote}</Text>
        <Row label={t.exportBackup} onPress={doExport} />
        <Row label={t.restoreBackup} onPress={doImport} last />
      </Section>

      <Section title={t.reminders}>
        <View style={[styles.row, { gap: 12 }]}>
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={styles.label}>{t.weeklyReminder}</Text>
            <Text style={styles.sub}>{t.reminderNote}</Text>
          </View>
          <Switch
            value={reminder}
            onValueChange={toggleReminder}
            trackColor={{ true: c.accent, false: c.line }}
            accessibilityLabel={t.weeklyReminder}
          />
        </View>
      </Section>

      <Section title={t.privacy}>
        <Text style={styles.note}>{t.privacyNote}</Text>
        <Row label={t.privacyPolicy} onPress={() => Linking.openURL(PRIVACY)} last />
      </Section>

      <Section title={t.about}>
        <Row label={t.support} onPress={() => Linking.openURL(SUPPORT)} />
        <Row label={t.website} onPress={() => Linking.openURL(SITE)} />
        <Row label={t.version} value={Constants.expoConfig?.version ?? '—'} last />
      </Section>

      <Section title={t.data}>
        <Row label={t.deleteAll} destructive onPress={confirmDeleteAll} last />
      </Section>
    </ScrollView>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  const styles = useStyles();
  return (
    <View style={{ gap: 8 }}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.card}>{children}</View>
    </View>
  );
}

function Row({
  label,
  value,
  onPress,
  destructive,
  last,
}: {
  label: string;
  value?: string;
  onPress?: () => void;
  destructive?: boolean;
  last?: boolean;
}) {
  const styles = useStyles();
  const c = useColors();
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      style={({ pressed }) => [styles.row, !last && styles.rowLine, pressed && { opacity: 0.6 }]}
    >
      <Text style={[styles.label, destructive && { color: c.accent }]}>{label}</Text>
      {value ? <Text style={styles.value}>{value}</Text> : onPress ? <Text style={styles.chevron}>›</Text> : null}
    </Pressable>
  );
}

const useStyles = makeStyles((c) => ({
  wrap: { padding: 16, gap: 24, paddingBottom: 48 },
  sectionTitle: { fontSize: 13, color: c.muted, textTransform: 'uppercase', letterSpacing: 1, marginLeft: 4 },
  card: { backgroundColor: c.card, borderRadius: 14, overflow: 'hidden' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  rowLine: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: c.line },
  label: { fontSize: 16, color: c.ink },
  value: { fontSize: 16, color: c.muted },
  chevron: { fontSize: 22, color: c.muted, lineHeight: 22 },
  sub: { color: c.muted, fontSize: 13, lineHeight: 18 },
  busy: { flex: 1, backgroundColor: c.scrim, alignItems: 'center', justifyContent: 'center' },
  busyCard: { backgroundColor: c.card, borderRadius: 16, padding: 24, gap: 12, alignItems: 'center', minWidth: 220 },
  note: { color: c.muted, fontSize: 14, lineHeight: 20, padding: 16, paddingBottom: 4 },
}));
