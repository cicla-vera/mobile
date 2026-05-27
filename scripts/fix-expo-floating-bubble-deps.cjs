const fs = require('node:fs');
const path = require('node:path');

const appRoot = process.cwd();
const bundledModulesRoot = path.join(
  appRoot,
  'node_modules',
  'expo-floating-bubble',
  'node_modules',
);

const modulesToRemove = [
  'expo-modules-core',
  'react-native-gesture-handler',
  'react-native-reanimated',
  'react-native-safe-area-context',
];

for (const moduleName of modulesToRemove) {
  const targetPath = path.join(bundledModulesRoot, moduleName);

  if (!fs.existsSync(targetPath)) {
    continue;
  }

  fs.rmSync(targetPath, { recursive: true, force: true });
  console.log(`[postinstall] removed bundled ${moduleName}`);
}
