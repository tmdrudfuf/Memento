import { router, useLocalSearchParams, useNavigation } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { createJar, createMemory, listJars, type JarSummary } from '../lib/db';
import { removeFiles, saveFailed } from '../lib/media';
import { C, Photo } from '../lib/ui';

// Photo → choose Jar → Done. Tapping a jar IS the save; nothing else is asked.
export default function Capture() {
  const db = useSQLiteContext();
  const p = useLocalSearchParams<{ file: string; date: string; jarId: string }>();
  const [jars, setJars] = useState<JarSummary[] | null>(null);
  const [naming, setNaming] = useState(false);
  const [name, setName] = useState('');
  const saved = useRef(false);

  useEffect(() => {
    listJars(db).then((all) => {
      const pre = Number(p.jarId);
      // Current jar (if capturing from inside one) first, otherwise last used.
      setJars(pre ? [...all.filter((j) => j.id === pre), ...all.filter((j) => j.id !== pre)] : all);
      if (!all.length) setNaming(true);
    });
  }, [db, p.jarId]);

  // Abandoned capture (swipe down / back): the copied photo is not a memory, so remove it.
  const navigation = useNavigation();
  useEffect(
    () =>
      navigation.addListener('beforeRemove', () => {
        if (!saved.current && p.file) removeFiles([p.file]);
      }),
    [navigation, p.file],
  );

  async function save(jarId: number) {
    if (saved.current) return;
    saved.current = true;
    try {
      const id = await createMemory(db, { jarId, cover: p.file, memoryDate: Number(p.date) || null });
      router.dismissTo({ pathname: '/jar/[id]', params: { id: String(jarId), settle: String(id) } });
    } catch (e) {
      saved.current = false;
      saveFailed(e);
    }
  }

  async function saveToNewJar() {
    if (!name.trim()) return;
    try {
      await save(await createJar(db, name));
    } catch (e) {
      saveFailed(e);
    }
  }

  if (!p.file || !jars) return null;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.wrap} keyboardShouldPersistTaps="handled">
        <View style={styles.frame}>
          <Photo file={p.file} style={{ aspectRatio: 1, width: '100%' }} />
        </View>
        <Text style={styles.label}>{jars.length ? 'Tap a jar to keep it' : 'Name your first jar'}</Text>
        <View style={styles.chips}>
          {jars.map((j, i) => (
            <Pressable
              key={j.id}
              onPress={() => save(j.id)}
              style={({ pressed }) => [styles.chip, i === 0 && styles.chipFirst, pressed && { opacity: 0.6 }]}
              accessibilityRole="button"
              accessibilityLabel={`Save to ${j.name}`}
            >
              <Text style={[styles.chipText, i === 0 && { color: '#fff' }]}>{j.name}</Text>
            </Pressable>
          ))}
          {!naming && (
            <Pressable onPress={() => setNaming(true)} style={[styles.chip, styles.chipNew]} accessibilityRole="button">
              <Text style={styles.chipText}>＋ New jar</Text>
            </Pressable>
          )}
        </View>
        {naming && (
          <View style={styles.newRow}>
            <TextInput
              autoFocus
              value={name}
              onChangeText={setName}
              placeholder="e.g. Japan 2026, Us, Cooking"
              placeholderTextColor={C.muted}
              returnKeyType="done"
              onSubmitEditing={saveToNewJar}
              style={styles.input}
              maxLength={40}
            />
            <Pressable
              onPress={saveToNewJar}
              style={[styles.chip, styles.chipFirst, !name.trim() && { opacity: 0.4 }]}
              accessibilityRole="button"
            >
              <Text style={[styles.chipText, { color: '#fff' }]}>Keep</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: 20, gap: 16 },
  frame: {
    backgroundColor: C.card,
    padding: 10,
    paddingBottom: 28,
    alignSelf: 'center',
    width: '78%',
    transform: [{ rotate: '-1.5deg' }],
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  label: { color: C.muted, fontSize: 14, marginTop: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chip: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 22,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.line,
  },
  chipFirst: { backgroundColor: C.ink, borderColor: C.ink },
  chipNew: { borderStyle: 'dashed' },
  chipText: { fontSize: 16, color: C.ink, fontWeight: '500' },
  newRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
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
