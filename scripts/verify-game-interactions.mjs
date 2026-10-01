import assert from 'node:assert/strict';
import { Game } from '../src/game.js';
import { ITEM_DEFINITIONS } from '../src/items.js';
import { sounds } from '../src/audio.js';

sounds.isMuted = true;

function createGameHarness() {
  const shelves = Object.fromEntries(Object.values(ITEM_DEFINITIONS).map(item => [
    item.shelfId,
    {
      id: item.shelfId,
      itemId: item.id,
      name: item.name,
      capacity: item.boxCapacity,
      currentCount: Math.floor(item.boxCapacity / 2)
    }
  ]));
  const spawnedBoxes = [];
  const game = Object.create(Game.prototype);
  game.money = 2500;
  game.dayStats = { revenue: 0, cogs: 0 };
  game.store = {
    shelves,
    refreshShelfItems() {},
    spawnDeliveryBox(item, count) {
      spawnedBoxes.push({ itemId: item.id, count });
    }
  };
  game.showTopBanner = message => {
    game.lastBanner = message;
  };
  game.updateHUD = () => {};
  return { game, shelves, spawnedBoxes };
}

function installOrderModalStub() {
  class FakeButton {
    constructor() {
      this.onclick = null;
      this.disabled = false;
    }
  }

  class FakeCard {
    constructor() {
      this.className = '';
      this.elements = new Map();
    }

    set innerHTML(value) {
      this.elements.set('[data-action="down"]', new FakeButton());
      this.elements.set('[data-action="up"]', new FakeButton());
      this.elements.set('.btn-buy-box', new FakeButton());
    }

    querySelector(selector) {
      return this.elements.get(selector) || null;
    }
  }

  class FakeList {
    constructor() {
      this.children = [];
    }

    set innerHTML(value) {
      this.children = [];
    }

    appendChild(child) {
      this.children.push(child);
    }
  }

  const list = new FakeList();
  globalThis.document = {
    getElementById(id) {
      return id === 'order-items-list' ? list : null;
    },
    createElement() {
      return new FakeCard();
    }
  };
  return list;
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

check('顧客小費每位只能領取一次', () => {
  const { game } = createGameHarness();
  let moodCalls = 0;
  const customer = {
    archetype: { name: '測試顧客' },
    setMood() { moodCalls += 1; }
  };
  const startingMoney = game.money;
  game.clickCustomerInteract(customer);
  game.clickCustomerInteract(customer);
  assert.equal(game.money, startingMoney + 20);
  assert.equal(game.dayStats.revenue, 20);
  assert.equal(moodCalls, 1);
});

check('一鍵補貨會補滿貨架並扣除成本', () => {
  const { game, shelves } = createGameHarness();
  const startingMoney = game.money;
  game.restockAllShelves();
  assert.ok(Object.values(shelves).every(shelf => shelf.currentCount === shelf.capacity));
  assert.ok(game.dayStats.cogs > 0);
  assert.ok(game.money < startingMoney);
});

check('資金不足時一鍵補貨會顯示明確提示', () => {
  const { game } = createGameHarness();
  game.money = 0;
  game.restockAllShelves();
  assert.match(game.lastBanner, /資金不足/);
});

check('進貨卡片會建立配送箱並扣款', () => {
  const { game, spawnedBoxes } = createGameHarness();
  const list = installOrderModalStub();
  const startingMoney = game.money;
  game.renderOrderList();
  const buyButton = list.children[0]?.querySelector('.btn-buy-box');
  assert.ok(buyButton?.onclick, '進貨按鈕沒有事件回呼');
  buyButton.onclick();
  const firstItem = Object.values(ITEM_DEFINITIONS)[0];
  assert.equal(spawnedBoxes[0]?.itemId, firstItem.id);
  assert.equal(spawnedBoxes[0]?.count, firstItem.boxCapacity);
  assert.equal(game.money, startingMoney - firstItem.cost * firstItem.boxCapacity);
});

if (failures.length > 0) {
  console.error(`\n${failures.length} regression check(s) failed.`);
  process.exitCode = 1;
}
