import { router, Stack } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';
import { getSetting, listJars, setJarOrder, setSetting, type JarOrder, type JarSummary } from '../lib/db';
import { t } from '../lib/i18n';
import { makeStyles, useChrome } from '../lib/theme';
import { BoardThumb } from '../lib/ui';

// Manual board order with ▲▼ (no drag library needed). Saving switches Home to this order.
export default function Arrange() {
  const db = useSQLiteContext();
  const chrome = useChrome();
  const styles = useStyles();
  const [jars, setJars] = useState<JarSummary[]>([]);

  useEffect(() => {
    getSetting(db, 'boardOrder').then((o) => listJars(db, (o as JarOrder) ?? 'recent').then(setJars));
  }, [db]);

  const move = (i: number, d: -1 | 1) =>
    setJars((js) => {
      const next = [...js];
      [next[i], next[i + d]] = [next[i + d], next[i]];
      return next;
    });

  async function save() {
    await setJarOrder(
      db,
      jars.map((j) => j.id),
    );
    await setSetting(db, 'boardOrder', 'custom');
    router.back();
  }

  async function recent() {
    await setSetting(db, 'boardOrder', 'recent');
    router.back();
  }

  return (
    <>
      <Stack.Screen
        options={{
          ...chrome,
          title: t.arrangeBoards,
          headerRight: () => (
            <Pressable onPress={save} hitSlop={12} accessibilityRole="button">
              <Text style={styles.done}>{t.done}</Text>
            </Pressable>
          ),
        }}
      />
      <FlatList
        data={jars}
        keyExtractor={(j) => String(j.id)}
        contentContainerStyle={{ padding: 16, gap: 10 }}
        ListHeaderComponent={<Text style={styles.hint}>{t.arrangeHint}</Text>}
        ListFooterComponent={
          <Pressable onPress={recent} style={{ padding: 16, alignSelf: 'center' }} accessibilityRole="button">
            <Text style={styles.link}>{t.sortRecent}</Text>
          </Pressable>
        }
        renderItem={({ item, index }) => (
          <View style={styles.row}>
            <BoardThumb covers={item.covers} width={70} />
            <View style={{ flex: 1 }}>
              <Text style={styles.name} numberOfLines={1}>
                {item.name}
              </Text>
              <Text style={styles.count}>{t.memories(item.count)}</Text>
            </View>
            <Pressable
              onPress={() => move(index, -1)}
              disabled={index === 0}
              hitSlop={6}
              style={[styles.arrow, index === 0 && { opacity: 0.25 }]}
              accessibilityRole="button"
              accessibilityLabel={t.moveUp(item.name)}
            >
              <Text style={styles.arrowText}>▲</Text>
            </Pressable>
            <Pressable
              onPress={() => move(index, 1)}
              disabled={index === jars.length - 1}
              hitSlop={6}
              style={[styles.arrow, index === jars.length - 1 && { opacity: 0.25 }]}
              accessibilityRole="button"
              accessibilityLabel={t.moveDown(item.name)}
            >
              <Text style={styles.arrowText}>▼</Text>
            </Pressable>
          </View>
        )}
      />
    </>
  );
}

const useStyles = makeStyles((c) => ({
  hint: { color: c.muted, fontSize: 14, marginBottom: 6 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: c.card, borderRadius: 14, padding: 10 },
  name: { fontSize: 16, fontWeight: '600', color: c.ink },
  count: { fontSize: 13, color: c.muted },
  arrow: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: c.paper,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowText: { fontSize: 16, color: c.ink },
  done: { color: c.accent, fontSize: 16, fontWeight: '600' },
  link: { color: c.accent, fontSize: 15 },
}));
