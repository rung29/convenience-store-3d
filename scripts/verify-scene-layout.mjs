import assert from 'node:assert/strict';
import fs from 'node:fs';
import { MARKET_SCENE_LAYOUT, PRODUCT_DISPLAY_EQUIPMENT } from '../src/store3d.js';
import { STORE_ASSET_MANIFEST } from '../src/models.js';

const storeSource = fs.readFileSync(new URL('../src/store3d.js', import.meta.url), 'utf8');

const sidewalkOuterEdge = MARKET_SCENE_LAYOUT.sidewalkCenter + MARKET_SCENE_LAYOUT.sidewalkDepth / 2;
const roadInnerEdge = MARKET_SCENE_LAYOUT.outerRoadCenter - MARKET_SCENE_LAYOUT.outerRoadWidth / 2;

assert.ok(
  MARKET_SCENE_LAYOUT.interiorScale >= 1.15,
  `store interior scale is too small: ${MARKET_SCENE_LAYOUT.interiorScale}`
);
assert.ok(
  roadInnerEdge > sidewalkOuterEdge + 0.3,
  `outer road overlaps the sidewalk: road ${roadInnerEdge}, sidewalk ${sidewalkOuterEdge}`
);
assert.equal(
  MARKET_SCENE_LAYOUT.roadTileRotationAlongX,
  Math.PI / 2,
  'road tiles along the X axis must rotate from their local Z axis'
);
assert.equal(
  MARKET_SCENE_LAYOUT.roadTileRotationAlongZ,
  0,
  'road tiles along the Z axis should keep their source orientation'
);

for (const assetKey of [
  'gondolaTins',
  'freezerChest',
  'uprightFreezer',
  'kenneyEmployee',
  'kenneyShelfEnd',
  'kenneyFreezer',
  'cityBase',
  'cityBuildingC',
  'cityWatertower'
]) {
  assert.match(
    storeSource,
    new RegExp(`['"]${assetKey}['"]`),
    `scene should place imported asset: ${assetKey}`
  );
}

assert.match(
  storeSource,
  /replaceImportedShelfEquipment\(shelf, newItemId\)/,
  'changing a product should replace its imported display equipment'
);

const expectedProductEquipment = {
  green_tea: 'chillerDrinks',
  canned_coffee: 'chillerDairy',
  onigiri: 'gondolaBottles',
  chips: 'gondolaSnacks',
  instant_noodles: 'gondolaTins',
  oden: 'odenHotFoodCounter'
};

for (const [itemId, assetKey] of Object.entries(expectedProductEquipment)) {
  assert.equal(
    PRODUCT_DISPLAY_EQUIPMENT[itemId]?.assetKey,
    assetKey,
    `${itemId} should use its dedicated display equipment`
  );
}

assert.equal(
  new Set(Object.values(expectedProductEquipment)).size,
  Object.keys(expectedProductEquipment).length,
  'each current product should have a distinct display asset'
);
assert.equal(
  STORE_ASSET_MANIFEST.odenHotFoodCounter,
  'models/store/oden-hot-food-counter.glb',
  'oden should load the dedicated hot-food counter GLB'
);
assert.ok(
  fs.existsSync(new URL('../public/models/store/oden-hot-food-counter.glb', import.meta.url)),
  'the local oden hot-food counter GLB should exist'
);
const odenModelBuffer = fs.readFileSync(new URL('../public/models/store/oden-hot-food-counter.glb', import.meta.url));
assert.equal(
  odenModelBuffer.subarray(0, 4).toString('ascii'),
  'glTF',
  'the oden hot-food counter should be a valid binary glTF file'
);
const odenModelContent = odenModelBuffer.toString('utf8');
for (const authoredDetail of [
  'Taiwan_Convenience_Store_Oden_Counter',
  'Oden_Pan_00',
  'Tea_Egg_00',
  'Oden_Label_Text'
]) {
  assert.match(
    odenModelContent,
    new RegExp(authoredDetail),
    `the Blender-authored oden model should contain ${authoredDetail}`
  );
}
assert.doesNotMatch(
  storeSource,
  /oden:\s*['"]impulseShelf['"]/,
  'oden must never fall back to a generic impulse shelf mapping'
);

console.log('PASS store layout and product-specific display equipment');
