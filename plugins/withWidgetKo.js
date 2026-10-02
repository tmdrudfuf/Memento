// Korean text for the home-screen widget picker. react-native-android-widget only writes the
// default (English) description, so add the values-ko override.
const fs = require('fs');
const path = require('path');
const { withDangerousMod } = require('expo/config-plugins');

const XML = `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <string name="widget_remember_description">이 순간, 기억나요? 추억 보드에서 매일 한 장씩.</string>
</resources>
`;

module.exports = (config) =>
  withDangerousMod(config, [
    'android',
    (cfg) => {
      const dir = path.join(cfg.modRequest.platformProjectRoot, 'app/src/main/res/values-ko');
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, 'widget_strings.xml'), XML);
      return cfg;
    },
  ]);
