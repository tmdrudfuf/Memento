import { router, Stack, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { deleteJar, getJar, listMemories, renameJar, type Jar as JarRow, type Memory } from '../../lib/db';
import { removeFiles, startCapture } from '../../lib/media';
import { Button, C, CaptureBar, Empty, formatDate, Polaroid } from '../../lib/ui';

export default function Jar() {
  const db = useSQLiteContext();
  const { id: idParam, settle } = useLocalSearchParams<{ id: string; settle?: string }>();
  const id = Number(idParam);
  const [jar, setJar] = useState<JarRow | null>(null);
  const [memories, setMemories] = useState<Memory[]>([]);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');

  const load = useCallback(async () => {
    const j = await getJar(db, id);
    if (!j) return router.back();
    setJar(j);
    setName(j.name);
    setMemories(await listMemories(db, id));
  }, [db, id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  async function saveName() {
    if (!name.trim()) return;
    await renameJar(db, id, name);
    setEditing(false);
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
            <Pressable onPress={() => setEditing((e) => !e)} hitSlop={12} accessibilityRole="button">
              <Text style={{ color: C.accent, fontSize: 16 }}>{editing ? 'Done' : 'Edit'}</Text>
            </Pressable>
          ),
        }}
      />
      {editing && (
        <View style={styles.edit}>
          <TextInput
            value={name}
            onChangeText={setName}
            onSubmitEditing={saveName}
            onBlur={saveName}
            style={styles.input}
            maxLength={40}
            accessibilityLabel="Jar name"
          />
          <Button label="Delete jar" kind="ghost" onPress={confirmDelete} />
        </View>
      )}
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  edit: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, alignItems: 'center' },
  input: {
    flex: 1,
    fontSize: 16,
    backgroundColor: C.card,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: C.ink,
    borderWidth: 1,
    borderColor: C.line,
  },
});
