import Constants from 'expo-constants';
import { router, Stack, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState, type ReactNode } from 'react';
import { Alert, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { deleteAllData, stats } from '../lib/db';
import { removeAllMedia, storageUsed } from '../lib/media';
import { t } from '../lib/i18n';
import { makeStyles, useChrome } from '../lib/theme';
import { useColors } from '../lib/ui';

const SITE = 'https://tmdrudfuf.github.io/Memento/';
const PRIVACY = `${SITE}privacy.html`;
const SUPPORT = 'https://github.com/tmdrudfuf/Memento/issues';

const formatBytes = (b: number) =>
  b < 1024 * 1024 ? `${Math.max(1, Math.round(b / 1024))} KB` : `${(b / 1024 / 1024).toFixed(b < 100 * 1024 * 1024 ? 1 : 0)} MB`;

export default function Settings() {
  const db = useSQLiteContext();
  const chrome = useChrome();
  const styles = useStyles();
  const [s, setS] = useState({ memories: 0, jars: 0, revisited: 0 });
  const [bytes, setBytes] = useState(0);

  const load = useCallback(() => {
    stats(db).then(setS);
    setBytes(storageUsed());
  }, [db]);
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
      <Section title={t.yourCollection}>
        <Row label={t.memoriesLabel} value={String(s.memories)} />
        <Row label={t.jarsLabel} value={String(s.jars)} />
        <Row label={t.revisited} value={String(s.revisited)} />
        <Row label={t.storageUsed} value={formatBytes(bytes)} last />
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
  note: { color: c.muted, fontSize: 14, lineHeight: 20, padding: 16, paddingBottom: 4 },
}));
