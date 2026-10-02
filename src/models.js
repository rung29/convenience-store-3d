// 3D 骨架模型與動作載入器 (Skeletal Model & Animation Manager)
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';

// Blender/Godot-friendly GLB assets. They are downloaded into public/models/store
// so the game does not depend on a remote CDN at runtime.
export const STORE_ASSET_MANIFEST = Object.freeze({
  wallBayPlain: 'models/store/wall-bay-plain.glb',
  wallBayWindow: 'models/store/wall-bay-window.glb',
  entranceBay: 'models/store/entrance-bay.glb',
  shopfrontGlass: 'models/store/shopfront-glass.glb',
  cornerPost: 'models/store/corner-post.glb',
  storeSignFascia: 'models/store/store-sign-fascia.glb',
  gondolaTins: 'models/store/gondola-tins.glb',
  gondolaCereal: 'models/store/gondola-cereal.glb',
  gondolaBottles: 'models/store/gondola-bottles.glb',
  gondolaSnacks: 'models/store/gondola-snacks.glb',
  chillerDairy: 'models/store/chiller-dairy.glb',
  chillerDrinks: 'models/store/chiller-drinks.glb',
  freezerChest: 'models/store/freezer-chest.glb',
  uprightFreezer: 'models/store/upright-freezer.glb',
  checkoutLane: 'models/store/checkout-lane.glb',
  serviceDesk: 'models/store/service-desk.glb',
  baggingArea: 'models/store/bagging-area.glb',
  atm: 'models/store/atm.glb',
  lotteryStand: 'models/store/lottery-stand.glb',
  customerLockers: 'models/store/customer-lockers.glb',
  magazineRack: 'models/store/magazine-rack.glb',
  flowerBucket: 'models/store/flower-bucket.glb',
  promoPallet: 'models/store/promo-pallet.glb',
  impulseShelf: 'models/store/impulse-shelf.glb',
  odenHotFoodCounter: 'models/store/oden-hot-food-counter.glb',
  deliveryLorry: 'models/store/delivery-lorry.glb',
  testRobot: 'models/RobotExpressive.glb',
  testSoldier: 'models/Soldier.glb',
  characterShopperTrolley: 'models/characters/shopper-trolley.glb',
  characterShopperBasket: 'models/characters/shopper-basket.glb',
  characterShopperReaching: 'models/characters/shopper-reaching.glb',
  characterChildBalloon: 'models/characters/child-balloon.glb',
  characterCashier: 'models/characters/cashier.glb',
  characterShelfStacker: 'models/characters/shelf-stacker.glb',
  characterDeliAssistant: 'models/characters/deli-assistant.glb',
  characterSelfCheckout: 'models/characters/self-checkout-shopper.glb',
  characterSecurityGuard: 'models/characters/security-guard.glb',
  characterElderly: 'models/characters/elderly-shopper.glb',
  characterManager: 'models/characters/manager.glb',
  characterDeliveryDriver: 'models/characters/delivery-driver.glb',
  chibiArcher: 'models/characters/chibi/archer.glb',
  chibiBaseMesh: 'models/characters/chibi/base-mesh.glb',
  chibiKnight: 'models/characters/chibi/knight.glb',
  chibiMerchant: 'models/characters/chibi/merchant.glb',
  chibiNinja: 'models/characters/chibi/ninja.glb',
  chibiStudent: 'models/characters/chibi/student.glb',
  kayKnight: 'models/external/kaykit/characters/Knight.glb',
  kayBarbarian: 'models/external/kaykit/characters/Barbarian.glb',
  kayMage: 'models/external/kaykit/characters/Mage.glb',
  kayRogue: 'models/external/kaykit/characters/Rogue.glb',
  kayRogueHooded: 'models/external/kaykit/characters/Rogue_Hooded.glb',
  kenneyCashRegister: 'models/external/kenney/mini-market/cash-register.glb',
  kenneyEmployee: 'models/external/kenney/mini-market/character-employee.glb',
  kenneyDisplayBread: 'models/external/kenney/mini-market/display-bread.glb',
  kenneyDisplayFruit: 'models/external/kenney/mini-market/display-fruit.glb',
  kenneyFreezer: 'models/external/kenney/mini-market/freezer.glb',
  kenneyFreezersStanding: 'models/external/kenney/mini-market/freezers-standing.glb',
  kenneyShelfEnd: 'models/external/kenney/mini-market/shelf-end.glb',
  kenneyShoppingBasket: 'models/external/kenney/mini-market/shopping-basket.glb',
  kenneyShoppingCart: 'models/external/kenney/mini-market/shopping-cart.glb',
  kenneyBottleReturn: 'models/external/kenney/mini-market/bottle-return.glb',
  cityBase: 'models/external/kaykit/city/base.gltf',
  cityBench: 'models/external/kaykit/city/bench.gltf',
  cityBuildingA: 'models/external/kaykit/city/building_A.gltf',
  cityBuildingB: 'models/external/kaykit/city/building_B.gltf',
  cityBuildingC: 'models/external/kaykit/city/building_C.gltf',
  cityBush: 'models/external/kaykit/city/bush.gltf',
  cityCarStationwagon: 'models/external/kaykit/city/car_stationwagon.gltf',
  cityCarTaxi: 'models/external/kaykit/city/car_taxi.gltf',
  cityFirehydrant: 'models/external/kaykit/city/firehydrant.gltf',
  cityRoadCorner: 'models/external/kaykit/city/road_corner.gltf',
  cityRoadStraight: 'models/external/kaykit/city/road_straight.gltf',
  cityRoadCrossing: 'models/external/kaykit/city/road_straight_crossing.gltf',
  cityStreetlight: 'models/external/kaykit/city/streetlight.gltf',
  cityTrafficlight: 'models/external/kaykit/city/trafficlight_A.gltf',
  cityTrash: 'models/external/kaykit/city/trash_A.gltf',
  cityWatertower: 'models/external/kaykit/city/watertower.gltf'
});

class ModelManager {
  constructor() {
    this.loader = new GLTFLoader();
    this.humanModel = null;
    this.humanClips = [];
    this.robotModel = null;
    this.robotClips = [];
    this.isLoaded = false;
    this.storeAssets = new Map();
    this.storeAssetAnimations = new Map();
    this.storeAssetErrors = [];
  }

  // 預先載入 3D 人型骨架動畫模型
  async preloadModels() {
    if (this.isLoaded) return;

    try {
      // 載入具備真實人型骨架與動作的 Xbot.glb
      const gltf = await this.loadAsync(`${import.meta.env.BASE_URL}models/Xbot.glb`);
      this.humanModel = gltf.scene;
      this.humanClips = gltf.animations;

      // 預設將陰影開啟
      this.humanModel.traverse(node => {
        if (node.isMesh) {
          node.castShadow = true;
          node.receiveShadow = true;
        }
      });

      console.log('✅ 3D 人型動畫模型載入成功，內建動作:', this.humanClips.map(c => c.name));
      this.isLoaded = true;
    } catch (err) {
      console.warn('⚠️ 人型模型載入失敗，將退回備用高質感幾何人偶:', err);
    }
  }

  loadAsync(url) {
    return new Promise((resolve, reject) => {
      this.loader.load(url, resolve, undefined, reject);
    });
  }

  async preloadStoreAssets() {
    const entries = Object.entries(STORE_ASSET_MANIFEST);
    const results = await Promise.allSettled(entries.map(async ([key, relativePath]) => {
      const gltf = await this.loadAsync(`${import.meta.env.BASE_URL}${relativePath}`);
      return { key, scene: gltf.scene, animations: gltf.animations ?? [] };
    }));

    results.forEach((result, index) => {
      const [key] = entries[index];
      if (result.status === 'fulfilled') {
        this.storeAssets.set(result.value.key, result.value.scene);
        this.storeAssetAnimations.set(result.value.key, result.value.animations);
      } else {
        this.storeAssetErrors.push({ key, error: result.reason });
        console.warn(`Store asset failed to load: ${key}`, result.reason);
      }
    });

    console.info(`Store GLB assets loaded: ${this.storeAssets.size}/${entries.length}`);
    return this.storeAssets.size > 0;
  }

  hasStoreAsset(key) {
    return this.storeAssets.has(key);
  }

  getStoreAssetAnimations(key) {
    return this.storeAssetAnimations.get(key) ?? [];
  }

  createStoreAssetInstance(key) {
    const source = this.storeAssets.get(key);
    if (!source) return null;

    const clone = SkeletonUtils.clone(source);
    clone.traverse(node => {
      if (!node.isMesh) return;
      node.castShadow = true;
      node.receiveShadow = true;
      if (node.material) {
        node.material = Array.isArray(node.material)
          ? node.material.map(material => material.clone())
          : node.material.clone();
      }
      if (node.material?.map) {
        node.material.map.colorSpace = THREE.SRGBColorSpace;
        node.material.map.anisotropy = 4;
        node.material.map.needsUpdate = true;
      }
    });
    return clone;
  }

  // 實例化一個獨立的 3D 人偶 (包含骨架與獨立動作混合器)
  createCharacterInstance(options = {}) {
    if (!this.humanModel) {
      return null;
    }

    // 使用 SkeletonUtils 完整複製骨骼、網格與權重
    const clone = SkeletonUtils.clone(this.humanModel);
    const mixer = new THREE.AnimationMixer(clone);

    // 縮放為適合超商微縮場景的比例 (約 0.85 ~ 0.95 高度)
    const scale = options.scale || 0.9;
    clone.scale.set(scale, scale, scale);

    // 替換各部位材質顏色 (衣服、褲子、配件)
    const shirtColor = options.shirtColor || '#38bdf8';
    const pantsColor = options.pantsColor || '#334155';

    clone.traverse(node => {
      if (node.isMesh) {
        node.castShadow = true;
        node.receiveShadow = true;
        if (node.material) {
          node.material = node.material.clone();
          // 若為小偷，將材質整體染成深黑夜行裝
          if (options.isThief) {
            node.material.color = new THREE.Color('#0f172a');
            node.material.roughness = 0.8;
          } else {
            // 隨機染上不同色系上衣
            if (node.name.toLowerCase().includes('top') || node.name.toLowerCase().includes('body')) {
              node.material.color = new THREE.Color(shirtColor);
            } else if (node.name.toLowerCase().includes('bottom') || node.name.toLowerCase().includes('leg')) {
              node.material.color = new THREE.Color(pantsColor);
            } else {
              node.material.color = new THREE.Color(shirtColor).lerp(new THREE.Color('#ffffff'), 0.2);
            }
          }
        }
      }
    });

    // 建立動作清單 (Idle, Walk, Agree, Run 等)
    const actions = {};
    this.humanClips.forEach(clip => {
      const name = clip.name.toLowerCase();
      actions[name] = mixer.clipAction(clip);
    });

    let currentAction = actions['idle'] || Object.values(actions)[0];
    if (currentAction) {
      currentAction.play();
    }

    // 回傳包含控制器的方法
    return {
      mesh: clone,
      mixer: mixer,
      actions: actions,
      playAnimation: (animName, duration = 0.3) => {
        const target = actions[animName.toLowerCase()];
        if (!target || target === currentAction) return;

        if (currentAction) {
          currentAction.fadeOut(duration);
        }
        target.reset().fadeIn(duration).play();
        currentAction = target;
      },
      update: (delta) => {
        mixer.update(delta);
      }
    };
  }
}

export const modelManager = new ModelManager();
