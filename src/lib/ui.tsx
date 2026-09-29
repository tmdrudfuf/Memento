import { Image } from 'expo-image';
import { useEffect, useState, type ReactNode } from 'react';
import { Animated, ImageBackground, Pressable, Text, View, type ImageStyle, type ViewStyle } from 'react-native';
import { t } from './i18n';
import { mediaUri } from './media';
import { makeStyles, pinColor, useColors } from './theme';

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
  // "Settle": the new memory drops onto the board. Runs after the save is persisted.
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
      <Pin id={id} />
    </Animated.View>
  );
}

/** A push pin, centered on the top edge of whatever it's placed in. */
export function Pin({ id, size = 14 }: { id: number; size?: number }) {
  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        top: -size / 2,
        left: '50%',
        marginLeft: -size / 2,
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: pinColor(id),
        shadowColor: '#000',
        shadowOpacity: 0.35,
        shadowRadius: 2,
        shadowOffset: { width: 1, height: 2 },
        elevation: 4,
      }}
    >
      <View
        style={{
          position: 'absolute',
          top: size * 0.18,
          left: size * 0.22,
          width: size * 0.3,
          height: size * 0.3,
          borderRadius: size,
          backgroundColor: 'rgba(255,255,255,0.55)',
        }}
      />
    </View>
  );
}

/** Cork board surface (felt in dark mode). */
export function BoardSurface({ children, style }: { children?: ReactNode; style?: ViewStyle }) {
  const c = useColors();
  return (
    <ImageBackground
      source={c.board === 'felt' ? require('../../assets/board-felt.png') : require('../../assets/board-cork.png')}
      resizeMode="repeat"
      style={style}
    >
      {children}
    </ImageBackground>
  );
}

const hash = (str: string) => [...str].reduce((a, ch) => (a * 31 + ch.charCodeAt(0)) >>> 0, 7);

// Where the latest prints sit on a board thumbnail (x/y as fractions of the cork area).
const SPOTS: Record<number, { x: number; y: number; r: string }[]> = {
  1: [{ x: 0.5, y: 0.52, r: '-3deg' }],
  2: [
    { x: 0.3, y: 0.5, r: '-6deg' },
    { x: 0.7, y: 0.54, r: '5deg' },
  ],
  3: [
    { x: 0.22, y: 0.46, r: '-7deg' },
    { x: 0.5, y: 0.6, r: '3deg' },
    { x: 0.78, y: 0.44, r: '-2deg' },
  ],
};

/** A board on the Home wall: framed cork with its latest covers pinned on it. */
export function BoardThumb({ covers, width = 156 }: { covers: string[]; width?: number }) {
  const styles = useStyles();
  const c = useColors();
  const height = Math.round(width * 0.8);
  const inner = { w: width - 12, h: height - 12 };
  const prints = covers.slice(0, 3);
  const print = prints.length === 1 ? 62 : 50;
  return (
    <View style={[styles.boardFrame, { width, height }]}>
      <BoardSurface style={{ flex: 1, borderRadius: 3, overflow: 'hidden' }}>
        {prints.length === 0 ? (
          <View style={styles.boardNoteWrap}>
            <View style={styles.boardNote}>
              <Text style={{ color: c.frameInk, fontSize: 12, textAlign: 'center' }}>{t.noMemoriesYet}</Text>
              <Pin id={0} size={10} />
            </View>
          </View>
        ) : (
          prints.map((f, i) => {
            const spot = SPOTS[prints.length][i];
            return (
              <View
                key={f + i}
                style={[
                  styles.miniPrint,
                  {
                    width: print,
                    left: spot.x * inner.w - print / 2,
                    top: spot.y * inner.h - print / 2,
                    transform: [{ rotate: spot.r }],
                  },
                ]}
              >
                <Photo file={f} style={{ width: '100%', aspectRatio: 1 }} />
                <Pin id={hash(f)} size={9} />
              </View>
            );
          })
        )}
      </BoardSurface>
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
  boardFrame: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: c.frameWood,
    borderWidth: 1,
    borderColor: c.frameWoodDark,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  miniPrint: {
    position: 'absolute',
    backgroundColor: c.frame,
    padding: 3,
    paddingBottom: 8,
    borderRadius: 1,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  boardNoteWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  boardNote: {
    backgroundColor: c.frame,
    paddingVertical: 10,
    paddingHorizontal: 12,
    transform: [{ rotate: '-2deg' }],
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  btn: { paddingVertical: 14, paddingHorizontal: 18, borderRadius: 14, alignItems: 'center' },
  btnPrimary: { backgroundColor: c.ink },
  btnGhost: { backgroundColor: c.card, borderWidth: 1, borderColor: c.line },
  btnText: { color: c.onInk, fontSize: 16, fontWeight: '600' },
  btnGhostText: { color: c.ink },
  bar: { flexDirection: 'row', gap: 10, padding: 16, paddingBottom: 8 },
  empty: { alignItems: 'center', padding: 32, gap: 8 },
  emptyTitle: { fontSize: 18, color: c.ink, fontWeight: '600', textAlign: 'center' },
}));
