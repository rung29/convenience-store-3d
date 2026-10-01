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
  createFloorGridTexture,
  createFridgeFrontTexture,
  createPromoPosterTexture
} from './textures.js';
import { ITEM_DEFINITIONS } from './items.js';
import { NavGrid } from './nav.js';
import { modelManager } from './models.js';

function createCanvasTexture(canvas) {
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  texture.needsUpdate = true;
  return texture;
}

function roundedRectPath(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

const PLACEMENT_GRID_SIZE = 0.3;
const ROOM_PLACEMENT_BOUNDS = Object.freeze({
  // Floor interior reaches almost to the wall inner edge (±6.82). Keep only
  // a tiny safety inset so a footprint can visually sit against the wall.
  minX: -6.8,
  maxX: 6.8,
  minZ: -6.8,
  maxZ: 6.8
});
const PLACEMENT_PREVIEW_PADDING = 0.08;
export const MARKET_SCENE_LAYOUT = Object.freeze({
  interiorScale: 1.25,
  sidewalkCenter: 10.35,
  sidewalkDepth: 1.85,
  outerRoadCenter: 12.75,
  outerRoadWidth: 2.25,
  // KayKit's straight road mesh runs along its local Z axis. Keep these
  // explicit so each perimeter side follows the direction of the road band.
  roadTileRotationAlongX: Math.PI / 2,
  roadTileRotationAlongZ: 0
});
const DECOR_PLACEMENT_FOOTPRINTS = Object.freeze({
  ficus_plant: { width: 1.0, depth: 1.0 },
  lucky_cat: { width: 0.6, depth: 0.6 },
  magazine_rack: { width: 1.8, depth: 0.8 },
  gashapon: { width: 0.9, depth: 0.9 },
  atm: { width: 1.2, depth: 1.2 },
  dining_set: { width: 2.4, depth: 1.0 },
  lottery_1: { width: 1.5, depth: 0.9 },
  lockers_1: { width: 1.4, depth: 0.8 },
  flower_1: { width: 0.9, depth: 0.9 },
  promo_pallet_1: { width: 2.0, depth: 1.2 },
  impulse_1: { width: 1.0, depth: 0.9 },
  table: { width: 2.4, depth: 1.0 },
  plant: { width: 1.0, depth: 1.0 },
  vending: { width: 1.4, depth: 1.05 },
  recycle: { width: 1.8, depth: 0.8 }
});

export class Store3D {
  constructor(scene) {
    this.scene = scene;
    this.interiorRoot = new THREE.Group();
    this.interiorRoot.name = 'store-interior-root';
    this.interiorRoot.userData = { isStoreInterior: true };
    this.scene.add(this.interiorRoot);

    // 走道導航與 A* 尋路系統 (防止人物穿過貨架與擺設)
    this.navGrid = new NavGrid();
    this.onLayoutChanged = null;

    // 貨架資料與網格清單 (支援滑鼠點擊互動與自由調整擺設)
    this.shelves = {};
    this.interactiveShelves = [];

    // 裝飾擺設資料與網格清單 (盆栽、ATM、招財貓、雜誌架、扭蛋機、自動販賣機)
    this.decorations = {};
    this.interactiveDecors = [];
    this.importedAssets = {};

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
    this.buildFrontAwning();
    this.buildWelcomeMat();
    this.buildAisleWayfinding();
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
    this.buildOutdoorVendingMachine();
    this.buildRecycleStation();
    this.buildDeliveryTruck();
    this.buildImportedRetailProps();
    this.buildImportedStaffDecor();
    this.buildKenneyMiniMarketDecor();
    this.buildPerimeterMarketStreet();
    this.buildKayKitStreetScenery();
    this.buildFloorGrid();
    this.buildSelectionMarker();
    this.buildGhostPreviewSystem();
    this.organizeAndScaleInterior();

    // 建立初始走道導航網格
    this.updateNavGrid();
  }

  // 1. 打造如參考圖的溫馨微縮盒景 (Diorama Cutaway Room)
  addImportedAssetToGroup(assetKey, parent, options = {}) {
    const asset = modelManager.createStoreAssetInstance(assetKey);
    if (!asset) return null;

    if (options.scale) {
      if (typeof options.scale === 'number') {
        asset.scale.setScalar(options.scale);
      } else {
        asset.scale.set(options.scale.x ?? 1, options.scale.y ?? 1, options.scale.z ?? 1);
      }
    }
    if (options.position) asset.position.copy(options.position);
    if (options.rotation) asset.rotation.set(options.rotation.x ?? 0, options.rotation.y ?? 0, options.rotation.z ?? 0);
    parent.add(asset);
    return asset;
  }

  addImportedAsset(assetKey, options = {}) {
    const group = new THREE.Group();
    if (options.position) group.position.copy(options.position);
    if (options.rotation) group.rotation.set(options.rotation.x ?? 0, options.rotation.y ?? 0, options.rotation.z ?? 0);
    if (!this.addImportedAssetToGroup(assetKey, group, { scale: options.scale })) return null;
    this.scene.add(group);
    this.importedAssets[options.id || assetKey] = group;
    return group;
  }

  organizeAndScaleInterior() {
    const directChildren = [...this.scene.children];
    directChildren.forEach(child => {
      if (child === this.interiorRoot || child === this.sidewalkMesh) return;

      const isInteriorAnchor = child === this.floorMesh || child.userData?.isStoreInterior;
      const isInsideStoreFootprint = Math.abs(child.position.x) <= 7.25
        && Math.abs(child.position.z) <= 7.25;
      if (isInteriorAnchor || isInsideStoreFootprint) {
        this.interiorRoot.add(child);
      }
    });

    this.interiorRoot.scale.setScalar(MARKET_SCENE_LAYOUT.interiorScale);
  }

  registerImportedDecoration(id, group, name, category = 'Imported 3D asset') {
    if (!group) return null;
    let mesh = null;
    group.traverse(child => {
      if (!mesh && child.isMesh) mesh = child;
      child.userData = { isDecor: true, decorId: id, name, category };
    });
    if (!mesh) return group;
    group.userData = mesh.userData;
    this.decorations[id] = {
      id,
      group,
      mesh,
      name,
      category,
      placementFootprint: DECOR_PLACEMENT_FOOTPRINTS[id] || undefined
    };
    this.interactiveDecors.push(mesh);
    return group;
  }

  buildDioramaRoom() {
    // 溫暖雙色棋盤格地磚 (14 x 14)
    const floorGeo = new THREE.PlaneGeometry(14, 14);
    const floorMat = new THREE.MeshStandardMaterial({
      map: createCozyFloorTexture(),
      roughness: 0.35,
      metalness: 0.05
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    this.floorMesh = floor;
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this.scene.add(floor);

    const useImportedShell = modelManager.hasStoreAsset('wallBayPlain');
    if (useImportedShell) {
      this.buildImportedStoreShell();
    } else {

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
    }

    // 前側與右側低矮花槽圍欄 (讓玩家能完全無死角欣賞超商內部)
    this.createLowFlowerCurb(0, 0.3, 7, 14.2, 0.6, 0.45);
    this.createLowFlowerCurb(7, 0.3, 1.5, 0.45, 0.6, 11.2);

    // 寬敞室外人行道地磚 (米白色淡雅石磚)
    // 保留完整 30m 外圍平台；顯示比例交由正交鏡頭控制，不壓縮地圖本身。
    const sidewalkGeo = new THREE.PlaneGeometry(30, 30);
    const sidewalkMat = new THREE.MeshStandardMaterial({
      map: createCozySidewalkTexture(),
      roughness: 0.8
    });
    const sidewalk = new THREE.Mesh(sidewalkGeo, sidewalkMat);
    this.sidewalkMesh = sidewalk;
    sidewalk.rotation.x = -Math.PI / 2;
    sidewalk.position.set(0, -0.05, 0);
    sidewalk.receiveShadow = true;
    this.scene.add(sidewalk);
  }

  // 建造窗框
  buildImportedStoreShell() {
    const shell = new THREE.Group();
    const backXs = [-5, -3, -1, 1, 3, 5];
    const sideZs = [-5, -3, -1, 1, 3, 5];

    backXs.forEach((x, index) => {
      const assetKey = index === 1 || index === 4 ? 'wallBayWindow' : 'wallBayPlain';
      this.addImportedAssetToGroup(assetKey, shell, { position: new THREE.Vector3(x, 0, -6.82) });
    });
    sideZs.forEach((z, index) => {
      const assetKey = index === 2 || index === 5 ? 'wallBayWindow' : 'wallBayPlain';
      this.addImportedAssetToGroup(assetKey, shell, {
        position: new THREE.Vector3(-6.82, 0, z),
        rotation: new THREE.Euler(0, Math.PI / 2, 0)
      });
    });

    [-6.82, 6.82].forEach(x => {
      [-6.82, 6.82].forEach(z => {
        this.addImportedAssetToGroup('cornerPost', shell, { position: new THREE.Vector3(x, 0, z) });
      });
    });

    [-5, 5].forEach(x => {
      this.addImportedAssetToGroup('shopfrontGlass', shell, { position: new THREE.Vector3(x, 0, 6.86) });
    });

    this.scene.add(shell);
    this.importedAssets.shell = shell;
  }

  createWindowFrame(x, y, z, w, h, d, rotY) {
    const frameMat = new THREE.MeshStandardMaterial({ color: '#57836d', roughness: 0.4 });
    const frameGroup = new THREE.Group();
    frameGroup.position.set(x, y, z);
    frameGroup.rotation.y = rotY;

    // 玻璃透光：保留牆面的開口感，不再用一塊實心綠盒子蓋住窗景。
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: '#dbeafe',
      transparent: true,
      opacity: 0.3,
      roughness: 0.1,
      transmission: 0.8,
      depthWrite: false
    });
    const innerW = Math.max(0.05, w - 0.18);
    const innerD = Math.max(0.05, d - 0.18);
    const glass = new THREE.Mesh(new THREE.BoxGeometry(innerW, h - 0.22, innerD), glassMat);
    frameGroup.add(glass);

    const bars = [];
    if (w >= d) {
      bars.push(
        { size: [0.12, h, 0.12], pos: [-w / 2, 0, 0] },
        { size: [0.12, h, 0.12], pos: [w / 2, 0, 0] },
        { size: [w, 0.12, 0.12], pos: [0, -h / 2, 0] },
        { size: [w, 0.12, 0.12], pos: [0, h / 2, 0] },
        { size: [0.08, h - 0.16, 0.12], pos: [0, 0, 0] }
      );
    } else {
      bars.push(
        { size: [0.12, h, 0.12], pos: [0, 0, -d / 2] },
        { size: [0.12, h, 0.12], pos: [0, 0, d / 2] },
        { size: [0.12, 0.12, d], pos: [0, -h / 2, 0] },
        { size: [0.12, 0.12, d], pos: [0, h / 2, 0] },
        { size: [0.12, h - 0.16, 0.08], pos: [0, 0, 0] }
      );
    }
    bars.forEach(({ size, pos }) => {
      const bar = new THREE.Mesh(new THREE.BoxGeometry(...size), frameMat);
      bar.position.set(...pos);
      bar.castShadow = true;
      frameGroup.add(bar);
    });

    const sill = new THREE.Mesh(
      new THREE.BoxGeometry(Math.max(w, 0.18) + 0.18, 0.08, Math.max(d, 0.18) + 0.18),
      new THREE.MeshStandardMaterial({ color: '#c79c6e', roughness: 0.5 })
    );
    sill.position.y = -h / 2 - 0.1;
    frameGroup.add(sill);
    this.scene.add(frameGroup);
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
    // 降低純環境光、增加上下色溫差，讓貨架邊角與商品陰影更立體。
    const ambient = new THREE.AmbientLight(0xfff7ed, 0.68);
    this.scene.add(ambient);

    const hemisphere = new THREE.HemisphereLight(0xfff4df, 0xb8c9c0, 0.5);
    this.scene.add(hemisphere);

    // 主方向太陽光 (傾斜斜射出柔和微縮模型陰影)
    const sun = new THREE.DirectionalLight(0xffeed9, 1.55);
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
    const fillLight = new THREE.DirectionalLight(0xdbeafe, 0.48);
    fillLight.position.set(-15, 15, -15);
    this.scene.add(fillLight);
  }

  // 3. 服務櫃檯、咖啡熱食台與可愛店員 (Service Counter & Friendly Clerk)
  buildServiceCounter() {
    if (modelManager.hasStoreAsset('serviceDesk')) {
      const importedCounter = new THREE.Group();
      importedCounter.position.set(0.5, 0, -4.6);
      this.addImportedAssetToGroup('checkoutLane', importedCounter, {
        position: new THREE.Vector3(-1.25, 0, 0)
      });
      this.addImportedAssetToGroup('serviceDesk', importedCounter, {
        position: new THREE.Vector3(1.35, 0, 0)
      });
      this.addImportedAssetToGroup('baggingArea', importedCounter, {
        position: new THREE.Vector3(2.85, 0, 0)
      });
      this.buildCuteClerk(importedCounter);
      this.scene.add(importedCounter);
      this.importedAssets.counter = importedCounter;
      this.checkoutPos = new THREE.Vector3(-0.3, 0, -3.2);
      return;
    }

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
    const boardMat = new THREE.MeshStandardMaterial({ map: createCanvasTexture(bCanvas), roughness: 0.8 });
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
    const importedClerk = modelManager.createStoreAssetInstance('characterCashier');
    if (importedClerk) {
      importedClerk.position.set(-0.1, 0, -0.9);
      importedClerk.scale.setScalar(1.0);

      // Keep the authored cashier, then add a tiny local apron/badge accent for the shop's Taiwanese identity.
      const apron = new THREE.Mesh(
        new THREE.BoxGeometry(0.34, 0.30, 0.035),
        new THREE.MeshStandardMaterial({ color: '#f97316', roughness: 0.52 })
      );
      apron.position.set(0, 0.72, 0.44);
      apron.castShadow = true;
      importedClerk.add(apron);

      const badge = new THREE.Mesh(
        new THREE.BoxGeometry(0.11, 0.07, 0.018),
        new THREE.MeshStandardMaterial({ color: '#fef3c7', roughness: 0.4 })
      );
      badge.position.set(0.10, 0.91, 0.47);
      importedClerk.add(badge);

      counterGroup.add(importedClerk);
      this.clerk = importedClerk;
      this.clerkBodyGroup = importedClerk;
      this.clerkHeadGroup = null;
      return;
    }

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
      new THREE.SpriteMaterial({ map: createCanvasTexture(tagCanvas), transparent: true })
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
      new THREE.SpriteMaterial({ map: createCanvasTexture(smileCanvas), transparent: true })
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

    clerk.scale.setScalar(1.12);

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
    if (modelManager.hasStoreAsset('entranceBay')) {
      this.addImportedAsset('entranceBay', {
        id: 'entrance-bay',
        position: new THREE.Vector3(0, 0, 6.86)
      });
      return;
    }

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
      new THREE.SpriteMaterial({ map: createCanvasTexture(signCanvas), transparent: true })
    );
    signSprite.position.set(0, 3.3, 0.2);
    signSprite.scale.set(2.2, 0.55, 1);
    doorGroup.add(signSprite);

    this.scene.add(doorGroup);
  }

  // 4.7 戶外送貨小卡車 (Cute Delivery Truck)
  buildDeliveryTruck() {
    if (modelManager.hasStoreAsset('deliveryLorry')) {
      this.addImportedAsset('deliveryLorry', {
        id: 'delivery-lorry',
        position: new THREE.Vector3(10.8, 0, 10.4),
        rotation: new THREE.Euler(0, -Math.PI / 4, 0),
        scale: 0.55
      });
      return;
    }

    const truck = new THREE.Group();
    truck.position.set(9.2, 0, MARKET_SCENE_LAYOUT.outerRoadCenter);
    truck.rotation.y = -Math.PI / 2;

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
      new THREE.SpriteMaterial({ map: createCanvasTexture(truckLabel), transparent: true })
    );
    labelSprite.position.set(-0.3, 1.15, 0.6);
    labelSprite.scale.set(1.2, 0.6, 1);
    truck.add(labelSprite);

    this.scene.add(truck);
  }

  // 建造豐富精緻的貨架 (含層板、金屬框、冰箱玻璃門等)
  createImportedShelf(config, assetKey) {
    const shelfGroup = new THREE.Group();
    shelfGroup.position.copy(config.pos);
    shelfGroup.rotation.y = config.rotY;

    const scale = assetKey.includes('chiller') || assetKey.includes('freezer') ? 1.04 : 1;
    const visual = this.addImportedAssetToGroup(assetKey, shelfGroup, { scale });
    if (!visual) return false;

    const itemsGroup = new THREE.Group();
    // Imported GLBs already contain their authored product arrangement. Keep the
    // gameplay inventory proxy alive, but do not draw a second procedural layer.
    itemsGroup.visible = false;
    shelfGroup.add(itemsGroup);

    const stockBadge = this.createStockBadge(config);
    shelfGroup.add(stockBadge);

    const body = new THREE.Mesh(
      new THREE.BoxGeometry(config.w, config.h, config.d),
      new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })
    );
    body.position.y = config.h / 2;
    shelfGroup.add(body);
    (this.interiorRoot || this.scene).add(shelfGroup);

    const shelfData = {
      id: config.id, name: config.name, itemId: config.itemId, category: config.category,
      capacity: config.capacity, currentCount: config.currentCount,
      worldPos: config.pos.clone(), customerApproachPos: config.approachPos.clone(),
      shelfGroup, shelfMesh: body, signMesh: null, bodyMat: null,
      itemsGroup, iconSprite: null, promoSprite: null, promoType: null, config,
      importedAsset: assetKey, importedVisual: visual, stockBadge
    };
    const uData = { isShelf: true, shelfId: config.id };
    body.userData = uData;
    shelfGroup.userData = uData;
    shelfGroup.traverse(child => { child.userData = uData; });
    this.shelves[config.id] = shelfData;
    this.interactiveShelves.push(body);
    this.refreshShelfItems(config.id);
    return true;
  }

  createStockBadge(config) {
    const canvas = document.createElement('canvas');
    canvas.width = 240;
    canvas.height = 64;
    const badge = new THREE.Sprite(new THREE.SpriteMaterial({
      map: createCanvasTexture(canvas),
      transparent: true,
      depthWrite: false
    }));
    badge.name = 'imported-shelf-stock-badge';
    badge.position.set(0, config.h + 0.42, config.d / 2 + 0.12);
    badge.scale.set(Math.max(0.72, Math.min(1.5, config.w * 0.9)), 0.28, 1);
    this.updateStockBadge(badge, config.currentCount, config.capacity, config.color);
    return badge;
  }

  updateStockBadge(badge, currentCount, capacity, accent = '#16a34a') {
    if (!badge?.material?.map?.image) return;
    const canvas = badge.material.map.image;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const ratio = capacity > 0 ? currentCount / capacity : 0;
    const statusColor = ratio <= 0 ? '#dc2626' : ratio < 0.35 ? '#f59e0b' : accent;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'rgba(255, 253, 249, 0.96)';
    if (ctx.roundRect) {
      ctx.beginPath();
      ctx.roundRect(3, 3, canvas.width - 6, canvas.height - 6, 16);
      ctx.fill();
    } else {
      ctx.fillRect(3, 3, canvas.width - 6, canvas.height - 6);
    }
    ctx.strokeStyle = statusColor;
    ctx.lineWidth = 6;
    ctx.strokeRect(4, 4, canvas.width - 8, canvas.height - 8);
    ctx.fillStyle = '#334155';
    ctx.font = '900 28px "Noto Sans TC", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`庫存 ${currentCount}/${capacity}`, canvas.width / 2, canvas.height / 2 + 1);
    badge.material.map.needsUpdate = true;
    badge.userData.stockCount = currentCount;
    badge.userData.stockCapacity = capacity;
  }

  createCozyShelf(config) {
    const shelfGroup = new THREE.Group();
    shelfGroup.position.copy(config.pos);
    shelfGroup.rotation.y = config.rotY;

    const isFridge = config.category && config.category.includes('冷藏');
    const isOden = config.category && config.category.includes('關東煮');
    const importedShelfAsset = {
      green_tea: 'chillerDrinks',
      canned_coffee: 'chillerDairy',
      onigiri: 'gondolaBottles',
      chips: 'gondolaSnacks',
      instant_noodles: 'gondolaCereal',
      oden: 'impulseShelf'
    }[config.itemId];
    if (importedShelfAsset && modelManager.hasStoreAsset(importedShelfAsset)) {
      this.createImportedShelf(config, importedShelfAsset);
      return;
    }

    if (isFridge) {
      // ── 冷藏冰櫃：金屬外框 + 玻璃門 + 內部層板 ──
      const metalMat = new THREE.MeshStandardMaterial({ color: '#c0c8d0', roughness: 0.25, metalness: 0.6 });
      // 隱形碰撞框只負責點擊與尋路，避免一整塊實心盒子把商品遮掉。
      const body = new THREE.Mesh(
        new THREE.BoxGeometry(config.w, config.h, config.d),
        new THREE.MeshBasicMaterial({ visible: false })
      );
      body.position.y = config.h / 2;
      body.castShadow = true; body.receiveShadow = true;
      shelfGroup.add(body);

      const backPanel = new THREE.Mesh(
        new THREE.BoxGeometry(config.w - 0.08, config.h - 0.12, 0.08),
        metalMat
      );
      backPanel.position.set(0, config.h / 2, -config.d / 2 + 0.04);
      backPanel.castShadow = true;
      shelfGroup.add(backPanel);

      // 冰箱四周的圓角感金屬邊框
      const framePieces = [
        { size: [0.08, config.h, config.d], pos: [-config.w / 2 + 0.04, config.h / 2, 0] },
        { size: [0.08, config.h, config.d], pos: [config.w / 2 - 0.04, config.h / 2, 0] },
        { size: [config.w, 0.1, config.d], pos: [0, config.h - 0.05, 0] },
        { size: [config.w, 0.1, config.d], pos: [0, 0.05, 0] }
      ];
      framePieces.forEach(({ size, pos }) => {
        const frame = new THREE.Mesh(new THREE.BoxGeometry(...size), metalMat);
        frame.position.set(...pos);
        frame.castShadow = true;
        shelfGroup.add(frame);
      });

      const innerShelfMat = new THREE.MeshStandardMaterial({ color: '#e2e8f0', metalness: 0.55, roughness: 0.3 });
      [0.32, 0.62].forEach(ratio => {
        const innerShelf = new THREE.Mesh(
          new THREE.BoxGeometry(config.w - 0.16, 0.045, config.d - 0.12),
          innerShelfMat
        );
        innerShelf.position.set(0, config.h * ratio, 0);
        shelfGroup.add(innerShelf);
      });

      // 正面冰箱玻璃門：保留反光，但讓真正的 3D 商品透出來
      const fridgeTex = createFridgeFrontTexture(config.color);
      const glassMat = new THREE.MeshPhysicalMaterial({
        color: '#dbeafe', transparent: true, opacity: 0.2, roughness: 0.05, metalness: 0.05,
        transmission: 0.65, depthWrite: false
      });
      const glassDoor = new THREE.Mesh(new THREE.BoxGeometry(config.w - 0.05, config.h - 0.05, 0.04), glassMat);
      glassDoor.position.set(0, config.h / 2, config.d / 2 + 0.02);
      glassDoor.castShadow = false;
      shelfGroup.add(glassDoor);

      const doorSticker = new THREE.Mesh(
        new THREE.PlaneGeometry(Math.max(0.45, config.w - 0.16), config.h - 0.24),
        new THREE.MeshBasicMaterial({ map: fridgeTex, transparent: true, opacity: 0.12, depthWrite: false })
      );
      doorSticker.position.set(0, config.h / 2, config.d / 2 + 0.045);
      shelfGroup.add(doorSticker);

      // 玻璃上的長條反光，讓冷藏櫃在放大鏡頭下更有材質層次
      const glassHighlight = new THREE.Mesh(
        new THREE.PlaneGeometry(0.08, config.h - 0.2),
        new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.28, depthWrite: false })
      );
      glassHighlight.position.set(-config.w * 0.28, config.h / 2, config.d / 2 + 0.052);
      shelfGroup.add(glassHighlight);

      // 冰箱門把手
      const handleMat = new THREE.MeshStandardMaterial({ color: '#94a3b8', metalness: 0.8, roughness: 0.2 });
      const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, config.h * 0.6, 8), handleMat);
      handle.position.set(config.w * 0.42, config.h / 2, config.d / 2 + 0.08);
      shelfGroup.add(handle);

      // 冰箱頂部彩色分類燈帶
      const ledMat = new THREE.MeshStandardMaterial({
        color: config.color, emissive: config.color, emissiveIntensity: 1.2, roughness: 0.1
      });
      const ledBar = new THREE.Mesh(new THREE.BoxGeometry(config.w, 0.06, config.d), ledMat);
      ledBar.position.y = config.h + 0.03;
      shelfGroup.add(ledBar);

      // 底部出風口與細格柵
      const ventMat = new THREE.MeshStandardMaterial({ color: '#334155', roughness: 0.6 });
      const vent = new THREE.Mesh(new THREE.BoxGeometry(config.w - 0.1, 0.12, 0.08), ventMat);
      vent.position.set(0, 0.06, config.d / 2 + 0.04);
      shelfGroup.add(vent);
      for (let i = 0; i < 5; i++) {
        const ventLine = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.07, 0.012), new THREE.MeshBasicMaterial({ color: '#94a3b8' }));
        ventLine.position.set(-config.w * 0.32 + i * config.w * 0.16, 0.06, config.d / 2 + 0.085);
        shelfGroup.add(ventLine);
      }

      // 點光源 (冰箱內照明)
      const fridgeLight = new THREE.PointLight(new THREE.Color(config.color), 0.5, 3);
      fridgeLight.position.set(0, config.h * 0.5, config.d * 0.2);
      shelfGroup.add(fridgeLight);

      // 頂部標籤
      const topSignCanvas = document.createElement('canvas');
      topSignCanvas.width = 256; topSignCanvas.height = 64;
      const tsCtx = topSignCanvas.getContext('2d');
      tsCtx.fillStyle = config.color;
      tsCtx.fillRect(0, 0, 256, 64);
      tsCtx.fillStyle = '#ffffff';
      tsCtx.font = 'bold 24px sans-serif';
      tsCtx.textAlign = 'center';
      tsCtx.fillText(config.name || 'COLD DRINKS', 128, 42);
      const topSign = new THREE.Mesh(
        new THREE.BoxGeometry(config.w, 0.28, 0.05),
        new THREE.MeshStandardMaterial({ map: createCanvasTexture(topSignCanvas), emissive: config.color, emissiveIntensity: 0.3 })
      );
      topSign.position.set(0, config.h + 0.14, config.d / 2);
      shelfGroup.add(topSign);

      const fridgeItem = ITEM_DEFINITIONS[config.itemId];
      const fridgePriceCanvas = document.createElement('canvas');
      fridgePriceCanvas.width = 192; fridgePriceCanvas.height = 56;
      const fridgePriceCtx = fridgePriceCanvas.getContext('2d');
      fridgePriceCtx.fillStyle = '#fffdf2';
      fridgePriceCtx.fillRect(0, 0, 192, 56);
      fridgePriceCtx.fillStyle = config.color;
      fridgePriceCtx.fillRect(0, 0, 14, 56);
      fridgePriceCtx.strokeStyle = '#d4b483';
      fridgePriceCtx.lineWidth = 3;
      fridgePriceCtx.strokeRect(1.5, 1.5, 189, 53);
      fridgePriceCtx.fillStyle = '#b45309';
      fridgePriceCtx.font = '900 22px sans-serif';
      fridgePriceCtx.textAlign = 'center';
      fridgePriceCtx.fillText(`NT$ ${fridgeItem?.currentPrice || 35}`, 104, 36);
      const fridgePriceTag = new THREE.Mesh(
        new THREE.PlaneGeometry(0.68, 0.2),
        new THREE.MeshBasicMaterial({ map: createCanvasTexture(fridgePriceCanvas), transparent: true })
      );
      fridgePriceTag.position.set(0, 0.16, config.d / 2 + 0.055);
      shelfGroup.add(fridgePriceTag);

      const itemsGroup = new THREE.Group();
      shelfGroup.add(itemsGroup);
      const iconSprite = this.createFloatingShelfIcon(config.category);
      iconSprite.position.set(0, config.h + 0.7, 0);
      shelfGroup.add(iconSprite);
      (this.interiorRoot || this.scene).add(shelfGroup);

      const shelfData = {
        id: config.id, name: config.name, itemId: config.itemId, category: config.category,
        capacity: config.capacity, currentCount: config.currentCount,
        worldPos: config.pos.clone(), customerApproachPos: config.approachPos.clone(),
        shelfGroup, shelfMesh: body, signMesh: ledBar, bodyMat: metalMat,
        itemsGroup, iconSprite, promoSprite: null, promoType: null, config
      };
      const uData = { isShelf: true, shelfId: config.id };
      body.userData = uData; shelfGroup.userData = uData;
      shelfGroup.traverse(child => { child.userData = uData; });
      this.shelves[config.id] = shelfData;
      this.interactiveShelves.push(body);
      this.refreshShelfItems(config.id);
      return;
    }

    // ── 一般貨架：深色木框 + 多層金屬隔板 ──
    // 側板 (左右)
    const woodMat = new THREE.MeshStandardMaterial({ color: '#8b6340', roughness: 0.55 });
    [-config.d / 2 + 0.06, config.d / 2 - 0.06].forEach(pz => {
      const sidePanel = new THREE.Mesh(
        new THREE.BoxGeometry(config.w, config.h, 0.06), woodMat
      );
      sidePanel.position.set(0, config.h / 2, pz);
      sidePanel.castShadow = true; sidePanel.receiveShadow = true;
      shelfGroup.add(sidePanel);
    });

    // 背板
    const backPanel = new THREE.Mesh(
      new THREE.BoxGeometry(0.06, config.h, config.d), woodMat
    );
    backPanel.position.set(-config.w / 2 + 0.03, config.h / 2, 0);
    shelfGroup.add(backPanel);

    // 底板
    const basePanel = new THREE.Mesh(
      new THREE.BoxGeometry(config.w, 0.06, config.d), woodMat
    );
    basePanel.position.set(0, 0.03, 0);
    basePanel.receiveShadow = true;
    shelfGroup.add(basePanel);

    // 多層金屬隔板
    const shelfMat = new THREE.MeshStandardMaterial({ color: '#d1d5db', roughness: 0.4, metalness: 0.5 });
    const layers = config.h > 1.5 ? 3 : 2;
    const layerY = config.h / (layers + 1);
    for (let l = 0; l <= layers; l++) {
      const shelf = new THREE.Mesh(
        new THREE.BoxGeometry(config.w - 0.1, 0.04, config.d - 0.1), shelfMat
      );
      shelf.position.set(0, l * layerY + 0.04, 0);
      shelfGroup.add(shelf);
    }

    // 頂部彩色分類招牌
    const signCanvas = document.createElement('canvas');
    signCanvas.width = 512; signCanvas.height = 80;
    const sCtx = signCanvas.getContext('2d');
    // 漸層底色
    const signGrad = sCtx.createLinearGradient(0, 0, 512, 0);
    signGrad.addColorStop(0, config.color);
    signGrad.addColorStop(1, config.color + 'cc');
    sCtx.fillStyle = signGrad;
    sCtx.fillRect(0, 0, 512, 80);
    // 白色文字
    sCtx.fillStyle = '#ffffff';
    sCtx.font = 'bold 36px sans-serif';
    sCtx.textAlign = 'center';
    sCtx.shadowColor = 'rgba(0,0,0,0.3)';
    sCtx.shadowBlur = 6;
    sCtx.fillText(config.name || config.category, 256, 55);
    const signMesh = new THREE.Mesh(
      new THREE.BoxGeometry(config.w, 0.28, config.d - 0.15),
      new THREE.MeshStandardMaterial({
        map: createCanvasTexture(signCanvas),
        emissive: config.color, emissiveIntensity: 0.3, roughness: 0.3
      })
    );
    signMesh.position.y = config.h + 0.14;
    shelfGroup.add(signMesh);

    // 貨架頂部發光 LED 條
    const ledMat = new THREE.MeshStandardMaterial({
      color: '#ffffff', emissive: '#fff8e1', emissiveIntensity: 0.8, roughness: 0.1
    });
    const ledStrip = new THREE.Mesh(new THREE.BoxGeometry(config.w - 0.1, 0.03, 0.06), ledMat);
    ledStrip.position.set(0, config.h + 0.015, config.d / 2 - 0.1);
    shelfGroup.add(ledStrip);

    const displayLight = new THREE.PointLight(new THREE.Color(config.color), 0.22, 2.6);
    displayLight.position.set(0, config.h * 0.58, config.d / 2 + 0.18);
    shelfGroup.add(displayLight);

    // 底部價格標籤橫條
    const priceMat = new THREE.MeshStandardMaterial({ color: '#fef9c3', roughness: 0.5 });
    for (let l = 0; l < layers; l++) {
      const priceBar = new THREE.Mesh(new THREE.BoxGeometry(config.w - 0.1, 0.05, 0.04), priceMat);
      priceBar.position.set(0, l * layerY + 0.065, config.d / 2 - 0.06);
      shelfGroup.add(priceBar);

      // 每層獨立的價格小卡，讓貨架不再只是色塊，而是有零售陳列的資訊層次。
      const itemDef = ITEM_DEFINITIONS[config.itemId];
      const priceCanvas = document.createElement('canvas');
      priceCanvas.width = 256; priceCanvas.height = 64;
      const priceCtx = priceCanvas.getContext('2d');
      priceCtx.fillStyle = '#fffdf2';
      priceCtx.fillRect(0, 0, 256, 64);
      priceCtx.fillStyle = config.color;
      priceCtx.fillRect(0, 0, 18, 64);
      priceCtx.strokeStyle = '#d4b483';
      priceCtx.lineWidth = 4;
      priceCtx.strokeRect(2, 2, 252, 60);
      priceCtx.fillStyle = '#6b4f38';
      priceCtx.font = '700 22px sans-serif';
      priceCtx.textAlign = 'left';
      priceCtx.fillText(itemDef?.category || config.category, 28, 25);
      priceCtx.fillStyle = '#b45309';
      priceCtx.font = '900 25px sans-serif';
      priceCtx.fillText(`NT$ ${itemDef?.currentPrice || 35}`, 28, 51);
      const priceLabel = new THREE.Mesh(
        new THREE.PlaneGeometry(Math.min(0.98, Math.max(0.48, config.w - 0.12)), 0.2),
        new THREE.MeshBasicMaterial({ map: createCanvasTexture(priceCanvas), transparent: true })
      );
      priceLabel.position.set(0, l * layerY + 0.13, config.d / 2 + 0.012);
      shelfGroup.add(priceLabel);
    }

    // 木框四角加上細金屬包邊，放大視角後能看見結構而不是平面色塊。
    const trimMat = new THREE.MeshStandardMaterial({ color: '#c79c6e', metalness: 0.35, roughness: 0.32 });
    [-config.w / 2 + 0.035, config.w / 2 - 0.035].forEach(px => {
      const trim = new THREE.Mesh(new THREE.BoxGeometry(0.035, config.h, 0.035), trimMat);
      trim.position.set(px, config.h / 2, config.d / 2 + 0.035);
      shelfGroup.add(trim);
    });

    // 背板廣告海報 (僅非冰箱)
    if (!isOden) {
      const posterTypes = ['sale', 'new', 'combo', 'limited'];
      const posterType = posterTypes[Math.floor(Math.random() * posterTypes.length)];
      const posterTex = createPromoPosterTexture(posterType);
      const poster = new THREE.Mesh(
        new THREE.BoxGeometry(config.w - 0.1, config.h - 0.1, 0.02),
        new THREE.MeshStandardMaterial({ map: posterTex, roughness: 0.8 })
      );
      poster.position.set(0, config.h / 2, -config.d / 2 + 0.05);
      shelfGroup.add(poster);
    }

    // 商品群組
    const itemsGroup = new THREE.Group();
    shelfGroup.add(itemsGroup);

    // 浮動圖示
    const iconSprite = this.createFloatingShelfIcon(config.category);
    iconSprite.position.set(0, config.h + 0.7, 0);
    shelfGroup.add(iconSprite);

    // 主體碰撞用的 invisible 大框 mesh
    const body = new THREE.Mesh(
      new THREE.BoxGeometry(config.w, config.h, config.d),
      new THREE.MeshStandardMaterial({ visible: false })
    );
    body.position.y = config.h / 2;
    shelfGroup.add(body);

    (this.interiorRoot || this.scene).add(shelfGroup);

    const shelfData = {
      id: config.id, name: config.name, itemId: config.itemId, category: config.category,
      capacity: config.capacity, currentCount: config.currentCount,
      worldPos: config.pos.clone(), customerApproachPos: config.approachPos.clone(),
      shelfGroup, shelfMesh: body, signMesh, bodyMat: woodMat,
      itemsGroup, iconSprite, promoSprite: null, promoType: null, config
    };

    const uData = { isShelf: true, shelfId: config.id };
    body.userData = uData; shelfGroup.userData = uData;
    shelfGroup.traverse(child => { child.userData = uData; });
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

    const spriteMat = new THREE.SpriteMaterial({ map: createCanvasTexture(canvas), transparent: true });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.scale.set(1.2, 1.2, 1);
    return sprite;
  }

  // 刷新貨架上的精緻 3D 商品模型 (多層隔板整齊排列)
  refreshShelfItems(shelfId) {
    const shelf = this.shelves[shelfId];
    if (!shelf) return;

    if (shelf.stockBadge) {
      this.updateStockBadge(shelf.stockBadge, shelf.currentCount, shelf.capacity, shelf.config.color);
    }

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
          new THREE.SpriteMaterial({ map: createCanvasTexture(steamCanvas), transparent: true })
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

    // 商品在放大展示鏡頭下仍要辨識得到輪廓、標籤與瓶蓋細節。
    group.scale.set(1.08, 1.08, 1.08);
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
    // 圓滾滾蓬鬆大綠樹 (如參考圖左上角可愛圓球狀樹冠)
    // 進貨紙箱送達點 (店外右前側空地 X = 5.2, Z = 7.8)
    this.deliveryAreaPos = new THREE.Vector3(7.9, 0, 9.55);

    // 卸貨區可愛地面標示圈
    const ringMat = new THREE.MeshBasicMaterial({ color: '#f59e0b', transparent: true, opacity: 0.7 });
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.9, 1.1, 24), ringMat);
    ring.rotation.x = -Math.PI / 2;
    ring.position.copy(this.deliveryAreaPos).setY(0.02);
    this.scene.add(ring);
  }

  // 產生 3D 進貨紙箱 (支援滑鼠點擊直接補貨)
  buildPerimeterMarketStreet() {
    const pathMat = new THREE.MeshStandardMaterial({ color: '#d7ded5', roughness: 0.92 });
    const seamMat = new THREE.MeshStandardMaterial({ color: '#b9c4b9', roughness: 0.95 });
    const curbMat = new THREE.MeshStandardMaterial({ color: '#8fa096', roughness: 0.82 });
    const roadMat = new THREE.MeshStandardMaterial({ color: '#59636b', roughness: 0.96 });
    const sidewalkCenter = MARKET_SCENE_LAYOUT.sidewalkCenter;
    const sidewalkDepth = MARKET_SCENE_LAYOUT.sidewalkDepth;
    const curbCenter = sidewalkCenter + sidewalkDepth / 2 + 0.03;
    const roadCenter = MARKET_SCENE_LAYOUT.outerRoadCenter;
    const roadWidth = MARKET_SCENE_LAYOUT.outerRoadWidth;

    const addPanel = (x, z, width, depth, material, y = -0.015) => {
      const panel = new THREE.Mesh(new THREE.BoxGeometry(width, 0.06, depth), material);
      panel.position.set(x, y, z);
      panel.receiveShadow = true;
      this.scene.add(panel);
      return panel;
    };

    // The light ring is the pedestrian sidewalk. Keep road material outside it.
    [
      { x: 0, z: sidewalkCenter, width: 24.5, depth: sidewalkDepth },
      { x: 0, z: -sidewalkCenter, width: 24.5, depth: sidewalkDepth },
      { x: sidewalkCenter, z: 0, width: sidewalkDepth, depth: 17.5 },
      { x: -sidewalkCenter, z: 0, width: sidewalkDepth, depth: 17.5 }
    ].forEach(({ x, z, width, depth }) => addPanel(x, z, width, depth, pathMat));

    // A dark outer strip fills the road beneath the KayKit road tiles.
    [
      { x: 0, z: roadCenter, width: 25.5, depth: roadWidth },
      { x: 0, z: -roadCenter, width: 25.5, depth: roadWidth },
      { x: roadCenter, z: 0, width: roadWidth, depth: 25.0 },
      { x: -roadCenter, z: 0, width: roadWidth, depth: 25.0 }
    ].forEach(({ x, z, width, depth }) => addPanel(x, z, width, depth, roadMat, 0.005));

    // Paving seams and raised edges add scale cues around the store footprint.
    for (let x = -11.4; x <= 11.4; x += 1.9) {
      addPanel(x, sidewalkCenter, 0.025, sidewalkDepth - 0.13, seamMat, 0.026);
      addPanel(x, -sidewalkCenter, 0.025, sidewalkDepth - 0.13, seamMat, 0.026);
    }
    for (let z = -8.4; z <= 8.4; z += 1.9) {
      addPanel(sidewalkCenter, z, sidewalkDepth - 0.13, 0.025, seamMat, 0.026);
      addPanel(-sidewalkCenter, z, sidewalkDepth - 0.13, 0.025, seamMat, 0.026);
    }
    addPanel(0, curbCenter, 24.5, 0.12, curbMat, 0.03);
    addPanel(0, -curbCenter, 24.5, 0.12, curbMat, 0.03);
    addPanel(curbCenter, 0, 0.12, 17.5, curbMat, 0.03);
    addPanel(-curbCenter, 0, 0.12, 17.5, curbMat, 0.03);

    const addPlanter = (x, z, accent) => {
      const planterGroup = new THREE.Group();
      planterGroup.position.set(x, 0, z);

      const baseMat = new THREE.MeshStandardMaterial({ color: '#7c5a43', roughness: 0.72 });
      const rimMat = new THREE.MeshStandardMaterial({ color: '#d8a36d', roughness: 0.56 });
      const soilMat = new THREE.MeshStandardMaterial({ color: '#4b3628', roughness: 1 });
      const base = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.34, 0.95), baseMat);
      base.position.y = 0.17;
      planterGroup.add(base);
      const rim = new THREE.Mesh(new THREE.BoxGeometry(1.08, 0.1, 1.08), rimMat);
      rim.position.y = 0.39;
      planterGroup.add(rim);
      const soil = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.38, 0.08, 12), soilMat);
      soil.position.y = 0.48;
      planterGroup.add(soil);

      [-0.18, 0.05, 0.23].forEach((offset, index) => {
        const stem = new THREE.Mesh(
          new THREE.CylinderGeometry(0.025, 0.035, 0.5 + index * 0.08, 6),
          new THREE.MeshStandardMaterial({ color: '#3f6f49', roughness: 0.9 })
        );
        stem.position.set(offset, 0.76 + index * 0.04, index % 2 === 0 ? -0.08 : 0.08);
        planterGroup.add(stem);
        const flower = new THREE.Mesh(
          new THREE.SphereGeometry(0.13, 10, 8),
          new THREE.MeshStandardMaterial({ color: index === 1 ? '#fbbf24' : accent, roughness: 0.62 })
        );
        flower.position.set(offset, 1.06 + index * 0.08, index % 2 === 0 ? -0.08 : 0.08);
        planterGroup.add(flower);
      });

      this.scene.add(planterGroup);
    };

    const addTree = (x, z, scale = 1) => {
      const treeGroup = new THREE.Group();
      treeGroup.position.set(x, 0, z);
      treeGroup.scale.setScalar(scale);
      const trunkMat = new THREE.MeshStandardMaterial({ color: '#84552f', roughness: 0.82 });
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.3, 1.9, 8), trunkMat);
      trunk.position.y = 0.95;
      treeGroup.add(trunk);
      const leafMat = new THREE.MeshStandardMaterial({ color: '#4f8f38', roughness: 0.78 });
      [
        [-0.42, 2.25, 0, 0.72],
        [0.35, 2.35, 0.02, 0.76],
        [0, 2.8, -0.08, 0.72]
      ].forEach(([xOffset, y, zOffset, radius]) => {
        const leaves = new THREE.Mesh(new THREE.SphereGeometry(radius, 14, 12), leafMat);
        leaves.position.set(xOffset, y, zOffset);
        treeGroup.add(leaves);
      });
      this.scene.add(treeGroup);
    };

    const addDisplayStand = (x, z, accent, label) => {
      const standGroup = new THREE.Group();
      standGroup.position.set(x, 0, z);

      const woodMat = new THREE.MeshStandardMaterial({ color: '#a86f42', roughness: 0.7 });
      const accentMat = new THREE.MeshStandardMaterial({ color: accent, roughness: 0.48, metalness: 0.08 });
      const deck = new THREE.Mesh(new THREE.BoxGeometry(2.55, 0.14, 1.05), woodMat);
      deck.position.y = 0.52;
      deck.castShadow = true;
      standGroup.add(deck);
      [-1.05, 1.05].forEach(px => {
        const leg = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.54, 0.1), woodMat);
        leg.position.set(px, 0.27, 0);
        standGroup.add(leg);
      });

      const canopy = new THREE.Mesh(new THREE.BoxGeometry(2.7, 0.1, 1.2), accentMat);
      canopy.position.y = 2.0;
      canopy.castShadow = true;
      standGroup.add(canopy);
      [-1.18, 1.18].forEach(px => {
        const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.045, 1.48, 8), accentMat);
        pole.position.set(px, 1.25, 0);
        standGroup.add(pole);
      });

      [-0.78, 0, 0.78].forEach((px, index) => {
        const crate = new THREE.Mesh(
          new THREE.BoxGeometry(0.56, 0.36, 0.56),
          new THREE.MeshStandardMaterial({ color: ['#f59e0b', '#fb7185', '#34d399'][index], roughness: 0.72 })
        );
        crate.position.set(px, 0.77, 0.04);
        crate.castShadow = true;
        standGroup.add(crate);
        const product = new THREE.Mesh(
          new THREE.SphereGeometry(0.16, 10, 8),
          new THREE.MeshStandardMaterial({ color: index === 1 ? '#fde68a' : '#fef3c7', roughness: 0.58 })
        );
        product.position.set(px, 1.04, 0.04);
        standGroup.add(product);
      });

      const signCanvas = document.createElement('canvas');
      signCanvas.width = 420;
      signCanvas.height = 92;
      const signCtx = signCanvas.getContext('2d');
      signCtx.fillStyle = '#fffaf0';
      signCtx.fillRect(0, 0, signCanvas.width, signCanvas.height);
      signCtx.fillStyle = accent;
      signCtx.fillRect(0, 0, 24, signCanvas.height);
      signCtx.fillStyle = '#4a3424';
      signCtx.font = '900 28px sans-serif';
      signCtx.textAlign = 'center';
      signCtx.textBaseline = 'middle';
      signCtx.fillText(label, 220, 46);
      const sign = new THREE.Mesh(
        new THREE.BoxGeometry(1.9, 0.42, 0.045),
        new THREE.MeshStandardMaterial({ map: createCanvasTexture(signCanvas), roughness: 0.5 })
      );
      sign.position.set(0, 1.7, 0.53);
      standGroup.add(sign);
      this.scene.add(standGroup);
    };

    const addStreetLamp = (x, z) => {
      const lampGroup = new THREE.Group();
      lampGroup.position.set(x, 0, z);
      const metalMat = new THREE.MeshStandardMaterial({ color: '#315344', roughness: 0.42, metalness: 0.55 });
      const base = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.34, 0.3, 10), metalMat);
      base.position.y = 0.15;
      lampGroup.add(base);
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.09, 3.2, 10), metalMat);
      pole.position.y = 1.75;
      lampGroup.add(pole);
      const arm = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.07, 0.07), metalMat);
      arm.position.set(0.24, 3.3, 0);
      lampGroup.add(arm);
      const glowMat = new THREE.MeshStandardMaterial({ color: '#fff7c2', emissive: '#fbbf24', emissiveIntensity: 1.2, roughness: 0.2 });
      const lantern = new THREE.Mesh(new THREE.SphereGeometry(0.18, 10, 8), glowMat);
      lantern.position.set(0.54, 3.22, 0);
      lampGroup.add(lantern);
      const light = new THREE.PointLight(0xfef08a, 0.65, 8);
      light.position.set(0.54, 3.2, 0);
      lampGroup.add(light);
      this.scene.add(lampGroup);
    };

    const addParcelLocker = (x, z) => {
      const lockerGroup = new THREE.Group();
      lockerGroup.position.set(x, 0, z);
      const bodyMat = new THREE.MeshStandardMaterial({ color: '#64748b', roughness: 0.35, metalness: 0.45 });
      const body = new THREE.Mesh(new THREE.BoxGeometry(1.25, 1.55, 0.65), bodyMat);
      body.position.y = 0.78;
      body.castShadow = true;
      lockerGroup.add(body);
      const frontMat = new THREE.MeshStandardMaterial({ color: '#e0f2fe', roughness: 0.3, metalness: 0.2 });
      [0.45, 0.88, 1.31].forEach((y, row) => {
        [-0.31, 0.31].forEach((xOffset, col) => {
          const slot = new THREE.Mesh(new THREE.BoxGeometry(0.43, 0.27, 0.035), frontMat);
          slot.position.set(xOffset, y, 0.34);
          lockerGroup.add(slot);
          const slotLight = new THREE.Mesh(
            new THREE.BoxGeometry(0.1, 0.025, 0.02),
            new THREE.MeshBasicMaterial({ color: (row + col) % 2 === 0 ? '#22c55e' : '#f59e0b' })
          );
          slotLight.position.set(xOffset, y + 0.07, 0.365);
          lockerGroup.add(slotLight);
        });
      });
      const top = new THREE.Mesh(new THREE.BoxGeometry(1.42, 0.18, 0.75), new THREE.MeshStandardMaterial({ color: '#f97316', roughness: 0.45 }));
      top.position.y = 1.65;
      lockerGroup.add(top);
      this.scene.add(lockerGroup);
    };

    const addCartBay = (x, z) => {
      const bayGroup = new THREE.Group();
      bayGroup.position.set(x, 0, z);
      const railMat = new THREE.MeshStandardMaterial({ color: '#334155', roughness: 0.3, metalness: 0.65 });
      const base = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.08, 0.72), railMat);
      base.position.y = 0.04;
      bayGroup.add(base);
      [-0.92, 0.92].forEach(px => {
        const rail = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.74, 0.08), railMat);
        rail.position.set(px, 0.37, 0);
        bayGroup.add(rail);
      });
      [-0.54, 0.36].forEach(px => {
        const cart = new THREE.Group();
        const basketMat = new THREE.MeshStandardMaterial({ color: '#cbd5e1', roughness: 0.28, metalness: 0.7, transparent: true, opacity: 0.82 });
        const basket = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.32, 0.46), basketMat);
        basket.position.y = 0.48;
        cart.add(basket);
        const handle = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.55), railMat);
        handle.position.set(0.38, 0.74, 0);
        cart.add(handle);
        const wheelMat = new THREE.MeshStandardMaterial({ color: '#1e293b', roughness: 0.45 });
        [-0.26, 0.26].forEach(wz => {
          const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.06, 10), wheelMat);
          wheel.rotation.x = Math.PI / 2;
          wheel.position.set(-0.18, 0.16, wz);
          cart.add(wheel);
        });
        cart.position.x = px;
        bayGroup.add(cart);
      });
      this.scene.add(bayGroup);
    };

    addPlanter(-10.75, 10.75, '#f472b6');
    addPlanter(10.75, 10.75, '#60a5fa');
    addPlanter(-10.75, -10.75, '#a78bfa');
    addPlanter(10.75, -10.75, '#fb923c');
    addParcelLocker(10.9, 1.7);
    addCartBay(-10.9, 2.2);
  }

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

    const hintSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: createCanvasTexture(hintCanvas), transparent: true }));
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
    if (modelManager.hasStoreAsset('storeSignFascia')) {
      this.addImportedAsset('storeSignFascia', {
        id: 'store-sign-fascia',
        position: new THREE.Vector3(0, 3.45, 6.7),
        scale: { x: 3.2, y: 1, z: 1 }
      });
      return;
    }

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
    mat.userData.isStoreInterior = true;
    mat.receiveShadow = true;
    this.scene.add(mat);
  }

  // 門面遮雨棚：用有節奏的色塊與小燈泡增加影片式的店面焦點。
  buildFrontAwning() {
    const canopyGroup = new THREE.Group();
    canopyGroup.position.set(0, 3.05, 7.05);

    const stripeColors = ['#f97316', '#fff7ed', '#2d6a50', '#fff7ed', '#f97316', '#fff7ed', '#2d6a50'];
    stripeColors.forEach((color, index) => {
      const stripe = new THREE.Mesh(
        new THREE.BoxGeometry(0.82, 0.18, 0.58),
        new THREE.MeshStandardMaterial({ color, roughness: 0.42 })
      );
      stripe.position.set((index - 3) * 0.74, 0, 0);
      stripe.rotation.z = (index % 2 === 0 ? 1 : -1) * 0.035;
      stripe.castShadow = true;
      canopyGroup.add(stripe);
    });

    const canopyTop = new THREE.Mesh(
      new THREE.BoxGeometry(5.35, 0.12, 0.62),
      new THREE.MeshStandardMaterial({ color: '#3f5f4c', roughness: 0.36, metalness: 0.12 })
    );
    canopyTop.position.y = 0.13;
    canopyGroup.add(canopyTop);

    const bulbMat = new THREE.MeshStandardMaterial({
      color: '#fff7c2',
      emissive: '#fbbf24',
      emissiveIntensity: 1.3,
      roughness: 0.2
    });
    [-1.8, -0.6, 0.6, 1.8].forEach(x => {
      const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.055, 10, 8), bulbMat);
      bulb.position.set(x, -0.13, 0.28);
      canopyGroup.add(bulb);
    });

    this.scene.add(canopyGroup);
  }

  // 地面導視貼花：把空間分成飲料、零食、鮮食三個小區域，讓畫面更像完整的商店展示。
  buildAisleWayfinding() {
    const markers = [
      { label: '飲料  DRINKS', color: '#0f766e', x: -3.8, z: -0.25 },
      { label: '零食  SNACKS', color: '#c2410c', x: 2.8, z: 1.85 },
      { label: '鮮食  FRESH', color: '#be123c', x: 0.5, z: -2.5 }
    ];

    markers.forEach(marker => {
      const canvas = document.createElement('canvas');
      canvas.width = 512; canvas.height = 128;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, 512, 128);
      ctx.fillStyle = 'rgba(255, 253, 249, 0.9)';
      roundedRectPath(ctx, 8, 8, 496, 112, 28);
      ctx.fill();
      ctx.strokeStyle = marker.color;
      ctx.lineWidth = 8;
      ctx.stroke();
      ctx.fillStyle = marker.color;
      ctx.beginPath();
      ctx.moveTo(34, 64); ctx.lineTo(60, 42); ctx.lineTo(60, 55); ctx.lineTo(84, 55);
      ctx.lineTo(84, 73); ctx.lineTo(60, 73); ctx.lineTo(60, 86); ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#4a3424';
      ctx.font = '900 31px "Noto Sans TC", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(marker.label, 294, 65);

      const decal = new THREE.Mesh(
        new THREE.PlaneGeometry(1.75, 0.44),
        new THREE.MeshBasicMaterial({ map: createCanvasTexture(canvas), transparent: true, depthWrite: false })
      );
      decal.rotation.x = -Math.PI / 2;
      decal.position.set(marker.x, 0.028, marker.z);
      this.scene.add(decal);
    });
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
    vendGroup.position.set(-3.0, 0, 9.55);
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
    stationGroup.position.set(3.2, 0, 9.55);

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
    if (modelManager.hasStoreAsset('atm')) {
      const atmGroup = this.addImportedAsset('atm', {
        id: 'atm_1',
        position: new THREE.Vector3(-6.2, 0, 4.0),
        rotation: new THREE.Euler(0, Math.PI / 2, 0)
      });
      this.registerImportedDecoration('atm_1', atmGroup, '24H ATM', 'Main prop');
      return;
    }

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
    if (modelManager.hasStoreAsset('magazineRack')) {
      const magGroup = this.addImportedAsset('magazineRack', {
        id: 'magazine_1',
        position: new THREE.Vector3(6.2, 0, -3.8),
        rotation: new THREE.Euler(0, -Math.PI / 2, 0)
      });
      this.registerImportedDecoration('magazine_1', magGroup, 'Magazine rack', 'Main prop');
      return;
    }

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

      const bannerTex = createCanvasTexture(canvas);
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
  buildImportedRetailProps() {
    const props = [
      { key: 'lotteryStand', id: 'lottery_1', name: 'Lottery stand', position: new THREE.Vector3(-4.55, 0, 5.55), rotation: new THREE.Euler(0, Math.PI / 2, 0) },
      { key: 'customerLockers', id: 'lockers_1', name: 'Customer lockers', position: new THREE.Vector3(5.35, 0, 5.5), rotation: new THREE.Euler(0, -Math.PI / 2, 0) },
      { key: 'flowerBucket', id: 'flower_1', name: 'Flower stand', position: new THREE.Vector3(4.45, 0, 5.55) },
      { key: 'promoPallet', id: 'promo_pallet_1', name: 'Promotional display', position: new THREE.Vector3(-2.25, 0, 4.85), scale: 0.9 },
      { key: 'impulseShelf', id: 'impulse_1', name: 'Impulse shelf', position: new THREE.Vector3(2.65, 0, 5.65), rotation: new THREE.Euler(0, Math.PI, 0) }
    ];

    props.forEach(({ key, id, name, position, rotation, scale }) => {
      if (!modelManager.hasStoreAsset(key)) return;
      const group = this.addImportedAsset(key, { id, position, rotation, scale });
      this.registerImportedDecoration(id, group, name, 'Main prop');
    });
  }

  buildImportedStaffDecor() {
    const staff = [
      {
        key: 'characterShelfStacker',
        id: 'staff_shelf_stacker',
        role: 'Shelf stacker',
        position: new THREE.Vector3(-4.45, 0, 0.15),
        rotation: new THREE.Euler(0, Math.PI / 2, 0),
        scale: 0.9,
        accent: '#f59e0b'
      },
      {
        key: 'characterDeliAssistant',
        id: 'staff_deli_assistant',
        role: 'Deli assistant',
        position: new THREE.Vector3(-4.6, 0, -5.55),
        rotation: new THREE.Euler(0, 0, 0),
        scale: 0.9,
        accent: '#ef4444'
      },
      {
        key: 'characterSecurityGuard',
        id: 'staff_security_guard',
        role: 'Security guard',
        position: new THREE.Vector3(3.25, 0, 6.05),
        rotation: new THREE.Euler(0, Math.PI, 0),
        scale: 0.92,
        accent: '#0f766e'
      }
    ];

    staff.forEach(({ key, id, role, position, rotation, scale, accent }) => {
      if (!modelManager.hasStoreAsset(key)) return;
      const group = this.addImportedAsset(key, { id, position, rotation, scale });
      if (!group) return;

      const badge = new THREE.Mesh(
        new THREE.BoxGeometry(0.11, 0.07, 0.018),
        new THREE.MeshStandardMaterial({ color: accent, roughness: 0.45 })
      );
      badge.position.set(0.11, 0.91, 0.42);
      badge.castShadow = true;
      group.add(badge);
      group.userData = { isStaff: true, role };
    });
  }

  buildKenneyMiniMarketDecor() {
    const addProp = (key, id, position, scale = 1, rotation = 0) => {
      if (!modelManager.hasStoreAsset(key)) return null;
      const group = this.addImportedAsset(key, {
        id,
        position,
        rotation: new THREE.Euler(0, rotation, 0),
        scale
      });
      if (!group) return null;
      group.userData = { isScenery: true, source: 'Kenney Mini Market' };
      group.traverse(child => {
        child.userData = { ...child.userData, isScenery: true, source: 'Kenney Mini Market' };
      });
      return group;
    };

    // The register enriches the existing counter without becoming a second
    // draggable decoration. The remaining props form a compact market strip
    // on the front sidewalk, outside the walkable floor/nav-grid.
    addProp(
      'kenneyCashRegister',
      'kenney_cash_register',
      new THREE.Vector3(1.85, 1.1, -4.55),
      0.78,
      Math.PI
    );
    addProp(
      'kenneyDisplayBread',
      'kenney_bread_display',
      new THREE.Vector3(-5.65, 0, 9.55),
      1.35,
      Math.PI
    );
    addProp(
      'kenneyDisplayFruit',
      'kenney_fruit_display',
      new THREE.Vector3(-4.35, 0, 9.55),
      1.35,
      Math.PI
    );
    addProp(
      'kenneyBottleReturn',
      'kenney_bottle_return',
      new THREE.Vector3(-7.0, 0, 9.55),
      1.25,
      Math.PI
    );
    addProp(
      'kenneyFreezersStanding',
      'kenney_front_freezer',
      new THREE.Vector3(4.65, 0, 9.55),
      1.2,
      Math.PI
    );
    addProp(
      'kenneyShoppingCart',
      'kenney_shopping_cart',
      new THREE.Vector3(5.95, 0, 9.55),
      1.35,
      Math.PI / 2
    );
    addProp(
      'kenneyShoppingBasket',
      'kenney_shopping_basket',
      new THREE.Vector3(6.75, 0, 9.55),
      1.4,
      Math.PI / 2
    );
  }

  buildKayKitStreetScenery() {
    const addStreetAsset = (key, id, position, scale = 1, rotation = 0) => {
      if (!modelManager.hasStoreAsset(key)) return null;
      const group = this.addImportedAsset(key, {
        id,
        position,
        rotation: new THREE.Euler(0, rotation, 0),
        scale
      });
      if (!group) return null;
      group.userData = { isScenery: true, source: 'KayKit City Builder Bits' };
      group.traverse(child => {
        child.userData = { ...child.userData, isScenery: true, source: 'KayKit City Builder Bits' };
      });
      return group;
    };

    // Road tiles belong to the outer road band only. The light ring between
    // the shop and this band remains a pedestrian sidewalk.
    const roadScale = 1.08;
    const roadCenter = MARKET_SCENE_LAYOUT.outerRoadCenter;
    const roadRotationAlongX = MARKET_SCENE_LAYOUT.roadTileRotationAlongX;
    const roadRotationAlongZ = MARKET_SCENE_LAYOUT.roadTileRotationAlongZ;
    const roadAxisPositions = [];
    for (let axis = -11.4; axis <= 11.4; axis += 2.28) {
      roadAxisPositions.push(Number(axis.toFixed(2)));
    }

    roadAxisPositions.forEach((x, index) => {
      addStreetAsset(
        index === Math.floor(roadAxisPositions.length / 2) ? 'cityRoadCrossing' : 'cityRoadStraight',
        `city_road_front_${index}`,
        new THREE.Vector3(x, 0, roadCenter),
        roadScale,
        roadRotationAlongX
      );
      addStreetAsset(
        'cityRoadStraight',
        `city_road_back_${index}`,
        new THREE.Vector3(x, 0, -roadCenter),
        roadScale,
        roadRotationAlongX
      );
    });

    roadAxisPositions.forEach((z, index) => {
      addStreetAsset(
        'cityRoadStraight',
        `city_road_right_${index}`,
        new THREE.Vector3(roadCenter, 0, z),
        roadScale,
        roadRotationAlongZ
      );
      addStreetAsset(
        'cityRoadStraight',
        `city_road_left_${index}`,
        new THREE.Vector3(-roadCenter, 0, z),
        roadScale,
        roadRotationAlongZ
      );
    });

    [
      [roadCenter, roadCenter, 0],
      [-roadCenter, roadCenter, Math.PI / 2],
      [roadCenter, -roadCenter, -Math.PI / 2],
      [-roadCenter, -roadCenter, Math.PI]
    ].forEach(([x, z, rotation], index) => {
      addStreetAsset(
        'cityRoadCorner',
        `city_road_corner_${index}`,
        new THREE.Vector3(x, 0, z),
        roadScale,
        rotation
      );
    });

    // Keep the background as a small neighbourhood backdrop rather than a
    // collection of unrelated landmarks.
    addStreetAsset('cityBuildingA', 'city_building_a', new THREE.Vector3(-8.6, 0, -13.05), 2.2, 0);
    addStreetAsset('cityBuildingB', 'city_building_b', new THREE.Vector3(8.6, 0, -13.05), 2.2, Math.PI);

    addStreetAsset('cityCarStationwagon', 'city_car_stationwagon', new THREE.Vector3(-5.9, 0.08, MARKET_SCENE_LAYOUT.outerRoadCenter), 2.45, Math.PI / 2);
    addStreetAsset('cityCarTaxi', 'city_car_taxi', new THREE.Vector3(5.75, 0.08, MARKET_SCENE_LAYOUT.outerRoadCenter), 2.45, -Math.PI / 2);
    addStreetAsset('cityStreetlight', 'city_streetlight', new THREE.Vector3(10.55, 0, 6.3), 3.1, 0);
    addStreetAsset('cityStreetlight', 'city_streetlight_left', new THREE.Vector3(-10.55, 0, -6.3), 3.1, Math.PI);
    addStreetAsset('cityTrafficlight', 'city_traffic_light', new THREE.Vector3(11.45, 0, 11.45), 2.7, Math.PI / 2);
    addStreetAsset('cityBench', 'city_bench', new THREE.Vector3(7.55, 0, -10.35), 2.8, Math.PI / 2);
    addStreetAsset('cityBush', 'city_bush', new THREE.Vector3(-7.45, 0, -10.35), 2.9, 0);
    addStreetAsset('cityBush', 'city_bush_left', new THREE.Vector3(-10.55, 0, 6.3), 3.2, 0);
    addStreetAsset('cityBush', 'city_bush_right', new THREE.Vector3(10.55, 0, -6.3), 3.2, 0);
    addStreetAsset('cityFirehydrant', 'city_fire_hydrant', new THREE.Vector3(10.55, 0, 4.35), 2.7, 0);
    addStreetAsset('cityTrash', 'city_trash', new THREE.Vector3(-10.55, 0, 3.25), 3.0, 0);
  }

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

  getPlacementGroup(type, target) {
    return type === 'shelf' ? target?.shelfGroup : target?.group;
  }

  getPlacementFootprint(type, target) {
    if (target?.placementFootprint) return target.placementFootprint;

    if (type === 'shelf') {
      return {
        width: target?.config?.w || 1.8,
        depth: target?.config?.d || 0.9
      };
    }

    const id = target?.id || '';
    if (DECOR_PLACEMENT_FOOTPRINTS[id]) return DECOR_PLACEMENT_FOOTPRINTS[id];
    const normalizedId = id.replace(/_\d+$/, '');
    if (DECOR_PLACEMENT_FOOTPRINTS[normalizedId]) return DECOR_PLACEMENT_FOOTPRINTS[normalizedId];

    const typeKey = target?.type || '';
    if (DECOR_PLACEMENT_FOOTPRINTS[typeKey]) return DECOR_PLACEMENT_FOOTPRINTS[typeKey];

    const name = target?.name || '';
    if (name.includes('自動販賣機') || name.toLowerCase().includes('vending')) return DECOR_PLACEMENT_FOOTPRINTS.atm;
    if (name.includes('ATM') || name.toLowerCase().includes('atm')) return DECOR_PLACEMENT_FOOTPRINTS.atm;
    if (name.includes('雜誌') || name.toLowerCase().includes('magazine')) return DECOR_PLACEMENT_FOOTPRINTS.magazine_rack;
    if (name.includes('扭蛋') || name.toLowerCase().includes('gashapon')) return DECOR_PLACEMENT_FOOTPRINTS.gashapon;
    if (name.includes('桌椅')) return DECOR_PLACEMENT_FOOTPRINTS.dining_set;
    if (name.includes('盆栽') || name.includes('綠植')) return DECOR_PLACEMENT_FOOTPRINTS.ficus_plant;
    if (name.includes('回收桶')) return { width: 1.8, depth: 0.8 };
    if (name.includes('招財貓')) return DECOR_PLACEMENT_FOOTPRINTS.lucky_cat;

    return { width: 0.9, depth: 0.9 };
  }

  getPlacementRect(type, target, x, z, rotationY = null) {
    const group = this.getPlacementGroup(type, target);
    const footprint = this.getPlacementFootprint(type, target);
    const angle = Number.isFinite(rotationY) ? rotationY : (group?.rotation?.y || 0);
    const cos = Math.abs(Math.cos(angle));
    const sin = Math.abs(Math.sin(angle));
    const width = footprint.width * cos + footprint.depth * sin;
    const depth = footprint.width * sin + footprint.depth * cos;

    return {
      minX: x - width / 2,
      maxX: x + width / 2,
      minZ: z - depth / 2,
      maxZ: z + depth / 2,
      width,
      depth
    };
  }

  placementRectsOverlap(a, b) {
    return a.minX < b.maxX && a.maxX > b.minX && a.minZ < b.maxZ && a.maxZ > b.minZ;
  }

  findAvailablePlacement(type, target, preferredPos) {
    const group = this.getPlacementGroup(type, target);
    const rotationY = group?.rotation?.y || 0;
    const footprint = this.getPlacementRect(type, target, 0, 0, rotationY);
    const minX = ROOM_PLACEMENT_BOUNDS.minX + footprint.width / 2;
    const maxX = ROOM_PLACEMENT_BOUNDS.maxX - footprint.width / 2;
    const minZ = ROOM_PLACEMENT_BOUNDS.minZ + footprint.depth / 2;
    const maxZ = ROOM_PLACEMENT_BOUNDS.maxZ - footprint.depth / 2;
    const startX = Math.round(preferredPos.x / PLACEMENT_GRID_SIZE);
    const startZ = Math.round(preferredPos.z / PLACEMENT_GRID_SIZE);

    for (let radius = 0; radius <= 30; radius++) {
      for (let gx = -radius; gx <= radius; gx++) {
        for (let gz = -radius; gz <= radius; gz++) {
          if (radius > 0 && Math.max(Math.abs(gx), Math.abs(gz)) !== radius) continue;

          const x = Math.max(minX, Math.min(maxX, (startX + gx) * PLACEMENT_GRID_SIZE));
          const z = Math.max(minZ, Math.min(maxZ, (startZ + gz) * PLACEMENT_GRID_SIZE));
          if (this.checkPlacementValidity(x, z, { type, target, rotationY })) {
            return new THREE.Vector3(x, 0, z);
          }
        }
      }
    }

    return null;
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

    // 取得尺寸調整地面方框，與實際碰撞檢查共用同一組 footprint。
    const footprint = this.getPlacementFootprint(type, target);
    const w = footprint.width;
    const d = footprint.depth;

    this.ghostFloorQuad.geometry.dispose();
    this.ghostFloorQuad.geometry = new THREE.PlaneGeometry(w + PLACEMENT_PREVIEW_PADDING, d + PLACEMENT_PREVIEW_PADDING);
    this.ghostEdgesLine.geometry.dispose();
    this.ghostEdgesLine.geometry = new THREE.EdgesGeometry(new THREE.PlaneGeometry(w + PLACEMENT_PREVIEW_PADDING, d + PLACEMENT_PREVIEW_PADDING));

    this.ghostMeshHolder.add(cloned);
    this.ghostGroup.rotation.y = group.rotation.y;
    this.ghostGroup.position.copy(group.position);
    this.ghostGroup.visible = true;
    this.updateGhostPosition(group.position, true);
  }

  // 更新虛影位置：先依物件旋轉後尺寸計算可用中心，再做網格吸附。
  updateGhostPosition(groundPos, isLocal = false) {
    if (!this.ghostGroup.visible || !this.selectedObject) return null;

    const { type, target } = this.selectedObject;
    const group = this.getPlacementGroup(type, target);
    const localGroundPos = isLocal || !this.interiorRoot
      ? groundPos
      : this.interiorRoot.worldToLocal(groundPos.clone());
    const rotationY = group?.rotation?.y || 0;
    const worldFootprint = this.getPlacementRect(type, target, 0, 0, rotationY);
    const minX = ROOM_PLACEMENT_BOUNDS.minX + worldFootprint.width / 2;
    const maxX = ROOM_PLACEMENT_BOUNDS.maxX - worldFootprint.width / 2;
    const minZ = ROOM_PLACEMENT_BOUNDS.minZ + worldFootprint.depth / 2;
    const maxZ = ROOM_PLACEMENT_BOUNDS.maxZ - worldFootprint.depth / 2;

    // 網格對齊吸附，但不再使用固定 5.2m 內縮；牆邊位置由物件實際尺寸決定。
    let snapX = Math.round(localGroundPos.x / PLACEMENT_GRID_SIZE) * PLACEMENT_GRID_SIZE;
    let snapZ = Math.round(localGroundPos.z / PLACEMENT_GRID_SIZE) * PLACEMENT_GRID_SIZE;
    snapX = Math.max(minX, Math.min(maxX, snapX));
    snapZ = Math.max(minZ, Math.min(maxZ, snapZ));

    this.ghostGroup.position.set(snapX, 0, snapZ);

    // 檢查放置合法性（房間邊界、固定設施與其它可佈置物件）。
    this.ghostValid = this.checkPlacementValidity(snapX, snapZ, { type, target, rotationY });

    const mat = this.ghostValid ? this.ghostValidMat : this.ghostInvalidMat;
    const floorColor = this.ghostValid ? 0x38bdf8 : 0xef4444;

    this.ghostMeshHolder.traverse(child => {
      if (child.isMesh) child.material = mat;
    });
    this.ghostFloorQuad.material.color.setHex(floorColor);

    return { x: snapX, z: snapZ, valid: this.ghostValid };
  }

  // 檢查該位置是否合法：物件必須完整落在室內，且不可與固定設施或其它佈置重疊。
  checkPlacementValidity(x, z, options = {}) {
    const selected = options.target || this.selectedObject?.target;
    const type = options.type || this.selectedObject?.type || 'decor';
    const group = this.getPlacementGroup(type, selected);
    const rotationY = Number.isFinite(options.rotationY) ? options.rotationY : (group?.rotation?.y || 0);
    const candidate = this.getPlacementRect(type, selected, x, z, rotationY);

    // 1. 依實際物件外框限制室內邊界，允許外框貼到牆的內側。
    if (
      candidate.minX < ROOM_PLACEMENT_BOUNDS.minX ||
      candidate.maxX > ROOM_PLACEMENT_BOUNDS.maxX ||
      candidate.minZ < ROOM_PLACEMENT_BOUNDS.minZ ||
      candidate.maxZ > ROOM_PLACEMENT_BOUNDS.maxZ
    ) {
      return false;
    }

    // 2. 門口與收銀櫃檯的固定禁放區，改以外框判斷而非物件中心點。
    const entranceBlock = { minX: -1.4, maxX: 1.4, minZ: 4.2, maxZ: ROOM_PLACEMENT_BOUNDS.maxZ };
    const counterBlock = { minX: -1.2, maxX: 2.2, minZ: -6.0, maxZ: -3.6 };
    if (this.placementRectsOverlap(candidate, entranceBlock) || this.placementRectsOverlap(candidate, counterBlock)) {
      return false;
    }

    // 3. 貨架與裝飾物互相視為障礙，移動自己時排除目前選中的物件。
    for (const shelf of Object.values(this.shelves || {})) {
      if (shelf === selected) continue;
      const shelfGroup = this.getPlacementGroup('shelf', shelf);
      if (!shelfGroup) continue;
      const shelfRect = this.getPlacementRect('shelf', shelf, shelfGroup.position.x, shelfGroup.position.z);
      if (this.placementRectsOverlap(candidate, shelfRect)) return false;
    }

    for (const decor of Object.values(this.decorations || {})) {
      if (decor === selected) continue;
      const decorGroup = this.getPlacementGroup('decor', decor);
      if (!decorGroup) continue;
      const decorRect = this.getPlacementRect('decor', decor, decorGroup.position.x, decorGroup.position.z);
      if (this.placementRectsOverlap(candidate, decorRect)) return false;
    }

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

    const newX = group.position.x + dx;
    const newZ = group.position.z + dz;
    if (!this.checkPlacementValidity(newX, newZ, { type, target })) {
      return { x: group.position.x, z: group.position.z, valid: false };
    }

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

    return { x: newX, z: newZ, valid: true };
  }

  // 旋轉當前選中物件 (90 度順時針旋轉)
  rotateSelectedObject(angleDelta = Math.PI / 2) {
    if (!this.selectedObject) return 0;

    const { type, target } = this.selectedObject;
    const group = type === 'shelf' ? target.shelfGroup : target.group;

    const nextRotation = (group.rotation.y + angleDelta) % (Math.PI * 2);
    if (!this.checkPlacementValidity(group.position.x, group.position.z, { type, target, rotationY: nextRotation })) {
      return { rotation: group.rotation.y, valid: false };
    }
    group.rotation.y = nextRotation;

    if (type === 'shelf') {
      const approachOffset = new THREE.Vector3(0, 0, 1.35).applyAxisAngle(new THREE.Vector3(0, 1, 0), group.rotation.y);
      target.customerApproachPos.copy(group.position).add(approachOffset);
    }

    // 更新走道導航路徑網格
    this.updateNavGrid();

    return { rotation: group.rotation.y, valid: true };
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

    const spriteMat = new THREE.SpriteMaterial({ map: createCanvasTexture(tagCanvas), transparent: true });
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

    const candidate = {
      config,
      shelfGroup: { position: spawnPos, rotation: { y: config.rotY } }
    };
    const freePos = this.findAvailablePlacement('shelf', candidate, spawnPos);
    if (!freePos) return null;
    config.pos = freePos;
    config.approachPos = freePos.clone().add(new THREE.Vector3(0, 0, 1.35));

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
    const candidate = { type, name: type, group: decorGroup };
    const freePos = this.findAvailablePlacement('decor', candidate, spawnPos);
    if (!freePos) return null;
    decorGroup.position.copy(freePos);
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
        worldPos: freePos.clone(),
        seatPos: freePos.clone().add(new THREE.Vector3(-0.9, 0, 0)),
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
      (this.interiorRoot || this.scene).add(decorGroup);
      this.decorations[id] = {
        id,
        type,
        group: decorGroup,
        mesh: decorMesh,
        name,
        category,
        placementFootprint: DECOR_PLACEMENT_FOOTPRINTS[type] || undefined
      };
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
      target.shelfGroup.parent?.remove(target.shelfGroup);
      delete this.shelves[id];
      const sIdx = this.interactiveShelves.indexOf(target.shelfMesh);
      if (sIdx !== -1) this.interactiveShelves.splice(sIdx, 1);
    } else if (type === 'decor') {
      target.group.parent?.remove(target.group);
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
