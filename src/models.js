// 3D 骨架模型與動作載入器 (Skeletal Model & Animation Manager)
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';

class ModelManager {
  constructor() {
    this.loader = new GLTFLoader();
    this.humanModel = null;
    this.humanClips = [];
    this.robotModel = null;
    this.robotClips = [];
    this.isLoaded = false;
  }

  // 預先載入 3D 人型骨架動畫模型
  async preloadModels() {
    if (this.isLoaded) return;

    try {
      // 載入具備真實人型骨架與動作的 Xbot.glb
      const gltf = await this.loadAsync('/models/Xbot.glb');
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
