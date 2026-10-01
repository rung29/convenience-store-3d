import assert from 'node:assert/strict';
import * as THREE from 'three';
import { Store3D } from '../src/store3d.js';

function createPlacementHarness({ candidate, decorations }) {
  const store = Object.create(Store3D.prototype);
  store.ghostGroup = new THREE.Group();
  store.ghostGroup.visible = true;
  store.ghostMeshHolder = new THREE.Group();
  store.ghostGroup.add(store.ghostMeshHolder);
  store.ghostValidMat = {};
  store.ghostInvalidMat = {};
  store.ghostFloorQuad = { material: { color: { setHex() {} } } };
  store.selectionMarker = new THREE.Group();
  store.updateNavGrid = () => {};
  store.selectedObject = { type: 'decor', id: 'candidate', target: candidate };
  store.decorations = decorations;
  store.shelves = {};
  return store;
}

function createPlant(name = '精選綠植盆栽') {
  return { name, group: new THREE.Group(), mesh: new THREE.Mesh() };
}

const failures = [];
function check(name, callback) {
  try {
    callback();
    console.log(`PASS ${name}`);
  } catch (error) {
    failures.push(`${name}: ${error.message}`);
    console.error(`FAIL ${name}: ${error.message}`);
  }
}

check('裝飾物可以貼近店內牆面，不會被固定 5.2 邊界擋住', () => {
  const candidate = createPlant();
  const store = createPlacementHarness({ candidate, decorations: { candidate } });
  const preview = store.updateGhostPosition(new THREE.Vector3(6.3, 0, 0));

  assert.equal(preview.x, 6.3);
  assert.equal(preview.valid, true);
});

check('裝飾物不可與既有裝飾物重疊', () => {
  const candidate = createPlant();
  const existing = createPlant();
  existing.group.position.set(0, 0, 0);
  candidate.group.position.set(0.3, 0, 0);
  const store = createPlacementHarness({ candidate, decorations: { candidate, existing } });
  const preview = store.updateGhostPosition(new THREE.Vector3(0.3, 0, 0));

  assert.equal(preview.valid, false);
});

check('移動控制不可把裝飾物推進既有物件', () => {
  const candidate = createPlant();
  const existing = createPlant();
  existing.group.position.set(1, 0, 0);
  const store = createPlacementHarness({ candidate, decorations: { candidate, existing } });
  const result = store.moveSelectedObject(0.6, 0);

  assert.equal(result.valid, false);
  assert.equal(candidate.group.position.x, 0);
});

check('旋轉後超出牆界時會拒絕變更', () => {
  const candidate = { type: 'dining_set', name: 'dining_set', group: new THREE.Group() };
  candidate.group.position.set(2, 0, 5.9);
  const store = createPlacementHarness({ candidate, decorations: { candidate } });
  const result = store.rotateSelectedObject(Math.PI / 2);

  assert.equal(result.valid, false);
  assert.equal(candidate.group.rotation.y, 0);
});

if (failures.length > 0) {
  console.error(`\n${failures.length} placement regression check(s) failed.`);
  process.exitCode = 1;
}
