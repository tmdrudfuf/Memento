import { router, Stack, useFocusEffect } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { allMemoriesLite, createJar, deleteJar, getSetting, listJars, renameJar, type JarSummary } from '../lib/db';
import { t } from '../lib/i18n';
import { removeFiles, saveFailed, startCapture } from '../lib/media';
import {
  onThisDay,
  recap,
  recapSeasonYear,
  rememberThis,
  thisWeekInPastYears,
  yearsAgo,
  type MemoryLite,
} from '../lib/rediscover';
import { NameDialog, Sheet } from '../lib/sheet';
import { makeStyles, useChrome } from '../lib/theme';
import { CaptureBar, CoverStack, Empty, formatDate, Photo } from '../lib/ui';

const NEW = -1; // sentinel item for the "New jar" tile

export default function Home() {
  const db = useSQLiteContext();
  const chrome = useChrome();
  const styles = useStyles();
  const [jars, setJars] = useState<JarSummary[] | null>(null);
  const [lite, setLite] = useState<{ rows: MemoryLite[]; now: number }>({ rows: [], now: 0 });
  const [menuFor, setMenuFor] = useState<JarSummary | null>(null);
  const [dialog, setDialog] = useState<{ mode: 'new' } | { mode: 'rename'; jar: JarSummary } | null>(null);

  const load = useCallback(() => {
    listJars(db).then(setJars);
    allMemoriesLite(db).then((rows) => setLite({ rows, now: Date.now() }));
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
        ListHeaderComponent={<Rediscover rows={lite.rows} now={lite.now} />}
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

const openMemory = (id: number) => router.push({ pathname: '/memory/[id]', params: { id: String(id) } });

// Brings old memories back to the shelf: yearly recap in season, "on this day", else "remember this?".
function Rediscover({ rows, now }: { rows: MemoryLite[]; now: number }) {
  const styles = useStyles();
  const season = recapSeasonYear(now);
  const showRecap = season !== null && recap(rows, season).count > 0;
  const exact = onThisDay(rows, now);
  const past = (exact.length ? exact : thisWeekInPastYears(rows, now)).slice(0, 6);
  const remember = past.length ? null : rememberThis(rows, now);
  if (!showRecap && !past.length && !remember) return null;
  return (
    <View style={{ gap: 12, marginBottom: 8 }}>
      {showRecap && (
        <Pressable
          style={styles.card}
          onPress={() => router.push({ pathname: '/recap', params: { year: String(season) } })}
          accessibilityRole="button"
        >
          <Text style={styles.cardTitle}>{t.recapTitle(season!)}</Text>
          <Text style={styles.cardBody}>{t.recapCardBody}</Text>
        </Pressable>
      )}
      {past.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardLabel}>{exact.length ? t.onThisDay : t.thisWeek}</Text>
          <View style={styles.pastRow}>
            {past.map((m) => (
              <Pressable key={m.id} style={styles.pastItem} onPress={() => openMemory(m.id)} accessibilityRole="button">
                <View style={styles.miniPrint}>
                  <Photo file={m.cover} style={{ width: '100%', aspectRatio: 1 }} />
                </View>
                <Text style={styles.pastCaption} numberOfLines={1}>
                  {t.yearsAgo(yearsAgo(m.memoryDate, now))}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}
      {remember && (
        <Pressable style={[styles.card, styles.rememberCard]} onPress={() => openMemory(remember.id)} accessibilityRole="button">
          <View style={[styles.miniPrint, { width: 84 }]}>
            <Photo file={remember.cover} style={{ width: '100%', aspectRatio: 1 }} />
          </View>
          <View style={{ flex: 1, gap: 4 }}>
            <Text style={styles.cardLabel}>{t.rememberThis}</Text>
            <Text style={styles.cardTitle} numberOfLines={2}>
              {remember.title || formatDate(remember.memoryDate)}
            </Text>
            {remember.title ? <Text style={styles.cardBody}>{formatDate(remember.memoryDate)}</Text> : null}
          </View>
        </Pressable>
      )}
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  card: { backgroundColor: c.card, borderRadius: 16, padding: 16, gap: 6 },
  rememberCard: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  cardLabel: { fontSize: 12, color: c.muted, textTransform: 'uppercase', letterSpacing: 1 },
  cardTitle: { fontSize: 17, fontWeight: '600', color: c.ink },
  cardBody: { fontSize: 14, color: c.muted },
  pastRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 6 },
  pastItem: { width: 76, gap: 6, alignItems: 'center' },
  pastCaption: { fontSize: 12, color: c.muted },
  miniPrint: {
    width: 76,
    backgroundColor: c.frame,
    padding: 4,
    paddingBottom: 10,
    borderRadius: 2,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
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
