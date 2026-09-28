import { Stack } from 'expo-router';
import { SQLiteProvider } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';
import { migrate } from '../lib/db';
import { C } from '../lib/ui';

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
