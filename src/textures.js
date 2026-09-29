// 紋理生成器：打造溫馨日系可愛風格 (Cozy Diorama Style) 的材質貼圖
import * as THREE from 'three';

// 1. 生成如參考圖的溫暖雙色棋盤格木質地磚紋理 (Warm Checkerboard Parquet Floor)
export function createCozyFloorTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  // 雙色棋盤格：溫暖淺木色與焦糖木色
  const tileSize = 64;
  const colorA = '#edd5b3'; // 溫暖米黃木色
  const colorB = '#dfbe96'; // 焦糖淺木色

  for (let x = 0; x < 512; x += tileSize) {
    for (let y = 0; y < 512; y += tileSize) {
      const isEven = (x / tileSize + y / tileSize) % 2 === 0;
      ctx.fillStyle = isEven ? colorA : colorB;
      ctx.fillRect(x, y, tileSize, tileSize);

      // 細緻的內陰影與木紋微光感
      ctx.fillStyle = isEven ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.04)';
      ctx.fillRect(x + 2, y + 2, tileSize - 4, tileSize - 4);
    }
  }

  // 柔和的接縫線條
  ctx.strokeStyle = '#cda97e';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 512; i += tileSize) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, 512);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(512, i);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(4, 4);
  return texture;
}

// 2. 室外淡雅人行道石磚紋理
export function createCozySidewalkTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#e8eee6'; // 淡粉青灰石板
  ctx.fillRect(0, 0, 256, 256);

  ctx.strokeStyle = '#d0d8ce';
  ctx.lineWidth = 2;
  const size = 64;
  for (let x = 0; x <= 256; x += size) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 256); ctx.stroke();
  }
  for (let y = 0; y <= 256; y += size) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(256, y); ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(8, 8);
  return texture;
}

// 3. 牆面質感貼圖 (清爽薄荷綠 + 米白踢腳線)
export function createCozyWallTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#faf8f5'; // 溫馨米白
  ctx.fillRect(0, 0, 256, 256);

  // 頂部淺薄荷綠裝飾帶 (如參考圖)
  ctx.fillStyle = '#4e826b';
  ctx.fillRect(0, 0, 256, 36);

  // 木質踢腳線
  ctx.fillStyle = '#a67b51';
  ctx.fillRect(0, 230, 256, 26);

  return new THREE.CanvasTexture(canvas);
}

// 4. 花槽與植栽小花紋理 (如參考圖周圍圍欄上的綠植與白小花)
export function createFlowerHedgeTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');

  // 翠綠色樹叢底色
  ctx.fillStyle = '#65a30d';
  ctx.fillRect(0, 0, 128, 128);

  // 散落的可愛小圓白花與淡黃花心
  const flowers = [
    { x: 20, y: 30 }, { x: 75, y: 25 }, { x: 110, y: 60 },
    { x: 40, y: 80 }, { x: 85, y: 100 }, { x: 15, y: 110 }
  ];

  flowers.forEach(f => {
    // 花瓣白色
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(f.x, f.y, 8, 0, Math.PI * 2);
    ctx.fill();

    // 花心黃色
    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.arc(f.x, f.y, 4, 0, Math.PI * 2);
    ctx.fill();
  });

  return new THREE.CanvasTexture(canvas);
}

// 5. 瓦楞進貨紙箱貼圖 (可愛圓角標籤)
export function createBoxTexture(itemName, count) {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#d4a373'; // 溫暖紙箱牛皮紙色
  ctx.fillRect(0, 0, 256, 256);

  // 白色圓角標籤貼紙
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.roundRect ? ctx.roundRect(24, 24, 208, 110, 12) : ctx.fillRect(24, 24, 208, 110);
  ctx.fill();

  ctx.fillStyle = '#2b2d42';
  ctx.font = 'bold 20px "Noto Sans TC", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(itemName || '超商進貨箱', 128, 65);

  ctx.fillStyle = '#e76f51';
  ctx.font = 'bold 16px sans-serif';
  ctx.fillText(`數量：${count || 12} 入`, 128, 105);

  // 膠帶
  ctx.fillStyle = '#b08968';
  ctx.fillRect(0, 128, 256, 18);

  return new THREE.CanvasTexture(canvas);
}

// 6. 經典橘子超商大門霓虹招牌貼圖 (Gamania Mart 24H Neon Sign)
export function createStoreSignTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');

  // 底色：深墨綠搭配亮橘色雙色飾條
  ctx.fillStyle = '#1e3a2f';
  ctx.fillRect(0, 0, 512, 128);

  // 頂部與底部橘色邊條
  ctx.fillStyle = '#f97316';
  ctx.fillRect(0, 0, 512, 12);
  ctx.fillRect(0, 116, 512, 12);

  // 白色邊框
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 4;
  ctx.strokeRect(8, 16, 496, 96);

  // 招牌大字
  ctx.fillStyle = '#ffffff';
  ctx.font = '900 44px "Noto Sans TC", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('🍊 橘子便利商店', 256, 52);

  // 英文副標與 24H 徽章
  ctx.font = '800 20px "Outfit", sans-serif';
  ctx.fillStyle = '#fde047';
  ctx.fillText('GAMANIA MART • 24 HOURS OPEN', 256, 88);

  const texture = new THREE.CanvasTexture(canvas);
  return texture;
}

// 7. 門口迎賓紅色地墊貼圖 (Welcome Mat)
export function createWelcomeMatTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');

  // 深酒紅底
  ctx.fillStyle = '#991b1b';
  ctx.fillRect(0, 0, 256, 128);

  // 金色花紋邊框
  ctx.strokeStyle = '#fef08a';
  ctx.lineWidth = 6;
  ctx.strokeRect(6, 6, 244, 116);

  // 迎賓文字
  ctx.fillStyle = '#fef08a';
  ctx.font = 'bold 24px "Noto Sans TC", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('🍊 歡 迎 光 臨 🍊', 128, 54);

  ctx.font = 'bold 16px "Outfit", sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.fillText('WELCOME TO GAMANIA MART', 128, 88);

  return new THREE.CanvasTexture(canvas);
}

// 8. 室外日系自動販賣機面板貼圖 (Vending Machine Texture)
export function createVendingMachineTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  // 機身米白色
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(0, 0, 256, 512);

  // 頂部招牌
  ctx.fillStyle = '#0284c7';
  ctx.fillRect(10, 10, 236, 50);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 24px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('COLD DRINKS ❄️', 128, 44);

  // 玻璃展示窗格 (展示飲料瓶罐)
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(14, 70, 228, 240);

  // 繪製兩排飲料罐展示
  const canColors = ['#ef4444', '#10b981', '#f59e0b', '#3b82f6', '#8b5cf6', '#ec4899'];
  for (let row = 0; row < 2; row++) {
    const y = 85 + row * 110;
    for (let col = 0; col < 3; col++) {
      const x = 32 + col * 72;
      const c = canColors[row * 3 + col];
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.roundRect ? ctx.roundRect(x, y, 48, 70, 8) : ctx.fillRect(x, y, 48, 70);
      ctx.fill();
      // 小按鈕 (亮藍燈)
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.roundRect ? ctx.roundRect(x + 8, y + 78, 32, 16, 4) : ctx.fillRect(x + 8, y + 78, 32, 16);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 10px sans-serif';
      ctx.fillText('NT$25', x + 24, y + 90);
    }
  }

  // 投幣口與退幣口
  ctx.fillStyle = '#334155';
  ctx.fillRect(30, 330, 80, 24);
  ctx.fillStyle = '#94a3b8';
  ctx.fillText('投幣孔 🪙', 70, 346);

  // 取物出貨口 (黑色翻板)
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(20, 380, 216, 90);
  ctx.fillStyle = '#64748b';
  ctx.font = 'bold 16px sans-serif';
  ctx.fillText('↓ PUSH 取飲料 ↓', 128, 430);

  return new THREE.CanvasTexture(canvas);
}

// 9. ATM 自動櫃員機面板貼圖
export function createAtmScreenTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#0f766e'; // 墨綠銀行科技感
  ctx.fillRect(0, 0, 256, 256);

  ctx.fillStyle = '#fef08a';
  ctx.font = 'bold 22px "Noto Sans TC", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('🍊 橘子便利銀行 ATM', 128, 45);

  ctx.fillStyle = '#ffffff';
  ctx.font = '16px sans-serif';
  ctx.fillText('請插入金融卡或掃描行動支付', 128, 90);

  // 按鈕選單
  const buttons = ['提款', '存款', '轉帳', '查詢'];
  buttons.forEach((txt, idx) => {
    const by = 130 + Math.floor(idx / 2) * 50;
    const bx = (idx % 2 === 0) ? 20 : 138;
    ctx.fillStyle = '#115e59';
    ctx.fillRect(bx, by, 98, 36);
    ctx.strokeStyle = '#5eead4';
    ctx.lineWidth = 2;
    ctx.strokeRect(bx, by, 98, 36);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText(txt, bx + 49, by + 24);
  });

  return new THREE.CanvasTexture(canvas);
}

// 10. 書報雜誌架貼圖 (Magazine Rack Covers)
export function createMagazineRackTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#f1f5f9';
  ctx.fillRect(0, 0, 256, 256);

  // 繪製多本雜誌排排站 (少年Jump、潮流週刊、美食誌)
  const mags = [
    { title: 'JUMP', color: '#dc2626', sub: '週刊漫畫' },
    { title: 'FASHION', color: '#db2777', sub: '日系穿搭' },
    { title: 'FOOD', color: '#d97706', sub: '超商美食' },
    { title: 'GAME', color: '#2563eb', sub: '電玩誌' }
  ];

  mags.forEach((m, i) => {
    const x = 12 + i * 60;
    ctx.fillStyle = m.color;
    ctx.fillRect(x, 15, 52, 90);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(m.title, x + 26, 45);
    ctx.font = '9px sans-serif';
    ctx.fillText(m.sub, x + 26, 75);

    // 下層雜誌
    ctx.fillStyle = m.color;
    ctx.fillRect(x, 130, 52, 90);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText(m.title, x + 26, 160);
  });

  return new THREE.CanvasTexture(canvas);
}

// 11. 裝潢佈置模式地面網格貼圖 (Floor Grid for Decor Mode)
export function createFloorGridTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  ctx.clearRect(0, 0, 512, 512);

  // 溫暖金色發光半透明網格
  const gridSize = 64;
  ctx.strokeStyle = 'rgba(245, 158, 11, 0.45)';
  ctx.lineWidth = 2;

  for (let i = 0; i <= 512; i += gridSize) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, 512);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(512, i);
    ctx.stroke();
  }

  // 網格交叉點光點
  ctx.fillStyle = 'rgba(245, 158, 11, 0.8)';
  for (let x = 0; x <= 512; x += gridSize) {
    for (let y = 0; y <= 512; y += gridSize) {
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2, 2);
  return texture;
}

