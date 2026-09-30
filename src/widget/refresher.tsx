import Constants, { ExecutionEnvironment } from 'expo-constants';
import { useEffect } from 'react';
import { AppState, Platform } from 'react-native';

// Re-renders the home-screen widget when the user leaves the app (new/deleted memories show up).
export function WidgetRefresher() {
  useEffect(() => {
    if (Platform.OS !== 'android' || Constants.executionEnvironment === ExecutionEnvironment.StoreClient) return;
    const sub = AppState.addEventListener('change', (s) => {
      // eslint-disable-next-line @typescript-eslint/no-require-imports -- native widget module, Android builds only
      if (s === 'background') require('./handler').refreshWidget();
    });
    return () => sub.remove();
  }, []);
  return null;
}
