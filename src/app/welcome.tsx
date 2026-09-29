import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { setSetting } from '../lib/db';
import { Button, C } from '../lib/ui';

// One-time intro: the concept in five seconds, then straight to capture.
export default function Welcome() {
  const db = useSQLiteContext();
  const start = async () => {
    await setSetting(db, 'welcomed', '1');
    router.back();
  };
  return (
    <SafeAreaView style={styles.wrap}>
      <View style={styles.center}>
        <Image source={require('../../assets/splash-icon.png')} style={styles.mark} contentFit="contain" />
        <Text style={styles.title}>One photo opens{'\n'}the whole memory.</Text>
        <View style={styles.points}>
          <Point n="1" text="Pick one photo that brings a moment back: a meal, a ticket, a view." />
          <Point n="2" text="Keep it in a jar, like Japan 2026, Us or Family." />
          <Point n="3" text="Add more photos, videos and a note later, whenever you like." />
        </View>
        <Text style={styles.private}>Everything stays on your phone.</Text>
      </View>
      <Button label="Start collecting" onPress={start} style={{ margin: 20 }} />
    </SafeAreaView>
  );
}

function Point({ n, text }: { n: string; text: string }) {
  return (
    <View style={styles.point}>
      <Text style={styles.n}>{n}</Text>
      <Text style={styles.pointText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: C.paper },
  center: { flex: 1, justifyContent: 'center', padding: 28, gap: 20 },
  mark: { width: 120, height: 120, alignSelf: 'center' },
  title: { fontSize: 28, fontWeight: '700', color: C.ink, textAlign: 'center', lineHeight: 36 },
  points: { gap: 14, marginTop: 8 },
  point: { flexDirection: 'row', gap: 14, alignItems: 'flex-start' },
  n: { width: 26, height: 26, borderRadius: 13, backgroundColor: C.ink, color: '#fff', textAlign: 'center', lineHeight: 26, fontWeight: '600', overflow: 'hidden' },
  pointText: { flex: 1, fontSize: 16, color: C.ink, lineHeight: 22 },
  private: { color: C.muted, textAlign: 'center', marginTop: 8 },
});
