// 3D 溫馨微縮模型風格便利商店世界 (Cozy Diorama Store 3D)
import * as THREE from 'three';
import { 
  createCozyFloorTexture, 
  createCozySidewalkTexture, 
  createCozyWallTexture, 
  createFlowerHedgeTexture,
  createBoxTexture,
  createStoreSignTexture,
  createWelcomeMatTexture,
  createVendingMachineTexture,
  createAtmScreenTexture,
  createMagazineRackTexture,
  createFloorGridTexture
} from './textures.js';
import { ITEM_DEFINITIONS } from './items.js';
import { NavGrid } from './nav.js';

export class Store3D {
  constructor(scene) {
    this.scene = scene;

    // 走道導航與 A* 尋路系統 (防止人物穿過貨架與擺設)
    this.navGrid = new NavGrid();
    this.onLayoutChanged = null;

    // 貨架資料與網格清單 (支援滑鼠點擊互動與自由調整擺設)
    this.shelves = {};
    this.interactiveShelves = [];

    // 裝飾擺設資料與網格清單 (盆栽、ATM、招財貓、雜誌架、扭蛋機、自動販賣機)
    this.decorations = {};
    this.interactiveDecors = [];

    // 自由裝潢佈置模式狀態
    this.isDecorMode = false;
    this.selectedObject = null; // { type: 'shelf'|'decor', id: string, target: any }

    // 貨架主題色彩配置
    this.shelfThemes = {
      wood: '#d4a373',   // 經典原木
      white: '#f8fafc',  // 極簡純白
      mint: '#34d399',   // 清爽薄荷
      orange: '#fb923c', // 活力招牌橘
      dark: '#334155'    // 沉穩曜黑
    };

    // 進貨紙箱清單
    this.boxes = [];

    // 內用桌椅清單 (顧客可坐下享用美食)
    this.tables = [];

    // 收銀結帳點位置 (櫃檯前方走道)
    this.checkoutPos = new THREE.Vector3(-0.3, 0, -3.2);

    this.initCozyStore();
  }

  initCozyStore() {
    this.buildDioramaRoom();
    this.buildLighting();
    this.buildCeiling();
    this.buildAutoDoor();
    this.buildStoreSign();
    this.buildWelcomeMat();
    this.buildServiceCounter();
    this.buildConvenienceShelves();
    this.buildDiningTables();
    this.buildPottedPlants();
    this.buildAtmKiosk();
    this.buildMagazineRack();
    this.buildGashaponMachine();
    this.buildLuckyCat();
    this.buildCounterAppliances();
    this.buildCeilingBanners();
    this.buildExteriorDecor();
    this.buildStreetLamp();
    this.buildOutdoorVendingMachine();
    this.buildRecycleStation();
    this.buildDeliveryTruck();
    this.buildFloorGrid();
    this.buildSelectionMarker();
    this.buildGhostPreviewSystem();

    // 建立初始走道導航網格
    this.updateNavGrid();
  }

  // 1. 打造如參考圖的溫馨微縮盒景 (Diorama Cutaway Room)
  buildDioramaRoom() {
    // 溫暖雙色棋盤格地磚 (14 x 14)
    const floorGeo = new THREE.PlaneGeometry(14, 14);
    const floorMat = new THREE.MeshStandardMaterial({
      map: createCozyFloorTexture(),
      roughness: 0.35,
      metalness: 0.05
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this.scene.add(floor);

    // 後左牆 (Back-Left Wall, X = -7)
    const wallGeo = new THREE.BoxGeometry(0.35, 4.0, 14);
    const wallMat = new THREE.MeshStandardMaterial({
      map: createCozyWallTexture(),
      roughness: 0.6
    });
    const leftWall = new THREE.Mesh(wallGeo, wallMat);
    leftWall.position.set(-7, 2.0, 0);
    leftWall.receiveShadow = true;
    this.scene.add(leftWall);

    // 後右牆 (Back-Right Wall, Z = -7)
    const backWallGeo = new THREE.BoxGeometry(14, 4.0, 0.35);
    const backWall = new THREE.Mesh(backWallGeo, wallMat);
    backWall.position.set(0, 2.0, -7);
    backWall.receiveShadow = true;
    this.scene.add(backWall);

    // 牆面日系大玻璃窗格 (左牆窗戶)
    this.createWindowFrame(-6.8, 2.3, -2.5, 0.1, 1.8, 3.2, 0);
    // 後牆窗戶
    this.createWindowFrame(2.5, 2.3, -6.8, 3.2, 1.8, 0.1, 0);

    // 頂部與圍籬上的綠植花槽花箱 (如參考圖綠葉帶白小花的花槽)
    this.createPlanterHedge(-7, 4.0, 0, 0.5, 0.35, 14.2);
    this.createPlanterHedge(0, 4.0, -7, 14.2, 0.35, 0.5);

    // 前側與右側低矮花槽圍欄 (讓玩家能完全無死角欣賞超商內部)
    this.createLowFlowerCurb(0, 0.3, 7, 14.2, 0.6, 0.45);
    this.createLowFlowerCurb(7, 0.3, 1.5, 0.45, 0.6, 11.2);

    // 寬敞室外人行道地磚 (米白色淡雅石磚)
    const sidewalkGeo = new THREE.PlaneGeometry(30, 30);
    const sidewalkMat = new THREE.MeshStandardMaterial({
      map: createCozySidewalkTexture(),
      roughness: 0.8
    });
    const sidewalk = new THREE.Mesh(sidewalkGeo, sidewalkMat);
    sidewalk.rotation.x = -Math.PI / 2;
    sidewalk.position.set(0, -0.05, 0);
    sidewalk.receiveShadow = true;
    this.scene.add(sidewalk);
  }

  // 建造窗框
  createWindowFrame(x, y, z, w, h, d, rotY) {
    const frameMat = new THREE.MeshStandardMaterial({ color: '#57836d', roughness: 0.4 });
    const frame = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), frameMat);
    frame.position.set(x, y, z);
    frame.rotation.y = rotY;
    this.scene.add(frame);

    // 玻璃透光
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: '#dbeafe',
      transparent: true,
      opacity: 0.4,
      roughness: 0.1,
      transmission: 0.8
    });
    const innerW = w > 0.2 ? w - 0.2 : 0.05;
    const innerD = d > 0.2 ? d - 0.2 : 0.05;
    const glass = new THREE.Mesh(new THREE.BoxGeometry(innerW, h - 0.2, innerD), glassMat);
    glass.position.set(x, y, z);
    this.scene.add(glass);
  }

  // 頂部花槽
  createPlanterHedge(x, y, z, w, h, d) {
    const hedgeMat = new THREE.MeshStandardMaterial({
      map: createFlowerHedgeTexture(),
      roughness: 0.8
    });
    const hedge = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), hedgeMat);
    hedge.position.set(x, y, z);
    this.scene.add(hedge);
  }

  // 前側低矮花槽圍欄
  createLowFlowerCurb(x, y, z, w, h, d) {
    const curbGroup = new THREE.Group();
    curbGroup.position.set(x, y, z);

    // 木質基座底盒
    const woodMat = new THREE.MeshStandardMaterial({ color: '#8c5932', roughness: 0.6 });
    const woodBase = new THREE.Mesh(new THREE.BoxGeometry(w, 0.3, d), woodMat);
    woodBase.position.y = -0.15;
    curbGroup.add(woodBase);

    // 上層圓潤花叢
    const flowerMat = new THREE.MeshStandardMaterial({
      map: createFlowerHedgeTexture(),
      roughness: 0.7
    });
    const flowerTop = new THREE.Mesh(new THREE.BoxGeometry(w, 0.3, d), flowerMat);
    flowerTop.position.y = 0.15;
    curbGroup.add(flowerTop);

    this.scene.add(curbGroup);
  }

  // 2. 溫暖柔和的日系光照 (Cozy Warm Lighting)
  buildLighting() {
    // 柔和溫暖環境光
    const ambient = new THREE.AmbientLight(0xfff7ed, 0.95);
    this.scene.add(ambient);

    // 主方向太陽光 (傾斜斜射出柔和微縮模型陰影)
    const sun = new THREE.DirectionalLight(0xffeed9, 1.35);
    sun.position.set(16, 24, 14);
    sun.castShadow = true;
    sun.shadow.mapSize.width = 2048;
    sun.shadow.mapSize.height = 2048;
    sun.shadow.camera.near = 1;
    sun.shadow.camera.far = 60;
    sun.shadow.camera.left = -16;
    sun.shadow.camera.right = 16;
    sun.shadow.camera.top = 16;
    sun.shadow.camera.bottom = -16;
    sun.shadow.bias = -0.0005;
    this.scene.add(sun);
    this.sunLight = sun;

    // 補光
    const fillLight = new THREE.DirectionalLight(0xdbeafe, 0.4);
    fillLight.position.set(-15, 15, -15);
    this.scene.add(fillLight);
  }

  // 3. 服務櫃檯、咖啡熱食台與可愛店員 (Service Counter & Friendly Clerk)
  buildServiceCounter() {
    const counterGroup = new THREE.Group();
    // 位於後牆中央 (X = 0, Z = -4.2)
    counterGroup.position.set(0.5, 0, -4.6);

    // 櫃檯本體 (米白色底座 + 溫暖原木檯面，如參考圖)
    const baseGeo = new THREE.BoxGeometry(4.2, 1.05, 1.3);
    const baseMat = new THREE.MeshStandardMaterial({ color: '#fbfaf8', roughness: 0.3 });
    const counterBase = new THREE.Mesh(baseGeo, baseMat);
    counterBase.position.y = 0.525;
    counterBase.receiveShadow = true;
    counterBase.castShadow = true;
    counterGroup.add(counterBase);

    // 原木邊條與檯面
    const topGeo = new THREE.BoxGeometry(4.35, 0.08, 1.45);
    const topMat = new THREE.MeshStandardMaterial({ color: '#c79c6e', roughness: 0.4 });
    const counterTop = new THREE.Mesh(topGeo, topMat);
    counterTop.position.y = 1.07;
    counterGroup.add(counterTop);

    // POS 機台與螢幕 (朝向店長/櫃檯)
    const posMat = new THREE.MeshStandardMaterial({ color: '#334155' });
    const posScreen = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.28, 0.05), new THREE.MeshStandardMaterial({ color: '#38bdf8', emissive: '#0284c7', emissiveIntensity: 0.3 }));
    posScreen.position.set(-0.8, 1.32, 0.1);
    posScreen.rotation.x = -Math.PI / 8;
    counterGroup.add(posScreen);

    // 復古薄荷綠義式咖啡機 (如參考圖薄荷綠精品咖啡機台)
    const coffeeGroup = new THREE.Group();
    coffeeGroup.position.set(1.1, 1.11, 0);

    const machineBase = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.7, 0.75), new THREE.MeshStandardMaterial({ color: '#528373', roughness: 0.4 }));
    machineBase.position.y = 0.35;
    coffeeGroup.add(machineBase);

    // 金屬出杯頭與熱水噴嘴
    const metalMat = new THREE.MeshStandardMaterial({ color: '#e2e8f0', metalness: 0.85, roughness: 0.2 });
    const nozzle = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.15, 8), metalMat);
    nozzle.position.set(0, 0.25, 0.4);
    coffeeGroup.add(nozzle);

    // 咖啡杯 (白色陶瓷外帶杯)
    const cupGeo = new THREE.CylinderGeometry(0.06, 0.045, 0.12, 12);
    const cupMat = new THREE.MeshStandardMaterial({ color: '#ffffff' });
    const cup = new THREE.Mesh(cupGeo, cupMat);
    cup.position.set(0, 0.06, 0.4);
    coffeeGroup.add(cup);

    // 咖啡豆磨豆機
    const grinder = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.5, 12), new THREE.MeshStandardMaterial({ color: '#334155' }));
    grinder.position.set(0.85, 0.25, 0);
    coffeeGroup.add(grinder);

    counterGroup.add(coffeeGroup);

    // 後牆黑板掛牌 (如參考圖綠底黑板 "7-JOY COFFEE & CONVENIENCE")
    const boardGeo = new THREE.BoxGeometry(3.6, 1.1, 0.05);
    const bCanvas = document.createElement('canvas');
    bCanvas.width = 512; bCanvas.height = 160;
    const bCtx = bCanvas.getContext('2d');
    bCtx.fillStyle = '#2d4a3e'; // 深綠黑板
    bCtx.fillRect(0, 0, 512, 160);
    bCtx.strokeStyle = '#c79c6e'; bCtx.lineWidth = 10;
    bCtx.strokeRect(5, 5, 502, 150);
    bCtx.fillStyle = '#f8fafc';
    bCtx.font = 'bold 36px "Outfit", "Noto Sans TC", sans-serif';
    bCtx.textAlign = 'center';
    bCtx.fillText('7-JOY COZY STORE', 256, 70);
    bCtx.fillStyle = '#fde047';
    bCtx.font = '22px sans-serif';
    bCtx.fillText('FRESH FOOD & SPECIALTY COFFEE', 256, 115);
    const boardMat = new THREE.MeshStandardMaterial({ map: new THREE.CanvasTexture(bCanvas), roughness: 0.8 });
    const board = new THREE.Mesh(boardGeo, boardMat);
    board.position.set(0.6, 2.7, -6.8);
    this.scene.add(board);

    // 可愛店員模型 (站立於收銀機與咖啡機後方，穿著溫馨圍裙)
    this.buildCuteClerk(counterGroup);

    this.scene.add(counterGroup);

    // 結帳顧客排隊與櫃檯位置
    this.checkoutPos = new THREE.Vector3(-0.3, 0, -3.2);
  }

  // 打造精緻 Q 版親切店員小助手 (Detailed Chibi Clerk)
  buildCuteClerk(counterGroup) {
    const clerk = new THREE.Group();
    clerk.position.set(-0.1, 0, -0.9);

    const skinMat = new THREE.MeshStandardMaterial({ color: '#fddcb5', roughness: 0.75 });
    const apronMat = new THREE.MeshStandardMaterial({ color: '#f97316', roughness: 0.5 });
    const shirtMat = new THREE.MeshStandardMaterial({ color: '#fef08a', roughness: 0.5 });
    const hairMat = new THREE.MeshStandardMaterial({ color: '#78350f', roughness: 0.65 });

    // 身體群組 (用於呼吸微動)
    const bodyGrp = new THREE.Group();

    // 上身 (鵝黃色 T 恤)
    const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 0.50, 12), shirtMat);
    torso.position.y = 0.78;
    torso.castShadow = true;
    bodyGrp.add(torso);

    // 圍裙 (橘色，經典橘子超商風)
    const apron = new THREE.Mesh(new THREE.BoxGeometry(0.40, 0.38, 0.06), apronMat);
    apron.position.set(0, 0.72, 0.12);
    bodyGrp.add(apron);

    // 圍裙口袋
    const pocketMat = new THREE.MeshStandardMaterial({ color: '#ea580c' });
    const pocket = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.10, 0.02), pocketMat);
    pocket.position.set(0, 0.62, 0.155);
    bodyGrp.add(pocket);

    // 名牌 (白底寫「店長」)
    const tagCanvas = document.createElement('canvas');
    tagCanvas.width = 64; tagCanvas.height = 32;
    const tCtx = tagCanvas.getContext('2d');
    tCtx.fillStyle = '#ffffff';
    tCtx.fillRect(0, 0, 64, 32);
    tCtx.strokeStyle = '#f97316'; tCtx.lineWidth = 3;
    tCtx.strokeRect(1, 1, 62, 30);
    tCtx.fillStyle = '#1e293b';
    tCtx.font = 'bold 16px sans-serif';
    tCtx.textAlign = 'center';
    tCtx.fillText('店長', 32, 22);
    const tagSprite = new THREE.Sprite(
      new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(tagCanvas), transparent: true })
    );
    tagSprite.position.set(0.12, 0.90, 0.17);
    tagSprite.scale.set(0.22, 0.11, 1);
    bodyGrp.add(tagSprite);

    // 衣領 (白色圓領)
    const collarMat = new THREE.MeshStandardMaterial({ color: '#fafaf9' });
    const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.18, 0.05, 12), collarMat);
    collar.position.y = 1.02;
    bodyGrp.add(collar);

    // 下半身褲裙
    const skirtMat = new THREE.MeshStandardMaterial({ color: '#1e293b', roughness: 0.6 });
    const skirt = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.16, 0.32, 12), skirtMat);
    skirt.position.y = 0.46;
    bodyGrp.add(skirt);

    // 小腿和鞋子
    const shoeMat = new THREE.MeshStandardMaterial({ color: '#451a03', roughness: 0.4 });
    [-0.07, 0.07].forEach(sx => {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.04, 0.18, 8), skinMat);
      leg.position.set(sx, 0.24, 0);
      bodyGrp.add(leg);
      const shoe = new THREE.Mesh(new THREE.SphereGeometry(0.055, 8, 6), shoeMat);
      shoe.position.set(sx, 0.12, 0.02);
      shoe.scale.set(1, 0.6, 1.3);
      bodyGrp.add(shoe);
    });

    // 手臂 (舉起招呼動作)
    const armGeo = new THREE.CylinderGeometry(0.04, 0.035, 0.28, 8);
    const leftArm = new THREE.Mesh(armGeo, shirtMat);
    leftArm.position.set(-0.24, 0.80, 0);
    leftArm.rotation.z = 0.3;
    bodyGrp.add(leftArm);
    // 右手微舉打招呼
    const rightArm = new THREE.Mesh(armGeo, shirtMat);
    rightArm.position.set(0.24, 0.88, 0.05);
    rightArm.rotation.z = -0.8;
    rightArm.rotation.x = -0.3;
    bodyGrp.add(rightArm);

    // 手掌
    const handGeo = new THREE.SphereGeometry(0.038, 8, 8);
    const leftHand = new THREE.Mesh(handGeo, skinMat);
    leftHand.position.set(-0.28, 0.65, 0);
    bodyGrp.add(leftHand);
    const rightHand = new THREE.Mesh(handGeo, skinMat);
    rightHand.position.set(0.35, 1.02, 0.08);
    bodyGrp.add(rightHand);

    clerk.add(bodyGrp);

    // ---- 頭部 ----
    const headGrp = new THREE.Group();
    headGrp.position.y = 1.22;

    // 大圓頭
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.28, 20, 16), skinMat);
    head.castShadow = true;
    headGrp.add(head);

    // 臉頰紅暈
    const blushMat = new THREE.MeshBasicMaterial({ color: '#fda4af', transparent: true, opacity: 0.4 });
    [-0.16, 0.16].forEach(bx => {
      const blush = new THREE.Mesh(new THREE.SphereGeometry(0.055, 8, 8), blushMat);
      blush.position.set(bx, -0.04, 0.20);
      blush.scale.set(1.2, 0.65, 0.3);
      headGrp.add(blush);
    });

    // 閃亮大眼
    const eyeWhiteMat = new THREE.MeshBasicMaterial({ color: '#ffffff' });
    const eyePupilMat = new THREE.MeshBasicMaterial({ color: '#1e293b' });
    [-0.085, 0.085].forEach(ex => {
      const eyeW = new THREE.Mesh(new THREE.SphereGeometry(0.052, 10, 10), eyeWhiteMat);
      eyeW.position.set(ex, 0.02, 0.24);
      eyeW.scale.set(0.8, 1, 0.4);
      headGrp.add(eyeW);
      const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.038, 10, 10), eyePupilMat);
      pupil.position.set(ex, 0.015, 0.26);
      pupil.scale.set(0.7, 0.85, 0.3);
      headGrp.add(pupil);
      const hl = new THREE.Mesh(new THREE.SphereGeometry(0.013, 6, 6), eyeWhiteMat);
      hl.position.set(ex + 0.018, 0.035, 0.28);
      headGrp.add(hl);
    });

    // 微笑
    const smileCanvas = document.createElement('canvas');
    smileCanvas.width = 64; smileCanvas.height = 64;
    const sCtx = smileCanvas.getContext('2d');
    sCtx.strokeStyle = '#94340a';
    sCtx.lineWidth = 3;
    sCtx.lineCap = 'round';
    sCtx.beginPath();
    sCtx.arc(32, 22, 11, 0.15, Math.PI - 0.15);
    sCtx.stroke();
    const smileSpr = new THREE.Sprite(
      new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(smileCanvas), transparent: true })
    );
    smileSpr.position.set(0, -0.07, 0.28);
    smileSpr.scale.set(0.14, 0.14, 1);
    headGrp.add(smileSpr);

    // 雙馬尾髮型
    const frontHair = new THREE.Mesh(
      new THREE.SphereGeometry(0.295, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.55),
      hairMat
    );
    frontHair.position.set(0, 0.05, -0.01);
    headGrp.add(frontHair);
    // 左馬尾
    const tailL = new THREE.Mesh(new THREE.SphereGeometry(0.10, 10, 10), hairMat);
    tailL.position.set(-0.25, -0.04, -0.15);
    tailL.scale.set(0.7, 1.3, 0.7);
    headGrp.add(tailL);
    // 右馬尾
    const tailR = new THREE.Mesh(new THREE.SphereGeometry(0.10, 10, 10), hairMat);
    tailR.position.set(0.25, -0.04, -0.15);
    tailR.scale.set(0.7, 1.3, 0.7);
    headGrp.add(tailR);
    // 橘色髮圈
    const bandMat = new THREE.MeshStandardMaterial({ color: '#f97316' });
    [-0.22, 0.22].forEach(bx => {
      const band = new THREE.Mesh(new THREE.TorusGeometry(0.045, 0.012, 8, 12), bandMat);
      band.position.set(bx, 0.06, -0.15);
      band.rotation.x = Math.PI / 2;
      headGrp.add(band);
    });

    // 耳朵
    [-0.26, 0.26].forEach(ex => {
      const ear = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 8), skinMat);
      ear.position.set(ex, 0, 0);
      ear.scale.set(0.5, 0.8, 0.7);
      headGrp.add(ear);
    });

    clerk.add(headGrp);

    counterGroup.add(clerk);
    this.clerk = clerk;
    this.clerkBodyGroup = bodyGrp;
    this.clerkHeadGroup = headGrp;
  }

  // 4. 便利商店食品貨架與冷藏冰櫃 (支持滑鼠點擊互動)
  buildConvenienceShelves() {
    // 貨架 A: 飲料冷藏庫 (靠左牆 X = -5.8, Z = 1.0)
    this.createCozyShelf({
      id: 'fridge_shelf_1',
      name: '日式極品綠茶冷藏櫃',
      itemId: 'green_tea',
      category: '飲料冷藏',
      capacity: 16,
      currentCount: 10,
      pos: new THREE.Vector3(-5.8, 0, 1.2),
      rotY: Math.PI / 2,
      w: 1.0, h: 2.2, d: 2.8,
      color: '#34d399',
      approachPos: new THREE.Vector3(-4.4, 0, 1.2)
    });

    // 貨架 B: 醇黑咖啡冷藏櫃 (靠左牆 X = -5.8, Z = -1.8)
    this.createCozyShelf({
      id: 'fridge_shelf_2',
      name: '醇黑濃縮咖啡冷藏櫃',
      itemId: 'canned_coffee',
      category: '飲料冷藏',
      capacity: 16,
      currentCount: 10,
      pos: new THREE.Vector3(-5.8, 0, -1.8),
      rotY: Math.PI / 2,
      w: 1.0, h: 2.2, d: 2.6,
      color: '#a855f7',
      approachPos: new THREE.Vector3(-4.4, 0, -1.8)
    });

    // 貨架 C: 鮮食飯糰與甜點展示台 (靠右側走道 X = 4.8, Z = -1.0)
    this.createCozyShelf({
      id: 'fresh_shelf_1',
      name: '經典御飯糰鮮食櫃',
      itemId: 'onigiri',
      category: '鮮食專區',
      capacity: 12,
      currentCount: 8,
      pos: new THREE.Vector3(4.8, 0, -1.2),
      rotY: -Math.PI / 2,
      w: 0.9, h: 1.4, d: 2.4,
      color: '#f97316',
      approachPos: new THREE.Vector3(3.5, 0, -1.2)
    });

    // 貨架 D: 洋芋片與零食泡麵雙面島型貨架 (右前側 X = 4.8, Z = 2.2)
    this.createCozyShelf({
      id: 'snack_shelf_1',
      name: '經典洋芋片休閒零食架',
      itemId: 'chips',
      category: '休閒零食',
      capacity: 10,
      currentCount: 6,
      pos: new THREE.Vector3(4.8, 0, 2.2),
      rotY: -Math.PI / 2,
      w: 0.9, h: 1.6, d: 2.6,
      color: '#fbbf24',
      approachPos: new THREE.Vector3(3.5, 0, 2.2)
    });

    // 貨架 E: 蔥燒牛肉泡麵速食架 (中島位置 X = 1.2, Z = 1.0)
    this.createCozyShelf({
      id: 'snack_shelf_2',
      name: '超人氣速食泡麵架',
      itemId: 'instant_noodles',
      category: '速食泡麵',
      capacity: 12,
      currentCount: 8,
      pos: new THREE.Vector3(1.5, 0, 1.2),
      rotY: 0,
      w: 2.4, h: 1.4, d: 0.8,
      color: '#ef4444',
      approachPos: new THREE.Vector3(1.5, 0, 2.4)
    });

    // 貨架 F: 暖呼呼關東煮鮮食台 (櫃台左側 X = -2.8, Z = -4.0)
    this.createCozyShelf({
      id: 'fresh_shelf_2',
      name: '暖呼呼關東煮鍋',
      itemId: 'oden',
      category: '鮮食關東煮',
      capacity: 10,
      currentCount: 6,
      pos: new THREE.Vector3(-3.2, 0, -4.6),
      rotY: 0,
      w: 1.8, h: 1.1, d: 0.9,
      color: '#d97706',
      approachPos: new THREE.Vector3(-3.2, 0, -3.2)
    });
  }

  // 4.5 天花板與日光燈管 (Cozy Ceiling with Fluorescent Lights)
  buildCeiling() {
    // 天花板平面 (比地板稍高)
    const ceilGeo = new THREE.PlaneGeometry(14, 14);
    const ceilMat = new THREE.MeshStandardMaterial({ color: '#fefcf9', roughness: 0.9 });
    const ceil = new THREE.Mesh(ceilGeo, ceilMat);
    ceil.rotation.x = Math.PI / 2;
    ceil.position.y = 4.0;
    this.scene.add(ceil);

    // 日光燈管 (4 排雙管燈條)
    const lightPositions = [
      { x: -3.5, z: -2.5 }, { x: -3.5, z: 2.5 },
      { x: 2.0, z: -2.5 }, { x: 2.0, z: 2.5 }
    ];
    const tubeMat = new THREE.MeshStandardMaterial({
      color: '#ffffff',
      emissive: '#fff7ed',
      emissiveIntensity: 0.6,
      roughness: 0.1
    });
    lightPositions.forEach(pos => {
      const tubeGeo = new THREE.BoxGeometry(0.1, 0.08, 3.0);
      const tube = new THREE.Mesh(tubeGeo, tubeMat);
      tube.position.set(pos.x, 3.95, pos.z);
      this.scene.add(tube);

      // 柔和點光源
      const pointLight = new THREE.PointLight(0xfff5e6, 0.3, 8);
      pointLight.position.set(pos.x, 3.8, pos.z);
      this.scene.add(pointLight);
    });
  }

  // 4.6 自動玻璃門 (Automatic Sliding Door Entrance)
  buildAutoDoor() {
    const doorGroup = new THREE.Group();
    doorGroup.position.set(0, 0, 7);

    // 門框
    const frameMat = new THREE.MeshStandardMaterial({ color: '#57836d', roughness: 0.3 });
    // 左框
    const leftFrame = new THREE.Mesh(new THREE.BoxGeometry(0.15, 2.8, 0.3), frameMat);
    leftFrame.position.set(-1.5, 1.4, 0);
    doorGroup.add(leftFrame);
    // 右框
    const rightFrame = new THREE.Mesh(new THREE.BoxGeometry(0.15, 2.8, 0.3), frameMat);
    rightFrame.position.set(1.5, 1.4, 0);
    doorGroup.add(rightFrame);
    // 上框
    const topFrame = new THREE.Mesh(new THREE.BoxGeometry(3.15, 0.2, 0.3), frameMat);
    topFrame.position.set(0, 2.85, 0);
    doorGroup.add(topFrame);

    // 兩扇透明玻璃門
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: '#bfdbfe',
      transparent: true,
      opacity: 0.35,
      roughness: 0.05,
      transmission: 0.85
    });
    const leftDoor = new THREE.Mesh(new THREE.BoxGeometry(1.35, 2.6, 0.06), glassMat);
    leftDoor.position.set(-0.7, 1.35, 0);
    doorGroup.add(leftDoor);
    const rightDoor = new THREE.Mesh(new THREE.BoxGeometry(1.35, 2.6, 0.06), glassMat);
    rightDoor.position.set(0.7, 1.35, 0);
    doorGroup.add(rightDoor);

    // 門頂「歡迎光臨」感應器
    const sensorMat = new THREE.MeshStandardMaterial({ color: '#1e293b' });
    const sensor = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.12, 0.12), sensorMat);
    sensor.position.set(0, 2.95, 0.15);
    doorGroup.add(sensor);

    // 門上營業中標示
    const signCanvas = document.createElement('canvas');
    signCanvas.width = 256; signCanvas.height = 64;
    const sCtx = signCanvas.getContext('2d');
    sCtx.fillStyle = '#10b981';
    sCtx.fillRect(0, 0, 256, 64);
    sCtx.fillStyle = '#ffffff';
    sCtx.font = 'bold 28px "Noto Sans TC", sans-serif';
    sCtx.textAlign = 'center';
    sCtx.fillText('🍊 歡迎光臨 OPEN', 128, 42);
    const signSprite = new THREE.Sprite(
      new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(signCanvas), transparent: true })
    );
    signSprite.position.set(0, 3.3, 0.2);
    signSprite.scale.set(2.2, 0.55, 1);
    doorGroup.add(signSprite);

    this.scene.add(doorGroup);
  }

  // 4.7 戶外送貨小卡車 (Cute Delivery Truck)
  buildDeliveryTruck() {
    const truck = new THREE.Group();
    truck.position.set(8.5, 0, 7.5);
    truck.rotation.y = -Math.PI / 4;

    // 車身底盤
    const chassisMat = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.3 });
    const chassis = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.6, 1.2), chassisMat);
    chassis.position.y = 0.5;
    truck.add(chassis);

    // 貨箱 (橘色)
    const cargoMat = new THREE.MeshStandardMaterial({ color: '#f97316', roughness: 0.4 });
    const cargo = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.1, 1.15), cargoMat);
    cargo.position.set(-0.3, 1.15, 0);
    truck.add(cargo);

    // 駕駛座 (深綠)
    const cabMat = new THREE.MeshStandardMaterial({ color: '#57836d', roughness: 0.3 });
    const cab = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.85, 1.1), cabMat);
    cab.position.set(0.75, 1.0, 0);
    truck.add(cab);

    // 擋風玻璃
    const windshieldMat = new THREE.MeshPhysicalMaterial({
      color: '#bfdbfe',
      transparent: true,
      opacity: 0.5,
      roughness: 0.1
    });
    const windshield = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.5, 0.9), windshieldMat);
    windshield.position.set(1.1, 1.1, 0);
    truck.add(windshield);

    // 輪子 (4 個圓柱)
    const wheelMat = new THREE.MeshStandardMaterial({ color: '#1e293b' });
    const wheelGeo = new THREE.CylinderGeometry(0.22, 0.22, 0.15, 12);
    [[-0.5, -0.68], [-0.5, 0.68], [0.6, -0.68], [0.6, 0.68]].forEach(([wx, wz]) => {
      const wheel = new THREE.Mesh(wheelGeo, wheelMat);
      wheel.rotation.x = Math.PI / 2;
      wheel.position.set(wx, 0.22, wz);
      truck.add(wheel);
    });

    // 車身側面文字
    const truckLabel = document.createElement('canvas');
    truckLabel.width = 256; truckLabel.height = 128;
    const tCtx = truckLabel.getContext('2d');
    tCtx.fillStyle = '#f97316';
    tCtx.fillRect(0, 0, 256, 128);
    tCtx.fillStyle = '#ffffff';
    tCtx.font = 'bold 28px "Noto Sans TC", sans-serif';
    tCtx.textAlign = 'center';
    tCtx.fillText('🍊 橘子物流', 128, 55);
    tCtx.font = '18px sans-serif';
    tCtx.fillText('GAMANIA LOGISTICS', 128, 90);
    const labelSprite = new THREE.Sprite(
      new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(truckLabel), transparent: true })
    );
    labelSprite.position.set(-0.3, 1.15, 0.6);
    labelSprite.scale.set(1.2, 0.6, 1);
    truck.add(labelSprite);

    this.scene.add(truck);
  }

  // 建造單個可愛貨架
  createCozyShelf(config) {
    const shelfGroup = new THREE.Group();
    shelfGroup.position.copy(config.pos);
    shelfGroup.rotation.y = config.rotY;

    // 溫暖木質本體
    const woodMat = new THREE.MeshStandardMaterial({ color: '#d4a373', roughness: 0.5 });
    const body = new THREE.Mesh(new THREE.BoxGeometry(config.w, config.h, config.d), woodMat);
    body.position.y = config.h / 2;
    body.castShadow = true;
    body.receiveShadow = true;
    shelfGroup.add(body);

    // 頂部圓角分類發光小招牌 (如草莓粉、檸檬黃、薄荷綠)
    const signGeo = new THREE.BoxGeometry(config.w + 0.05, 0.3, config.d - 0.2);
    const signMat = new THREE.MeshStandardMaterial({
      color: config.color,
      roughness: 0.3,
      emissive: config.color,
      emissiveIntensity: 0.25
    });
    const sign = new THREE.Mesh(signGeo, signMat);
    sign.position.y = config.h + 0.15;
    shelfGroup.add(sign);

    // 貨架上的實體商品群組
    const itemsGroup = new THREE.Group();
    shelfGroup.add(itemsGroup);

    // 點擊互動浮動圖示提示 (滑鼠懸停或點擊時放大)
    const iconSprite = this.createFloatingShelfIcon(config.category);
    iconSprite.position.set(0, config.h + 0.6, 0);
    shelfGroup.add(iconSprite);

    this.scene.add(shelfGroup);

    const shelfData = {
      id: config.id,
      name: config.name,
      itemId: config.itemId,
      category: config.category,
      capacity: config.capacity,
      currentCount: config.currentCount,
      worldPos: config.pos.clone(),
      customerApproachPos: config.approachPos.clone(),
      shelfGroup: shelfGroup,
      shelfMesh: body,
      signMesh: sign,
      bodyMat: woodMat,
      itemsGroup: itemsGroup,
      iconSprite: iconSprite,
      promoSprite: null,
      promoType: null,
      config: config
    };

    const uData = { isShelf: true, shelfId: config.id };
    body.userData = uData;
    shelfGroup.userData = uData;
    shelfGroup.traverse(child => {
      child.userData = uData;
    });
    this.shelves[config.id] = shelfData;
    this.interactiveShelves.push(body);

    this.refreshShelfItems(config.id);
  }

  // 建立貨架上方浮動的小圖示 (🍙, 🍵, ☕, 🍟)
  createFloatingShelfIcon(category) {
    const canvas = document.createElement('canvas');
    canvas.width = 128; canvas.height = 128;
    const ctx = canvas.getContext('2d');

    // 圓角可愛白色小氣泡
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(64, 64, 52, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#e2e8f0'; ctx.lineWidth = 6;
    ctx.stroke();

    // 根據品類畫代表符號
    ctx.font = '54px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    let iconChar = '🍙';
    if (category.includes('飲料')) iconChar = '🍵';
    else if (category.includes('咖啡')) iconChar = '☕';
    else if (category.includes('零食')) iconChar = '🍟';
    ctx.fillText(iconChar, 64, 66);

    const spriteMat = new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(canvas), transparent: true });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.scale.set(0.9, 0.9, 1);
    return sprite;
  }

  // 刷新貨架上的精緻 3D 商品模型 (多層隔板整齊排列)
  refreshShelfItems(shelfId) {
    const shelf = this.shelves[shelfId];
    if (!shelf) return;

    while (shelf.itemsGroup.children.length > 0) {
      shelf.itemsGroup.remove(shelf.itemsGroup.children[0]);
    }

    const itemDef = ITEM_DEFINITIONS[shelf.itemId];
    if (!itemDef || shelf.currentCount <= 0) return;

    const count = shelf.currentCount;
    const shelfH = shelf.config.h;
    const shelfD = shelf.config.d;

    // 多層隔板排列 (2~3 層)
    const layers = shelfH > 1.5 ? 3 : 2;
    const itemsPerLayer = Math.ceil(count / layers);
    const layerSpacing = (shelfH * 0.7) / layers;

    for (let i = 0; i < count; i++) {
      const layer = Math.floor(i / itemsPerLayer);
      const posInLayer = i % itemsPerLayer;
      const maxInThisLayer = Math.min(itemsPerLayer, count - layer * itemsPerLayer);

      const itemMesh = this.createDetailedItemMesh(itemDef);

      // 沿貨架深度方向排列
      const zSpacing = Math.min(0.28, (shelfD * 0.8) / maxInThisLayer);
      const offsetZ = (posInLayer - (maxInThisLayer - 1) / 2) * zSpacing;
      const baseY = shelfH * 0.2 + layer * layerSpacing;

      // 微小隨機偏移增加自然感
      const jitterX = (Math.random() - 0.5) * 0.03;
      const jitterZ = (Math.random() - 0.5) * 0.02;

      itemMesh.position.set(jitterX, baseY, offsetZ + jitterZ);
      itemMesh.rotation.y = (Math.random() - 0.5) * 0.15; // 微微轉一點
      shelf.itemsGroup.add(itemMesh);
    }

    shelf.itemsGroup.traverse(child => {
      child.userData = shelf.shelfGroup.userData;
    });

    // 更新浮動圖示可見度
    if (shelf.iconSprite) {
      shelf.iconSprite.material.opacity = shelf.currentCount < 3 ? 0.4 : 1.0;
    }
  }

  // 建立精緻的 3D 商品模型 (每種商品都有獨特造型)
  createDetailedItemMesh(itemDef) {
    const group = new THREE.Group();
    const mainColor = itemDef.color || '#3b82f6';
    const mat = new THREE.MeshStandardMaterial({ color: mainColor, roughness: 0.35, metalness: 0.05 });

    switch (itemDef.shape) {
      case 'bottle': {
        // 精緻瓶裝飲料 (瓶身 + 瓶蓋 + 標籤環)
        const bodyGeo = new THREE.CylinderGeometry(0.055, 0.06, 0.22, 10);
        const body = new THREE.Mesh(bodyGeo, mat);
        body.position.y = 0.11;
        group.add(body);

        // 瓶頸
        const neckGeo = new THREE.CylinderGeometry(0.03, 0.04, 0.06, 8);
        const neck = new THREE.Mesh(neckGeo, mat);
        neck.position.y = 0.24;
        group.add(neck);

        // 瓶蓋 (白色)
        const capMat = new THREE.MeshStandardMaterial({ color: '#f8fafc', roughness: 0.3 });
        const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, 0.03, 8), capMat);
        cap.position.y = 0.285;
        group.add(cap);

        // 中間標籤環 (白色橫帶)
        const labelMat = new THREE.MeshStandardMaterial({ color: '#fefce8', roughness: 0.4 });
        const label = new THREE.Mesh(new THREE.CylinderGeometry(0.059, 0.064, 0.08, 10), labelMat);
        label.position.y = 0.10;
        group.add(label);

        // 水面液體效果 (半透明內瓶)
        const liquidMat = new THREE.MeshStandardMaterial({
          color: mainColor,
          transparent: true,
          opacity: 0.6,
          roughness: 0.1
        });
        const liquid = new THREE.Mesh(new THREE.CylinderGeometry(0.048, 0.052, 0.16, 8), liquidMat);
        liquid.position.y = 0.09;
        group.add(liquid);
        break;
      }

      case 'can': {
        // 罐裝咖啡 (金屬質感 + 拉環)
        const canMat = new THREE.MeshStandardMaterial({
          color: mainColor,
          metalness: 0.6,
          roughness: 0.25
        });
        const canBody = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.18, 12), canMat);
        canBody.position.y = 0.09;
        group.add(canBody);

        // 頂部銀色 (鋁蓋)
        const topMat = new THREE.MeshStandardMaterial({ color: '#e2e8f0', metalness: 0.8, roughness: 0.2 });
        const top = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.012, 12), topMat);
        top.position.y = 0.186;
        group.add(top);

        // 底部
        const bottom = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.012, 12), topMat);
        bottom.position.y = 0.006;
        group.add(bottom);

        // 拉環
        const ringMat = new THREE.MeshStandardMaterial({ color: '#94a3b8', metalness: 0.9, roughness: 0.1 });
        const ring = new THREE.Mesh(new THREE.TorusGeometry(0.015, 0.003, 4, 8), ringMat);
        ring.position.set(0, 0.195, 0.015);
        ring.rotation.x = Math.PI / 2;
        group.add(ring);

        // 標籤文字帶
        const labelBand = new THREE.Mesh(
          new THREE.CylinderGeometry(0.053, 0.053, 0.06, 12),
          new THREE.MeshStandardMaterial({ color: '#fef3c7', roughness: 0.4 })
        );
        labelBand.position.y = 0.09;
        group.add(labelBand);
        break;
      }

      case 'triangle': {
        // 御飯糰 (三角形包裝 + 海苔帶 + 塑膠包裝光澤)
        const wrapMat = new THREE.MeshStandardMaterial({
          color: '#ffffff',
          roughness: 0.2,
          metalness: 0.1
        });
        const triBody = new THREE.Mesh(new THREE.CylinderGeometry(0, 0.10, 0.14, 3), wrapMat);
        triBody.position.y = 0.07;
        triBody.rotation.y = Math.PI / 6;
        group.add(triBody);

        // 海苔帶 (黑色，包住底部)
        const noriMat = new THREE.MeshStandardMaterial({ color: '#1a2e1a', roughness: 0.8 });
        const nori = new THREE.Mesh(new THREE.CylinderGeometry(0, 0.105, 0.06, 3), noriMat);
        nori.position.y = 0.03;
        nori.rotation.y = Math.PI / 6;
        group.add(nori);

        // 頂部紅色小三角標籤
        const tagMat = new THREE.MeshBasicMaterial({ color: '#dc2626' });
        const tag = new THREE.Mesh(new THREE.CylinderGeometry(0, 0.03, 0.03, 3), tagMat);
        tag.position.y = 0.14;
        tag.rotation.y = Math.PI / 6;
        group.add(tag);
        break;
      }

      case 'bag': {
        // 洋芋片袋 (鼓鼓的袋子造型)
        const bagMat = new THREE.MeshStandardMaterial({
          color: mainColor,
          roughness: 0.4,
          metalness: 0.15
        });
        // 鼓起的袋身 (膨脹橢圓)
        const bagBody = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 8), bagMat);
        bagBody.position.y = 0.12;
        bagBody.scale.set(0.85, 1.3, 0.65);
        group.add(bagBody);

        // 頂部封口捏合 (扁平)
        const sealMat = new THREE.MeshStandardMaterial({ color: '#fef3c7' });
        const seal = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.025, 0.03), sealMat);
        seal.position.y = 0.22;
        group.add(seal);

        // 商品標籤 (白色圓圈)
        const lblMat = new THREE.MeshBasicMaterial({ color: '#ffffff' });
        const lbl = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 8), lblMat);
        lbl.position.set(0, 0.13, 0.058);
        lbl.scale.set(1, 1, 0.2);
        group.add(lbl);
        break;
      }

      case 'cup': {
        // 泡麵杯 (杯身 + 蓋子 + 腰帶文字)
        const cupMat = new THREE.MeshStandardMaterial({ color: '#fefce8', roughness: 0.5 });
        const cupBody = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.055, 0.16, 12), cupMat);
        cupBody.position.y = 0.08;
        group.add(cupBody);

        // 頂蓋 (紅色/品牌色)
        const lidMat = new THREE.MeshStandardMaterial({ color: mainColor, roughness: 0.3 });
        const lid = new THREE.Mesh(new THREE.CylinderGeometry(0.068, 0.068, 0.012, 12), lidMat);
        lid.position.y = 0.166;
        group.add(lid);

        // 杯身腰帶 (品牌色)
        const bandMat = new THREE.MeshStandardMaterial({ color: mainColor, roughness: 0.4 });
        const band = new THREE.Mesh(new THREE.CylinderGeometry(0.063, 0.058, 0.05, 12), bandMat);
        band.position.y = 0.06;
        group.add(band);
        break;
      }

      case 'bowl': {
        // 關東煮 (熱湯碗 + 浮動蒸氣)
        const bowlMat = new THREE.MeshStandardMaterial({ color: '#fefce8', roughness: 0.4 });
        const bowlBody = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.06, 0.10, 12), bowlMat);
        bowlBody.position.y = 0.05;
        group.add(bowlBody);

        // 湯汁 (琥珀色)
        const soupMat = new THREE.MeshStandardMaterial({
          color: '#d97706',
          roughness: 0.2,
          transparent: true,
          opacity: 0.8
        });
        const soup = new THREE.Mesh(new THREE.CylinderGeometry(0.074, 0.074, 0.015, 12), soupMat);
        soup.position.y = 0.10;
        group.add(soup);

        // 浮在湯面上的食材球 (深色黑輪、白蘿蔔)
        const oden1Mat = new THREE.MeshStandardMaterial({ color: '#78350f' });
        const oden1 = new THREE.Mesh(new THREE.SphereGeometry(0.025, 8, 8), oden1Mat);
        oden1.position.set(-0.02, 0.11, 0.01);
        group.add(oden1);
        const oden2Mat = new THREE.MeshStandardMaterial({ color: '#fef9c3' });
        const oden2 = new THREE.Mesh(new THREE.SphereGeometry(0.022, 8, 8), oden2Mat);
        oden2.position.set(0.025, 0.11, -0.015);
        group.add(oden2);

        // 蒸氣效果 (小白色 sprite)
        const steamCanvas = document.createElement('canvas');
        steamCanvas.width = 32; steamCanvas.height = 32;
        const stCtx = steamCanvas.getContext('2d');
        const gradient = stCtx.createRadialGradient(16, 16, 2, 16, 16, 14);
        gradient.addColorStop(0, 'rgba(255,255,255,0.5)');
        gradient.addColorStop(1, 'rgba(255,255,255,0)');
        stCtx.fillStyle = gradient;
        stCtx.fillRect(0, 0, 32, 32);
        const steamSprite = new THREE.Sprite(
          new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(steamCanvas), transparent: true })
        );
        steamSprite.position.set(0, 0.18, 0);
        steamSprite.scale.set(0.12, 0.12, 1);
        group.add(steamSprite);
        break;
      }

      default: {
        // 通用盒裝商品
        const boxBody = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.20, 0.12), mat);
        boxBody.position.y = 0.10;
        group.add(boxBody);
      }
    }

    group.scale.set(0.85, 0.85, 0.85);
    return group;
  }

  // 5. 溫馨內用木質桌椅 (如參考圖木桌搭配 2 張椅子，供顧客坐下喝咖啡吃點心)
  buildDiningTables() {
    const tablePositions = [
      { x: -2.2, z: 0.8 },
      { x: 0.6, z: 2.2 },
      { x: -2.2, z: -2.2 }
    ];

    tablePositions.forEach((pos, idx) => {
      const tableGroup = new THREE.Group();
      tableGroup.position.set(pos.x, 0, pos.z);

      // 原木小長桌
      const topMat = new THREE.MeshStandardMaterial({ color: '#deb887', roughness: 0.5 });
      const tableTop = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.08, 0.9), topMat);
      tableTop.position.y = 0.8;
      tableTop.castShadow = true;
      tableGroup.add(tableTop);

      // 白色餐桌紙墊 (如參考圖桌上的白色菜單/餐墊紙)
      const paper = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.4), new THREE.MeshBasicMaterial({ color: '#ffffff' }));
      paper.rotation.x = -Math.PI / 2;
      paper.position.set(0, 0.845, 0);
      tableGroup.add(paper);

      // 四隻深色木桌腳
      const legMat = new THREE.MeshStandardMaterial({ color: '#8c5932' });
      [[-0.6, -0.35], [0.6, -0.35], [-0.6, 0.35], [0.6, 0.35]].forEach(([lx, lz]) => {
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.8, 8), legMat);
        leg.position.set(lx, 0.4, lz);
        tableGroup.add(leg);
      });

      // 兩側可愛小木椅 (配有白色軟墊)
      const chairMat = new THREE.MeshStandardMaterial({ color: '#8c5932' });
      const cushionMat = new THREE.MeshStandardMaterial({ color: '#fef08a' });

      // 左側椅子
      const chairL = this.createCozyChair(chairMat, cushionMat);
      chairL.position.set(-0.95, 0, 0);
      chairL.rotation.y = Math.PI / 2;
      tableGroup.add(chairL);

      // 右側椅子
      const chairR = this.createCozyChair(chairMat, cushionMat);
      chairR.position.set(0.95, 0, 0);
      chairR.rotation.y = -Math.PI / 2;
      tableGroup.add(chairR);

      this.scene.add(tableGroup);

      const tableId = `table_${idx}`;
      tableGroup.userData = { isDecor: true, decorId: tableId, name: '休閒原木內用桌椅', category: '舒適休憩' };
      tableGroup.traverse(child => {
        child.userData = tableGroup.userData;
      });
      this.decorations[tableId] = { group: tableGroup, mesh: tableTop, name: '休閒原木內用桌椅', category: '舒適休憩' };
      this.interactiveDecors.push(tableTop);

      this.tables.push({
        id: tableId,
        worldPos: new THREE.Vector3(pos.x, 0, pos.z),
        seatPos: new THREE.Vector3(pos.x - 0.95, 0, pos.z),
        isOccupied: false
      });
    });
  }

  // 打造單張可愛小餐椅
  createCozyChair(woodMat, cushionMat) {
    const chair = new THREE.Group();
    // 座面軟墊
    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.06, 0.42), cushionMat);
    seat.position.y = 0.48;
    chair.add(seat);

    // 靠背
    const back = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.45, 0.05), woodMat);
    back.position.set(0, 0.72, -0.19);
    chair.add(back);

    // 椅腳
    [[-0.17, -0.17], [0.17, -0.17], [-0.17, 0.17], [0.17, 0.17]].forEach(([cx, cz]) => {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.48, 8), woodMat);
      leg.position.set(cx, 0.24, cz);
      chair.add(leg);
    });
    return chair;
  }

  // 6. 室內大型觀葉盆栽 (如參考圖角落中精緻的木盆圓綠葉盆栽)
  buildPottedPlants() {
    const plantPositions = [
      { x: -5.8, z: 5.5 },
      { x: -1.2, z: -5.6 },
      { x: 2.2, z: 5.5 }
    ];

    plantPositions.forEach((pos, idx) => {
      const plantGroup = new THREE.Group();
      plantGroup.position.set(pos.x, 0, pos.z);

      // 方形原木花槽盆 (如參考圖條紋木盆)
      const potMat = new THREE.MeshStandardMaterial({ color: '#c79c6e', roughness: 0.6 });
      const pot = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.65, 0.9), potMat);
      pot.position.y = 0.325;
      plantGroup.add(pot);

      // 圓潤翠綠的大綠葉 (使用多個扁平球體層層交疊)
      const leafMat = new THREE.MeshStandardMaterial({ color: '#4ade80', roughness: 0.5 });
      const darkLeafMat = new THREE.MeshStandardMaterial({ color: '#16a34a', roughness: 0.5 });

      for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2;
        const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.24, 12, 8), i % 2 === 0 ? leafMat : darkLeafMat);
        leaf.scale.set(1.4, 0.3, 1.0);
        leaf.position.set(Math.cos(angle) * 0.28, 0.72 + (i % 3) * 0.08, Math.sin(angle) * 0.28);
        leaf.rotation.y = angle;
        leaf.rotation.z = 0.2;
        plantGroup.add(leaf);
      }

      this.scene.add(plantGroup);

      const plantId = `plant_${idx}`;
      plantGroup.userData = { isDecor: true, decorId: plantId, name: '室內觀葉綠植盆栽', category: '綠植美化' };
      plantGroup.traverse(child => {
        child.userData = plantGroup.userData;
      });
      this.decorations[plantId] = { group: plantGroup, mesh: pot, name: '室內觀葉綠植盆栽', category: '綠植美化' };
      this.interactiveDecors.push(pot);
    });
  }

  // 7. 室外庭園長椅、路燈與蓬鬆大綠樹 (Exterior Cozy Environment)
  buildExteriorDecor() {
    // 室外原木長凳 (如參考圖左下角公園綠長椅)
    const benchGroup = new THREE.Group();
    benchGroup.position.set(-6.5, 0, 8.8);
    const benchMat = new THREE.MeshStandardMaterial({ color: '#57836d' });
    const seat = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.08, 0.5), benchMat);
    seat.position.y = 0.45;
    benchGroup.add(seat);
    const back = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.4, 0.06), benchMat);
    back.position.set(0, 0.7, -0.22);
    benchGroup.add(back);
    this.scene.add(benchGroup);

    // 圓滾滾蓬鬆大綠樹 (如參考圖左上角可愛圓球狀樹冠)
    const treeGroup = new THREE.Group();
    treeGroup.position.set(-9.5, 0, -4.5);
    const trunkMat = new THREE.MeshStandardMaterial({ color: '#8c5932' });
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.35, 2.2, 8), trunkMat);
    trunk.position.y = 1.1;
    treeGroup.add(trunk);

    const foliageMat = new THREE.MeshStandardMaterial({ color: '#65a30d', roughness: 0.6 });
    const foliage = new THREE.Mesh(new THREE.SphereGeometry(1.8, 16, 16), foliageMat);
    foliage.scale.set(1.2, 1.3, 1.2);
    foliage.position.y = 2.8;
    treeGroup.add(foliage);
    this.scene.add(treeGroup);

    // 進貨紙箱送達點 (店外右前側空地 X = 5.2, Z = 7.8)
    this.deliveryAreaPos = new THREE.Vector3(5.2, 0, 8.2);

    // 卸貨區可愛地面標示圈
    const ringMat = new THREE.MeshBasicMaterial({ color: '#f59e0b', transparent: true, opacity: 0.7 });
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.9, 1.1, 24), ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.copy(this.deliveryAreaPos).setY(0.02);
    this.scene.add(ring);
  }

  // 產生 3D 進貨紙箱 (支援滑鼠點擊直接補貨)
  spawnDeliveryBox(itemDef, count) {
    const boxGroup = new THREE.Group();
    const boxGeo = new THREE.BoxGeometry(0.65, 0.5, 0.65);
    const boxTex = createBoxTexture(itemDef.name, count);
    const boxMat = new THREE.MeshStandardMaterial({ map: boxTex, roughness: 0.8 });
    const boxMesh = new THREE.Mesh(boxGeo, boxMat);
    boxMesh.castShadow = true;
    boxMesh.position.y = 0.25;
    boxGroup.add(boxMesh);

    // 附帶紙箱浮動「點擊上架」提示小圖示
    const hintCanvas = document.createElement('canvas');
    hintCanvas.width = 160; hintCanvas.height = 80;
    const hCtx = hintCanvas.getContext('2d');
    hCtx.fillStyle = '#f59e0b';
    hCtx.beginPath();
    hCtx.roundRect ? hCtx.roundRect(4, 4, 152, 72, 14) : hCtx.fillRect(4, 4, 152, 72);
    hCtx.fill();
    hCtx.fillStyle = '#ffffff';
    hCtx.font = 'bold 24px "Noto Sans TC", sans-serif';
    hCtx.textAlign = 'center';
    hCtx.fillText('點我上架 👆', 80, 46);

    const hintSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(hintCanvas), transparent: true }));
    hintSprite.position.set(0, 0.85, 0);
    hintSprite.scale.set(0.9, 0.45, 1);
    boxGroup.add(hintSprite);

    // 微小隨機偏移
    const countExist = this.boxes.length;
    const offsetX = (countExist % 2) * 0.75 - 0.35;
    const offsetZ = Math.floor(countExist / 2) * 0.75;
    boxGroup.position.set(
      this.deliveryAreaPos.x + offsetX,
      0,
      this.deliveryAreaPos.z + offsetZ
    );

    boxGroup.userData = {
      isBox: true,
      itemId: itemDef.id,
      itemCount: count,
      targetShelfId: itemDef.shelfId
    };
    boxMesh.userData = boxGroup.userData;

    this.scene.add(boxGroup);
    this.boxes.push(boxGroup);
    return boxGroup;
  }

  // 移除紙箱
  removeBox(box) {
    const idx = this.boxes.indexOf(box);
    if (idx !== -1) {
      this.boxes.splice(idx, 1);
    }
    this.scene.remove(box);
  }

  // ============================================================
  // 場景美化系統 (Scene Aesthetics & Decor Systems)
  // ============================================================

  // 1. 經典橘子超商大門發光霓虹大招牌 (Gamania Mart Neon Sign)
  buildStoreSign() {
    const signGroup = new THREE.Group();
    signGroup.position.set(0, 4.35, 7.0);

    // 招牌箱體 (6.4m 寬 x 1.2m 高 x 0.25m 厚)
    const signBoxGeo = new THREE.BoxGeometry(6.4, 1.2, 0.25);
    const signTex = createStoreSignTexture();
    const signBoxMat = new THREE.MeshStandardMaterial({
      map: signTex,
      roughness: 0.2,
      emissive: '#f97316',
      emissiveIntensity: 0.2
    });
    const signBox = new THREE.Mesh(signBoxGeo, signBoxMat);
    signBox.castShadow = true;
    signGroup.add(signBox);

    // 招牌邊緣金屬飾條
    const trimMat = new THREE.MeshStandardMaterial({ color: '#ca8a04', metalness: 0.8, roughness: 0.2 });
    const topTrim = new THREE.Mesh(new THREE.BoxGeometry(6.5, 0.08, 0.28), trimMat);
    topTrim.position.y = 0.62;
    signGroup.add(topTrim);
    const bottomTrim = new THREE.Mesh(new THREE.BoxGeometry(6.5, 0.08, 0.28), trimMat);
    bottomTrim.position.y = -0.62;
    signGroup.add(bottomTrim);

    // 招牌下方照射射燈 (溫暖金黃投射光)
    [-2.2, 0, 2.2].forEach(lx => {
      const spot = new THREE.PointLight(0xffedd5, 0.6, 6);
      spot.position.set(lx, -0.4, 0.4);
      signGroup.add(spot);
    });

    this.scene.add(signGroup);
    this.storeSign = signGroup;
  }

  // 2. 門口迎賓紅色地墊 (Welcome Mat)
  buildWelcomeMat() {
    const matGeo = new THREE.PlaneGeometry(2.6, 1.4);
    const matTex = createWelcomeMatTexture();
    const matMat = new THREE.MeshStandardMaterial({
      map: matTex,
      roughness: 0.85
    });
    const mat = new THREE.Mesh(matGeo, matMat);
    mat.rotation.x = -Math.PI / 2;
    mat.position.set(0, 0.015, 7.8);
    mat.receiveShadow = true;
    this.scene.add(mat);
  }

  // 3. 復古日系暖色街燈 (Street Lamp)
  buildStreetLamp() {
    const lampGroup = new THREE.Group();
    lampGroup.position.set(-7.5, 0, 7.8);

    const metalMat = new THREE.MeshStandardMaterial({ color: '#274438', roughness: 0.4, metalness: 0.6 });
    // 燈柱底座
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.4, 0.6, 12), metalMat);
    base.position.y = 0.3;
    lampGroup.add(base);

    // 燈柱本體
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.10, 4.2, 10), metalMat);
    pole.position.y = 2.4;
    lampGroup.add(pole);

    // 彎曲燈臂
    const arm = new THREE.Mesh(new THREE.TorusGeometry(0.4, 0.05, 8, 12, Math.PI / 2), metalMat);
    arm.position.set(0.25, 4.5, 0);
    lampGroup.add(arm);

    // 玻璃燈罩
    const lanternMat = new THREE.MeshStandardMaterial({
      color: '#ffffff',
      emissive: '#fef08a',
      emissiveIntensity: 0.8,
      roughness: 0.1
    });
    const lantern = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.16, 0.4, 8), lanternMat);
    lantern.position.set(0.65, 4.3, 0);
    lampGroup.add(lantern);

    // 街燈溫暖點光源
    const light = new THREE.PointLight(0xfef08a, 1.2, 14);
    light.position.set(0.65, 4.2, 0);
    light.castShadow = true;
    lampGroup.add(light);
    this.streetLampLight = light;

    this.scene.add(lampGroup);
  }

  // 4. 室外日系自動販賣機 (Cold Drinks Vending Machine)
  buildOutdoorVendingMachine() {
    const vendGroup = new THREE.Group();
    vendGroup.position.set(-3.5, 0, 7.6);
    vendGroup.rotation.y = 0;

    const boxGeo = new THREE.BoxGeometry(1.3, 2.3, 0.9);
    const boxTex = createVendingMachineTexture();
    const boxMat = new THREE.MeshStandardMaterial({
      map: boxTex,
      roughness: 0.3
    });
    const vendMesh = new THREE.Mesh(boxGeo, boxMat);
    vendMesh.position.y = 1.15;
    vendMesh.castShadow = true;
    vendMesh.receiveShadow = true;
    vendGroup.add(vendMesh);

    // 頂部遮雨小頂棚
    const canopyMat = new THREE.MeshStandardMaterial({ color: '#0284c7' });
    const canopy = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.08, 1.05), canopyMat);
    canopy.position.set(0, 2.34, 0.05);
    vendGroup.add(canopy);

    // 柔和微光
    const displayGlow = new THREE.PointLight(0x38bdf8, 0.5, 4);
    displayGlow.position.set(0, 1.4, 0.6);
    vendGroup.add(displayGlow);

    this.scene.add(vendGroup);

    vendMesh.userData = { isDecor: true, decorId: 'vending_1', name: '日系冰飲自動販賣機', category: '戶外設施' };
    vendGroup.userData = vendMesh.userData;
    this.decorations['vending_1'] = { group: vendGroup, mesh: vendMesh, name: '日系冰飲自動販賣機' };
    this.interactiveDecors.push(vendMesh);
  }

  // 5. 超商 3 色環保資源回收站 (3-Color Eco Recycling Station)
  buildRecycleStation() {
    const stationGroup = new THREE.Group();
    stationGroup.position.set(3.4, 0, 7.6);

    const colors = [
      { col: '#0284c7', label: '寶特瓶', type: 'bottle' },
      { col: '#eab308', label: '鐵鋁罐', type: 'can' },
      { col: '#64748b', label: '一般垃圾', type: 'trash' }
    ];

    colors.forEach((c, idx) => {
      const binGroup = new THREE.Group();
      binGroup.position.set((idx - 1) * 0.55, 0, 0);

      // 圓桶身
      const binMat = new THREE.MeshStandardMaterial({ color: c.col, roughness: 0.4 });
      const bin = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.18, 0.85, 14), binMat);
      bin.position.y = 0.425;
      bin.castShadow = true;
      binGroup.add(bin);

      // 桶蓋投入口
      const lidMat = new THREE.MeshStandardMaterial({ color: '#f8fafc', roughness: 0.3 });
      const lid = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.10, 14), lidMat);
      lid.position.y = 0.90;
      binGroup.add(lid);

      const hole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.02, 10), new THREE.MeshBasicMaterial({ color: '#0f172a' }));
      hole.position.y = 0.955;
      binGroup.add(hole);

      stationGroup.add(binGroup);
    });

    this.scene.add(stationGroup);
    const stationMesh = stationGroup.children[0].children[0];
    stationMesh.userData = { isDecor: true, decorId: 'recycle_1', name: '環保三色分類回收桶', category: '衛生設施' };
    stationGroup.userData = stationMesh.userData;
    this.decorations['recycle_1'] = { group: stationGroup, mesh: stationMesh, name: '環保三色分類回收桶' };
    this.interactiveDecors.push(stationMesh);
  }

  // 6. 櫃台熱食微波與包子機台 (Counter Microwave & Hot Food Station)
  buildCounterAppliances() {
    const appGroup = new THREE.Group();
    appGroup.position.set(-1.1, 1.08, -4.6);

    // 商用雙層微波爐
    const microMat = new THREE.MeshStandardMaterial({ color: '#334155', metalness: 0.5, roughness: 0.3 });
    const micro = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.5, 0.55), microMat);
    micro.position.y = 0.25;
    micro.castShadow = true;
    appGroup.add(micro);

    // 爐門發光窗 (溫暖金黃加熱光澤)
    const doorMat = new THREE.MeshStandardMaterial({
      color: '#f59e0b',
      emissive: '#d97706',
      emissiveIntensity: 0.6,
      roughness: 0.2
    });
    const door = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.34, 0.02), doorMat);
    door.position.set(-0.10, 0.25, 0.28);
    appGroup.add(door);

    // 數位顯示幕 (綠色 LED)
    const ledMat = new THREE.MeshBasicMaterial({ color: '#22c55e' });
    const led = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.06, 0.02), ledMat);
    led.position.set(0.28, 0.35, 0.28);
    appGroup.add(led);

    // 熱狗滾輪機 (滾動熱狗烤箱)
    const grillMat = new THREE.MeshStandardMaterial({ color: '#94a3b8', metalness: 0.8, roughness: 0.2 });
    const grill = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.25, 0.45), grillMat);
    grill.position.set(0.9, 0.125, 0);
    appGroup.add(grill);

    // 3 根香濃紅褐色熱狗
    const sausageMat = new THREE.MeshStandardMaterial({ color: '#b91c1c', roughness: 0.4 });
    [-0.1, 0, 0.1].forEach(sz => {
      const sausage = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.55, 8), sausageMat);
      sausage.rotation.z = Math.PI / 2;
      sausage.position.set(0.9, 0.28, sz);
      appGroup.add(sausage);
    });

    this.scene.add(appGroup);
  }

  // 7. 24H 銀行 ATM 機台 (ATM Kiosk)
  buildAtmKiosk() {
    const atmGroup = new THREE.Group();
    atmGroup.position.set(-6.2, 0, 4.0);
    atmGroup.rotation.y = Math.PI / 2;

    // 機身
    const bodyMat = new THREE.MeshStandardMaterial({ color: '#f1f5f9', roughness: 0.3 });
    const body = new THREE.Mesh(new THREE.BoxGeometry(1.0, 2.2, 0.85), bodyMat);
    body.position.y = 1.1;
    body.castShadow = true;
    atmGroup.add(body);

    // 螢幕面板
    const screenGeo = new THREE.PlaneGeometry(0.65, 0.65);
    const screenTex = createAtmScreenTexture();
    const screenMat = new THREE.MeshBasicMaterial({ map: screenTex });
    const screen = new THREE.Mesh(screenGeo, screenMat);
    screen.position.set(0, 1.45, 0.43);
    atmGroup.add(screen);

    // 鍵盤金屬台
    const padMat = new THREE.MeshStandardMaterial({ color: '#cbd5e1', metalness: 0.7, roughness: 0.3 });
    const pad = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.08, 0.25), padMat);
    pad.position.set(0, 0.98, 0.48);
    pad.rotation.x = 0.3;
    atmGroup.add(pad);

    // 螢幕上方頂棚
    const topCapMat = new THREE.MeshStandardMaterial({ color: '#0f766e' });
    const topCap = new THREE.Mesh(new THREE.BoxGeometry(1.04, 0.22, 0.9), topCapMat);
    topCap.position.y = 2.2;
    atmGroup.add(topCap);

    this.scene.add(atmGroup);

    body.userData = { isDecor: true, decorId: 'atm_1', name: '24H 跨行自動櫃員機 ATM', category: '便民金融' };
    atmGroup.userData = body.userData;
    this.decorations['atm_1'] = { group: atmGroup, mesh: body, name: '24H 跨行自動櫃員機 ATM' };
    this.interactiveDecors.push(body);
  }

  // 8. 潮流書報雜誌架 (Magazine Rack)
  buildMagazineRack() {
    const magGroup = new THREE.Group();
    magGroup.position.set(6.2, 0, -3.8);
    magGroup.rotation.y = -Math.PI / 2;

    // 木質展示框架
    const woodMat = new THREE.MeshStandardMaterial({ color: '#a67b51', roughness: 0.5 });
    const frame = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.5, 0.5), woodMat);
    frame.position.y = 0.75;
    frame.castShadow = true;
    magGroup.add(frame);

    // 斜切展示雜誌貼圖
    const magTex = createMagazineRackTexture();
    const magPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(1.45, 1.25),
      new THREE.MeshStandardMaterial({ map: magTex, roughness: 0.4 })
    );
    magPlane.position.set(0, 0.78, 0.26);
    magGroup.add(magPlane);

    this.scene.add(magGroup);

    frame.userData = { isDecor: true, decorId: 'magazine_1', name: '潮流書報雜誌架', category: '休閒閱讀' };
    magGroup.userData = frame.userData;
    this.decorations['magazine_1'] = { group: magGroup, mesh: frame, name: '潮流書報雜誌架' };
    this.interactiveDecors.push(frame);
  }

  // 9. 復古雙層彩色扭蛋機 (Gashapon Machine)
  buildGashaponMachine() {
    const gashaGroup = new THREE.Group();
    gashaGroup.position.set(3.8, 0, 5.8);

    // 機身本體 (亮黃色底座)
    const baseMat = new THREE.MeshStandardMaterial({ color: '#f59e0b', roughness: 0.3 });
    const base = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.75, 0.65), baseMat);
    base.position.y = 0.375;
    base.castShadow = true;
    gashaGroup.add(base);

    // 透明圓形透明圓頂 (放彩色扭蛋球)
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: '#ffffff',
      transparent: true,
      opacity: 0.4,
      roughness: 0.1,
      transmission: 0.8
    });
    const globe = new THREE.Mesh(new THREE.SphereGeometry(0.34, 16, 14), glassMat);
    globe.position.set(0, 1.15, 0);
    gashaGroup.add(globe);

    // 內部彩色扭蛋球 (紅、黃、藍、綠、粉球)
    const ballColors = ['#ef4444', '#3b82f6', '#10b981', '#fbbf24', '#ec4899', '#8b5cf6'];
    for (let i = 0; i < 9; i++) {
      const bMat = new THREE.MeshStandardMaterial({ color: ballColors[i % ballColors.length], roughness: 0.3 });
      const ball = new THREE.Mesh(new THREE.SphereGeometry(0.08, 8, 8), bMat);
      const angle = (i / 9) * Math.PI * 2;
      ball.position.set(Math.cos(angle) * 0.16, 1.05 + (i % 3) * 0.08, Math.sin(angle) * 0.16);
      gashaGroup.add(ball);
    }

    // 旋轉手把
    const knobMat = new THREE.MeshStandardMaterial({ color: '#e2e8f0', metalness: 0.8 });
    const knob = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.06, 8), knobMat);
    knob.position.set(0, 0.55, 0.35);
    knob.rotation.x = Math.PI / 2;
    gashaGroup.add(knob);

    this.scene.add(gashaGroup);

    base.userData = { isDecor: true, decorId: 'gashapon_1', name: '復古雙層彩色扭蛋機', category: '娛樂休閒' };
    gashaGroup.userData = base.userData;
    this.decorations['gashapon_1'] = { group: gashaGroup, mesh: base, name: '復古雙層彩色扭蛋機' };
    this.interactiveDecors.push(base);
  }

  // 10. 開運金光招財貓 (Golden Lucky Cat - Maneki-Neko)
  buildLuckyCat() {
    const catGroup = new THREE.Group();
    // 位於服務櫃檯收銀機旁
    catGroup.position.set(1.95, 1.11, -4.6);

    const goldMat = new THREE.MeshStandardMaterial({
      color: '#facc15',
      metalness: 0.75,
      roughness: 0.25,
      emissive: '#eab308',
      emissiveIntensity: 0.2
    });

    // 圓滾滾貓身
    const catBody = new THREE.Mesh(new THREE.SphereGeometry(0.14, 12, 10), goldMat);
    catBody.scale.set(1, 1.25, 0.9);
    catBody.position.y = 0.16;
    catGroup.add(catBody);

    // 招財手 (準備搖晃招呼)
    const armGeo = new THREE.CylinderGeometry(0.025, 0.02, 0.15, 8);
    this.catPaw = new THREE.Mesh(armGeo, goldMat);
    this.catPaw.position.set(-0.13, 0.22, 0.06);
    this.catPaw.rotation.z = 0.6;
    catGroup.add(this.catPaw);

    // 紅項圈與鈴鐺
    const collarMat = new THREE.MeshStandardMaterial({ color: '#dc2626' });
    const collar = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.015, 8, 16), collarMat);
    collar.position.set(0, 0.24, 0);
    collar.rotation.x = Math.PI / 2;
    catGroup.add(collar);

    const bell = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 8), goldMat);
    bell.position.set(0, 0.22, 0.12);
    catGroup.add(bell);

    // 貓耳朵
    [-0.07, 0.07].forEach(ex => {
      const ear = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.08, 4), goldMat);
      ear.position.set(ex, 0.33, 0);
      catGroup.add(ear);
    });

    this.scene.add(catGroup);

    catBody.userData = { isDecor: true, decorId: 'lucky_cat_1', name: '開運金光招財貓', category: '招財吉祥物' };
    catGroup.userData = catBody.userData;
    this.decorations['lucky_cat_1'] = { group: catGroup, mesh: catBody, name: '開運金光招財貓' };
    this.interactiveDecors.push(catBody);
  }

  // 11. 天花板促銷垂吊旗 (Ceiling Promotional Banners)
  buildCeilingBanners() {
    const banners = [
      { text: '🔥 24H 鮮食年中慶', color: '#ea580c', x: -1.5, z: -1.0 },
      { text: '☕ 極品黑咖啡第二件半價', color: '#854d0e', x: 2.2, z: -1.0 },
      { text: '🎉 滿額享驚喜好禮', color: '#16a34a', x: 0.5, z: 2.4 }
    ];

    banners.forEach((b, idx) => {
      const bannerGroup = new THREE.Group();
      bannerGroup.position.set(b.x, 3.8, b.z);

      const canvas = document.createElement('canvas');
      canvas.width = 256; canvas.height = 128;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = b.color;
      ctx.fillRect(0, 0, 256, 128);
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 6;
      ctx.strokeRect(6, 6, 244, 116);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 24px "Noto Sans TC", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(b.text, 128, 70);

      const bannerTex = new THREE.CanvasTexture(canvas);
      const bannerMat = new THREE.MeshStandardMaterial({ map: bannerTex, roughness: 0.4, side: THREE.DoubleSide });
      const bannerMesh = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.8), bannerMat);
      bannerMesh.position.y = -0.4;
      bannerGroup.add(bannerMesh);

      // 垂吊細繩
      const stringMat = new THREE.MeshBasicMaterial({ color: '#94a3b8' });
      [-0.7, 0.7].forEach(sx => {
        const str = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.4, 4), stringMat);
        str.position.set(sx, -0.2, 0);
        bannerGroup.add(str);
      });

      this.scene.add(bannerGroup);
    });
  }

  // 12. 裝潢佈置模式地面網格提示 (Floor Grid Plane)
  buildFloorGrid() {
    const gridGeo = new THREE.PlaneGeometry(13.8, 13.8);
    const gridTex = createFloorGridTexture();
    const gridMat = new THREE.MeshBasicMaterial({
      map: gridTex,
      transparent: true,
      opacity: 0.75,
      depthWrite: false
    });
    this.floorGridMesh = new THREE.Mesh(gridGeo, gridMat);
    this.floorGridMesh.rotation.x = -Math.PI / 2;
    this.floorGridMesh.position.y = 0.025;
    this.floorGridMesh.visible = false;
    this.scene.add(this.floorGridMesh);
  }

  // 13. 物件選中發光指示環 (Selection Marker Ring)
  buildSelectionMarker() {
    this.selectionMarker = new THREE.Group();

    // 外環發光圓環
    const ringMat = new THREE.MeshBasicMaterial({ color: '#f59e0b', transparent: true, opacity: 0.8 });
    const ring = new THREE.Mesh(new THREE.RingGeometry(1.1, 1.25, 32), ringMat);
    ring.rotation.x = -Math.PI / 2;
    this.selectionMarker.add(ring);

    // 四個直角定位角標
    const cornerMat = new THREE.MeshBasicMaterial({ color: '#fbbf24' });
    for (let i = 0; i < 4; i++) {
      const angle = (i * Math.PI) / 2 + Math.PI / 4;
      const corner = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.04, 0.08), cornerMat);
      corner.position.set(Math.cos(angle) * 1.2, 0.01, Math.sin(angle) * 1.2);
      corner.rotation.y = angle;
      this.selectionMarker.add(corner);
    }

    this.selectionMarker.position.y = 0.035;
    this.selectionMarker.visible = false;
    this.scene.add(this.selectionMarker);
  }

  // 14. 建立透化全息預覽虛影系統 (Ghost Hologram Preview System)
  buildGhostPreviewSystem() {
    this.ghostGroup = new THREE.Group();
    this.ghostGroup.visible = false;
    this.ghostValid = true;

    // 透化預覽材質 (半透明科技感全息光)
    this.ghostValidMat = new THREE.MeshStandardMaterial({
      color: '#38bdf8',
      emissive: '#0284c7',
      emissiveIntensity: 0.65,
      transparent: true,
      opacity: 0.55,
      roughness: 0.2
    });

    this.ghostInvalidMat = new THREE.MeshStandardMaterial({
      color: '#ef4444',
      emissive: '#b91c1c',
      emissiveIntensity: 0.85,
      transparent: true,
      opacity: 0.65,
      roughness: 0.2
    });

    // 虛影預覽物件網格載體
    this.ghostMeshHolder = new THREE.Group();
    this.ghostGroup.add(this.ghostMeshHolder);

    // 地面方框範圍提示環 (透化綠/紅光)
    const boxGeo = new THREE.PlaneGeometry(2.0, 1.2);
    const boxMat = new THREE.MeshBasicMaterial({
      color: '#38bdf8',
      transparent: true,
      opacity: 0.45,
      side: THREE.DoubleSide,
      depthWrite: false
    });
    this.ghostFloorQuad = new THREE.Mesh(boxGeo, boxMat);
    this.ghostFloorQuad.rotation.x = -Math.PI / 2;
    this.ghostFloorQuad.position.y = 0.04;
    this.ghostGroup.add(this.ghostFloorQuad);

    // 外框線
    const edges = new THREE.EdgesGeometry(boxGeo);
    const lineMat = new THREE.LineBasicMaterial({ color: '#ffffff', linewidth: 2 });
    this.ghostEdgesLine = new THREE.LineSegments(edges, lineMat);
    this.ghostEdgesLine.rotation.x = -Math.PI / 2;
    this.ghostEdgesLine.position.y = 0.045;
    this.ghostGroup.add(this.ghostEdgesLine);

    this.scene.add(this.ghostGroup);
  }

  // 根據當前選中物件建立透化虛影
  createGhostPreview() {
    if (!this.selectedObject) return;
    const { type, target } = this.selectedObject;
    const group = type === 'shelf' ? target.shelfGroup : target.group;

    // 清空舊的虛影
    while (this.ghostMeshHolder.children.length > 0) {
      this.ghostMeshHolder.remove(this.ghostMeshHolder.children[0]);
    }

    // 複製模型結構為純淨的透化 Mesh 結構
    const cloned = new THREE.Group();
    group.traverse(child => {
      if (child.isMesh && child.geometry) {
        const meshClone = new THREE.Mesh(child.geometry, this.ghostValidMat);
        meshClone.position.copy(child.position);
        meshClone.rotation.copy(child.rotation);
        meshClone.scale.copy(child.scale);
        meshClone.castShadow = false;
        meshClone.receiveShadow = false;
        cloned.add(meshClone);
      }
    });

    // 取得尺寸調整地面方框
    let w = 1.8, d = 1.0;
    if (type === 'shelf') {
      w = target.config.w || 1.8;
      d = target.config.d || 0.9;
    } else {
      const name = target.name || '';
      if (name.includes('自動販賣機')) { w = 1.6; d = 1.2; }
      else if (name.includes('ATM')) { w = 1.2; d = 1.2; }
      else if (name.includes('雜誌架')) { w = 1.8; d = 0.8; }
      else if (name.includes('扭蛋機')) { w = 0.9; d = 0.9; }
      else if (name.includes('桌椅')) { w = 1.4; d = 1.0; }
      else { w = 0.9; d = 0.9; }
    }

    this.ghostFloorQuad.geometry.dispose();
    this.ghostFloorQuad.geometry = new THREE.PlaneGeometry(w + 0.35, d + 0.35);
    this.ghostEdgesLine.geometry.dispose();
    this.ghostEdgesLine.geometry = new THREE.EdgesGeometry(new THREE.PlaneGeometry(w + 0.35, d + 0.35));

    this.ghostMeshHolder.add(cloned);
    this.ghostGroup.rotation.y = group.rotation.y;
    this.ghostGroup.position.copy(group.position);
    this.ghostGroup.visible = true;
    this.updateGhostPosition(group.position);
  }

  // 更新虛影位置 (配合地面網格吸附 Snapping 0.3m)
  updateGhostPosition(groundPos) {
    if (!this.ghostGroup.visible || !this.selectedObject) return null;

    // 網格對齊吸附 (Grid Snap 0.3m)
    const snapSize = 0.3;
    let snapX = Math.round(groundPos.x / snapSize) * snapSize;
    let snapZ = Math.round(groundPos.z / snapSize) * snapSize;

    // 限制在店內活動範圍
    snapX = Math.max(-5.2, Math.min(5.2, snapX));
    snapZ = Math.max(-5.2, Math.min(5.2, snapZ));

    this.ghostGroup.position.set(snapX, 0, snapZ);

    // 檢查放置合法性 (是否與櫃檯重疊或擋住正門)
    this.ghostValid = this.checkPlacementValidity(snapX, snapZ);

    const mat = this.ghostValid ? this.ghostValidMat : this.ghostInvalidMat;
    const floorColor = this.ghostValid ? 0x38bdf8 : 0xef4444;

    this.ghostMeshHolder.traverse(child => {
      if (child.isMesh) child.material = mat;
    });
    this.ghostFloorQuad.material.color.setHex(floorColor);

    return { x: snapX, z: snapZ, valid: this.ghostValid };
  }

  // 檢查該位置是否合法 (避免擋住大門入口與收銀櫃檯後台)
  checkPlacementValidity(x, z) {
    // 1. 擋住大門入口 (門口中央 X: -1.4 ~ 1.4, Z > 4.2)
    if (Math.abs(x) < 1.4 && z > 4.2) return false;

    // 2. 擋在收銀台正後方或櫃檯區域 (X: -1.2 ~ 2.2, Z: -6.0 ~ -3.6)
    if (x >= -1.2 && x <= 2.2 && z >= -6.0 && z <= -3.6) return false;

    return true;
  }

  // 將選中物件放置到虛影目標位置
  applyGhostPlacement() {
    if (!this.selectedObject || !this.ghostGroup.visible) return false;

    if (!this.ghostValid) {
      this.hideGhostPreview();
      return false;
    }

    const { type, target } = this.selectedObject;
    const group = type === 'shelf' ? target.shelfGroup : target.group;
    const pos = this.ghostGroup.position;

    group.position.set(pos.x, 0, pos.z);
    this.selectionMarker.position.set(pos.x, 0.035, pos.z);

    if (type === 'shelf') {
      target.worldPos.copy(pos);
      const approachOffset = new THREE.Vector3(0, 0, 1.35).applyAxisAngle(new THREE.Vector3(0, 1, 0), group.rotation.y);
      target.customerApproachPos.copy(pos).add(approachOffset);
    }

    this.hideGhostPreview();
    this.updateNavGrid();
    return true;
  }

  // 隱藏虛影預覽
  hideGhostPreview() {
    if (this.ghostGroup) {
      this.ghostGroup.visible = false;
    }
  }

  // ============================================================
  // 自由擺設與裝潢佈置調整操作 API (Free Layout & Decor Management)
  // ============================================================

  // 開啟 / 關閉自由擺設模式
  setDecorMode(enabled) {
    this.isDecorMode = enabled;
    if (this.floorGridMesh) {
      this.floorGridMesh.visible = enabled;
    }
    if (!enabled) {
      this.hideGhostPreview();
      this.deselectObject();
    }
  }

  // 選中指定物件 (貨架或裝飾品)
  selectObject(id, type = 'shelf') {
    let target = null;
    let pos = null;

    if (type === 'shelf' && this.shelves[id]) {
      target = this.shelves[id];
      pos = target.shelfGroup.position;
      this.selectedObject = { type: 'shelf', id, target };
    } else if (type === 'decor' && this.decorations[id]) {
      target = this.decorations[id];
      pos = target.group.position;
      this.selectedObject = { type: 'decor', id, target };
    }

    if (target && pos) {
      this.selectionMarker.position.set(pos.x, 0.035, pos.z);
      this.selectionMarker.visible = true;
      return this.selectedObject;
    }

    this.deselectObject();
    return null;
  }

  // 取消選中
  deselectObject() {
    this.selectedObject = null;
    if (this.selectionMarker) {
      this.selectionMarker.visible = false;
    }
    this.hideGhostPreview();
  }

  // 移動當前選中物件 (dx, dz 代表網格位移步長)
  moveSelectedObject(dx, dz) {
    if (!this.selectedObject) return null;

    const { type, target } = this.selectedObject;
    const group = type === 'shelf' ? target.shelfGroup : target.group;

    // 限制超商內部邊界 (-5.2 ~ 5.2)
    const newX = Math.max(-5.2, Math.min(5.2, group.position.x + dx));
    const newZ = Math.max(-5.2, Math.min(5.2, group.position.z + dz));

    group.position.set(newX, 0, newZ);
    this.selectionMarker.position.set(newX, 0.035, newZ);

    if (type === 'shelf') {
      target.worldPos.copy(group.position);
      // 動態重算顧客上前選購的站立點
      const approachOffset = new THREE.Vector3(0, 0, 1.35).applyAxisAngle(new THREE.Vector3(0, 1, 0), group.rotation.y);
      target.customerApproachPos.copy(group.position).add(approachOffset);
    }

    // 更新走道導航路徑網格
    this.updateNavGrid();

    return { x: newX, z: newZ };
  }

  // 旋轉當前選中物件 (90 度順時針旋轉)
  rotateSelectedObject(angleDelta = Math.PI / 2) {
    if (!this.selectedObject) return 0;

    const { type, target } = this.selectedObject;
    const group = type === 'shelf' ? target.shelfGroup : target.group;

    group.rotation.y = (group.rotation.y + angleDelta) % (Math.PI * 2);

    if (type === 'shelf') {
      const approachOffset = new THREE.Vector3(0, 0, 1.35).applyAxisAngle(new THREE.Vector3(0, 1, 0), group.rotation.y);
      target.customerApproachPos.copy(group.position).add(approachOffset);
    }

    // 更新走道導航路徑網格
    this.updateNavGrid();

    return group.rotation.y;
  }

  // 自由更改指定貨架販售的商品
  changeShelfItem(shelfId, newItemId) {
    const shelf = this.shelves[shelfId];
    const itemDef = ITEM_DEFINITIONS[newItemId];
    if (!shelf || !itemDef) return false;

    shelf.itemId = newItemId;
    shelf.name = `${itemDef.name}專屬展售架`;
    shelf.category = itemDef.category;
    shelf.config.color = itemDef.color || '#3b82f6';

    // 變更頂部標牌色彩
    if (shelf.signMesh) {
      shelf.signMesh.material.color.set(shelf.config.color);
      shelf.signMesh.material.emissive.set(shelf.config.color);
    }

    // 刷新上方浮動圖示
    if (shelf.iconSprite) {
      shelf.shelfGroup.remove(shelf.iconSprite);
      shelf.iconSprite = this.createFloatingShelfIcon(itemDef.category);
      shelf.iconSprite.position.set(0, shelf.config.h + 0.6, 0);
      shelf.shelfGroup.add(shelf.iconSprite);
    }

    // 重新排列貨架實體 3D 模型
    this.refreshShelfItems(shelfId);
    return true;
  }

  // 更換貨架風格色彩 (wood, white, mint, orange, dark)
  changeShelfTheme(shelfId, themeKey) {
    const shelf = this.shelves[shelfId];
    const hex = this.shelfThemes[themeKey] || this.shelfThemes.wood;
    if (!shelf || !shelf.shelfMesh) return;

    shelf.shelfMesh.material.color.set(hex);
  }

  // 為貨架加上熱銷促銷立牌標籤 (HOT, SALE, RECOMMEND)
  setShelfPromoTag(shelfId, tagType) {
    const shelf = this.shelves[shelfId];
    if (!shelf) return;

    if (shelf.promoSprite) {
      shelf.shelfGroup.remove(shelf.promoSprite);
      shelf.promoSprite = null;
    }

    if (!tagType) {
      shelf.promoType = null;
      return;
    }

    shelf.promoType = tagType;
    const tagCanvas = document.createElement('canvas');
    tagCanvas.width = 160; tagCanvas.height = 80;
    const ctx = tagCanvas.getContext('2d');

    const tagColors = {
      hot: { bg: '#ef4444', text: '🔥 超人氣' },
      sale: { bg: '#f59e0b', text: '🎉 特價特賣' },
      recommend: { bg: '#10b981', text: '⭐ 店長推薦' }
    };
    const t = tagColors[tagType] || tagColors.hot;

    ctx.fillStyle = t.bg;
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(4, 4, 152, 72, 16) : ctx.fillRect(4, 4, 152, 72);
    ctx.fill();
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 4;
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px "Noto Sans TC", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(t.text, 80, 42);

    const spriteMat = new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(tagCanvas), transparent: true });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.position.set(0, shelf.config.h + 0.95, 0);
    sprite.scale.set(1.1, 0.55, 1);
    shelf.shelfGroup.add(sprite);
    shelf.promoSprite = sprite;
  }

  // 購買並放置全新貨架 (中島架、飲料雙門冰櫃、熟食鮮食台)
  addNewShelf(type, itemId, customPos = null) {
    const id = `custom_shelf_${Date.now()}`;
    const itemDef = ITEM_DEFINITIONS[itemId] || ITEM_DEFINITIONS.onigiri;

    const spawnPos = customPos || new THREE.Vector3(
      -2.0 + Math.random() * 4.0,
      0,
      -1.0 + Math.random() * 3.0
    );

    let config = {
      id,
      name: `${itemDef.name}陳列貨架`,
      itemId: itemDef.id,
      category: itemDef.category,
      capacity: 12,
      currentCount: 8,
      pos: spawnPos,
      rotY: 0,
      w: 1.8, h: 1.5, d: 0.9,
      color: itemDef.color || '#f97316',
      approachPos: new THREE.Vector3(spawnPos.x, 0, spawnPos.z + 1.35)
    };

    if (type === 'double_fridge') {
      config.w = 1.2; config.h = 2.2; config.d = 2.4;
      config.capacity = 16;
    } else if (type === 'island_gondola') {
      config.w = 2.2; config.h = 1.4; config.d = 1.0;
      config.capacity = 14;
    } else if (type === 'oden_bar') {
      config.w = 1.8; config.h = 1.2; config.d = 1.0;
      config.capacity = 12;
    }

    this.createCozyShelf(config);
    this.updateNavGrid();
    return id;
  }

  // 購買並放置全新裝飾美化物件 (發光盆栽、招財貓、雜誌架、扭蛋機、桌椅)
  addNewDecoration(type, customPos = null) {
    const id = `${type}_${Date.now()}`;
    const spawnPos = customPos || new THREE.Vector3(
      -2.5 + Math.random() * 5.0,
      0,
      -2.0 + Math.random() * 4.0
    );

    const decorGroup = new THREE.Group();
    decorGroup.position.copy(spawnPos);
    let decorMesh = null;
    let name = '超商精緻擺件';
    let category = '店面美化';

    if (type === 'ficus_plant') {
      name = '室內闊葉發光盆栽';
      category = '綠植美化';
      const potMat = new THREE.MeshStandardMaterial({ color: '#c79c6e', roughness: 0.6 });
      const pot = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.6, 0.8), potMat);
      pot.position.y = 0.3;
      pot.castShadow = true;
      decorGroup.add(pot);

      const leafMat = new THREE.MeshStandardMaterial({ color: '#4ade80', roughness: 0.5 });
      for (let i = 0; i < 6; i++) {
        const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 8), leafMat);
        leaf.scale.set(1.4, 0.3, 1.0);
        const a = (i / 6) * Math.PI * 2;
        leaf.position.set(Math.cos(a) * 0.25, 0.65 + (i % 2) * 0.08, Math.sin(a) * 0.25);
        decorGroup.add(leaf);
      }
      decorMesh = pot;
    } else if (type === 'lucky_cat') {
      name = '開運金光招財貓';
      category = '招財吉祥';
      const catMat = new THREE.MeshStandardMaterial({ color: '#facc15', metalness: 0.8, roughness: 0.2 });
      const cat = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 8), catMat);
      cat.position.y = 0.22;
      cat.castShadow = true;
      decorGroup.add(cat);
      decorMesh = cat;
    } else if (type === 'dining_set') {
      name = '休閒原木內用桌椅';
      category = '舒適休憩';
      const topMat = new THREE.MeshStandardMaterial({ color: '#deb887', roughness: 0.5 });
      const tableTop = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.08, 0.8), topMat);
      tableTop.position.y = 0.8;
      tableTop.castShadow = true;
      decorGroup.add(tableTop);
      decorMesh = tableTop;
      this.tables.push({
        id: `table_${Date.now()}`,
        worldPos: spawnPos.clone(),
        seatPos: spawnPos.clone().add(new THREE.Vector3(-0.9, 0, 0)),
        isOccupied: false
      });
    } else {
      // 預設盆栽擺飾
      name = '精選綠植盆栽';
      category = '綠植美化';
      const potMat = new THREE.MeshStandardMaterial({ color: '#b45309' });
      const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.2, 0.5, 10), potMat);
      pot.position.y = 0.25;
      decorGroup.add(pot);
      decorMesh = pot;
    }

    if (decorMesh) {
      decorMesh.userData = { isDecor: true, decorId: id, name, category };
      decorGroup.userData = decorMesh.userData;
      this.scene.add(decorGroup);
      this.decorations[id] = { group: decorGroup, mesh: decorMesh, name, category };
      this.interactiveDecors.push(decorMesh);
      this.updateNavGrid();
      return id;
    }
    return null;
  }

  // 移除當前選中之自訂擺設或貨架
  removeSelectedObject() {
    if (!this.selectedObject) return null;
    const { type, id, target } = this.selectedObject;

    if (type === 'shelf') {
      // 至少保留 3 個基礎貨架
      if (Object.keys(this.shelves).length <= 3) {
        return { success: false, reason: '店內至少需保留 3 組基礎營業貨架！' };
      }
      this.scene.remove(target.shelfGroup);
      delete this.shelves[id];
      const sIdx = this.interactiveShelves.indexOf(target.shelfMesh);
      if (sIdx !== -1) this.interactiveShelves.splice(sIdx, 1);
    } else if (type === 'decor') {
      this.scene.remove(target.group);
      delete this.decorations[id];
      const dIdx = this.interactiveDecors.indexOf(target.mesh);
      if (dIdx !== -1) this.interactiveDecors.splice(dIdx, 1);
    }

    this.deselectObject();
    this.updateNavGrid();
    return { success: true };
  }

  // 計算並評鑑當前超商美觀度評分 (Aesthetics Rating 0 ~ 100)
  calculateAestheticsScore() {
    let score = 65; // 基礎底分

    // 擺飾數量加分
    const decorCount = Object.keys(this.decorations).length;
    score += Math.min(20, decorCount * 4);

    // 貨架多樣性與促銷立牌加分
    let promoCount = 0;
    Object.values(this.shelves).forEach(s => {
      if (s.promoType) promoCount++;
    });
    score += Math.min(10, promoCount * 3);

    // 桌椅內用加分
    score += Math.min(5, this.tables.length * 2);

    return Math.min(100, Math.max(0, score));
  }

  // 隨營業時間切換光影 (早晨金陽、午後明亮、黃昏夕照、夜間浪漫微光)
  updateTimeOfDay(hours) {
    if (!this.sunLight) return;

    if (hours >= 6 && hours < 16) {
      // 白天明亮溫暖
      this.sunLight.intensity = 1.35;
      this.sunLight.color.setHex(0xffeed9);
      if (this.streetLampLight) this.streetLampLight.intensity = 0.3;
    } else if (hours >= 16 && hours < 18.5) {
      // 傍晚夕陽金黃色
      this.sunLight.intensity = 1.1;
      this.sunLight.color.setHex(0xf97316);
      if (this.streetLampLight) this.streetLampLight.intensity = 0.8;
    } else {
      // 夜間模式：深邃月光搭配溫暖超商內燈與街燈
      this.sunLight.intensity = 0.45;
      this.sunLight.color.setHex(0x93c5fd);
      if (this.streetLampLight) this.streetLampLight.intensity = 1.6;
    }
  }

  // 循環更新場景動態 (店員呼吸微動、招財貓招手、選中環呼吸)
  updateScene(delta) {
    const time = performance.now() * 0.003;

    // 店員呼吸微動
    if (this.clerkBodyGroup) {
      this.clerkBodyGroup.position.y = Math.sin(time * 2) * 0.015;
    }

    // 招財貓揮動金爪
    if (this.catPaw) {
      this.catPaw.rotation.z = 0.6 + Math.sin(time * 5) * 0.25;
    }

    // 選中標記微光脈衝
    if (this.selectionMarker && this.selectionMarker.visible) {
      const s = 1.0 + Math.sin(time * 4) * 0.05;
      this.selectionMarker.scale.set(s, 1, s);
    }
  }

  // 更新與烘焙 A* 走道尋路網格 (Obstacle & Pathway Baking)
  updateNavGrid() {
    if (this.navGrid) {
      this.navGrid.rebuild(this);
    }
    if (this.onLayoutChanged) {
      this.onLayoutChanged();
    }
  }

  // 透過 A* 搜尋由 startPos 至 targetPos 避開貨架障礙的最佳航點路徑
  findPath(startPos, targetPos) {
    if (!this.navGrid) return [targetPos.clone()];
    return this.navGrid.findPath(startPos, targetPos);
  }
}

