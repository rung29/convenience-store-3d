// 3D 精緻 Q 版可愛顧客與小偷系統 (Chibi-Style Cute Animated Characters)
import * as THREE from 'three';
import { ITEM_DEFINITIONS } from './items.js';
import { sounds } from './audio.js';
import { modelManager } from './models.js';

export const CHARACTER_SET_IDS = Object.freeze({
  MODERN: 'modern',
  CHIBI: 'chibi',
  KAYKIT: 'kaykit',
  TEST: 'test'
});

const CHIBI_ARCHETYPES = [
  { role: '高中生', shirtColor: '#38bdf8', pantsColor: '#1e293b', skinColor: '#fddcb5', hairColor: '#4a2c1a', hairStyle: 'short', name: '小健', fav: '休閒零食', accessory: 'none', assetKey: 'chibiStudent', modelScale: 0.78 },
  { role: '上班族', shirtColor: '#64748b', pantsColor: '#0f172a', skinColor: '#f5d0a9', hairColor: '#1a1a2e', hairStyle: 'neat', name: '林專員', fav: '飲料冷藏', accessory: 'none', assetKey: 'chibiMerchant', modelScale: 0.78 },
  { role: '小資女', shirtColor: '#f472b6', pantsColor: '#334155', skinColor: '#fce0c8', hairColor: '#78350f', hairStyle: 'ponytail', name: '欣怡', fav: '鮮食便當', accessory: 'none', assetKey: 'chibiArcher', modelScale: 0.78 },
  { role: '大學生', shirtColor: '#fbbf24', pantsColor: '#78350f', skinColor: '#f5d0a9', hairColor: '#0f172a', hairStyle: 'messy', name: '阿明', fav: '速食泡麵', accessory: 'none', assetKey: 'chibiStudent', modelScale: 0.78 },
  { role: '常客阿伯', shirtColor: '#34d399', pantsColor: '#14532d', skinColor: '#e8c49a', hairColor: '#9ca3af', hairStyle: 'bald', name: '陳伯伯', fav: '飲料冷藏', accessory: 'none', assetKey: 'chibiBaseMesh', modelScale: 0.78 },
  { role: '小學生', shirtColor: '#fb923c', pantsColor: '#1c1917', skinColor: '#fddcb5', hairColor: '#1e293b', hairStyle: 'short', name: '小豪', fav: '休閒零食', accessory: 'none', assetKey: 'chibiStudent', modelScale: 0.68 },
  { role: 'OL上班族', shirtColor: '#c084fc', pantsColor: '#1e1b4b', skinColor: '#fce0c8', hairColor: '#451a03', hairStyle: 'long', name: '美惠', fav: '飲料冷藏', accessory: 'none', assetKey: 'chibiMerchant', modelScale: 0.78 },
  { role: '外送員', shirtColor: '#22d3ee', pantsColor: '#0f172a', skinColor: '#f5d0a9', hairColor: '#1e293b', hairStyle: 'helmet', name: '阿翔', fav: '鮮食便當', accessory: 'none', assetKey: 'chibiKnight', modelScale: 0.72 }
];

const CHIBI_THIEF_ARCHETYPE = {
  role: '小偷',
  shirtColor: '#0f172a',
  pantsColor: '#020617',
  skinColor: '#d4a373',
  hairColor: '#0f172a',
  hairStyle: 'beanie',
  name: '蒙面小偷',
  fav: '休閒零食',
  accessory: 'none',
  assetKey: 'chibiNinja',
  modelScale: 0.76
};

const KAYKIT_ARCHETYPES = [
  { role: '奇幻騎士', shirtColor: '#38bdf8', pantsColor: '#1e293b', name: '小騎士', fav: '飲料冷藏櫃', accessory: 'none', assetKey: 'kayKnight', modelScale: 0.74 },
  { role: '森林大力士', shirtColor: '#22c55e', pantsColor: '#14532d', name: '大力士', fav: '洋芋片', accessory: 'none', assetKey: 'kayBarbarian', modelScale: 0.67 },
  { role: '魔法旅人', shirtColor: '#a78bfa', pantsColor: '#312e81', name: '小魔法師', fav: '關東煮', accessory: 'none', assetKey: 'kayMage', modelScale: 0.74 },
  { role: '俏皮盜賊', shirtColor: '#fb7185', pantsColor: '#4c1d95', name: '小盜賊', fav: '甜點櫃', accessory: 'none', assetKey: 'kayRogue', modelScale: 0.72 },
  { role: '披風旅人', shirtColor: '#f59e0b', pantsColor: '#292524', name: '披風客', fav: '咖啡', accessory: 'none', assetKey: 'kayRogueHooded', modelScale: 0.72 }
];

const KAYKIT_THIEF_ARCHETYPE = {
  ...KAYKIT_ARCHETYPES[4],
  role: '披風小偷',
  name: '披風小偷',
  assetKey: 'kayRogueHooded',
  modelScale: 0.72
};

const TEST_ARCHETYPES = [
  {
    role: '機器人測試客',
    shirtColor: '#60a5fa',
    pantsColor: '#1e3a8a',
    skinColor: '#cbd5e1',
    hairColor: '#475569',
    hairStyle: 'short',
    name: '機器人測試員',
    fav: '飲料冷藏',
    accessory: 'none',
    assetKey: 'testRobot',
    modelScale: 0.72
  },
  {
    role: '士兵測試客',
    shirtColor: '#4ade80',
    pantsColor: '#14532d',
    skinColor: '#d4a373',
    hairColor: '#334155',
    hairStyle: 'short',
    name: '士兵測試員',
    fav: '休閒零食',
    accessory: 'none',
    assetKey: 'testSoldier',
    modelScale: 0.78
  }
];

const TEST_THIEF_ARCHETYPE = {
  ...TEST_ARCHETYPES[1],
  role: '測試小偷',
  name: '士兵測試小偷'
};

function normalizeCharacterSet(characterSet) {
  if (characterSet === CHARACTER_SET_IDS.CHIBI) return CHARACTER_SET_IDS.CHIBI;
  if (characterSet === CHARACTER_SET_IDS.KAYKIT) return CHARACTER_SET_IDS.KAYKIT;
  if (characterSet === CHARACTER_SET_IDS.TEST) return CHARACTER_SET_IDS.TEST;
  return CHARACTER_SET_IDS.MODERN;
}

// 豐富角色庫 — 每個角色都有獨特外觀設定
const CUSTOMER_ARCHETYPES = [
  { role: '高中生', shirtColor: '#38bdf8', pantsColor: '#1e293b', skinColor: '#fddcb5', hairColor: '#4a2c1a', hairStyle: 'short', name: '小健', fav: '休閒零食', accessory: 'backpack', assetKey: 'characterShopperBasket' },
  { role: '上班族', shirtColor: '#64748b', pantsColor: '#0f172a', skinColor: '#f5d0a9', hairColor: '#1a1a2e', hairStyle: 'neat', name: '林專員', fav: '飲料冷藏', accessory: 'briefcase', assetKey: 'characterManager' },
  { role: '小資女', shirtColor: '#f472b6', pantsColor: '#334155', skinColor: '#fce0c8', hairColor: '#78350f', hairStyle: 'ponytail', name: '欣怡', fav: '鮮食便當', accessory: 'handbag', assetKey: 'characterSelfCheckout' },
  { role: '大學生', shirtColor: '#fbbf24', pantsColor: '#78350f', skinColor: '#f5d0a9', hairColor: '#0f172a', hairStyle: 'messy', name: '阿明', fav: '速食泡麵', accessory: 'cap', assetKey: 'characterShopperTrolley' },
  { role: '常客阿伯', shirtColor: '#34d399', pantsColor: '#14532d', skinColor: '#e8c49a', hairColor: '#9ca3af', hairStyle: 'bald', name: '陳伯伯', fav: '飲料冷藏', accessory: 'none', assetKey: 'characterElderly' },
  { role: '小學生', shirtColor: '#fb923c', pantsColor: '#1c1917', skinColor: '#fddcb5', hairColor: '#1e293b', hairStyle: 'short', name: '小豪', fav: '休閒零食', accessory: 'backpack', assetKey: 'characterChildBalloon' },
  { role: 'OL上班族', shirtColor: '#c084fc', pantsColor: '#1e1b4b', skinColor: '#fce0c8', hairColor: '#451a03', hairStyle: 'long', name: '美惠', fav: '飲料冷藏', accessory: 'handbag', assetKey: 'characterShopperReaching' },
  { role: '外送員', shirtColor: '#22d3ee', pantsColor: '#0f172a', skinColor: '#f5d0a9', hairColor: '#1e293b', hairStyle: 'helmet', name: '阿翔', fav: '鮮食便當', accessory: 'none', assetKey: 'characterDeliveryDriver' }
];

export class Customer {
  constructor(id, store, onCheckoutComplete, onLostSale, isThief = false, characterSet = CHARACTER_SET_IDS.MODERN) {
    this.id = id;
    this.store = store;
    this.onCheckoutComplete = onCheckoutComplete;
    this.onLostSale = onLostSale;
    this.isThief = isThief;
    this.characterSet = normalizeCharacterSet(characterSet);

    this.state = isThief ? 'STEALING' : 'WALKING_IN';
    this.speed = isThief ? 1.4 : 1.9;

    this.archetype = this.createArchetype();

    this.wishList = this.generateWishList();
    this.currentWishIndex = 0;
    this.basketItems = [];

    this.targetPos = new THREE.Vector3();
    this.path = [];
    this.pathIndex = 0;
    this.waitTime = 0;
    this.bobTime = Math.random() * Math.PI * 2; // 行走彈跳相位
    this.assignedTable = null;
    this.tipClaimed = false;

    this.group = new THREE.Group();
    this.usesImportedCharacter = false;
    this.importedMixer = null;
    this.importedActions = null;
    this.importedAction = null;

    // 始終採用精緻 Q 版日系微縮可愛人偶 (經典遊戲橘子便利商店美術風格)
    this.buildChibiCharacter();

    // 地面柔和接觸圓形微陰影 (讓人物完美立體著地)
    const shadowGeo = new THREE.CircleGeometry(0.32, 16);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: '#3e2723',
      transparent: true,
      opacity: 0.22,
      depthWrite: false
    });
    this.contactShadow = new THREE.Mesh(shadowGeo, shadowMat);
    this.contactShadow.rotation.x = -Math.PI / 2;
    this.contactShadow.position.y = 0.015;
    this.group.add(this.contactShadow);

    // 手提小購物籃 (購物時提在手上，放入所選商品)
    if (this.isThief) {
      this.buildThiefLootSack();
    } else if (!this.usesImportedCharacter) {
      this.buildShoppingBasket();
    }

    // 頭頂心情對話氣泡
    this.createMoodBubble();

    // 讓顧客成為畫面中可辨識的展示素材，而不是縮在走道裡的小點。
    this.group.scale.setScalar(1.15);

    // 出生點
    const interiorScale = this.store.interiorRoot?.scale.x || 1;
    this.group.position.set(
      (-2.0 + Math.random() * 4.0) / interiorScale,
      0,
      9.5 / interiorScale
    );
    (this.store.interiorRoot || this.store.scene).add(this.group);

    // 註冊滑鼠可點擊互動
    this.group.traverse(child => {
      child.userData = { isCustomer: true, customer: this, isThief: this.isThief };
    });

    if (this.isThief) {
      const shelves = Object.values(this.store.shelves);
      const targetShelf = shelves[Math.floor(Math.random() * shelves.length)];
      if (targetShelf) {
        this.setTarget(targetShelf.customerApproachPos);
      } else {
        this.setTarget(new THREE.Vector3(0, 0, 0));
      }
      this.setMood('🦹', '#fee2e2');
    } else {
      this.setTarget(new THREE.Vector3(0, 0, 4.0));
    }
  }

  createArchetype() {
    if (this.isThief) {
      if (this.characterSet === CHARACTER_SET_IDS.TEST) {
        return { ...TEST_THIEF_ARCHETYPE };
      }
      if (this.characterSet === CHARACTER_SET_IDS.CHIBI) {
        return { ...CHIBI_THIEF_ARCHETYPE };
      }
      if (this.characterSet === CHARACTER_SET_IDS.KAYKIT) {
        return { ...KAYKIT_THIEF_ARCHETYPE };
      }
      return {
        role: '小偷',
        shirtColor: '#0f172a',
        pantsColor: '#020617',
        skinColor: '#d4a373',
        hairColor: '#0f172a',
        hairStyle: 'beanie',
        name: '蒙面小偷',
        fav: '休閒零食',
        accessory: 'none',
        assetKey: 'characterShopperBasket'
      };
    }

    const archetypes = this.characterSet === CHARACTER_SET_IDS.TEST
      ? TEST_ARCHETYPES
        : this.characterSet === CHARACTER_SET_IDS.CHIBI
          ? CHIBI_ARCHETYPES
          : this.characterSet === CHARACTER_SET_IDS.KAYKIT
            ? KAYKIT_ARCHETYPES
            : CUSTOMER_ARCHETYPES;
    return archetypes[Math.floor(Math.random() * archetypes.length)];
  }

  setCharacterSet(characterSet) {
    const nextSet = normalizeCharacterSet(characterSet);
    if (nextSet === this.characterSet) return false;

    this.characterSet = nextSet;
    this.archetype = this.createArchetype();
    this.importedMixer?.stopAllAction();
    this.importedMixer = null;
    this.importedActions = null;
    this.importedAction = null;

    if (this.bodyGroup) this.group.remove(this.bodyGroup);
    this.bodyGroup = null;
    this.headGroup = null;
    this.leftArm = null;
    this.rightArm = null;
    this.leftLeg = null;
    this.rightLeg = null;
    this.leftShoe = null;
    this.rightShoe = null;
    this.basketGroup = null;
    this.basketContentsGroup = null;
    this.sackGroup = null;
    this.usesImportedCharacter = false;
    this.importedCharacter = null;

    this.buildChibiCharacter();
    if (this.isThief) {
      this.buildThiefLootSack();
    } else if (!this.usesImportedCharacter) {
      this.buildShoppingBasket();
    }

    this.group.traverse(child => {
      child.userData = { isCustomer: true, customer: this, isThief: this.isThief };
    });
    return true;
  }

  generateWishList() {
    const allKeys = Object.keys(this.store.shelves).map(k => this.store.shelves[k].itemId);
    const count = 1 + Math.floor(Math.random() * 3);
    const shuffled = [...allKeys].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }

  // ============================================
  // 精緻 Q 版可愛角色建構 (Chibi Character Builder)
  // ============================================
  buildImportedCharacter(imported) {
    this.usesImportedCharacter = true;
    this.importedCharacter = imported;
    this.bodyGroup = new THREE.Group();
    this.bodyGroup.name = `character-${this.archetype.assetKey}`;

    const scale = this.characterSet === CHARACTER_SET_IDS.CHIBI
      || this.characterSet === CHARACTER_SET_IDS.KAYKIT
      || this.characterSet === CHARACTER_SET_IDS.TEST
      ? (this.archetype.modelScale ?? 0.78)
      : this.archetype.assetKey === 'characterChildBalloon'
        ? 0.82
        : this.archetype.assetKey === 'characterDeliveryDriver' ? 0.98 : 1.0;
    imported.scale.setScalar(scale);

    // KayKit's rig origin is around the pelvis, unlike the A/B store models
    // whose feet already sit on y=0. Lift only C models to prevent their feet
    // from sinking into the floor when the customer group is placed.
    if (this.characterSet === CHARACTER_SET_IDS.KAYKIT) {
      imported.updateMatrixWorld(true);
      const bounds = new THREE.Box3().setFromObject(imported);
      if (Number.isFinite(bounds.min.y) && bounds.min.y < 0) {
        imported.position.y -= bounds.min.y;
      }
    }

    imported.traverse(node => {
      if (!node.isMesh || !node.material || !this.isThief) return;
      const materials = Array.isArray(node.material) ? node.material : [node.material];
      materials.forEach(material => {
        if (material.color) material.color.multiplyScalar(0.42);
        material.roughness = 0.85;
      });
    });

    this.bodyGroup.add(imported);
    this.group.add(this.bodyGroup);
    this.headGroup = null;
    this.leftArm = null;
    this.rightArm = null;
    this.leftLeg = null;
    this.rightLeg = null;
    this.leftShoe = null;
    this.rightShoe = null;

    const clips = modelManager.getStoreAssetAnimations(this.archetype.assetKey);
    if (clips.length > 0) {
      this.importedMixer = new THREE.AnimationMixer(imported);
      const idleClip = clips.find(clip => /idle|iddle/i.test(clip.name)) || clips[0];
      const walkClip = clips.find(clip => /walk/i.test(clip.name)) || idleClip;
      this.importedActions = {
        idle: this.importedMixer.clipAction(idleClip),
        walk: this.importedMixer.clipAction(walkClip)
      };
      this.importedAction = this.importedActions.idle;
      this.importedAction.play();
    }

    this.addTaiwaneseCharacterDetails();
  }

  playImportedAnimation(name) {
    const target = this.importedActions?.[name] || this.importedActions?.idle;
    if (!target || target === this.importedAction) return;

    if (this.importedAction) this.importedAction.fadeOut(0.18);
    target.reset().fadeIn(0.18).play();
    this.importedAction = target;
  }

  addTaiwaneseCharacterDetails() {
    const detailGroup = new THREE.Group();
    detailGroup.name = 'taiwan-style-character-details';
    if (this.characterSet === CHARACTER_SET_IDS.KAYKIT) {
      detailGroup.position.y = 0.28;
    }
    const key = this.archetype.assetKey;
    const accessory = this.archetype.accessory;
    const accent = this.isThief ? '#7f1d1d' : (this.archetype.shirtColor || '#f97316');

    const addMesh = mesh => {
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      detailGroup.add(mesh);
      return mesh;
    };

    // A tiny 24H badge gives every imported role the same Taiwanese convenience-store identity.
    const badgeCanvas = document.createElement('canvas');
    badgeCanvas.width = 96;
    badgeCanvas.height = 48;
    const badgeContext = badgeCanvas.getContext('2d');
    badgeContext.fillStyle = '#fff7ed';
    badgeContext.fillRect(0, 0, 96, 48);
    badgeContext.fillStyle = accent;
    badgeContext.fillRect(0, 0, 96, 8);
    badgeContext.fillStyle = '#14532d';
    badgeContext.font = 'bold 28px sans-serif';
    badgeContext.textAlign = 'center';
    badgeContext.textBaseline = 'middle';
    badgeContext.fillText('24H', 48, 29);
    const badge = new THREE.Sprite(new THREE.SpriteMaterial({
      map: new THREE.CanvasTexture(badgeCanvas),
      transparent: true,
      depthWrite: false
    }));
    badge.position.set(0.12, 0.94, 0.42);
    badge.scale.set(0.18, 0.09, 1);
    detailGroup.add(badge);

    if (this.isThief) {
      const mask = addMesh(new THREE.Mesh(
        new THREE.BoxGeometry(0.34, 0.12, 0.025),
        new THREE.MeshStandardMaterial({ color: '#111827', roughness: 0.7 })
      ));
      mask.position.set(0, 1.34, 0.39);
      const eyeBand = addMesh(new THREE.Mesh(
        new THREE.BoxGeometry(0.38, 0.035, 0.03),
        new THREE.MeshStandardMaterial({ color: '#ef4444', roughness: 0.6 })
      ));
      eyeBand.position.set(0, 1.43, 0.40);
    }

    // The Godot chibi set already has strong silhouettes and themed outfits.
    // Keep only the small 24H identity badge (and thief mask) so extra geometry
    // does not make the rounded models look boxy again.
    if (this.characterSet === CHARACTER_SET_IDS.CHIBI || this.characterSet === CHARACTER_SET_IDS.KAYKIT) {
      this.bodyGroup.add(detailGroup);
      return;
    }

    if (accessory === 'backpack') {
      const backpack = addMesh(new THREE.Mesh(
        new THREE.BoxGeometry(0.25, 0.30, 0.13),
        new THREE.MeshStandardMaterial({ color: accent, roughness: 0.65 })
      ));
      backpack.position.set(0, 0.78, -0.25);
      [-0.08, 0.08].forEach(x => {
        const strap = addMesh(new THREE.Mesh(
          new THREE.BoxGeometry(0.035, 0.29, 0.025),
          new THREE.MeshStandardMaterial({ color: '#fef3c7', roughness: 0.7 })
        ));
        strap.position.set(x, 0.82, -0.17);
      });
      if (key !== 'characterChildBalloon') this.addBubbleTea(detailGroup, 0.30, 0.62, 0.24);
    }

    if (accessory === 'handbag') {
      const handbag = addMesh(new THREE.Mesh(
        new THREE.BoxGeometry(0.20, 0.16, 0.12),
        new THREE.MeshStandardMaterial({ color: '#be185d', roughness: 0.55 })
      ));
      handbag.position.set(-0.31, 0.58, 0.20);
      const handle = addMesh(new THREE.Mesh(
        new THREE.TorusGeometry(0.075, 0.012, 6, 12, Math.PI),
        new THREE.MeshStandardMaterial({ color: '#fbbf24', roughness: 0.45 })
      ));
      handle.position.set(-0.31, 0.70, 0.20);
      handle.rotation.y = Math.PI / 2;
      this.addBubbleTea(detailGroup, 0.30, 0.62, 0.24);
    }

    if (accessory === 'briefcase') {
      const briefcase = addMesh(new THREE.Mesh(
        new THREE.BoxGeometry(0.22, 0.16, 0.08),
        new THREE.MeshStandardMaterial({ color: '#78350f', roughness: 0.72 })
      ));
      briefcase.position.set(0.31, 0.56, 0.20);
      const handle = addMesh(new THREE.Mesh(
        new THREE.TorusGeometry(0.055, 0.01, 6, 10, Math.PI),
        new THREE.MeshStandardMaterial({ color: '#fbbf24', roughness: 0.45 })
      ));
      handle.position.set(0.31, 0.67, 0.20);
      handle.rotation.y = Math.PI / 2;
    }

    if (accessory === 'cap') {
      const cap = addMesh(new THREE.Mesh(
        new THREE.SphereGeometry(0.22, 12, 6, 0, Math.PI * 2, 0, Math.PI * 0.55),
        new THREE.MeshStandardMaterial({ color: '#dc2626', roughness: 0.55 })
      ));
      cap.position.set(0, 1.56, 0);
      const brim = addMesh(new THREE.Mesh(
        new THREE.BoxGeometry(0.26, 0.035, 0.13),
        new THREE.MeshStandardMaterial({ color: '#991b1b', roughness: 0.55 })
      ));
      brim.position.set(0, 1.53, 0.18);
    }

    if (key === 'characterDeliveryDriver') {
      const helmet = addMesh(new THREE.Mesh(
        new THREE.SphereGeometry(0.26, 14, 8, 0, Math.PI * 2, 0, Math.PI * 0.58),
        new THREE.MeshStandardMaterial({ color: '#0f766e', roughness: 0.35, metalness: 0.05 })
      ));
      helmet.position.set(0, 1.57, 0);
      const visor = addMesh(new THREE.Mesh(
        new THREE.BoxGeometry(0.28, 0.035, 0.11),
        new THREE.MeshStandardMaterial({ color: '#bae6fd', transparent: true, opacity: 0.78, roughness: 0.2 })
      ));
      visor.position.set(0, 1.52, 0.20);
    }

    this.bodyGroup.add(detailGroup);
  }

  addBubbleTea(parent, x, y, z) {
    const cupGroup = new THREE.Group();
    const cup = new THREE.Mesh(
      new THREE.CylinderGeometry(0.055, 0.045, 0.14, 10),
      new THREE.MeshStandardMaterial({ color: '#f9a8d4', roughness: 0.42, transparent: true, opacity: 0.94 })
    );
    cup.castShadow = true;
    cupGroup.add(cup);
    const tea = new THREE.Mesh(
      new THREE.CylinderGeometry(0.04, 0.035, 0.09, 10),
      new THREE.MeshStandardMaterial({ color: '#7c2d12', roughness: 0.65 })
    );
    tea.position.y = 0.025;
    cupGroup.add(tea);
    const straw = new THREE.Mesh(
      new THREE.CylinderGeometry(0.008, 0.008, 0.12, 6),
      new THREE.MeshStandardMaterial({ color: '#f97316', roughness: 0.45 })
    );
    straw.position.set(0.015, 0.115, 0);
    straw.rotation.z = -0.12;
    cupGroup.add(straw);
    cupGroup.position.set(x, y, z);
    parent.add(cupGroup);
  }

  buildChibiCharacter() {
    const imported = this.archetype.assetKey
      ? modelManager.createStoreAssetInstance(this.archetype.assetKey)
      : null;
    if (imported) {
      this.buildImportedCharacter(imported);
      return;
    }

    const a = this.archetype;
    const skinMat = new THREE.MeshStandardMaterial({ color: a.skinColor, roughness: 0.75, metalness: 0.0 });
    const shirtMat = new THREE.MeshStandardMaterial({ color: a.shirtColor, roughness: 0.6 });
    const pantsMat = new THREE.MeshStandardMaterial({ color: a.pantsColor, roughness: 0.65 });
    const hairMat = new THREE.MeshStandardMaterial({ color: a.hairColor, roughness: 0.7 });
    const shoeMat = new THREE.MeshStandardMaterial({ color: '#1e293b', roughness: 0.5 });

    // ---- 身體群組 (Body group，用於行走彈跳) ----
    this.bodyGroup = new THREE.Group();

    // 上身軀幹 (稍微收腰的梯形)
    const torso = new THREE.Mesh(
      new THREE.CylinderGeometry(0.19, 0.24, 0.55, 12),
      shirtMat
    );
    torso.position.y = 0.72;
    torso.castShadow = true;
    this.bodyGroup.add(torso);

    // 衣領裝飾 (白色V領)
    const collarMat = new THREE.MeshStandardMaterial({ color: '#f8fafc' });
    const collar = new THREE.Mesh(
      new THREE.CylinderGeometry(0.20, 0.19, 0.06, 12),
      collarMat
    );
    collar.position.y = 0.99;
    this.bodyGroup.add(collar);

    // 下身褲子
    const legs = new THREE.Mesh(
      new THREE.CylinderGeometry(0.23, 0.18, 0.38, 12),
      pantsMat
    );
    legs.position.y = 0.42;
    legs.castShadow = true;
    this.bodyGroup.add(legs);

    // 左右小短腿 (分開的圓柱)
    const legGeo = new THREE.CylinderGeometry(0.07, 0.065, 0.22, 8);
    this.leftLeg = new THREE.Mesh(legGeo, pantsMat);
    this.leftLeg.position.set(-0.08, 0.2, 0);
    this.bodyGroup.add(this.leftLeg);
    this.rightLeg = new THREE.Mesh(legGeo, pantsMat);
    this.rightLeg.position.set(0.08, 0.2, 0);
    this.bodyGroup.add(this.rightLeg);

    // 鞋子 (圓潤小鞋)
    const shoeGeo = new THREE.SphereGeometry(0.075, 8, 6);
    this.leftShoe = new THREE.Mesh(shoeGeo, shoeMat);
    this.leftShoe.position.set(-0.08, 0.08, 0.03);
    this.leftShoe.scale.set(1, 0.6, 1.3);
    this.bodyGroup.add(this.leftShoe);
    this.rightShoe = new THREE.Mesh(shoeGeo, shoeMat);
    this.rightShoe.position.set(0.08, 0.08, 0.03);
    this.rightShoe.scale.set(1, 0.6, 1.3);
    this.bodyGroup.add(this.rightShoe);

    // 手臂 (小短手)
    const armGeo = new THREE.CylinderGeometry(0.045, 0.04, 0.32, 8);
    this.leftArm = new THREE.Mesh(armGeo, shirtMat);
    this.leftArm.position.set(-0.26, 0.72, 0);
    this.leftArm.rotation.z = 0.25;
    this.bodyGroup.add(this.leftArm);
    this.rightArm = new THREE.Mesh(armGeo, shirtMat);
    this.rightArm.position.set(0.26, 0.72, 0);
    this.rightArm.rotation.z = -0.25;
    this.bodyGroup.add(this.rightArm);

    // 手掌 (小球)
    const handGeo = new THREE.SphereGeometry(0.042, 8, 8);
    const leftHand = new THREE.Mesh(handGeo, skinMat);
    leftHand.position.set(-0.30, 0.55, 0);
    this.bodyGroup.add(leftHand);
    const rightHand = new THREE.Mesh(handGeo, skinMat);
    rightHand.position.set(0.30, 0.55, 0);
    this.bodyGroup.add(rightHand);

    this.group.add(this.bodyGroup);

    // ---- 頭部群組 (Head group) ----
    this.headGroup = new THREE.Group();
    this.headGroup.position.y = 1.18;

    // Q版大圓頭 (比身體大很多！)
    const head = new THREE.Mesh(
      new THREE.SphereGeometry(0.30, 20, 16),
      skinMat
    );
    head.castShadow = true;
    this.headGroup.add(head);

    // 臉頰紅暈 (可愛必備)
    const blushMat = new THREE.MeshBasicMaterial({ color: '#fda4af', transparent: true, opacity: 0.35 });
    const blushGeo = new THREE.SphereGeometry(0.06, 8, 8);
    const leftBlush = new THREE.Mesh(blushGeo, blushMat);
    leftBlush.position.set(-0.18, -0.04, 0.22);
    leftBlush.scale.set(1.2, 0.7, 0.3);
    this.headGroup.add(leftBlush);
    const rightBlush = new THREE.Mesh(blushGeo, blushMat);
    rightBlush.position.set(0.18, -0.04, 0.22);
    rightBlush.scale.set(1.2, 0.7, 0.3);
    this.headGroup.add(rightBlush);

    // 眼睛 (亮晶晶大眼)
    const eyeWhiteMat = new THREE.MeshBasicMaterial({ color: '#ffffff' });
    const eyePupilMat = new THREE.MeshBasicMaterial({ color: '#1e293b' });
    const eyeHighlightMat = new THREE.MeshBasicMaterial({ color: '#ffffff' });

    [-0.09, 0.09].forEach(ex => {
      // 白底
      const eyeWhite = new THREE.Mesh(new THREE.SphereGeometry(0.055, 10, 10), eyeWhiteMat);
      eyeWhite.position.set(ex, 0.02, 0.26);
      eyeWhite.scale.set(0.8, 1, 0.4);
      this.headGroup.add(eyeWhite);

      // 黑色大瞳孔
      const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.04, 10, 10), eyePupilMat);
      pupil.position.set(ex, 0.01, 0.28);
      pupil.scale.set(0.7, 0.85, 0.3);
      this.headGroup.add(pupil);

      // 高光點
      const highlight = new THREE.Mesh(new THREE.SphereGeometry(0.015, 6, 6), eyeHighlightMat);
      highlight.position.set(ex + 0.02, 0.035, 0.30);
      this.headGroup.add(highlight);
    });

    // 微笑弧線
    const smileCanvas = document.createElement('canvas');
    smileCanvas.width = 64; smileCanvas.height = 64;
    const sCtx = smileCanvas.getContext('2d');
    sCtx.clearRect(0, 0, 64, 64);
    sCtx.strokeStyle = '#94340a';
    sCtx.lineWidth = 3;
    sCtx.lineCap = 'round';
    sCtx.beginPath();
    sCtx.arc(32, 24, 12, 0.2, Math.PI - 0.2);
    sCtx.stroke();
    const smileTex = new THREE.CanvasTexture(smileCanvas);
    const smileSprite = new THREE.Sprite(
      new THREE.SpriteMaterial({ map: smileTex, transparent: true })
    );
    smileSprite.position.set(0, -0.08, 0.30);
    smileSprite.scale.set(0.15, 0.15, 1);
    this.headGroup.add(smileSprite);

    // 髮型
    this.buildHairStyle(hairMat, a.hairStyle);

    // 耳朵
    const earGeo = new THREE.SphereGeometry(0.045, 8, 8);
    [-0.28, 0.28].forEach(ex => {
      const ear = new THREE.Mesh(earGeo, skinMat);
      ear.position.set(ex, 0, 0);
      ear.scale.set(0.5, 0.8, 0.7);
      this.headGroup.add(ear);
    });

    this.group.add(this.headGroup);

    // ---- 配件 ----
    this.buildAccessory(a.accessory, shirtMat);

    // ---- 小偷特殊裝扮 ----
    if (this.isThief) {
      // 黑色蒙面頭套
      const maskMat = new THREE.MeshStandardMaterial({ color: '#0f172a' });
      const mask = new THREE.Mesh(new THREE.SphereGeometry(0.31, 16, 12), maskMat);
      mask.scale.set(1, 0.45, 1);
      mask.position.set(0, 0.02, 0);
      this.headGroup.add(mask);
    }
  }

  // 髮型系統
  buildHairStyle(hairMat, style) {
    switch (style) {
      case 'short': {
        // 短髮蓬鬆半球
        const hair = new THREE.Mesh(new THREE.SphereGeometry(0.31, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.6), hairMat);
        hair.position.set(0, 0.06, -0.01);
        this.headGroup.add(hair);
        break;
      }
      case 'neat': {
        // 整齊旁分
        const hair = new THREE.Mesh(new THREE.SphereGeometry(0.315, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.55), hairMat);
        hair.position.set(0, 0.05, -0.02);
        this.headGroup.add(hair);
        // 旁分線
        const partLine = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.02, 0.18), new THREE.MeshBasicMaterial({ color: this.archetype.skinColor }));
        partLine.position.set(-0.10, 0.26, 0.02);
        partLine.rotation.x = -0.3;
        this.headGroup.add(partLine);
        break;
      }
      case 'ponytail': {
        // 馬尾 — 前髮+後綁馬尾球
        const frontHair = new THREE.Mesh(new THREE.SphereGeometry(0.315, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.55), hairMat);
        frontHair.position.set(0, 0.06, -0.01);
        this.headGroup.add(frontHair);
        // 馬尾
        const ponytail = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 10), hairMat);
        ponytail.position.set(0, -0.02, -0.32);
        ponytail.scale.set(0.8, 1.4, 0.8);
        this.headGroup.add(ponytail);
        // 髮圈
        const bandMat = new THREE.MeshStandardMaterial({ color: '#f472b6' });
        const band = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.015, 8, 12), bandMat);
        band.position.set(0, 0.06, -0.28);
        band.rotation.x = Math.PI / 2;
        this.headGroup.add(band);
        break;
      }
      case 'long': {
        // 長髮 (披肩)
        const longHair = new THREE.Mesh(new THREE.SphereGeometry(0.32, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.55), hairMat);
        longHair.position.set(0, 0.06, -0.02);
        this.headGroup.add(longHair);
        // 後方長髮延伸
        const backHair = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.10, 0.35, 10), hairMat);
        backHair.position.set(0, -0.14, -0.18);
        this.headGroup.add(backHair);
        break;
      }
      case 'messy': {
        // 蓬亂捲髮 — 多個小球
        const baseHair = new THREE.Mesh(new THREE.SphereGeometry(0.32, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.58), hairMat);
        baseHair.position.set(0, 0.05, -0.01);
        this.headGroup.add(baseHair);
        for (let i = 0; i < 5; i++) {
          const tuft = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 8), hairMat);
          const angle = (i / 5) * Math.PI * 2;
          tuft.position.set(Math.cos(angle) * 0.22, 0.25 + Math.sin(i) * 0.04, Math.sin(angle) * 0.12);
          this.headGroup.add(tuft);
        }
        break;
      }
      case 'bald': {
        // 禿頭 — 只有兩側和後面一圈薄薄的灰白髮
        const sideHair = new THREE.Mesh(new THREE.SphereGeometry(0.31, 16, 10, Math.PI * 0.3, Math.PI * 1.4, Math.PI * 0.35, Math.PI * 0.3), hairMat);
        sideHair.position.set(0, -0.04, -0.02);
        this.headGroup.add(sideHair);
        break;
      }
      case 'helmet': {
        // 安全帽
        const helmetMat = new THREE.MeshStandardMaterial({ color: '#22d3ee', roughness: 0.3 });
        const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.33, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.55), helmetMat);
        helmet.position.set(0, 0.06, -0.01);
        this.headGroup.add(helmet);
        // 帽簷
        const visor = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.03, 0.12), helmetMat);
        visor.position.set(0, 0.04, 0.28);
        visor.rotation.x = -0.3;
        this.headGroup.add(visor);
        break;
      }
      case 'beanie': {
        // 毛帽 (小偷用)
        const beanieMat = new THREE.MeshStandardMaterial({ color: '#0f172a' });
        const beanie = new THREE.Mesh(new THREE.SphereGeometry(0.33, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.6), beanieMat);
        beanie.position.set(0, 0.04, -0.01);
        this.headGroup.add(beanie);
        // 帽緣
        const brim = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.04, 8, 16), beanieMat);
        brim.position.set(0, 0.02, 0);
        brim.rotation.x = Math.PI / 2;
        this.headGroup.add(brim);
        break;
      }
      default: {
        const hair = new THREE.Mesh(new THREE.SphereGeometry(0.31, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.6), hairMat);
        hair.position.set(0, 0.06, -0.01);
        this.headGroup.add(hair);
      }
    }
  }

  // 配件系統
  buildAccessory(type, shirtMat) {
    switch (type) {
      case 'backpack': {
        // 書包 (背在背後)
        const bpMat = new THREE.MeshStandardMaterial({ color: '#3b82f6', roughness: 0.5 });
        const bp = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.30, 0.14), bpMat);
        bp.position.set(0, 0.78, -0.22);
        this.bodyGroup.add(bp);
        // 書包帶子
        const strapMat = new THREE.MeshStandardMaterial({ color: '#1e40af' });
        const strapGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.24, 6);
        [-0.08, 0.08].forEach(sx => {
          const strap = new THREE.Mesh(strapGeo, strapMat);
          strap.position.set(sx, 0.85, -0.08);
          strap.rotation.x = 0.3;
          this.bodyGroup.add(strap);
        });
        break;
      }
      case 'briefcase': {
        // 公事包 (右手提)
        const bcMat = new THREE.MeshStandardMaterial({ color: '#78350f', roughness: 0.4 });
        const bc = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.18, 0.06), bcMat);
        bc.position.set(0.34, 0.48, 0);
        this.bodyGroup.add(bc);
        // 提把
        const handleMat = new THREE.MeshStandardMaterial({ color: '#451a03' });
        const handle = new THREE.Mesh(new THREE.TorusGeometry(0.04, 0.008, 6, 8, Math.PI), handleMat);
        handle.position.set(0.34, 0.58, 0);
        this.bodyGroup.add(handle);
        break;
      }
      case 'handbag': {
        // 小手提袋 (左手提)
        const hbMat = new THREE.MeshStandardMaterial({ color: '#e11d48', roughness: 0.4 });
        const hb = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.14, 0.08), hbMat);
        hb.position.set(-0.32, 0.50, 0);
        this.bodyGroup.add(hb);
        // 金屬釦
        const claspMat = new THREE.MeshStandardMaterial({ color: '#fbbf24', metalness: 0.8, roughness: 0.2 });
        const clasp = new THREE.Mesh(new THREE.SphereGeometry(0.015, 6, 6), claspMat);
        clasp.position.set(-0.32, 0.56, 0.04);
        this.bodyGroup.add(clasp);
        break;
      }
      case 'cap': {
        // 棒球帽
        const capMat = new THREE.MeshStandardMaterial({ color: '#dc2626', roughness: 0.4 });
        const capTop = new THREE.Mesh(new THREE.SphereGeometry(0.31, 14, 8, 0, Math.PI * 2, 0, Math.PI * 0.4), capMat);
        capTop.position.set(0, 0.10, 0);
        this.headGroup.add(capTop);
        // 帽簷
        const brim = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 0.03, 10, 1, false, -Math.PI * 0.4, Math.PI * 0.8), capMat);
        brim.position.set(0, 0.04, 0.22);
        brim.rotation.x = -0.5;
        this.headGroup.add(brim);
        break;
      }
    }
  }

  // 建立顧客購物手提籃
  buildShoppingBasket() {
    this.basketGroup = new THREE.Group();
    // 籃身
    const basketMat = new THREE.MeshStandardMaterial({ color: '#ef4444', roughness: 0.5 });
    const basket = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.12, 0.22), basketMat);
    basket.position.set(-0.35, 0.44, 0.10);
    this.basketGroup.add(basket);

    // 提把
    const handleMat = new THREE.MeshStandardMaterial({ color: '#fef08a' });
    const handle = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.012, 6, 12, Math.PI), handleMat);
    handle.position.set(-0.35, 0.53, 0.10);
    handle.rotation.y = Math.PI / 2;
    this.basketGroup.add(handle);

    // 籃內商品群組
    this.basketContentsGroup = new THREE.Group();
    this.basketContentsGroup.position.set(-0.35, 0.46, 0.10);
    this.basketGroup.add(this.basketContentsGroup);

    this.bodyGroup.add(this.basketGroup);
  }

  // 小偷專屬：背在背後的滿滿戰利品麻布大袋
  buildThiefLootSack() {
    this.sackGroup = new THREE.Group();
    const sackMat = new THREE.MeshStandardMaterial({ color: '#92400e', roughness: 0.8 });
    const sack = new THREE.Mesh(new THREE.SphereGeometry(0.24, 12, 10), sackMat);
    sack.scale.set(1.1, 1.3, 0.9);
    sack.position.set(0.18, 0.72, -0.22);
    sack.rotation.z = -0.3;
    this.sackGroup.add(sack);

    // 繩結
    const knot = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.06, 0.08, 8), sackMat);
    knot.position.set(0.10, 0.94, -0.16);
    this.sackGroup.add(knot);

    // 金幣標記 (金色 💰 符號)
    const coinCanvas = document.createElement('canvas');
    coinCanvas.width = 64; coinCanvas.height = 64;
    const cCtx = coinCanvas.getContext('2d');
    cCtx.fillStyle = '#fde047';
    cCtx.beginPath(); cCtx.arc(32, 32, 26, 0, Math.PI * 2); cCtx.fill();
    cCtx.strokeStyle = '#ca8a04'; cCtx.lineWidth = 4; cCtx.stroke();
    cCtx.fillStyle = '#854d0e'; cCtx.font = 'bold 32px sans-serif'; cCtx.textAlign = 'center';
    cCtx.fillText('$', 32, 42);
    const coinSpr = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(coinCanvas), transparent: true }));
    coinSpr.position.set(0.22, 0.72, -0.34);
    coinSpr.scale.set(0.22, 0.22, 1);
    this.sackGroup.add(coinSpr);

    this.bodyGroup.add(this.sackGroup);
  }

  // 將選購的微縮商品放入購物籃
  addItemToBasketVisual(itemDef) {
    if (!this.basketContentsGroup) return;
    const count = this.basketContentsGroup.children.length;
    if (count >= 4) return;

    const miniMat = new THREE.MeshStandardMaterial({ color: itemDef.color || '#f59e0b', roughness: 0.4 });
    const mini = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.06), miniMat);
    const ox = (count % 2 === 0 ? -0.04 : 0.04);
    const oz = (count >= 2 ? 0.04 : -0.04);
    mini.position.set(ox, 0.04, oz);
    this.basketContentsGroup.add(mini);
  }

  // 結帳後將籃子換為橘子便利超商手提購物袋
  replaceBasketWithBag() {
    if (this.basketGroup) {
      this.bodyGroup.remove(this.basketGroup);
      this.basketGroup = null;
    }

    const bagGroup = new THREE.Group();
    const bagMat = new THREE.MeshStandardMaterial({
      color: '#ffffff',
      roughness: 0.3,
      transparent: true,
      opacity: 0.95
    });
    const bag = new THREE.Mesh(new THREE.BoxGeometry(0.20, 0.24, 0.12), bagMat);
    bag.position.set(-0.35, 0.45, 0.06);
    bagGroup.add(bag);

    // 購物袋橘子標誌
    const logoCanvas = document.createElement('canvas');
    logoCanvas.width = 64; logoCanvas.height = 64;
    const lCtx = logoCanvas.getContext('2d');
    lCtx.font = '36px sans-serif'; lCtx.textAlign = 'center';
    lCtx.fillText('🍊', 32, 46);
    const logoSpr = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(logoCanvas), transparent: true }));
    logoSpr.position.set(-0.35, 0.45, 0.13);
    logoSpr.scale.set(0.15, 0.15, 1);
    bagGroup.add(logoSpr);

    this.bodyGroup.add(bagGroup);
  }

  createMoodBubble() {
    const canvas = document.createElement('canvas');
    canvas.width = 128; canvas.height = 128;
    this.bubbleCanvas = canvas;
    this.bubbleTex = new THREE.CanvasTexture(canvas);

    const spriteMat = new THREE.SpriteMaterial({ map: this.bubbleTex, transparent: true });
    this.bubbleSprite = new THREE.Sprite(spriteMat);
    this.bubbleSprite.position.set(0, 1.95, 0);
    this.bubbleSprite.scale.set(0.75, 0.75, 1);
    this.bubbleSprite.visible = false;
    this.group.add(this.bubbleSprite);
  }

  setMood(emoji, bgColor = '#ffffff') {
    const ctx = this.bubbleCanvas.getContext('2d');
    ctx.clearRect(0, 0, 128, 128);

    // 帶尾巴的對話氣泡
    ctx.fillStyle = bgColor;
    ctx.beginPath();
    ctx.arc(64, 56, 48, 0, Math.PI * 2);
    ctx.fill();
    // 氣泡尾巴
    ctx.beginPath();
    ctx.moveTo(54, 100);
    ctx.lineTo(64, 120);
    ctx.lineTo(74, 100);
    ctx.fill();

    ctx.strokeStyle = this.isThief ? '#ef4444' : '#d1d5db';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(64, 56, 48, 0, Math.PI * 2);
    ctx.stroke();

    ctx.font = '48px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(emoji, 64, 56);

    this.bubbleTex.needsUpdate = true;
    this.bubbleSprite.visible = true;
    this.moodTimeout = this.isThief ? 999 : 3.5;
  }

  setTarget(pos) {
    this.targetPos.copy(pos);
    // 透過超商導航系統計算避開貨架與擺設的最佳走道路徑航點
    if (this.store && this.store.findPath) {
      this.path = this.store.findPath(this.group.position, this.targetPos);
    } else {
      this.path = [this.targetPos.clone()];
    }
    this.pathIndex = 0;
  }

  update(delta) {
    // Q 版程序動畫：行走時身體上下彈跳、手臂與腿部鐘擺擺動
    const isMoving = this.state === 'WALKING_IN' || this.state === 'WALKING_OUT' || this.state === 'BROWSING' || this.state === 'WAITING_CHECKOUT';
    if (this.importedMixer) {
      this.importedMixer.update(delta);
      this.playImportedAnimation(isMoving ? 'walk' : 'idle');
    }

    if (this.bodyGroup) {
      this.bobTime += delta * 8;

      if (isMoving) {
        // 身體上下彈跳
        this.bodyGroup.position.y = Math.abs(Math.sin(this.bobTime)) * 0.06;
        // 地面接觸陰影呼吸微縮放
        if (this.contactShadow) {
          const shadowScale = 1 - Math.abs(Math.sin(this.bobTime)) * 0.15;
          this.contactShadow.scale.set(shadowScale, shadowScale, 1);
        }
        // 頭部晃動
        if (this.headGroup) {
          this.headGroup.position.y = 1.18 + Math.abs(Math.sin(this.bobTime + 0.5)) * 0.04;
          this.headGroup.rotation.z = Math.sin(this.bobTime * 0.5) * 0.05;
        }
        // 手臂擺動
        if (this.leftArm) this.leftArm.rotation.x = Math.sin(this.bobTime) * 0.45;
        if (this.rightArm) this.rightArm.rotation.x = -Math.sin(this.bobTime) * 0.45;
        // 腿部交替邁步
        if (this.leftLeg) this.leftLeg.rotation.x = Math.sin(this.bobTime) * 0.35;
        if (this.rightLeg) this.rightLeg.rotation.x = -Math.sin(this.bobTime) * 0.35;
        // 鞋子跟隨
        if (this.leftShoe) this.leftShoe.position.z = 0.03 + Math.sin(this.bobTime) * 0.05;
        if (this.rightShoe) this.rightShoe.position.z = 0.03 - Math.sin(this.bobTime) * 0.05;
      } else {
        // 站立呼吸微動
        this.bodyGroup.position.y = Math.sin(this.bobTime * 0.8) * 0.015;
        if (this.headGroup) {
          this.headGroup.position.y = 1.18 + Math.sin(this.bobTime * 0.8) * 0.015;
          this.headGroup.rotation.z = 0;
        }
        if (this.leftArm) this.leftArm.rotation.x = 0;
        if (this.rightArm) this.rightArm.rotation.x = 0;
        if (this.leftLeg) this.leftLeg.rotation.x = 0;
        if (this.rightLeg) this.rightLeg.rotation.x = 0;
      }
    }

    if (this.moodTimeout > 0 && !this.isThief) {
      this.moodTimeout -= delta;
      if (this.moodTimeout <= 0) {
        this.bubbleSprite.visible = false;
      }
    }

    if (this.isThief) {
      this.handleThiefBehavior(delta);
      return;
    }

    switch (this.state) {
      case 'WALKING_IN':
        if (this.moveToTarget(delta) < 0.3) {
          this.state = 'BROWSING';
          this.goToNextWishItem();
        }
        break;
      case 'BROWSING':
        if (this.moveToTarget(delta) < 0.4) {
          this.waitTime += delta;
          if (this.waitTime >= 1.2) {
            this.waitTime = 0;
            this.inspectCurrentShelf();
            this.currentWishIndex++;
            this.goToNextWishItem();
          }
        }
        break;
      case 'WAITING_CHECKOUT':
        if (this.moveToTarget(delta) < 0.4) {
          this.state = 'CHECKING_OUT';
          this.waitTime = 0;
        }
        break;
      case 'CHECKING_OUT':
        this.waitTime += delta;
        if (this.waitTime >= 1.4) {
          this.completeCheckout();
        }
        break;
      case 'SITTING':
        this.waitTime += delta;
        if (this.waitTime >= 3.0) {
          if (this.assignedTable) this.assignedTable.isOccupied = false;
          this.setMood('🥰');
          this.leaveStore();
        }
        break;
      case 'WALKING_OUT':
        if (this.moveToTarget(delta) < 0.4) {
          this.destroy();
        }
        break;
    }
  }

  handleThiefBehavior(delta) {
    const dist = this.moveToTarget(delta);
    if (dist < 0.4) {
      this.waitTime += delta;
      if (this.waitTime > 3.0) {
        this.leaveStore();
      }
    }
  }

  // 動態前往下一個心儀商品的貨架 (支援玩家自由更換貨架位置與販售品項)
  goToNextWishItem() {
    if (this.currentWishIndex >= this.wishList.length) {
      if (this.basketItems.length > 0) {
        this.state = 'WAITING_CHECKOUT';
        this.setTarget(this.store.checkoutPos);
      } else {
        this.leaveStore();
      }
      return;
    }

    const itemId = this.wishList[this.currentWishIndex];
    const itemDef = ITEM_DEFINITIONS[itemId];
    if (!itemDef) {
      this.currentWishIndex++;
      this.goToNextWishItem();
      return;
    }

    // 動態匹配正在販售該商品的貨架
    const shelf = Object.values(this.store.shelves).find(s => s.itemId === itemId) || this.store.shelves[itemDef.shelfId];

    if (shelf) {
      this.setTarget(shelf.customerApproachPos);
    } else {
      this.currentWishIndex++;
      this.goToNextWishItem();
    }
  }

  inspectCurrentShelf() {
    const itemId = this.wishList[this.currentWishIndex];
    const itemDef = ITEM_DEFINITIONS[itemId];
    if (!itemDef) return;

    // 動態匹配貨架
    const shelf = Object.values(this.store.shelves).find(s => s.itemId === itemId) || this.store.shelves[itemDef.shelfId];

    if (!shelf || shelf.currentCount <= 0) {
      this.setMood('💢');
      sounds.playDisappointed();
      if (this.onLostSale) this.onLostSale(itemDef, 'out_of_stock');
      return;
    }

    const priceRatio = itemDef.currentPrice / itemDef.suggestedPrice;
    if (priceRatio > itemDef.priceTolerance) {
      this.setMood('❓');
      if (this.onLostSale) this.onLostSale(itemDef, 'too_expensive');
      return;
    }

    shelf.currentCount--;
    this.store.refreshShelfItems(shelf.id);
    this.basketItems.push({ itemDef, price: itemDef.currentPrice });
    this.addItemToBasketVisual(itemDef);

    // 根據商品顯示不同表情
    const emojiMap = { triangle: '🍙', bottle: '🍵', can: '☕', bag: '🍟', cup: '🍜', bowl: '🍢' };
    this.setMood(emojiMap[itemDef.shape] || '😋');
    sounds.playRestockSound();
  }

  completeCheckout() {
    sounds.playScanBeep();
    setTimeout(() => sounds.playCashRegister(), 150);

    let totalSpent = 0;
    this.basketItems.forEach(b => totalSpent += b.price);
    this.setMood('❤️');

    // 換成環保手提購物袋
    this.replaceBasketWithBag();

    if (this.onCheckoutComplete) {
      this.onCheckoutComplete(this, totalSpent, this.basketItems);
    }

    const freeTable = this.store.tables.find(t => !t.isOccupied);
    if (freeTable && Math.random() > 0.4) {
      freeTable.isOccupied = true;
      this.assignedTable = freeTable;
      this.state = 'SITTING';
      this.waitTime = 0;
      this.setTarget(freeTable.seatPos);
      return;
    }

    this.leaveStore();
  }

  leaveStore() {
    this.state = 'WALKING_OUT';
    this.setTarget(new THREE.Vector3(0, 0, 10.5));
    if (this.animController) this.animController.playAnimation('walk');
  }

  moveToTarget(delta) {
    if (!this.path || this.path.length === 0) {
      this.path = [this.targetPos.clone()];
      this.pathIndex = 0;
    }

    // 當前需要前往的航點 (Waypoint)
    let currentWaypoint = this.path[this.pathIndex] || this.targetPos;
    let dirToWp = new THREE.Vector3().subVectors(currentWaypoint, this.group.position);
    dirToWp.y = 0;
    let distToWp = dirToWp.length();

    // 抵達中間航點時切換至下一航點
    while (distToWp < 0.32 && this.pathIndex < this.path.length - 1) {
      this.pathIndex++;
      currentWaypoint = this.path[this.pathIndex];
      dirToWp = new THREE.Vector3().subVectors(currentWaypoint, this.group.position);
      dirToWp.y = 0;
      distToWp = dirToWp.length();
    }

    // 朝當前航點走道前進
    if (distToWp > 0.04) {
      dirToWp.normalize();
      this.group.position.addScaledVector(dirToWp, this.speed * delta);

      // 柔和圓滑轉身朝向前進走道方向 (Smooth Walking Rotation)
      const targetAngle = Math.atan2(dirToWp.x, dirToWp.z);
      const currentAngle = this.group.rotation.y;
      let angleDiff = targetAngle - currentAngle;
      while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
      while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
      this.group.rotation.y += angleDiff * Math.min(1, delta * 9.0);

      if (this.animController) {
        this.animController.playAnimation('walk');
      }
    }

    // 計算人物離最終目的地 (如貨架站立點/收銀台) 的距離
    const finalDir = new THREE.Vector3().subVectors(this.targetPos, this.group.position);
    finalDir.y = 0;
    return finalDir.length();
  }

  destroy() {
    this.state = 'DONE';
    if (this.assignedTable) this.assignedTable.isOccupied = false;
    this.group.parent?.remove(this.group);
  }
}
