import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const gradlePropertiesPath = resolve(rootDir, 'android/gradle.properties');
const angularOutputPath = resolve(rootDir, 'src/environments/app-version.ts');
const iosOutputPath = resolve(rootDir, 'ios/app-version.xcconfig');

const properties = readFileSync(gradlePropertiesPath, 'utf8');
const versionMatch = properties.match(/^appVersionName\s*=\s*(.+)\s*$/m);

if (!versionMatch) {
  throw new Error('Missing appVersionName in android/gradle.properties');
}

const appVersion = versionMatch[1].trim();

if (!appVersion) {
  throw new Error('appVersionName in android/gradle.properties cannot be empty');
}

writeFileSync(
  angularOutputPath,
  `// Generated from android/gradle.properties by scripts/sync-app-version.mjs.\nexport const APP_VERSION = ${JSON.stringify(appVersion)};\n`,
);

writeFileSync(
  iosOutputPath,
  `// Generated from android/gradle.properties by scripts/sync-app-version.mjs.\nMARKETING_VERSION = ${appVersion}\n`,
);
