import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { Game } from '../src/game.js';
import { sounds } from '../src/audio.js';

const [html, game, css] = await Promise.all([
  readFile(new URL('../index.html', import.meta.url), 'utf8'),
  readFile(new URL('../src/game.js', import.meta.url), 'utf8'),
  readFile(new URL('../src/style.css', import.meta.url), 'utf8'),
]);

assert.match(
  html,
  /id="btn-dismiss-clerk-bubble"/,
  '店長提示需要有可操作的關閉按鈕',
);
assert.match(
  html,
  /id="btn-collapse-decor"/,
  '手機裝潢面板需要有收合控制',
);
assert.match(
  html,
  /class="decor-hud-content"/,
  '裝潢面板的內容需要獨立滾動區域',
);

assert.match(game, /clerkHintDismissed/, '店長提示需要保留關閉狀態');
assert.match(game, /toggleDecorPanelCollapsed/, '裝潢面板需要可收合');
assert.doesNotMatch(
  game,
  /decorPanel\.style\.display/,
  '裝潢面板不可由 inline display 強制覆蓋手機版排版',
);
assert.doesNotMatch(
  game,
  /clerkBubble\.style\.display/,
  '店長提示不可由 inline display 強制恢復顯示',
);

assert.match(css, /\.decor-hud-content\s*\{[\s\S]*?overflow-y:\s*auto/, '裝潢內容需要可滾動');
assert.match(css, /\.decor-panel-collapsed/, 'CSS 需要支援裝潢面板收合狀態');
assert.match(
  css,
  /width:\s*min\(320px,\s*calc\(100vw\s*-\s*24px\)\)/,
  '手機裝潢面板需要保留可見的遊戲空間',
);

class FakeClassList {
  constructor() {
    this.values = new Set();
  }

  toggle(name, force) {
    const shouldHave = force === undefined ? !this.values.has(name) : Boolean(force);
    if (shouldHave) this.values.add(name);
    else this.values.delete(name);
    return shouldHave;
  }

  add(name) {
    this.values.add(name);
  }

  remove(...names) {
    names.forEach(name => this.values.delete(name));
  }

  contains(name) {
    return this.values.has(name);
  }
}

const makeElement = () => ({
  classList: new FakeClassList(),
  style: {},
  attributes: {},
  setAttribute(name, value) {
    this.attributes[name] = String(value);
  },
});

const elements = new Map([
  ['btn-collapse-decor', makeElement()],
  ['btn-toggle-mobile-actions', makeElement()],
  ['btn-toggle-mobile-status', makeElement()],
  ['clerk-bubble', makeElement()],
]);
const body = { classList: new FakeClassList() };
globalThis.document = {
  body,
  getElementById(id) {
    return elements.get(id) ?? null;
  },
};

const previousMuted = sounds.isMuted;
sounds.isMuted = true;
const gameState = {
  isDecorMode: false,
  decorPanelCollapsed: false,
  clerkHintDismissed: false,
  store: {
    setDecorMode(value) {
      this.decorMode = value;
    },
    calculateAestheticsScore() {
      return 90;
    },
  },
  showTopBanner() {},
  updateHUD() {},
  toggleDecorPanelCollapsed: Game.prototype.toggleDecorPanelCollapsed,
  updateClerkHintVisibility: Game.prototype.updateClerkHintVisibility,
  dismissClerkHint: Game.prototype.dismissClerkHint,
};

Game.prototype.toggleDecorMode.call(gameState, true);
assert.equal(gameState.isDecorMode, true, '裝潢模式應該能開啟');
assert.equal(elements.get('decor-hud-panel')?.style.display, undefined, '不可寫入 inline display');
assert.equal(elements.get('clerk-bubble').classList.contains('is-dismissed'), true, '裝潢模式應隱藏提示');

Game.prototype.toggleDecorMode.call(gameState, false);
assert.equal(gameState.isDecorMode, false, '裝潢模式應該能關閉');
assert.equal(elements.get('clerk-bubble').classList.contains('is-dismissed'), false, '離開裝潢模式時提示可恢復');

gameState.dismissClerkHint();
assert.equal(gameState.clerkHintDismissed, true, '關閉提示後應保留狀態');
assert.equal(elements.get('clerk-bubble').classList.contains('is-dismissed'), true, '關閉提示後不可被重新顯示');

sounds.isMuted = previousMuted;
delete globalThis.document;

console.log('Mobile decoration UI checks passed.');
