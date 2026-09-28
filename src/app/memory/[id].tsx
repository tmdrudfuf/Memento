import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { router, Stack, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  addMedia,
  deleteMedia,
  deleteMemory,
  getMemory,
  listMedia,
  markOpened,
  updateMemory,
  type Media,
  type Memory as MemoryRow,
} from '../../lib/db';
import { pickFromLibrary, removeFiles, saveFailed, takeWithCamera } from '../../lib/media';
import { C, formatDate, Photo } from '../../lib/ui';

export default function Memory() {
  const db = useSQLiteContext();
  const id = Number(useLocalSearchParams<{ id: string }>().id);
  const [m, setM] = useState<MemoryRow | null>(null);
  const [media, setMedia] = useState<Media[]>([]);
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');

  const load = useCallback(async () => {
    const row = await getMemory(db, id);
    if (!row) return router.back();
    setM(row);
    setTitle(row.title ?? '');
    setNote(row.note ?? '');
    setMedia(await listMedia(db, id));
  }, [db, id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  // One open = one revisit (the H1 signal). Not re-counted when returning from the viewer.
  useEffect(() => {
    markOpened(db, id);
  }, [db, id]);

  const save = (patch: Parameters<typeof updateMemory>[2]) => updateMemory(db, id, patch).then(load);

  function editDate() {
    if (!m) return;
    DateTimePickerAndroid.open({
      value: new Date(m.memoryDate),
      mode: 'date',
      maximumDate: new Date(),
      onChange: (e, d) => e.type === 'set' && d && save({ memoryDate: d.getTime() }),
    });
  }

  async function add(camera: boolean) {
    try {
      const picked = camera ? await takeWithCamera({ videos: true }) : await pickFromLibrary({ multiple: true, videos: true });
      if (!picked.length) return;
      await addMedia(db, id, picked);
      load();
    } catch (e) {
      saveFailed(e);
    }
  }

  function removeItem(item: Media) {
    Alert.alert(`Remove this ${item.kind}?`, 'It will be removed from this memory only.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          const f = await deleteMedia(db, item.id);
          if (f) removeFiles([f]);
          load();
        },
      },
    ]);
  }

  function confirmDelete() {
    Alert.alert('Delete this memory?', 'Its photos, videos and note will be removed from Photo Catcher.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          removeFiles(await deleteMemory(db, id));
          router.back();
        },
      },
    ]);
  }

  const view = (file: string, kind: 'photo' | 'video') => router.push({ pathname: '/viewer', params: { file, kind } });

  if (!m) return null;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Stack.Screen
        options={{
          title: '',
          headerRight: () => (
            <Pressable onPress={confirmDelete} hitSlop={12} accessibilityRole="button">
              <Text style={{ color: C.accent, fontSize: 16 }}>Delete</Text>
            </Pressable>
          ),
        }}
      />
      <ScrollView contentContainerStyle={{ paddingBottom: 48 }} keyboardShouldPersistTaps="handled">
        <Pressable onPress={() => view(m.cover, 'photo')} accessibilityLabel="View cover photo">
          <Photo file={m.cover} style={{ width: '100%', aspectRatio: 1 }} />
        </Pressable>

        <View style={styles.body}>
          <TextInput
            value={title}
            onChangeText={(v) => {
              setTitle(v);
              updateMemory(db, id, { title: v }); // save as you type: leaving never loses text
            }}
            placeholder="Add a title"
            placeholderTextColor={C.muted}
            style={styles.title}
            maxLength={80}
            multiline
            submitBehavior="blurAndSubmit"
            returnKeyType="done"
          />

          {Platform.OS === 'ios' ? (
            <DateTimePicker
              value={new Date(m.memoryDate)}
              mode="date"
              display="compact"
              maximumDate={new Date()}
              onChange={(e, d) => e.type === 'set' && d && save({ memoryDate: d.getTime() })}
              style={{ alignSelf: 'flex-start', marginLeft: -8 }}
            />
          ) : (
            <Pressable onPress={editDate} accessibilityRole="button" accessibilityLabel="Change date">
              <Text style={styles.date}>{formatDate(m.memoryDate)} ✎</Text>
            </Pressable>
          )}

          <TextInput
            value={note}
            onChangeText={(v) => {
              setNote(v);
              updateMemory(db, id, { note: v });
            }}
            placeholder="A line to remember it by…"
            placeholderTextColor={C.muted}
            style={styles.note}
            multiline
            maxLength={1000}
          />

          <Text style={styles.section}>Inside this memory</Text>
          <View style={styles.grid}>
            {media.map((it) => (
              <Pressable
                key={it.id}
                style={styles.tile}
                onPress={() => view(it.file, it.kind)}
                onLongPress={() => removeItem(it)}
                accessibilityLabel={`${it.kind}, long press to remove`}
              >
                {it.kind === 'photo' ? (
                  <Photo file={it.file} style={{ flex: 1 }} />
                ) : (
                  <View style={styles.video}>
                    <Text style={{ color: '#fff', fontSize: 28 }}>▶</Text>
                  </View>
                )}
              </Pressable>
            ))}
            <Pressable style={[styles.tile, styles.add]} onPress={() => add(false)} accessibilityRole="button">
              <Text style={styles.addText}>＋{'\n'}Photos{'\n'}& videos</Text>
            </Pressable>
            <Pressable style={[styles.tile, styles.add]} onPress={() => add(true)} accessibilityRole="button">
              <Text style={styles.addText}>Camera</Text>
            </Pressable>
          </View>
          {media.length > 0 && <Text style={styles.hint}>Long-press an item to remove it.</Text>}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  body: { padding: 20, gap: 12 },
  title: { fontSize: 26, fontWeight: '700', color: C.ink, paddingVertical: 4 },
  date: { fontSize: 15, color: C.muted },
  note: { fontSize: 16, color: C.ink, lineHeight: 22, minHeight: 44, textAlignVertical: 'top' },
  section: { fontSize: 13, color: C.muted, marginTop: 12, textTransform: 'uppercase', letterSpacing: 1 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tile: { width: '32%', aspectRatio: 1, borderRadius: 6, overflow: 'hidden' },
  video: { flex: 1, backgroundColor: '#3A332E', alignItems: 'center', justifyContent: 'center' },
  add: { borderWidth: 1.5, borderStyle: 'dashed', borderColor: C.line, alignItems: 'center', justifyContent: 'center' },
  addText: { color: C.muted, textAlign: 'center', fontSize: 13 },
  hint: { color: C.muted, fontSize: 12 },
});
