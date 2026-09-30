// App entry: registers the Android home-screen widget's background task, then starts Expo Router.
import { Platform } from 'react-native';

if (Platform.OS === 'android') {
  const { registerWidgetTaskHandler } = require('react-native-android-widget');
  const { widgetTaskHandler } = require('./src/widget/handler');
  registerWidgetTaskHandler(widgetTaskHandler);
}

// Order doesn't matter: imports are hoisted, and the headless task only needs registering at load.
import 'expo-router/entry';
