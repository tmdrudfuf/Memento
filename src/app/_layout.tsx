import { Stack, type ErrorBoundaryProps } from 'expo-router';
import { SQLiteProvider } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';
import { Text, View } from 'react-native';
import { migrate } from '../lib/db';
import { Button, C } from '../lib/ui';

export default function RootLayout() {
  return (
    <SQLiteProvider databaseName="photo-catcher.db" onInit={migrate}>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: C.paper },
          headerShadowVisible: false,
          headerTintColor: C.ink,
          contentStyle: { backgroundColor: C.paper },
        }}
      >
        <Stack.Screen name="index" options={{ title: 'Photo Catcher' }} />
        <Stack.Screen name="jar/[id]" options={{ title: '' }} />
        <Stack.Screen name="memory/[id]" options={{ title: '' }} />
        <Stack.Screen name="capture" options={{ presentation: 'modal', title: 'Keep this memory' }} />
        <Stack.Screen
          name="viewer"
          options={{ presentation: 'fullScreenModal', headerShown: false, contentStyle: { backgroundColor: '#000' } }}
        />
      </Stack>
    </SQLiteProvider>
  );
}

// Any render error lands here instead of a blank crash. Memories are on disk; retry is safe.
export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  console.error(error);
  return (
    <View style={{ flex: 1, backgroundColor: C.paper, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12 }}>
      <Text style={{ fontSize: 18, fontWeight: '600', color: C.ink }}>Something went wrong</Text>
      <Text style={{ color: C.muted, textAlign: 'center' }}>Your memories are safe on this device.</Text>
      <Button label="Try again" onPress={retry} />
    </View>
  );
}
