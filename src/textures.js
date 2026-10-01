// 紋理生成器：打造超豐富日系便利商店質感 (Ultra-Detailed Konbini Style)
import * as THREE from 'three';

function makeCanvas(w, h) {
  const canvas = document.createElement('canvas');
  canvas.width = w; canvas.height = h;
  return { canvas, ctx: canvas.getContext('2d') };
}

// CanvasTexture 預設不會自動套用 sRGB，會讓暖色材質在 3D 場景裡看起來灰暗。
// 統一在這裡處理色彩空間與縮小取樣，讓地板、招牌與海報在放大鏡頭後仍保持清楚。
function finishTexture(texture) {
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  texture.needsUpdate = true;
  return texture;
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function shadeColor(hex, percent) {
  const cleanHex = hex.startsWith('#') ? hex.slice(1) : hex;
  if (cleanHex.length !== 6) return hex;
  const num = parseInt(cleanHex, 16);
  const r = Math.min(255, Math.max(0, (num >> 16) + percent));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0xff) + percent));
  const b = Math.min(255, Math.max(0, (num & 0xff) + percent));
  return `rgb(${r},${g},${b})`;
}

// 1. 地板磁磚 - 溫暖棋盤格，含細緻木紋
export function createCozyFloorTexture() {
  const { canvas, ctx } = makeCanvas(1024, 1024);
  const tile = 128;
  for (let x = 0; x < 1024; x += tile) {
    for (let y = 0; y < 1024; y += tile) {
      const even = (x / tile + y / tile) % 2 === 0;
      ctx.fillStyle = even ? '#f0dfc0' : '#e4c89e';
      ctx.fillRect(x, y, tile, tile);
      ctx.save();
      ctx.globalAlpha = 0.12;
      for (let g = 0; g < 5; g++) {
        const gx = x + g * (tile / 5) + Math.random() * 4;
        ctx.strokeStyle = even ? '#c8a472' : '#b8946a';
        ctx.lineWidth = 0.8 + Math.random() * 1.2;
        ctx.beginPath();
        ctx.moveTo(gx, y);
        ctx.bezierCurveTo(gx + 4, y + tile * 0.3, gx - 3, y + tile * 0.7, gx + 2, y + tile);
        ctx.stroke();
      }
      ctx.restore();
      const grad = ctx.createLinearGradient(x, y, x + tile, y + tile);
      grad.addColorStop(0, 'rgba(255,255,255,0.18)');
      grad.addColorStop(0.5, 'rgba(255,255,255,0)');
      grad.addColorStop(1, 'rgba(0,0,0,0.06)');
      ctx.fillStyle = grad;
      ctx.fillRect(x + 2, y + 2, tile - 4, tile - 4);
    }
  }
  ctx.strokeStyle = '#b89470';
  ctx.lineWidth = 2;
  for (let i = 0; i <= 1024; i += tile) {
    ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, 1024); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(1024, i); ctx.stroke();
  }
  const tex = finishTexture(new THREE.CanvasTexture(canvas));
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(4, 4);
  return tex;
}

// 2. 室外人行道石磚
export function createCozySidewalkTexture() {
  const { canvas, ctx } = makeCanvas(512, 512);
  const size = 80;
  for (let x = 0; x < 512; x += size) {
    for (let y = 0; y < 512; y += size) {
      const shade = 0.97 + Math.random() * 0.04;
      ctx.fillStyle = `rgb(${Math.floor(224 * shade)}, ${Math.floor(228 * shade)}, ${Math.floor(220 * shade)})`;
      ctx.fillRect(x + 1, y + 1, size - 2, size - 2);
      ctx.fillStyle = 'rgba(255,255,255,0.25)';
      ctx.fillRect(x + 2, y + 2, size * 0.4, size * 0.4);
    }
  }
  ctx.fillStyle = '#b8bfb4';
  for (let i = 0; i <= 512; i += size) {
    ctx.fillRect(i - 1, 0, 2, 512);
    ctx.fillRect(0, i - 1, 512, 2);
  }
  const tex = finishTexture(new THREE.CanvasTexture(canvas));
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(10, 10);
  return tex;
}

// 3. 牆面
export function createCozyWallTexture() {
  const { canvas, ctx } = makeCanvas(512, 512);
  const wallGrad = ctx.createLinearGradient(0, 0, 512, 0);
  wallGrad.addColorStop(0, '#faf8f4');
  wallGrad.addColorStop(0.5, '#f5f3ef');
  wallGrad.addColorStop(1, '#faf8f4');
  ctx.fillStyle = wallGrad;
  ctx.fillRect(0, 0, 512, 512);
  const greenGrad = ctx.createLinearGradient(0, 0, 0, 72);
  greenGrad.addColorStop(0, '#2d6a50');
  greenGrad.addColorStop(1, '#3d7d60');
  ctx.fillStyle = greenGrad;
  ctx.fillRect(0, 0, 512, 72);
  ctx.fillStyle = '#c8a050';
  ctx.fillRect(0, 70, 512, 3);
  ctx.strokeStyle = '#e8e4de';
  ctx.lineWidth = 1;
  for (let y = 100; y < 460; y += 40) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(512, y); ctx.stroke();
  }
  const baseGrad = ctx.createLinearGradient(0, 460, 0, 512);
  baseGrad.addColorStop(0, '#c09060');
  baseGrad.addColorStop(0.3, '#d4a870');
  baseGrad.addColorStop(1, '#a07848');
  ctx.fillStyle = baseGrad;
  ctx.fillRect(0, 460, 512, 52);
  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  ctx.fillRect(0, 460, 512, 6);
  return finishTexture(new THREE.CanvasTexture(canvas));
}

// 4. 花槽植栽
export function createFlowerHedgeTexture() {
  const { canvas, ctx } = makeCanvas(256, 256);
  const g = ctx.createRadialGradient(128, 128, 20, 128, 128, 140);
  g.addColorStop(0, '#7cc030');
  g.addColorStop(0.5, '#5a9e18');
  g.addColorStop(1, '#3d7a08');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 256);
  ctx.save();
  ctx.globalAlpha = 0.25;
  for (let i = 0; i < 30; i++) {
    const lx = Math.random() * 256;
    const ly = Math.random() * 256;
    ctx.fillStyle = Math.random() > 0.5 ? '#90d040' : '#3a6a10';
    ctx.save();
    ctx.translate(lx, ly);
    ctx.rotate(Math.random() * Math.PI * 2);
    ctx.scale(1 + Math.random(), 0.4 + Math.random() * 0.4);
    ctx.beginPath();
    ctx.ellipse(0, 0, 18, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();
  const flowers = [
    { x: 32, y: 45, c: '#ff4488' }, { x: 90, y: 30, c: '#ffffff' },
    { x: 155, y: 55, c: '#ffcc00' }, { x: 210, y: 35, c: '#ff88cc' },
    { x: 60, y: 110, c: '#ff6622' }, { x: 130, y: 95, c: '#ffffff' },
    { x: 190, y: 115, c: '#cc44ff' }, { x: 40, y: 175, c: '#ffaa00' },
    { x: 100, y: 190, c: '#ff4488' }, { x: 170, y: 165, c: '#ffffff' },
    { x: 225, y: 185, c: '#55ddff' }, { x: 75, y: 230, c: '#ffcc00' },
    { x: 145, y: 220, c: '#ff88cc' }, { x: 210, y: 240, c: '#ff4488' },
  ];
  flowers.forEach(f => {
    for (let p = 0; p < 5; p++) {
      const angle = (p / 5) * Math.PI * 2;
      ctx.fillStyle = f.c;
      ctx.beginPath();
      ctx.ellipse(f.x + Math.cos(angle) * 9, f.y + Math.sin(angle) * 9, 7, 4.5, angle, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#ffe44d';
    ctx.beginPath(); ctx.arc(f.x, f.y, 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ff9900';
    ctx.beginPath(); ctx.arc(f.x, f.y, 2.5, 0, Math.PI * 2); ctx.fill();
  });
  return finishTexture(new THREE.CanvasTexture(canvas));
}

// 5. 進貨紙箱
export function createBoxTexture(itemName, count) {
  const { canvas, ctx } = makeCanvas(512, 512);
  const g = ctx.createLinearGradient(0, 0, 512, 512);
  g.addColorStop(0, '#d4a06a'); g.addColorStop(0.5, '#c89058'); g.addColorStop(1, '#b87a48');
  ctx.fillStyle = g; ctx.fillRect(0, 0, 512, 512);
  ctx.save(); ctx.globalAlpha = 0.08; ctx.strokeStyle = '#7a5030'; ctx.lineWidth = 3;
  for (let y = 0; y < 512; y += 12) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(512, y); ctx.stroke(); }
  ctx.restore();
  ctx.strokeStyle = 'rgba(0,0,0,0.15)'; ctx.lineWidth = 2; ctx.strokeRect(4, 4, 504, 504);
  const tapeGrad = ctx.createLinearGradient(0, 236, 0, 276);
  tapeGrad.addColorStop(0, '#c0b080'); tapeGrad.addColorStop(0.5, '#e8d890'); tapeGrad.addColorStop(1, '#c0b080');
  ctx.fillStyle = tapeGrad; ctx.fillRect(0, 240, 512, 32);
  ctx.fillStyle = 'rgba(120,90,40,0.4)'; ctx.font = 'bold 14px sans-serif'; ctx.textAlign = 'center';
  ctx.fillText('FRAGILE  FRAGILE  FRAGILE  FRAGILE', 256, 261);
  ctx.fillStyle = '#ffffff'; ctx.shadowColor = 'rgba(0,0,0,0.2)'; ctx.shadowBlur = 8;
  roundRect(ctx, 40, 50, 432, 170, 16); ctx.fill(); ctx.shadowBlur = 0;
  ctx.fillStyle = '#f97316'; roundRect(ctx, 40, 50, 432, 44, 16); ctx.fill();
  ctx.fillStyle = '#ffffff'; ctx.font = 'bold 22px sans-serif'; ctx.textAlign = 'center';
  ctx.fillText('Gamania Logistics', 256, 81);
  ctx.fillStyle = '#1e293b'; ctx.font = 'bold 36px sans-serif';
  ctx.fillText(itemName || 'Product', 256, 148);
  ctx.fillStyle = '#f8f9fa'; roundRect(ctx, 40, 300, 432, 160, 16); ctx.fill();
  ctx.fillStyle = '#1e293b'; ctx.font = 'bold 28px sans-serif';
  ctx.fillText('Qty: ' + (count || 12) + ' pcs/box', 256, 350);
  ctx.fillStyle = '#1e293b';
  for (let i = 0; i < 30; i++) {
    const bx = 80 + i * 12.5; const bh = 30 + Math.random() * 25;
    ctx.fillRect(bx, 375, i % 3 === 0 ? 4 : 2, bh);
  }
  ctx.font = '16px monospace'; ctx.fillText('4901234567890', 256, 440);
  return finishTexture(new THREE.CanvasTexture(canvas));
}

// 6. 招牌
export function createStoreSignTexture() {
  const { canvas, ctx } = makeCanvas(1024, 256);
  const bg = ctx.createLinearGradient(0, 0, 0, 256);
  bg.addColorStop(0, '#1a3528'); bg.addColorStop(1, '#0d2018');
  ctx.fillStyle = bg; ctx.fillRect(0, 0, 1024, 256);
  ctx.fillStyle = '#f97316'; ctx.fillRect(0, 0, 1024, 24);
  ctx.fillStyle = '#f97316'; ctx.fillRect(0, 232, 1024, 24);
  ctx.shadowColor = '#ff8c00'; ctx.shadowBlur = 30;
  ctx.strokeStyle = '#ff8c00'; ctx.lineWidth = 3;
  ctx.strokeRect(12, 28, 1000, 200); ctx.shadowBlur = 0;
  ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 1.5;
  ctx.strokeRect(18, 34, 988, 188);
  ctx.shadowColor = '#ffffff'; ctx.shadowBlur = 15;
  ctx.fillStyle = '#ffffff'; ctx.font = '900 72px sans-serif'; ctx.textAlign = 'center';
  ctx.fillText('GAMANIA MART', 512, 120); ctx.shadowBlur = 0;
  ctx.fillStyle = '#fde047'; ctx.shadowColor = '#fde047'; ctx.shadowBlur = 10;
  ctx.font = 'bold 32px sans-serif'; ctx.fillText('OPEN 24 HOURS  •  CONVENIENCE STORE', 512, 175);
  ctx.shadowBlur = 0;
  return finishTexture(new THREE.CanvasTexture(canvas));
}

// 7. 迎賓地墊
export function createWelcomeMatTexture() {
  const { canvas, ctx } = makeCanvas(512, 256);
  const bg = ctx.createLinearGradient(0, 0, 0, 256);
  bg.addColorStop(0, '#7f1d1d'); bg.addColorStop(0.5, '#991b1b'); bg.addColorStop(1, '#7f1d1d');
  ctx.fillStyle = bg; ctx.fillRect(0, 0, 512, 256);
  ctx.save(); ctx.globalAlpha = 0.08; ctx.strokeStyle = '#cc2222'; ctx.lineWidth = 2;
  for (let y = 0; y < 256; y += 6) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(512, y); ctx.stroke(); }
  ctx.restore();
  ctx.strokeStyle = '#d4a017'; ctx.lineWidth = 5; ctx.strokeRect(8, 8, 496, 240);
  ctx.strokeStyle = '#fde47a'; ctx.lineWidth = 2; ctx.strokeRect(16, 16, 480, 224);
  ctx.shadowColor = '#d4a017'; ctx.shadowBlur = 10;
  ctx.fillStyle = '#fde47a'; ctx.font = 'bold 48px sans-serif'; ctx.textAlign = 'center';
  ctx.fillText('WELCOME  TO  GAMANIA MART', 256, 110); ctx.shadowBlur = 0;
  ctx.fillStyle = '#ffffff'; ctx.font = 'bold 26px sans-serif';
  ctx.fillText('OPEN 24 HOURS  |  Open Every Day', 256, 165);
  ctx.fillStyle = '#fde47a'; ctx.font = '20px sans-serif';
  ctx.fillText('Thank you for visiting!', 256, 210);
  return finishTexture(new THREE.CanvasTexture(canvas));
}

// 8. 自動販賣機
export function createVendingMachineTexture() {
  const { canvas, ctx } = makeCanvas(512, 1024);
  const bg = ctx.createLinearGradient(0, 0, 512, 0);
  bg.addColorStop(0, '#e8ecf0'); bg.addColorStop(0.3, '#f8fafc');
  bg.addColorStop(0.7, '#f8fafc'); bg.addColorStop(1, '#d0d4d8');
  ctx.fillStyle = bg; ctx.fillRect(0, 0, 512, 1024);
  const signGrad = ctx.createLinearGradient(0, 0, 0, 100);
  signGrad.addColorStop(0, '#0369a1'); signGrad.addColorStop(1, '#0284c7');
  ctx.fillStyle = signGrad; ctx.fillRect(16, 16, 480, 88);
  ctx.shadowColor = '#38bdf8'; ctx.shadowBlur = 20;
  ctx.fillStyle = '#ffffff'; ctx.font = 'bold 36px sans-serif'; ctx.textAlign = 'center';
  ctx.fillText('COLD DRINKS', 256, 72); ctx.shadowBlur = 0;
  const glassGrad = ctx.createLinearGradient(0, 110, 512, 110);
  glassGrad.addColorStop(0, '#0f1a2e'); glassGrad.addColorStop(0.5, '#162238'); glassGrad.addColorStop(1, '#0f1a2e');
  ctx.fillStyle = glassGrad;
  roundRect(ctx, 20, 110, 472, 540, 8); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.04)'; ctx.fillRect(24, 114, 60, 532);
  const drinks = [
    { c: '#22c55e', label: 'Green Tea', price: 'NT$25' },
    { c: '#ef4444', label: 'Cola', price: 'NT$30' },
    { c: '#f59e0b', label: 'Water', price: 'NT$20' },
    { c: '#8b5cf6', label: 'Grape', price: 'NT$35' },
    { c: '#ec4899', label: 'Strawberry', price: 'NT$40' },
    { c: '#0ea5e9', label: 'Sports', price: 'NT$30' },
    { c: '#f97316', label: 'Orange', price: 'NT$35' },
    { c: '#84cc16', label: 'Yogurt', price: 'NT$25' },
    { c: '#e11d48', label: 'Black Tea', price: 'NT$25' },
  ];
  const dw = 130, dh = 155, startX = 35, startY = 122, gapX = 13, gapY = 14;
  drinks.forEach((d, idx) => {
    const col = idx % 3; const row = Math.floor(idx / 3);
    const dx = startX + col * (dw + gapX); const dy = startY + row * (dh + gapY);
    const bottleGrad = ctx.createLinearGradient(dx, dy, dx + dw, dy);
    bottleGrad.addColorStop(0, shadeColor(d.c, -20));
    bottleGrad.addColorStop(0.3, d.c);
    bottleGrad.addColorStop(0.7, d.c);
    bottleGrad.addColorStop(1, shadeColor(d.c, -30));
    ctx.fillStyle = bottleGrad;
    roundRect(ctx, dx + 8, dy + 8, dw - 16, dh - 30, 12); ctx.fill();
    ctx.fillStyle = '#f8fafc';
    roundRect(ctx, dx + dw * 0.2, dy + 4, dw * 0.6, 16, 4); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.92)';
    roundRect(ctx, dx + 8, dy + dh * 0.35, dw - 16, dh * 0.3, 6); ctx.fill();
    ctx.fillStyle = '#1e293b'; ctx.font = 'bold 16px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(d.label, dx + dw / 2, dy + dh * 0.55);
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    roundRect(ctx, dx + 12, dy + 8, 18, dh - 38, 4); ctx.fill();
    const btnGrad = ctx.createLinearGradient(dx, dy + dh - 20, dx, dy + dh);
    btnGrad.addColorStop(0, '#1e40af'); btnGrad.addColorStop(1, '#1d4ed8');
    ctx.fillStyle = btnGrad;
    roundRect(ctx, dx + 8, dy + dh - 22, dw - 16, 18, 4); ctx.fill();
    ctx.fillStyle = '#ffffff'; ctx.font = 'bold 12px sans-serif';
    ctx.fillText(d.price, dx + dw / 2, dy + dh - 8);
  });
  ctx.fillStyle = '#1e3a5f'; ctx.fillRect(20, 655, 472, 3);
  ctx.fillStyle = '#f1f5f9';
  roundRect(ctx, 20, 665, 472, 100, 8); ctx.fill();
  ctx.fillStyle = '#64748b'; ctx.font = 'bold 20px sans-serif'; ctx.textAlign = 'center';
  ctx.fillText('Coin | Credit Card | Mobile Pay', 256, 710);
  ctx.fillStyle = '#0f172a';
  roundRect(ctx, 20, 780, 472, 120, 8); ctx.fill();
  ctx.fillStyle = '#475569'; ctx.font = 'bold 22px sans-serif';
  ctx.fillText('Pick up your drink here', 256, 845);
  ctx.fillStyle = '#fef9c3';
  roundRect(ctx, 30, 920, 452, 80, 12); ctx.fill();
  ctx.fillStyle = '#f97316'; ctx.font = 'bold 26px sans-serif';
  ctx.fillText('Gamania Points Rewards Program', 256, 967);
  return finishTexture(new THREE.CanvasTexture(canvas));
}

// 9. ATM 螢幕
export function createAtmScreenTexture() {
  const { canvas, ctx } = makeCanvas(512, 512);
  const bg = ctx.createLinearGradient(0, 0, 0, 512);
  bg.addColorStop(0, '#0c1a3a'); bg.addColorStop(1, '#0a1428');
  ctx.fillStyle = bg; ctx.fillRect(0, 0, 512, 512);
  ctx.fillStyle = '#0c4a6e'; ctx.fillRect(0, 0, 512, 80);
  ctx.shadowColor = '#38bdf8'; ctx.shadowBlur = 15;
  ctx.fillStyle = '#fde047'; ctx.font = 'bold 28px sans-serif'; ctx.textAlign = 'center';
  ctx.fillText('GAMANIA BANK ATM', 256, 52); ctx.shadowBlur = 0;
  ctx.fillStyle = 'rgba(12, 74, 110, 0.4)';
  roundRect(ctx, 20, 95, 472, 80, 8); ctx.fill();
  ctx.strokeStyle = '#0ea5e9'; ctx.lineWidth = 1.5;
  roundRect(ctx, 20, 95, 472, 80, 8); ctx.stroke();
  ctx.fillStyle = '#e0f2fe'; ctx.font = '22px sans-serif';
  ctx.fillText('Insert card or tap mobile payment', 256, 140);
  const btns = [
    { txt: 'Withdraw', c: '#0c4a6e' }, { txt: 'Deposit', c: '#064e3b' },
    { txt: 'Transfer', c: '#1e1b4b' }, { txt: 'Balance', c: '#4a1d1d' },
    { txt: 'Pay Bills', c: '#2d1b00' }, { txt: 'QR Code', c: '#0c2a4e' },
  ];
  btns.forEach((b, i) => {
    const bx = 24 + (i % 2) * 246; const by = 200 + Math.floor(i / 2) * 80;
    ctx.fillStyle = b.c; roundRect(ctx, bx, by, 228, 60, 8); ctx.fill();
    ctx.strokeStyle = '#38bdf8'; ctx.lineWidth = 1.5;
    roundRect(ctx, bx, by, 228, 60, 8); ctx.stroke();
    ctx.fillStyle = '#f0f9ff'; ctx.font = 'bold 22px sans-serif'; ctx.textAlign = 'center';
    ctx.fillText(b.txt, bx + 114, by + 38);
  });
  ctx.fillStyle = 'rgba(56,189,248,0.1)'; ctx.fillRect(0, 450, 512, 62);
  ctx.fillStyle = '#38bdf8'; ctx.font = '18px monospace'; ctx.textAlign = 'center';
  ctx.fillText('System OK  |  09:30:45  |  Free Balance Query', 256, 485);
  return finishTexture(new THREE.CanvasTexture(canvas));
}

// 10. 雜誌架
export function createMagazineRackTexture() {
  const { canvas, ctx } = makeCanvas(512, 512);
  ctx.fillStyle = '#f1f5f9'; ctx.fillRect(0, 0, 512, 512);
  const mags = [
    { title: 'JUMP', sub: 'Weekly Manga', c1: '#dc2626', c2: '#fca5a5' },
    { title: 'VOGUE', sub: 'Fashion', c1: '#9d174d', c2: '#fbcfe8' },
    { title: 'FOOD', sub: 'Gourmet', c1: '#b45309', c2: '#fde68a' },
    { title: 'GAME+', sub: 'Gaming', c1: '#1d4ed8', c2: '#bfdbfe' },
    { title: 'TRAVEL', sub: 'Japan', c1: '#047857', c2: '#a7f3d0' },
    { title: 'TECH', sub: 'AI Special', c1: '#4c1d95', c2: '#ddd6fe' },
    { title: 'SPORTS', sub: 'Sports', c1: '#0369a1', c2: '#bae6fd' },
    { title: 'HEALTH', sub: 'Wellness', c1: '#166534', c2: '#bbf7d0' },
  ];
  const mw = 108, mh = 148, gap = 8, startX = 8;
  mags.slice(0, 4).forEach((m, i) => {
    const mx = startX + i * (mw + gap);
    drawMagazine(ctx, mx, 16, mw, mh, m);
  });
  mags.slice(4, 8).forEach((m, i) => {
    const mx = startX + i * (mw + gap);
    drawMagazine(ctx, mx, 180, mw, mh, m);
  });
  ctx.fillStyle = '#e2e8f0'; ctx.fillRect(0, 340, 512, 172);
  ctx.fillStyle = '#94a3b8'; ctx.font = '14px sans-serif'; ctx.textAlign = 'left';
  ctx.fillText('Latest Issues', 12, 370);
  const spines = ['#dc2626','#9d174d','#b45309','#1d4ed8','#047857','#4c1d95','#0369a1','#166534'];
  spines.forEach((c, i) => {
    ctx.fillStyle = c; ctx.fillRect(12 + i * 60, 382, 50, 120);
    ctx.save(); ctx.fillStyle = '#ffffff'; ctx.font = 'bold 11px sans-serif';
    ctx.translate(12 + i * 60 + 25, 382 + 60); ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center'; ctx.fillText(mags[i].title, 0, 0); ctx.restore();
  });
  return finishTexture(new THREE.CanvasTexture(canvas));
}

function drawMagazine(ctx, x, y, w, h, m) {
  const g = ctx.createLinearGradient(x, y, x, y + h);
  g.addColorStop(0, m.c1); g.addColorStop(1, shadeColor(m.c1, -25));
  ctx.fillStyle = g; roundRect(ctx, x, y, w, h, 3); ctx.fill();
  ctx.fillStyle = m.c2; roundRect(ctx, x, y, w, 28, 3); ctx.fill();
  ctx.fillStyle = '#ffffff'; ctx.font = 'bold 14px sans-serif'; ctx.textAlign = 'center';
  ctx.fillText(m.title, x + w / 2, y + 20);
  ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.font = '10px sans-serif';
  ctx.fillText(m.sub, x + w / 2, y + h - 12);
  ctx.fillStyle = 'rgba(255,255,255,0.15)'; roundRect(ctx, x + 2, y, 12, h, 2); ctx.fill();
}

// 11. 地面裝潢網格
export function createFloorGridTexture() {
  const { canvas, ctx } = makeCanvas(512, 512);
  ctx.clearRect(0, 0, 512, 512);
  const gridSize = 64;
  ctx.strokeStyle = 'rgba(245, 158, 11, 0.5)'; ctx.lineWidth = 1.5;
  for (let i = 0; i <= 512; i += gridSize) {
    ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, 512); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(512, i); ctx.stroke();
  }
  ctx.fillStyle = 'rgba(245, 158, 11, 0.04)';
  for (let x = 0; x < 512; x += gridSize) {
    for (let y = 0; y < 512; y += gridSize) { ctx.fillRect(x + 1, y + 1, gridSize - 2, gridSize - 2); }
  }
  ctx.fillStyle = 'rgba(245, 158, 11, 0.9)';
  for (let x = 0; x <= 512; x += gridSize) {
    for (let y = 0; y <= 512; y += gridSize) {
      ctx.beginPath(); ctx.arc(x, y, 3.5, 0, Math.PI * 2); ctx.fill();
    }
  }
  const tex = finishTexture(new THREE.CanvasTexture(canvas));
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(2, 2);
  return tex;
}

// 12. 冷藏冰櫃正面
export function createFridgeFrontTexture(color) {
  const fridgeColor = color || '#22c55e';
  const { canvas, ctx } = makeCanvas(256, 512);
  const frameGrad = ctx.createLinearGradient(0, 0, 256, 0);
  frameGrad.addColorStop(0, '#c0c8d0'); frameGrad.addColorStop(0.1, '#e8eef4');
  frameGrad.addColorStop(0.9, '#e8eef4'); frameGrad.addColorStop(1, '#c0c8d0');
  ctx.fillStyle = frameGrad; ctx.fillRect(0, 0, 256, 512);
  const glassGrad = ctx.createLinearGradient(0, 0, 256, 512);
  glassGrad.addColorStop(0, 'rgba(180, 220, 255, 0.35)');
  glassGrad.addColorStop(1, 'rgba(120, 180, 230, 0.25)');
  ctx.fillStyle = glassGrad; roundRect(ctx, 14, 14, 228, 484, 4); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.fillRect(18, 14, 20, 484);
  ctx.fillStyle = 'rgba(255,255,255,0.15)'; ctx.fillRect(50, 14, 8, 484);
  const drinkColors = [fridgeColor, shadeColor(fridgeColor, 30), shadeColor(fridgeColor, -20), '#3b82f6', '#f59e0b', '#ec4899'];
  const dw = 42, dh = 120, startY = 24;
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 4; col++) {
      const dx = 24 + col * 54; const dy = startY + row * 155;
      const dc = drinkColors[(row * 4 + col) % drinkColors.length];
      const bg = ctx.createLinearGradient(dx, dy, dx + dw, dy);
      bg.addColorStop(0, shadeColor(dc, -20)); bg.addColorStop(0.4, dc); bg.addColorStop(1, shadeColor(dc, -30));
      ctx.fillStyle = bg; roundRect(ctx, dx, dy + 10, dw, dh - 20, 6); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      roundRect(ctx, dx + 4, dy + dh * 0.35, dw - 8, dh * 0.28, 3); ctx.fill();
      ctx.fillStyle = '#f1f5f9'; roundRect(ctx, dx + 6, dy + 6, dw - 12, 14, 3); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(dx + 3, dy + 10, 7, dh - 20);
    }
  }
  ctx.fillStyle = fridgeColor; roundRect(ctx, 14, 480, 228, 20, 0); ctx.fill();
  ctx.fillStyle = '#ffffff'; ctx.font = 'bold 13px sans-serif'; ctx.textAlign = 'center';
  ctx.fillText('COLD DRINKS', 127, 495);
  return finishTexture(new THREE.CanvasTexture(canvas));
}

// 13. 促銷海報
export function createPromoPosterTexture(type) {
  const posterType = type || 'sale';
  const { canvas, ctx } = makeCanvas(512, 768);
  const schemes = {
    sale: { bg: '#dc2626', accent: '#fde047', title: 'SPECIAL SALE', sub: 'Limited Time Offer' },
    new: { bg: '#0284c7', accent: '#bae6fd', title: 'NEW ARRIVAL', sub: 'Just In Stock' },
    combo: { bg: '#16a34a', accent: '#dcfce7', title: 'COMBO DEAL', sub: 'Buy 2 Get 1 Free' },
    limited: { bg: '#7c3aed', accent: '#ede9fe', title: 'LIMITED', sub: 'Exclusive Item' },
  };
  const s = schemes[posterType] || schemes.sale;
  const bg = ctx.createLinearGradient(0, 0, 0, 768);
  bg.addColorStop(0, s.bg); bg.addColorStop(1, shadeColor(s.bg, -30));
  ctx.fillStyle = bg; ctx.fillRect(0, 0, 512, 768);
  ctx.save(); ctx.globalAlpha = 0.15; ctx.fillStyle = '#ffffff';
  for (let i = -10; i < 15; i++) { ctx.fillRect(i * 60 - 200, 0, 28, 1000); }
  ctx.restore();
  ctx.fillStyle = 'rgba(255,255,255,0.1)';
  ctx.beginPath(); ctx.arc(50, 50, 90, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(462, 720, 110, 0, Math.PI * 2); ctx.fill();
  ctx.shadowColor = 'rgba(0,0,0,0.4)'; ctx.shadowBlur = 20;
  ctx.fillStyle = s.accent; ctx.font = 'bold 80px sans-serif'; ctx.textAlign = 'center';
  ctx.fillText(s.title, 256, 320); ctx.shadowBlur = 0;
  ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.font = 'bold 40px sans-serif';
  ctx.fillText(s.sub, 256, 400);
  ctx.fillStyle = 'rgba(255,255,255,0.95)';
  roundRect(ctx, 40, 440, 432, 200, 16); ctx.fill();
  ctx.fillStyle = s.bg; ctx.font = 'bold 38px sans-serif'; ctx.fillText('Buy 2 Get 1 FREE!', 256, 510);
  ctx.fillStyle = '#374151'; ctx.font = '26px sans-serif'; ctx.fillText('Selected items only', 256, 560);
  ctx.font = 'bold 22px sans-serif'; ctx.fillStyle = '#6b7280'; ctx.fillText('Valid until end of month', 256, 610);
  ctx.fillStyle = s.accent; ctx.font = 'bold 28px sans-serif';
  ctx.fillText('GAMANIA MART Exclusive', 256, 700);
  return finishTexture(new THREE.CanvasTexture(canvas));
}
