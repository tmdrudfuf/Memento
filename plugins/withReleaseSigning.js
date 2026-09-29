// Signs Android release builds with the upload key when MEMENTO_UPLOAD_STORE_FILE is set
// (CI and local store builds); otherwise release falls back to the debug key.
// Also lets CI set versionCode via ANDROID_VERSION_CODE (Play needs it to increase).
const { withAppBuildGradle } = require('expo/config-plugins');

const RELEASE_CONFIG = `
        release {
            if (System.getenv('MEMENTO_UPLOAD_STORE_FILE')) {
                storeFile file(System.getenv('MEMENTO_UPLOAD_STORE_FILE'))
                storePassword System.getenv('MEMENTO_UPLOAD_STORE_PASSWORD')
                keyAlias System.getenv('MEMENTO_UPLOAD_KEY_ALIAS') ?: 'upload'
                keyPassword System.getenv('MEMENTO_UPLOAD_KEY_PASSWORD')
            }
        }`;

module.exports = function withReleaseSigning(config) {
  return withAppBuildGradle(config, (cfg) => {
    let g = cfg.modResults.contents;
    if (g.includes('MEMENTO_UPLOAD_STORE_FILE')) return cfg;

    const before = g;
    g = g.replace(/signingConfigs \{/, `signingConfigs {${RELEASE_CONFIG}`);
    g = g.replace(
      /(release \{[^}]*?)signingConfig signingConfigs\.debug/,
      "$1signingConfig System.getenv('MEMENTO_UPLOAD_STORE_FILE') ? signingConfigs.release : signingConfigs.debug",
    );
    g = g.replace(/versionCode (\d+)/, "versionCode Integer.parseInt(System.getenv('ANDROID_VERSION_CODE') ?: '$1')");
    // Fail loudly if the template changed, rather than silently shipping debug-signed builds.
    if (
      (g.match(/MEMENTO_UPLOAD_STORE_FILE/g) || []).length < 3 ||
      !g.includes('ANDROID_VERSION_CODE') ||
      g === before
    ) {
      throw new Error('withReleaseSigning: android/app/build.gradle template changed; update the plugin');
    }
    cfg.modResults.contents = g;
    return cfg;
  });
};
