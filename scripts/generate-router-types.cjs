const fs = require('node:fs');
const path = require('node:path');

const outputDir = path.resolve('.expo/types');

fs.mkdirSync(outputDir, { recursive: true });
process.env.EXPO_ROUTER_APP_ROOT = path.resolve('app');

const { regenerateDeclarations } = require('expo-router/build/typed-routes');

regenerateDeclarations(outputDir);

setTimeout(() => {
  if (!fs.existsSync(path.join(outputDir, 'router.d.ts'))) {
    process.exitCode = 1;
  }
}, 1200);
