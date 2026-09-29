import Constants from 'expo-constants';
import { router, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState, type ReactNode } from 'react';
import { Alert, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { deleteAllData, stats } from '../lib/db';
import { removeAllMedia, storageUsed } from '../lib/media';
import { C } from '../lib/ui';

const SITE = 'https://tmdrudfuf.github.io/Memento/';
const PRIVACY = `${SITE}privacy.html`;
const SUPPORT = 'https://github.com/tmdrudfuf/Memento/issues';

const formatBytes = (b: number) =>
  b < 1024 * 1024 ? `${Math.max(1, Math.round(b / 1024))} KB` : `${(b / 1024 / 1024).toFixed(b < 100 * 1024 * 1024 ? 1 : 0)} MB`;

export default function Settings() {
  const db = useSQLiteContext();
  const [s, setS] = useState({ memories: 0, jars: 0, revisited: 0 });
  const [bytes, setBytes] = useState(0);

  const load = useCallback(() => {
    stats(db).then(setS);
    setBytes(storageUsed());
  }, [db]);
  useFocusEffect(load);

  function confirmDeleteAll() {
    Alert.alert('Delete all data?', 'Every jar, memory, photo, video and note in Memento will be removed from this phone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Continue',
        style: 'destructive',
        onPress: () =>
          Alert.alert('This cannot be undone', 'Your Photos library is not affected.', [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Delete everything',
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
      <Section title="Your collection">
        <Row label="Memories" value={String(s.memories)} />
        <Row label="Jars" value={String(s.jars)} />
        <Row label="Revisited after a week" value={String(s.revisited)} />
        <Row label="Storage used" value={formatBytes(bytes)} last />
      </Section>

      <Section title="Privacy">
        <Text style={styles.note}>
          Your memories are stored only on this phone. Memento only sees the photos you pick.
        </Text>
        <Row label="Privacy policy" onPress={() => Linking.openURL(PRIVACY)} last />
      </Section>

      <Section title="About">
        <Row label="Help & support" onPress={() => Linking.openURL(SUPPORT)} />
        <Row label="Website" onPress={() => Linking.openURL(SITE)} />
        <Row label="Version" value={Constants.expoConfig?.version ?? '—'} last />
      </Section>

      <Section title="Data">
        <Row label="Delete all data" destructive onPress={confirmDeleteAll} last />
      </Section>
    </ScrollView>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
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
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      style={({ pressed }) => [styles.row, !last && styles.rowLine, pressed && { opacity: 0.6 }]}
    >
      <Text style={[styles.label, destructive && { color: C.accent }]}>{label}</Text>
      {value ? <Text style={styles.value}>{value}</Text> : onPress ? <Text style={styles.chevron}>›</Text> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: 16, gap: 24, paddingBottom: 48 },
  sectionTitle: { fontSize: 13, color: C.muted, textTransform: 'uppercase', letterSpacing: 1, marginLeft: 4 },
  card: { backgroundColor: C.card, borderRadius: 14, overflow: 'hidden' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  rowLine: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.line },
  label: { fontSize: 16, color: C.ink },
  value: { fontSize: 16, color: C.muted },
  chevron: { fontSize: 22, color: C.muted, lineHeight: 22 },
  note: { color: C.muted, fontSize: 14, lineHeight: 20, padding: 16, paddingBottom: 4 },
});
