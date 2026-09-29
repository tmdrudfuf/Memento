import { router, Stack, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';
import { Alert, FlatList, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { deleteJar, getJar, listMemories, renameJar, type Jar as JarRow, type Memory } from '../../lib/db';
import { removeFiles, startCapture } from '../../lib/media';
import { NameDialog, Sheet } from '../../lib/sheet';
import { C, CaptureBar, Empty, formatDate, Polaroid } from '../../lib/ui';

export default function Jar() {
  const db = useSQLiteContext();
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
    Alert.alert(
      `Delete “${jar?.name}”?`,
      n ? `Its ${n} ${n === 1 ? 'memory' : 'memories'} and their photos and videos will be removed from Memento. Your Photos library is not affected.` : undefined,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            removeFiles(await deleteJar(db, id));
            router.back();
          },
        },
      ],
    );
  }

  if (!jar) return null;

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['bottom']}>
      <Stack.Screen
        options={{
          title: jar.name,
          headerRight: () => (
            <Pressable onPress={() => setMenu(true)} hitSlop={12} accessibilityRole="button" accessibilityLabel="Jar options">
              <Text style={{ color: C.ink, fontSize: 22, fontWeight: '700' }}>•••</Text>
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
          <Empty title="Nothing in this jar yet">
            <Text style={{ color: C.muted, textAlign: 'center' }}>Add one photo that brings a moment back.</Text>
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
          { label: 'Rename', onPress: () => setRenaming(true) },
          { label: 'Delete jar', destructive: true, onPress: confirmDelete },
        ]}
      />
      <NameDialog
        visible={renaming}
        title="Rename jar"
        initial={jar.name}
        onSubmit={saveName}
        onClose={() => setRenaming(false)}
      />
    </SafeAreaView>
  );
}

