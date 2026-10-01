import assert from 'node:assert/strict';
import fs from 'node:fs';

const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const css = fs.readFileSync(new URL('../src/style.css', import.meta.url), 'utf8');
const game = fs.readFileSync(new URL('../src/game.js', import.meta.url), 'utf8');
const mobileCss = css.slice(css.lastIndexOf('@media (max-width: 760px)'));

assert.match(
  html,
  /id="btn-toggle-mobile-actions"/,
  'mobile action drawer toggle is missing'
);
assert.match(
  html,
  /id="btn-toggle-mobile-status"/,
  'mobile status drawer toggle is missing'
);
assert.match(
  mobileCss,
  /\.bottom-actions-container\s*\{[^}]*display:\s*none\s*!important/s,
  'main actions should be collapsed by default on mobile'
);
assert.match(
  mobileCss,
  /body\.mobile-actions-open\s+\.bottom-actions-container\s*\{[^}]*flex-direction:\s*column/s,
  'mobile actions should open as a side drawer'
);
assert.match(
  mobileCss,
  /body\.mobile-status-open\s+\.quest-board-card\s*\{[^}]*position:\s*fixed/s,
  'quest information should only appear in the mobile status drawer'
);
assert.match(
  mobileCss,
  /\.mobile-status-toggle\s*\{[^}]*position:\s*fixed/s,
  'mobile status toggle should stay fixed to the viewport'
);
assert.match(
  mobileCss,
  /\.decor-hud-panel\s*\{[^}]*left:\s*auto/s,
  'decor controls should stay on the side instead of spanning the mobile screen'
);
assert.match(game, /mobile-status-open/, 'mobile status toggle is not wired to game state');
assert.match(game, /mobile-actions-open/, 'mobile action toggle is not wired to game state');

console.log('PASS mobile controls collapse and open as side drawers');
