import { router, Stack, useLocalSearchParams, useNavigation } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { createJar, createMemory, listJars, type JarSummary } from '../lib/db';
import { t } from '../lib/i18n';
import { removeFiles, saveFailed } from '../lib/media';
import { canCreateJar } from '../lib/plan';
import { usePremium } from '../lib/premium';
import { makeStyles, useChrome } from '../lib/theme';
import { haptic, Photo, Pin, useColors } from '../lib/ui';

// Photo → choose Jar → Done. Tapping a jar IS the save; nothing else is asked.
export default function Capture() {
  const db = useSQLiteContext();
  const chrome = useChrome();
  const styles = useStyles();
  const c = useColors();
  const p = useLocalSearchParams<{ file: string; date: string; jarId: string }>();
  const [jars, setJars] = useState<JarSummary[] | null>(null);
  const [naming, setNaming] = useState(false);
  const [name, setName] = useState('');
  const saved = useRef(false);
  const { isPremium } = usePremium();

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
      haptic.done();
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
      <Stack.Screen options={chrome} />
      <ScrollView contentContainerStyle={styles.wrap} keyboardShouldPersistTaps="handled">
        <View style={styles.frame}>
          <Photo file={p.file} style={{ aspectRatio: 1, width: '100%' }} />
          <Pin id={p.file.length} size={18} />
        </View>
        <Text style={styles.label}>{jars.length ? t.tapJar : t.nameFirstJar}</Text>
        <View style={styles.chips}>
          {jars.map((j, i) => (
            <Pressable
              key={j.id}
              onPress={() => save(j.id)}
              style={({ pressed }) => [styles.chip, i === 0 && styles.chipFirst, pressed && { opacity: 0.6 }]}
              accessibilityRole="button"
              accessibilityLabel={t.saveTo(j.name)}
            >
              <Text style={[styles.chipText, i === 0 && styles.chipFirstText]}>{j.name}</Text>
            </Pressable>
          ))}
          {!naming && (
            <Pressable
              onPress={() =>
                canCreateJar(jars.length, isPremium)
                  ? setNaming(true)
                  : router.push({ pathname: '/paywall', params: { reason: 'jars' } })
              }
              style={[styles.chip, styles.chipNew]}
              accessibilityRole="button"
            >
              <Text style={styles.chipText}>{t.newJarChip}</Text>
            </Pressable>
          )}
        </View>
        {naming && (
          <View style={styles.newRow}>
            <TextInput
              autoFocus
              value={name}
              onChangeText={setName}
              placeholder={t.jarPlaceholder}
              placeholderTextColor={c.muted}
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
              <Text style={[styles.chipText, styles.chipFirstText]}>{t.keep}</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const useStyles = makeStyles((c) => ({
  wrap: { padding: 20, gap: 16 },
  frame: {
    backgroundColor: c.frame,
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
  label: { color: c.muted, fontSize: 14, marginTop: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chip: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 22,
    backgroundColor: c.card,
    borderWidth: 1,
    borderColor: c.line,
  },
  chipFirst: { backgroundColor: c.ink, borderColor: c.ink },
  chipFirstText: { color: c.onInk },
  chipNew: { borderStyle: 'dashed' },
  chipText: { fontSize: 16, color: c.ink, fontWeight: '500' },
  newRow: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  input: {
    flex: 1,
    fontSize: 16,
    backgroundColor: c.card,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: c.ink,
    borderWidth: 1,
    borderColor: c.line,
  },
}));
