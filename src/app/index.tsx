import { router, Stack, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { createJar, deleteJar, getSetting, listJars, renameJar, type JarSummary } from '../lib/db';
import { t } from '../lib/i18n';
import { removeFiles, saveFailed, startCapture } from '../lib/media';
import { NameDialog, Sheet } from '../lib/sheet';
import { makeStyles, useChrome } from '../lib/theme';
import { CaptureBar, CoverStack, Empty } from '../lib/ui';

const NEW = -1; // sentinel item for the "New jar" tile

export default function Home() {
  const db = useSQLiteContext();
  const chrome = useChrome();
  const styles = useStyles();
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
    Alert.alert(t.deleteJarTitle(jar.name), jar.count ? t.deleteJarBody(jar.count) : undefined, [
      { text: t.cancel, style: 'cancel' },
      {
        text: t.delete,
        style: 'destructive',
        onPress: async () => {
          removeFiles(await deleteJar(db, jar.id));
          load();
        },
      },
    ]);
  }

  if (!jars) return null;
  const data = jars.length ? [...jars, { id: NEW } as JarSummary] : [];

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['bottom']}>
      <Stack.Screen
        options={{
          ...chrome,
          headerRight: () => (
            <Pressable
              onPress={() => router.push('/settings')}
              hitSlop={12}
              accessibilityRole="button"
              accessibilityLabel={t.settings}
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
          <Empty title={t.shelfEmptyTitle}>
            <Text style={styles.hint}>{t.shelfEmptyHint}</Text>
          </Empty>
        }
        renderItem={({ item }) =>
          item.id === NEW ? (
            <Pressable
              style={styles.jar}
              onPress={() => setDialog({ mode: 'new' })}
              accessibilityRole="button"
              accessibilityLabel={t.newJar}
            >
              <View style={styles.newTile}>
                <Text style={styles.newPlus}>＋</Text>
              </View>
              <Text style={[styles.jarName, styles.muted]}>{t.newJar}</Text>
            </Pressable>
          ) : (
            <Pressable
              style={styles.jar}
              onPress={() => open(item.id)}
              onLongPress={() => setMenuFor(item)}
              accessibilityRole="button"
              accessibilityLabel={t.jarA11y(item.name, item.count)}
            >
              <CoverStack covers={item.covers} />
              <Text style={styles.jarName} numberOfLines={1}>
                {item.name}
              </Text>
              <Text style={styles.count}>{t.memories(item.count)}</Text>
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
                { label: t.open, onPress: () => open(menuFor.id) },
                { label: t.rename, onPress: () => setDialog({ mode: 'rename', jar: menuFor }) },
                { label: t.deleteJar, destructive: true, onPress: () => confirmDelete(menuFor) },
              ]
            : []
        }
      />
      <NameDialog
        visible={!!dialog}
        title={dialog?.mode === 'rename' ? t.renameJar : t.newJar}
        initial={dialog?.mode === 'rename' ? dialog.jar.name : ''}
        placeholder={t.jarPlaceholder}
        confirmLabel={dialog?.mode === 'rename' ? t.save : t.create}
        onSubmit={submitName}
        onClose={() => setDialog(null)}
      />
    </SafeAreaView>
  );
}

const useStyles = makeStyles((c) => ({
  jar: { flex: 1, maxWidth: '50%', alignItems: 'center', paddingVertical: 16 },
  jarName: { fontSize: 16, fontWeight: '600', color: c.ink, marginTop: 10 },
  muted: { color: c.muted },
  count: { fontSize: 13, color: c.muted, marginTop: 2 },
  hint: { color: c.muted, textAlign: 'center', lineHeight: 20 },
  shelfLine: { height: 1, backgroundColor: c.line },
  gear: { fontSize: 24, color: c.ink },
  newTile: {
    width: 120,
    height: 120,
    marginVertical: 10,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: c.line,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  newPlus: { fontSize: 36, color: c.muted },
}));
