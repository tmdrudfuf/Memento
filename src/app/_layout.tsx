import { DarkTheme, DefaultTheme, Stack, ThemeProvider, type ErrorBoundaryProps } from 'expo-router';
import { SQLiteProvider } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';
import { Text, useColorScheme, View } from 'react-native';
import { AdsProvider } from '../lib/ads';
import { migrate } from '../lib/db';
import { t } from '../lib/i18n';
import { PremiumProvider } from '../lib/premium';
import { Button, useColors } from '../lib/ui';

export default function RootLayout() {
  const c = useColors();
  const scheme = useColorScheme();
  const base = scheme === 'dark' ? DarkTheme : DefaultTheme;
  const theme = {
    ...base,
    colors: {
      ...base.colors,
      background: c.paper,
      card: c.paper,
      text: c.ink,
      border: c.line,
      primary: c.accent,
    },
  };
  return (
    <SQLiteProvider databaseName="memento.db" onInit={migrate}>
      <PremiumProvider>
        <AdsProvider>
          <ThemeProvider value={theme}>
            <StatusBar style="auto" />
            <Stack screenOptions={{ headerShadowVisible: false }}>
              <Stack.Screen name="index" options={{ title: 'Memento' }} />
              <Stack.Screen name="jar/[id]" options={{ title: '' }} />
              <Stack.Screen name="memory/[id]" options={{ title: '' }} />
              <Stack.Screen name="capture" options={{ presentation: 'modal', title: t.captureTitle }} />
              <Stack.Screen name="settings" options={{ title: t.settings }} />
              <Stack.Screen name="recap" options={{ title: t.yearlyRecap }} />
              <Stack.Screen name="paywall" options={{ presentation: 'modal', title: '' }} />
              <Stack.Screen
                name="welcome"
                options={{
                  presentation: 'fullScreenModal',
                  headerShown: false,
                }}
              />
              <Stack.Screen
                name="viewer"
                options={{
                  presentation: 'fullScreenModal',
                  headerShown: false,
                  contentStyle: { backgroundColor: '#000' },
                }}
              />
            </Stack>
          </ThemeProvider>
        </AdsProvider>
      </PremiumProvider>
    </SQLiteProvider>
  );
}

// Any render error lands here instead of a blank crash. Memories are on disk; retry is safe.
export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  const c = useColors();
  console.error(error);
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: c.paper,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 32,
        gap: 12,
      }}
    >
      <Text style={{ fontSize: 18, fontWeight: '600', color: c.ink }}>{t.errorTitle}</Text>
      <Text style={{ color: c.muted, textAlign: 'center' }}>{t.errorBody}</Text>
      <Button label={t.tryAgain} onPress={retry} />
    </View>
  );
}
