import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useVideoPlayer, VideoView } from 'expo-video';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { mediaUri } from '../lib/media';

function Video({ uri }: { uri: string }) {
  const player = useVideoPlayer(uri, (p) => p.play());
  return <VideoView player={player} style={StyleSheet.absoluteFill} contentFit="contain" nativeControls />;
}

export default function Viewer() {
  const { file, kind } = useLocalSearchParams<{ file: string; kind: 'photo' | 'video' }>();
  const uri = mediaUri(file);
  return (
    <View style={styles.bg}>
      {kind === 'video' ? (
        <Video uri={uri} />
      ) : (
        <Image source={{ uri }} style={StyleSheet.absoluteFill} contentFit="contain" />
      )}
      <SafeAreaView edges={['top']} style={styles.top} pointerEvents="box-none">
        <Pressable onPress={() => router.back()} hitSlop={16} accessibilityRole="button" accessibilityLabel="Close">
          <Text style={styles.close}>✕</Text>
        </Pressable>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  bg: { flex: 1, backgroundColor: '#000' },
  top: { position: 'absolute', top: 0, left: 0, right: 0, padding: 16, alignItems: 'flex-end' },
  close: { color: '#fff', fontSize: 24, padding: 8 },
});
