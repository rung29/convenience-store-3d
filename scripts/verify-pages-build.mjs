import { access, readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const expectedBase = '/convenience-store-3d/';
const distDir = path.resolve('dist');
const indexPath = path.join(distDir, 'index.html');

const indexHtml = await readFile(indexPath, 'utf8');
const localAssetUrls = [...indexHtml.matchAll(/(?:src|href)="([^"]+)"/g)]
  .map((match) => match[1])
  .filter((url) => url.startsWith('/'));

const incorrectlyBasedAssets = localAssetUrls.filter(
  (url) => !url.startsWith(expectedBase),
);

if (incorrectlyBasedAssets.length > 0) {
  throw new Error(
    `Build contains assets outside ${expectedBase}: ${incorrectlyBasedAssets.join(', ')}`,
  );
}

const assetsDir = path.join(distDir, 'assets');
const javascriptBundles = (await readdir(assetsDir))
  .filter((file) => file.endsWith('.js'))
  .map((file) => path.join(assetsDir, file));
const javascript = (
  await Promise.all(javascriptBundles.map((file) => readFile(file, 'utf8')))
).join('\n');
const expectedModelRefs = [
  { bundleRef: `${expectedBase}models/Xbot.glb`, fileName: 'Xbot.glb' },
  { bundleRef: 'models/RobotExpressive.glb', fileName: 'RobotExpressive.glb' },
  { bundleRef: 'models/Soldier.glb', fileName: 'Soldier.glb' }
];

for (const { bundleRef, fileName } of expectedModelRefs) {
  if (!javascript.includes(bundleRef)) {
    throw new Error(`Build does not reference the model at ${bundleRef}`);
  }
  await access(path.join(distDir, 'models', fileName));
}

console.log(`GitHub Pages build verified for ${expectedBase}`);
