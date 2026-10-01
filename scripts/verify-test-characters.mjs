import assert from 'node:assert/strict';
import { Game } from '../src/game.js';
import { CHARACTER_SET_IDS } from '../src/customer.js';
import { modelManager, STORE_ASSET_MANIFEST } from '../src/models.js';
import { sounds } from '../src/audio.js';

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

check('測試角色模型路徑已加入資產清單', () => {
  assert.equal(STORE_ASSET_MANIFEST.testRobot, 'models/RobotExpressive.glb');
  assert.equal(STORE_ASSET_MANIFEST.testSoldier, 'models/Soldier.glb');
});

check('測試角色開關可切換並恢復原本角色套組', () => {
  const originalHasStoreAsset = modelManager.hasStoreAsset;
  const originalMuted = sounds.isMuted;
  const button = {
    textContent: '測試 OFF',
    title: '',
    classList: { toggle() {} }
  };

  modelManager.hasStoreAsset = key => key === 'testRobot' || key === 'testSoldier';
  sounds.isMuted = true;
  globalThis.document = {
    getElementById(id) {
      return id === 'btn-test-characters' ? button : null;
    }
  };

  try {
    const game = Object.create(Game.prototype);
    game.characterSet = CHARACTER_SET_IDS.MODERN;
    game.testCharactersEnabled = false;
    game.customers = [];
    game.showTopBanner = message => { game.lastBanner = message; };

    assert.equal(game.setTestCharactersEnabled(true), true);
    assert.equal(game.testCharactersEnabled, true);
    assert.equal(button.textContent, '測試 ON');

    assert.equal(game.setTestCharactersEnabled(false), true);
    assert.equal(game.testCharactersEnabled, false);
    assert.equal(button.textContent, '測試 OFF');
  } finally {
    modelManager.hasStoreAsset = originalHasStoreAsset;
    sounds.isMuted = originalMuted;
    delete globalThis.document;
  }
});

if (failures.length > 0) {
  console.error(`\n${failures.length} test character check(s) failed.`);
  process.exitCode = 1;
}
