import { router, Stack, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useCallback, useState } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import { allMemoriesLite, listJars } from '../lib/db';
import { t } from '../lib/i18n';
import { usePremium } from '../lib/premium';
import { recap, recapYears, type MemoryLite, type Recap as RecapData } from '../lib/rediscover';
import { makeStyles, useChrome } from '../lib/theme';
import { Button, Empty, Photo, Pin, tilt } from '../lib/ui';

const monthName = (m: number) => new Date(2000, m, 1).toLocaleDateString(undefined, { month: 'long' });

// "Your 2026 in Memories": built only from the covers the user chose, month by month.
export default function Recap() {
  const db = useSQLiteContext();
  const chrome = useChrome();
  const styles = useStyles();
  const params = useLocalSearchParams<{ year?: string }>();
  const [rows, setRows] = useState<MemoryLite[] | null>(null);
  const [jarNames, setJarNames] = useState(new Map<number, string>());
  const [year, setYear] = useState<number | null>(params.year ? Number(params.year) : null);
  const { isPremium } = usePremium();

  useFocusEffect(
    useCallback(() => {
      allMemoriesLite(db).then(setRows);
      listJars(db).then((js) => setJarNames(new Map(js.map((j) => [j.id, j.name]))));
    }, [db]),
  );

  if (!isPremium) {
    return (
      <View style={styles.wrap}>
        <Stack.Screen options={{ ...chrome, title: t.yearlyRecap }} />
        <Empty title={t.paywallRecapTitle}>
          <Text style={styles.line}>{t.paywallRecapBody}</Text>
          <Button
            label={t.seeWithPremium}
            onPress={() => router.replace({ pathname: '/paywall', params: { reason: 'recap' } })}
            style={{ marginTop: 12 }}
          />
        </Empty>
      </View>
    );
  }
  if (!rows) return null;
  const years = recapYears(rows);
  const shown = year ?? years[0] ?? new Date().getFullYear();
  const r: RecapData = recap(rows, shown);

  // Virtualized: month labels and rows of 3 prints, so a busy year only draws what's on screen.
  type Row = { key: string; month?: number; prints?: MemoryLite[] };
  const list: Row[] = [];
  r.months.forEach((n, m) => {
    if (!n) return;
    list.push({ key: `m${m}`, month: m });
    const items = r.memories.filter((x) => new Date(x.memoryDate).getMonth() === m);
    for (let i = 0; i < items.length; i += 3) list.push({ key: `p${m}-${i}`, prints: items.slice(i, i + 3) });
  });

  const header = (
    <View style={{ gap: 10 }}>
      {years.length > 1 && (
        <View style={styles.years}>
          {years.map((y) => (
            <Pressable
              key={y}
              onPress={() => setYear(y)}
              style={[styles.yearChip, y === shown && styles.yearChipOn]}
              accessibilityRole="button"
            >
              <Text style={[styles.yearText, y === shown && styles.yearTextOn]}>{y}</Text>
            </Pressable>
          ))}
        </View>
      )}
      <Text style={styles.title} accessibilityRole="header">
        {t.recapTitle(shown)}
      </Text>
      {r.count === 0 ? (
        <Empty title={t.recapEmpty} />
      ) : (
        <>
          <Text style={styles.big}>{t.recapStats(r.count, r.jarCount)}</Text>
          {r.busiestMonth !== null && <Text style={styles.line}>{t.busiestMonth(monthName(r.busiestMonth))}</Text>}
          {r.topJarId !== null && r.jarCount > 1 && (
            <Text style={styles.line}>{t.topJar(jarNames.get(r.topJarId) ?? '')}</Text>
          )}
        </>
      )}
    </View>
  );

  return (
    <>
      <Stack.Screen options={{ ...chrome, title: t.yearlyRecap }} />
      <FlatList
        key={shown}
        data={list}
        keyExtractor={(row) => row.key}
        ListHeaderComponent={header}
        contentContainerStyle={styles.wrap}
        initialNumToRender={6}
        windowSize={5}
        renderItem={({ item }) =>
          item.month !== undefined ? (
            <Text style={styles.monthLabel}>{monthName(item.month)}</Text>
          ) : (
            <View style={styles.grid}>
              {item.prints!.map((x) => (
                <Pressable
                  key={x.id}
                  style={[styles.print, { transform: [{ rotate: tilt(x.id, 3) }] }]}
                  onPress={() => router.push({ pathname: '/memory/[id]', params: { id: String(x.id) } })}
                  accessibilityRole="button"
                  accessibilityLabel={t.openMemory(x.title ?? monthName(new Date(x.memoryDate).getMonth()))}
                >
                  <Photo file={x.cover} style={{ width: '100%', aspectRatio: 1 }} />
                  <Pin id={x.id} size={11} />
                </Pressable>
              ))}
            </View>
          )
        }
      />
    </>
  );
}

const useStyles = makeStyles((c) => ({
  wrap: { padding: 20, paddingBottom: 48, gap: 10 },
  years: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 8 },
  yearChip: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 16, borderWidth: 1, borderColor: c.line },
  yearChipOn: { backgroundColor: c.ink, borderColor: c.ink },
  yearText: { color: c.ink, fontSize: 15 },
  yearTextOn: { color: c.onInk },
  title: { fontSize: 30, fontWeight: '700', color: c.ink, marginTop: 4 },
  big: { fontSize: 18, color: c.ink, marginTop: 4 },
  line: { fontSize: 15, color: c.muted },
  monthLabel: {
    fontSize: 13,
    color: c.muted,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 22,
    marginBottom: 12,
  },
  grid: { flexDirection: 'row', gap: 14, marginBottom: 14 },
  print: {
    width: '29%',
    backgroundColor: c.frame,
    padding: 5,
    paddingBottom: 14,
    borderRadius: 2,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
}));
