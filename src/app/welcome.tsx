import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { setSetting } from '../lib/db';
import { t } from '../lib/i18n';
import { makeStyles } from '../lib/theme';
import { Button } from '../lib/ui';

// One-time intro: the concept in five seconds, then straight to capture.
export default function Welcome() {
  const db = useSQLiteContext();
  const styles = useStyles();
  const start = async () => {
    await setSetting(db, 'welcomed', '1');
    router.back();
  };
  return (
    <SafeAreaView style={styles.wrap}>
      <View style={styles.center}>
        <Image source={require('../../assets/splash-icon.png')} style={styles.mark} contentFit="contain" />
        <Text style={styles.title}>{t.welcomeTitle}</Text>
        <View style={styles.points}>
          <Point n="1" text={t.welcome1} />
          <Point n="2" text={t.welcome2} />
          <Point n="3" text={t.welcome3} />
        </View>
        <Text style={styles.private}>{t.welcomePrivate}</Text>
      </View>
      <Button label={t.startCollecting} onPress={start} style={{ margin: 20 }} />
    </SafeAreaView>
  );
}

function Point({ n, text }: { n: string; text: string }) {
  const styles = useStyles();
  return (
    <View style={styles.point}>
      <Text style={styles.n}>{n}</Text>
      <Text style={styles.pointText}>{text}</Text>
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  wrap: { flex: 1, backgroundColor: c.paper },
  center: { flex: 1, justifyContent: 'center', padding: 28, gap: 20 },
  mark: { width: 120, height: 120, alignSelf: 'center' },
  title: { fontSize: 28, fontWeight: '700', color: c.ink, textAlign: 'center', lineHeight: 36 },
  points: { gap: 14, marginTop: 8 },
  point: { flexDirection: 'row', gap: 14, alignItems: 'flex-start' },
  n: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: c.ink,
    color: c.onInk,
    textAlign: 'center',
    lineHeight: 26,
    fontWeight: '600',
    overflow: 'hidden',
  },
  pointText: { flex: 1, fontSize: 16, color: c.ink, lineHeight: 22 },
  private: { color: c.muted, textAlign: 'center', marginTop: 8 },
}));
