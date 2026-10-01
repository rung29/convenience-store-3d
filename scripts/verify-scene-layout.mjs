import assert from 'node:assert/strict';
import { MARKET_SCENE_LAYOUT } from '../src/store3d.js';

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

console.log('PASS store scale, outer-road separation, and road orientation');
