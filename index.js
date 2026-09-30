// App entry: registers the Android home-screen widget's background task, then starts Expo Router.
import { Platform } from 'react-native';

if (Platform.OS === 'android') {
  const { registerWidgetTaskHandler } = require('react-native-android-widget');
  const { widgetTaskHandler } = require('./src/widget/handler');
  registerWidgetTaskHandler(widgetTaskHandler);
}

// Must be imported last so the handler above is registered before the app renders.
import 'expo-router/entry';
