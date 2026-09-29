import { router, Stack, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';
import { Alert, FlatList, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { deleteJar, getJar, listMemories, renameJar, type Jar as JarRow, type Memory } from '../../lib/db';
import { useChrome } from '../../lib/theme';
import { t } from '../../lib/i18n';
import { removeFiles, startCapture } from '../../lib/media';
import { NameDialog, Sheet } from '../../lib/sheet';
import { CaptureBar, Empty, formatDate, Polaroid, useColors } from '../../lib/ui';

export default function Jar() {
  const db = useSQLiteContext();
  const chrome = useChrome();
  const c = useColors();
  const { id: idParam, settle } = useLocalSearchParams<{ id: string; settle?: string }>();
  const id = Number(idParam);
  const [jar, setJar] = useState<JarRow | null>(null);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [menu, setMenu] = useState(false);
  const [renaming, setRenaming] = useState(false);

  const load = useCallback(async () => {
    const j = await getJar(db, id);
    if (!j) return router.back();
    setJar(j);
    setMemories(await listMemories(db, id));
  }, [db, id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  async function saveName(name: string) {
    await renameJar(db, id, name);
    load();
  }

  function confirmDelete() {
    const n = memories.length;
    Alert.alert(t.deleteJarTitle(jar?.name ?? ''), n ? t.deleteJarBody(n) : undefined, [
      { text: t.cancel, style: 'cancel' },
      {
        text: t.delete,
        style: 'destructive',
        onPress: async () => {
          removeFiles(await deleteJar(db, id));
          router.back();
        },
      },
    ]);
  }

  if (!jar) return null;

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['bottom']}>
      <Stack.Screen
        options={{
          ...chrome,
          title: jar.name,
          headerRight: () => (
            <Pressable onPress={() => setMenu(true)} hitSlop={12} accessibilityRole="button" accessibilityLabel={t.jarOptions}>
              <Text style={{ color: c.ink, fontSize: 22, fontWeight: '700' }}>•••</Text>
            </Pressable>
          ),
        }}
      />
      <FlatList
        data={memories}
        numColumns={2}
        keyExtractor={(m) => String(m.id)}
        contentContainerStyle={{ padding: 16, gap: 22, flexGrow: 1 }}
        columnWrapperStyle={{ gap: 18 }}
        ListEmptyComponent={
          <Empty title={t.jarEmptyTitle}>
            <Text style={{ color: c.muted, textAlign: 'center' }}>{t.jarEmptyHint}</Text>
          </Empty>
        }
        renderItem={({ item }) => (
          <View style={{ flex: 1, maxWidth: '50%' }}>
            <Polaroid
              id={item.id}
              file={item.cover}
              caption={item.title || formatDate(item.memoryDate)}
              settle={settle === String(item.id)}
              onPress={() => router.push({ pathname: '/memory/[id]', params: { id: String(item.id) } })}
            />
          </View>
        )}
      />
      <CaptureBar onLibrary={() => startCapture(false, id)} onCamera={() => startCapture(true, id)} />
      <Sheet
        visible={menu}
        title={jar.name}
        onClose={() => setMenu(false)}
        actions={[
          { label: t.rename, onPress: () => setRenaming(true) },
          { label: t.deleteJar, destructive: true, onPress: confirmDelete },
        ]}
      />
      <NameDialog
        visible={renaming}
        title={t.renameJar}
        initial={jar.name}
        onSubmit={saveName}
        onClose={() => setRenaming(false)}
      />
    </SafeAreaView>
  );
}
