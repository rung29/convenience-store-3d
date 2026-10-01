// 遊戲程式進入點
import './style.css';
import { Game } from './game.js';
import { modelManager } from './models.js';

window.addEventListener('DOMContentLoaded', async () => {
  const container = document.getElementById('canvas-container');

  // 1. 預先載入 3D 骨架動作模型 (Xbot.glb)
  await modelManager.preloadModels();
  await modelManager.preloadStoreAssets();

  // 2. 初始化橘子便利商店 3D 經營遊戲實例
  const game = new Game(container);
});
