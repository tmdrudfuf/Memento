import { Image } from 'expo-image';
import { useEffect, useState, type ReactNode } from 'react';
import { Animated, Pressable, Text, View, type ImageStyle, type ViewStyle } from 'react-native';
import { t } from './i18n';
import { mediaUri } from './media';
import { makeStyles, useColors } from './theme';

export { useColors } from './theme';

export const formatDate = (ms: number) =>
  new Date(ms).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });

// Deterministic tilt per id so the collection looks hand-placed but stable.
export const tilt = (id: number, max = 2.5) => `${(((id * 37) % 11) / 10 - 0.5) * 2 * max}deg`;

export function Photo({ file, style }: { file: string; style?: ImageStyle }) {
  const styles = useStyles();
  return (
    <Image
      source={{ uri: mediaUri(file) }}
      style={[styles.photo, style]}
      contentFit="cover"
      recyclingKey={file}
      transition={120}
      placeholder={{ blurhash: 'L6PZfSi_.AyE_3t7t7R**0o#DgR4' }}
    />
  );
}

export function Polaroid({
  file,
  caption,
  id,
  onPress,
  settle,
}: {
  file: string;
  caption: string;
  id: number;
  onPress?: () => void;
  settle?: boolean;
}) {
  const styles = useStyles();
  // "Settle": the new memory drops into the jar. Runs after the save is persisted.
  const [drop] = useState(() => new Animated.Value(settle ? 0 : 1));
  useEffect(() => {
    if (settle) Animated.spring(drop, { toValue: 1, useNativeDriver: true, friction: 6, tension: 60 }).start();
  }, [settle, drop]);
  const anim = {
    opacity: drop,
    transform: [
      { translateY: drop.interpolate({ inputRange: [0, 1], outputRange: [-120, 0] }) },
      { scale: drop.interpolate({ inputRange: [0, 1], outputRange: [1.1, 1] }) },
      { rotate: tilt(id) },
    ],
  };
  return (
    <Animated.View style={[styles.polaroid, anim]}>
      <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={t.openMemory(caption)}>
        <Photo file={file} style={{ aspectRatio: 1 }} />
        <Text style={styles.caption} numberOfLines={1}>
          {caption}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

// A jar on the shelf: its latest covers fanned like a stack of prints.
export function CoverStack({ covers, size = 120 }: { covers: string[]; size?: number }) {
  const styles = useStyles();
  const c = useColors();
  if (!covers.length) {
    // A blank print: clearly a jar, clearly different from the dashed "New jar" tile.
    return (
      <View style={{ width: size + 40, height: size + 20, alignItems: 'center', justifyContent: 'center' }}>
        <View style={[styles.stackCard, { position: 'relative', width: size, height: size }]}>
          <View style={styles.blank}>
            <Text style={{ color: c.muted, fontSize: 13 }}>{t.noMemoriesYet}</Text>
          </View>
        </View>
      </View>
    );
  }
  const layers = covers.slice(0, 3).reverse();
  const fan = [
    { rotate: '-9deg', translateX: -12, translateY: 2 },
    { rotate: '7deg', translateX: 12, translateY: -2 },
    { rotate: '-1deg', translateX: 0, translateY: 0 },
  ].slice(3 - layers.length);
  return (
    <View style={{ width: size + 40, height: size + 20, alignItems: 'center', justifyContent: 'center' }}>
      {layers.map((f, i) => (
        <View
          key={f + i}
          style={[
            styles.stackCard,
            {
              width: size,
              height: size,
              transform: [{ translateX: fan[i].translateX }, { translateY: fan[i].translateY }, { rotate: fan[i].rotate }],
            },
          ]}
        >
          <Photo file={f} style={{ flex: 1 }} />
        </View>
      ))}
    </View>
  );
}

export function Button({
  label,
  onPress,
  kind = 'primary',
  style,
}: {
  label: string;
  onPress: () => void;
  kind?: 'primary' | 'ghost';
  style?: ViewStyle;
}) {
  const styles = useStyles();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [
        styles.btn,
        kind === 'primary' ? styles.btnPrimary : styles.btnGhost,
        pressed && { opacity: 0.7 },
        style,
      ]}
    >
      <Text style={[styles.btnText, kind === 'ghost' && styles.btnGhostText]}>{label}</Text>
    </Pressable>
  );
}

export function CaptureBar({ onLibrary, onCamera }: { onLibrary: () => void; onCamera: () => void }) {
  const styles = useStyles();
  return (
    <View style={styles.bar}>
      <Button label={t.addMemory} onPress={onLibrary} style={{ flex: 1 }} />
      <Button label={t.camera} kind="ghost" onPress={onCamera} />
    </View>
  );
}

export function Empty({ title, children }: { title: string; children?: ReactNode }) {
  const styles = useStyles();
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyTitle}>{title}</Text>
      {children}
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  photo: { backgroundColor: c.line },
  polaroid: {
    backgroundColor: c.frame,
    padding: 8,
    paddingBottom: 4,
    borderRadius: 3,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  caption: { color: c.frameInk, fontSize: 13, paddingVertical: 8, textAlign: 'center' },
  stackCard: {
    position: 'absolute',
    backgroundColor: c.frame,
    padding: 5,
    borderRadius: 3,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  blank: { flex: 1, backgroundColor: c.paper, alignItems: 'center', justifyContent: 'center' },
  btn: { paddingVertical: 14, paddingHorizontal: 18, borderRadius: 14, alignItems: 'center' },
  btnPrimary: { backgroundColor: c.ink },
  btnGhost: { backgroundColor: c.card, borderWidth: 1, borderColor: c.line },
  btnText: { color: c.onInk, fontSize: 16, fontWeight: '600' },
  btnGhostText: { color: c.ink },
  bar: { flexDirection: 'row', gap: 10, padding: 16, paddingBottom: 8 },
  empty: { alignItems: 'center', padding: 32, gap: 8 },
  emptyTitle: { fontSize: 18, color: c.ink, fontWeight: '600', textAlign: 'center' },
}));
