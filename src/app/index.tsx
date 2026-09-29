import { router, Stack, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { createJar, deleteJar, getSetting, listJars, renameJar, type JarSummary } from '../lib/db';
import { removeFiles, saveFailed, startCapture } from '../lib/media';
import { NameDialog, Sheet } from '../lib/sheet';
import { C, CaptureBar, CoverStack, Empty } from '../lib/ui';

const NEW = -1; // sentinel item for the "New jar" tile

export default function Home() {
  const db = useSQLiteContext();
  const [jars, setJars] = useState<JarSummary[] | null>(null);
  const [menuFor, setMenuFor] = useState<JarSummary | null>(null);
  const [dialog, setDialog] = useState<{ mode: 'new' } | { mode: 'rename'; jar: JarSummary } | null>(null);

  const load = useCallback(() => {
    listJars(db).then(setJars);
  }, [db]);
  useFocusEffect(load);

  // First launch: show the one-time intro.
  useEffect(() => {
    getSetting(db, 'welcomed').then((v) => {
      if (!v) router.push('/welcome');
    });
  }, [db]);

  const open = (id: number) => router.push({ pathname: '/jar/[id]', params: { id: String(id) } });

  async function submitName(name: string) {
    try {
      if (dialog?.mode === 'rename') await renameJar(db, dialog.jar.id, name);
      else open(await createJar(db, name));
      load();
    } catch (e) {
      saveFailed(e);
    }
  }

  function confirmDelete(jar: JarSummary) {
    const n = jar.count;
    Alert.alert(
      `Delete “${jar.name}”?`,
      n
        ? `Its ${n} ${n === 1 ? 'memory' : 'memories'} and their photos and videos will be removed from Memento. Your Photos library is not affected.`
        : undefined,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            removeFiles(await deleteJar(db, jar.id));
            load();
          },
        },
      ],
    );
  }

  if (!jars) return null;
  const data = jars.length ? [...jars, { id: NEW } as JarSummary] : [];

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['bottom']}>
      <Stack.Screen
        options={{
          headerRight: () => (
            <Pressable
              onPress={() => router.push('/settings')}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel="Settings"
            >
              <Text style={styles.gear}>⚙</Text>
            </Pressable>
          ),
        }}
      />
      <FlatList
        data={data}
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
        renderItem={({ item }) =>
          item.id === NEW ? (
            <Pressable
              style={styles.jar}
              onPress={() => setDialog({ mode: 'new' })}
              accessibilityRole="button"
              accessibilityLabel="New jar"
            >
              <View style={styles.newTile}>
                <Text style={styles.newPlus}>＋</Text>
              </View>
              <Text style={[styles.jarName, { color: C.muted }]}>New jar</Text>
            </Pressable>
          ) : (
            <Pressable
              style={styles.jar}
              onPress={() => open(item.id)}
              onLongPress={() => setMenuFor(item)}
              accessibilityRole="button"
              accessibilityLabel={`${item.name}, ${plural(item.count, 'memory', 'memories')}. Long press for options`}
            >
              <CoverStack covers={item.covers} />
              <Text style={styles.jarName} numberOfLines={1}>
                {item.name}
              </Text>
              <Text style={styles.count}>{plural(item.count, 'memory', 'memories')}</Text>
            </Pressable>
          )
        }
      />
      <View style={styles.shelfLine} />
      <CaptureBar onLibrary={() => startCapture(false)} onCamera={() => startCapture(true)} />

      <Sheet
        visible={!!menuFor}
        title={menuFor?.name}
        onClose={() => setMenuFor(null)}
        actions={
          menuFor
            ? [
                { label: 'Open', onPress: () => open(menuFor.id) },
                { label: 'Rename', onPress: () => setDialog({ mode: 'rename', jar: menuFor }) },
                { label: 'Delete jar', destructive: true, onPress: () => confirmDelete(menuFor) },
              ]
            : []
        }
      />
      <NameDialog
        visible={!!dialog}
        title={dialog?.mode === 'rename' ? 'Rename jar' : 'New jar'}
        initial={dialog?.mode === 'rename' ? dialog.jar.name : ''}
        placeholder="e.g. Japan 2026, Us, Cooking"
        confirmLabel={dialog?.mode === 'rename' ? 'Save' : 'Create'}
        onSubmit={submitName}
        onClose={() => setDialog(null)}
      />
    </SafeAreaView>
  );
}

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

const styles = StyleSheet.create({
  jar: { flex: 1, maxWidth: '50%', alignItems: 'center', paddingVertical: 16 },
  jarName: { fontSize: 16, fontWeight: '600', color: C.ink, marginTop: 10 },
  count: { fontSize: 13, color: C.muted, marginTop: 2 },
  hint: { color: C.muted, textAlign: 'center', lineHeight: 20 },
  shelfLine: { height: 1, backgroundColor: C.line },
  gear: { fontSize: 24, color: C.ink },
  newTile: {
    width: 120,
    height: 120,
    marginVertical: 10,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: C.line,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  newPlus: { fontSize: 36, color: C.muted },
});
