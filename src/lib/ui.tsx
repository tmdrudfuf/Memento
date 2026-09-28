import { Image } from 'expo-image';
import { useEffect, useState, type ReactNode } from 'react';
import { Animated, Pressable, StyleSheet, Text, View, type ImageStyle, type ViewStyle } from 'react-native';
import { mediaUri } from './media';

export const C = {
  paper: '#F4EFE6',
  card: '#FFFFFF',
  ink: '#2B2622',
  muted: '#8A8078',
  accent: '#C8553D',
  line: '#E3DBCD',
};

export const formatDate = (ms: number) =>
  new Date(ms).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });

// Deterministic tilt per id so the collection looks hand-placed but stable.
export const tilt = (id: number, max = 2.5) => `${(((id * 37) % 11) / 10 - 0.5) * 2 * max}deg`;

export function Photo({ file, style }: { file: string; style?: ImageStyle }) {
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
      <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={`Open memory ${caption}`}>
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
  if (!covers.length) {
    return (
      <View style={[styles.emptyStack, { width: size, height: size }]}>
        <Text style={{ color: C.muted }}>empty</Text>
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
      <Text style={[styles.btnText, kind === 'ghost' && { color: C.ink }]}>{label}</Text>
    </Pressable>
  );
}

export function CaptureBar({ onLibrary, onCamera }: { onLibrary: () => void; onCamera: () => void }) {
  return (
    <View style={styles.bar}>
      <Button label="＋  Add a memory" onPress={onLibrary} style={{ flex: 1 }} />
      <Button label="Camera" kind="ghost" onPress={onCamera} />
    </View>
  );
}

export function Empty({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyTitle}>{title}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  photo: { backgroundColor: C.line },
  polaroid: {
    backgroundColor: C.card,
    padding: 8,
    paddingBottom: 4,
    borderRadius: 3,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  caption: { color: C.ink, fontSize: 13, paddingVertical: 8, textAlign: 'center' },
  stackCard: {
    position: 'absolute',
    backgroundColor: C.card,
    padding: 5,
    borderRadius: 3,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  emptyStack: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: C.line,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 8,
  },
  btn: { paddingVertical: 14, paddingHorizontal: 18, borderRadius: 14, alignItems: 'center' },
  btnPrimary: { backgroundColor: C.ink },
  btnGhost: { backgroundColor: C.card, borderWidth: 1, borderColor: C.line },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  bar: { flexDirection: 'row', gap: 10, padding: 16, paddingBottom: 8 },
  empty: { alignItems: 'center', padding: 32, gap: 8 },
  emptyTitle: { fontSize: 18, color: C.ink, fontWeight: '600', textAlign: 'center' },
});
