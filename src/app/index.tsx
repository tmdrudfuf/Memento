import { router, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { listJars, stats, type JarSummary } from '../lib/db';
import { startCapture } from '../lib/media';
import { C, CaptureBar, CoverStack, Empty } from '../lib/ui';

export default function Home() {
  const db = useSQLiteContext();
  const [jars, setJars] = useState<JarSummary[] | null>(null);
  const [s, setS] = useState({ memories: 0, jars: 0, revisited: 0 });

  useFocusEffect(
    useCallback(() => {
      listJars(db).then(setJars);
      stats(db).then(setS);
    }, [db]),
  );

  if (!jars) return null;

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['bottom']}>
      <FlatList
        data={jars}
        numColumns={2}
        keyExtractor={(j) => String(j.id)}
        contentContainerStyle={{ padding: 12, flexGrow: 1 }}
        columnWrapperStyle={{ gap: 12 }}
        ListEmptyComponent={
          <Empty title="Your shelf is empty">
            <Text style={styles.hint}>
              Pick one photo that brings a moment back — a meal, a ticket, a view.{'\n'}That photo opens the whole
              memory.
            </Text>
          </Empty>
        }
        renderItem={({ item }) => (
          <Pressable
            style={styles.jar}
            onPress={() => router.push({ pathname: '/jar/[id]', params: { id: String(item.id) } })}
            accessibilityRole="button"
            accessibilityLabel={`${item.name}, ${item.count} memories`}
          >
            <CoverStack covers={item.covers} />
            <Text style={styles.jarName} numberOfLines={1}>
              {item.name}
            </Text>
            <Text style={styles.count}>
              {item.count} {item.count === 1 ? 'memory' : 'memories'}
            </Text>
          </Pressable>
        )}
        ListFooterComponent={
          s.memories > 0 ? (
            <Text style={styles.stats}>
              {s.memories} memories · {s.jars} jars · {s.revisited} revisited after a week
            </Text>
          ) : null
        }
      />
      <View style={styles.shelfLine} />
      <CaptureBar onLibrary={() => startCapture(false)} onCamera={() => startCapture(true)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  jar: { flex: 1, maxWidth: '50%', alignItems: 'center', paddingVertical: 16 },
  jarName: { fontSize: 16, fontWeight: '600', color: C.ink, marginTop: 10 },
  count: { fontSize: 13, color: C.muted, marginTop: 2 },
  hint: { color: C.muted, textAlign: 'center', lineHeight: 20 },
  stats: { color: C.muted, fontSize: 12, textAlign: 'center', marginTop: 24 },
  shelfLine: { height: 1, backgroundColor: C.line },
});
