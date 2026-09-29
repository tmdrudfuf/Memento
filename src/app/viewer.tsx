import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useEffect, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getMemory, listMedia, type MediaKind } from '../lib/db';
import { t } from '../lib/i18n';
import { mediaUri, shareFile } from '../lib/media';

type Item = { file: string; kind: MediaKind };

function Video({ uri, active }: { uri: string; active?: boolean }) {
  const player = useVideoPlayer(uri);
  useEffect(() => {
    if (active) player.play();
    else player.pause();
  }, [active, player]);
  return <VideoView player={player} style={StyleSheet.absoluteFill} contentFit="contain" nativeControls />;
}

// Full-screen: the cover plus everything inside the memory, swipe left/right.
export default function Viewer() {
  const db = useSQLiteContext();
  const { memory, index } = useLocalSearchParams<{ memory: string; index?: string }>();
  const { width, height } = useWindowDimensions();
  const [items, setItems] = useState<Item[] | null>(null);
  const [page, setPage] = useState(Number(index) || 0);

  useEffect(() => {
    (async () => {
      const m = await getMemory(db, Number(memory));
      if (!m) return router.back();
      const media = await listMedia(db, m.id);
      setItems([{ file: m.cover, kind: 'photo' }, ...media.map((x) => ({ file: x.file, kind: x.kind }))]);
    })();
  }, [db, memory]);

  if (!items) return <View style={styles.bg} />;
  const current = items[Math.min(page, items.length - 1)];

  return (
    <View style={styles.bg}>
      <FlatList
        data={items}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        initialScrollIndex={Math.min(page, items.length - 1)}
        getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
        keyExtractor={(it, i) => it.file + i}
        onMomentumScrollEnd={(e) => setPage(Math.round(e.nativeEvent.contentOffset.x / width))}
        windowSize={3}
        renderItem={({ item, index: i }) => (
          <View style={{ width, height }}>
            {item.kind === 'video' ? (
              // Only the visible video is mounted, so no player runs off-screen.
              i === page ? (
                <Video uri={mediaUri(item.file)} active />
              ) : null
            ) : (
              <Image source={{ uri: mediaUri(item.file) }} style={StyleSheet.absoluteFill} contentFit="contain" />
            )}
          </View>
        )}
      />
      <SafeAreaView edges={['top']} style={styles.top} pointerEvents="box-none">
        <Pressable
          onPress={() => shareFile(current.file)}
          hitSlop={16}
          accessibilityRole="button"
          accessibilityLabel={t.share}
        >
          <Text style={styles.share}>{t.share}</Text>
        </Pressable>
        {items.length > 1 && (
          <Text style={styles.count} accessibilityLiveRegion="polite">
            {page + 1} / {items.length}
          </Text>
        )}
        <Pressable onPress={() => router.back()} hitSlop={16} accessibilityRole="button" accessibilityLabel={t.close}>
          <Text style={styles.close}>✕</Text>
        </Pressable>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: '#000' },
  top: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  share: { color: '#fff', fontSize: 17, padding: 8 },
  count: { color: 'rgba(255,255,255,0.8)', fontSize: 15 },
  close: { color: '#fff', fontSize: 24, padding: 8 },
});
