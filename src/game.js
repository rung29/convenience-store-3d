// 遊戲核心邏輯 - 遊戲橘子《便利商店》風格與純滑鼠微縮經營
import * as THREE from 'three';
import { Store3D } from './store3d.js';
import { CHARACTER_SET_IDS, Customer } from './customer.js';
import { modelManager } from './models.js';
import { ITEM_DEFINITIONS } from './items.js';
import { sounds } from './audio.js';
import confetti from 'canvas-confetti';

export class Game {
  constructor(canvasContainer) {
    this.container = canvasContainer;

    // 經營數據 (經典橘子便利商店指標)
    this.day = 1;
    this.money = 2500;       // 資金 (NT$)
    this.reputation = 65;    // 店鋪知名度 (0~100)
    this.cleanliness = 95;   // 店面清潔度 (0~100)
    this.timeOfDay = 8.0;    // 營業時間 08:00
    this.isStoreOpen = true; // 是否營業中
    this.isPaused = false;   // 暫停開關
    this.timeSpeed = 1.0;    // 時間倍率 (1x, 2x)
    this.characterSet = CHARACTER_SET_IDS.MODERN;
    this.testCharactersEnabled = false;
    this.isDecorMode = false; // 是否在自由裝潢佈置模式
    this.decorPanelCollapsed = false;
    this.clerkHintDismissed = false;

    // 當日營運統計
    this.dayStats = {
      revenue: 0,
      cogs: 0,
      marketingCost: 0,
      customersServed: 0,
      itemsSold: 0,
      lostSalesStock: 0,
      lostSalesPrice: 0,
      thievesCaught: 0
    };

    // 今日目標任務 (Gamania 任務挑戰)
    this.dailyQuest = {
      title: '熱銷飲品大促銷',
      description: '累計售出 15 瓶極品綠茶或咖啡',
      targetCount: 15,
      currentCount: 0,
      reward: 250,
      isCompleted: false,
      isClaimed: false
    };

    // 顧客與事件計時
    this.customers = [];
    this.customerSpawnTimer = 0;
    this.thiefTimer = 0;

    // 滑鼠正交相機視角控制：預設把店內主場景放大，讓商品與陳列細節成為畫面主角。
    // 保留完整地圖，但用更近的正交鏡頭讓店舖、貨架與角色同步放大。
    // Keep the whole expanded plaza in frame while reserving enough detail for
    // portrait phones and short landscape windows.
    const viewport = this.getViewportSize();
    const shortestSide = Math.min(viewport.width, viewport.height);
    this.cameraZoom = shortestSide < 560 ? 28 : shortestSide < 820 ? 24 : 22;
    this.cameraPan = new THREE.Vector3(0, 0, 0);

    // 初始化場景與微縮店鋪
    this.initIsometricScene();
    this.store = new Store3D(this.scene);

    // 滑鼠事件監聽 (拖曳平移、滾輪縮放、點擊 3D 物件)
    this.setupMouseControls();

    // 綁定 UI 事件
    this.bindUIEvents();

    // 啟動主渲染迴圈
    this.clock = new THREE.Clock();
    this.animate = this.animate.bind(this);
    requestAnimationFrame(this.animate);

    this.updateHUD();
    this.updateQuestCard();

    setTimeout(() => {
      this.showTopBanner('🍊 歡迎來到橘子超商！滑鼠點擊「裝潢擺設」即可自由挪移貨架、旋轉並調整商品！');
    }, 800);
  }

  getViewportSize() {
    const rect = this.container?.getBoundingClientRect?.();
    const visualViewport = window.visualViewport;
    return {
      width: Math.max(1, Math.round(rect?.width || visualViewport?.width || window.innerWidth || 1)),
      height: Math.max(1, Math.round(rect?.height || visualViewport?.height || window.innerHeight || 1))
    };
  }

  getRenderPixelRatio(width) {
    const devicePixelRatio = window.devicePixelRatio || 1;
    // Keep phones responsive without making desktop shadows visibly soft.
    return Math.min(devicePixelRatio, width < 760 ? 1.5 : 2);
  }

  resizeViewport() {
    if (!this.camera || !this.renderer) return;

    const { width, height } = this.getViewportSize();
    this.viewportWidth = width;
    this.viewportHeight = height;
    const aspect = width / height;
    const zoom = this.cameraZoom;
    this.camera.left = -zoom * aspect;
    this.camera.right = zoom * aspect;
    this.camera.top = zoom;
    this.camera.bottom = -zoom;
    this.camera.updateProjectionMatrix();
    this.renderer.setPixelRatio(this.getRenderPixelRatio(width));
    this.renderer.setSize(width, height, false);
  }

  // 正交微縮相機
  initIsometricScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xf6ede2); // 溫暖米粉白
    this.scene.fog = new THREE.Fog(0xf6ede2, 42, 86);

    const { width, height } = this.getViewportSize();
    const aspect = width / height;
    const d = this.cameraZoom;

    this.camera = new THREE.OrthographicCamera(-d * aspect, d * aspect, d, -d, 1, 1000);
    this.camera.position.set(24, 28, 24);
    this.camera.lookAt(0, 1.0, 0);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.12;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.container.appendChild(this.renderer.domElement);
    this.resizeViewport();

    const scheduleResize = () => {
      if (this.resizeFrame) cancelAnimationFrame(this.resizeFrame);
      this.resizeFrame = requestAnimationFrame(() => {
        this.resizeFrame = null;
        this.resizeViewport();
      });
    };
    window.addEventListener('resize', scheduleResize, { passive: true });
    window.addEventListener('orientationchange', scheduleResize, { passive: true });
    window.visualViewport?.addEventListener('resize', scheduleResize, { passive: true });
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(scheduleResize);
      this.resizeObserver.observe(this.container);
    }
  }

  // Pointer controls work with mouse, pen, and touch. This keeps the same
  // drag-to-pan and drag-to-place interaction on desktop and mobile.
  setupMouseControls() {
    let isCameraDragging = false;
    let isObjectDragging = false;
    let prevPointerX = 0;
    let prevPointerY = 0;
    let dragDist = 0;
    let pinchStartDistance = 0;
    let pinchStartZoom = this.cameraZoom;
    const activePointers = new Map();

    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    this.floorPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    this.planeIntersectPoint = new THREE.Vector3();

    const updateRayFromPointer = (event) => {
      const rect = this.container.getBoundingClientRect();
      const width = Math.max(rect.width, 1);
      const height = Math.max(rect.height, 1);
      this.mouse.x = ((event.clientX - rect.left) / width) * 2 - 1;
      this.mouse.y = -((event.clientY - rect.top) / height) * 2 + 1;
      this.raycaster.setFromCamera(this.mouse, this.camera);
    };

    const pointerDistance = () => {
      const [first, second] = [...activePointers.values()];
      if (!first || !second) return 0;
      return Math.hypot(second.x - first.x, second.y - first.y);
    };

    const panCamera = (dx, dy) => {
      const panFactor = 0.05 * (this.cameraZoom / 45);
      const right = new THREE.Vector3(1, 0, -1).normalize();
      const up = new THREE.Vector3(-1, 0, -1).normalize();
      this.cameraPan.addScaledVector(right, -dx * panFactor);
      this.cameraPan.addScaledVector(up, dy * panFactor);
      this.updateCameraTransform();
    };

    const finishObjectPlacement = () => {
      isObjectDragging = false;
      const placed = this.store.applyGhostPlacement();
      if (placed) {
        sounds.playRestockSound();
        this.showTopBanner('📍 擺設位置已更新！顧客尋路動線已自動重新計算！');
        this.updateHUD();
      } else {
        sounds.playDisappointed();
        this.showTopBanner('❌ 該位置會阻礙顧客出入口或收銀台走道，已恢復原位！');
      }
    };

    const resetPointerState = (event, { activateClick = true } = {}) => {
      if (isObjectDragging && this.isDecorMode) {
        finishObjectPlacement();
      } else {
        const wasCameraDragging = isCameraDragging;
        isCameraDragging = false;
        if (activateClick && wasCameraDragging && dragDist < 8) {
          this.handleSceneClick(event);
        }
      }
      activePointers.clear();
    };

    this.container.addEventListener('pointerdown', event => {
      if (event.pointerType === 'mouse' && event.button !== 0) return;
      sounds.init();
      activePointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
      dragDist = 0;

      if (activePointers.size > 1) {
        isCameraDragging = false;
        isObjectDragging = false;
        pinchStartDistance = pointerDistance();
        pinchStartZoom = this.cameraZoom;
        return;
      }

      prevPointerX = event.clientX;
      prevPointerY = event.clientY;
      updateRayFromPointer(event);

      if (this.isDecorMode) {
        const hits = this.raycaster.intersectObjects(this.scene.children, true);
        let hitObj = null;

        for (const hit of hits) {
          let obj = hit.object;
          while (obj && !obj.userData?.isShelf && !obj.userData?.isDecor && obj.parent) {
            obj = obj.parent;
          }
          if (obj?.userData?.isShelf || obj?.userData?.isDecor) {
            hitObj = obj;
            break;
          }
        }

        if (hitObj) {
          isObjectDragging = true;
          isCameraDragging = false;
          if (hitObj.userData.isShelf) {
            this.selectDecorItem(hitObj.userData.shelfId, 'shelf');
          } else {
            this.selectDecorItem(hitObj.userData.decorId, 'decor');
          }
          this.store.createGhostPreview();
        } else if (this.store.selectedObject
          && this.raycaster.ray.intersectPlane(this.floorPlane, this.planeIntersectPoint)) {
          isObjectDragging = true;
          isCameraDragging = false;
          this.store.createGhostPreview();
          this.store.updateGhostPosition(this.planeIntersectPoint);
        }
      }

      if (!isObjectDragging) {
        isCameraDragging = true;
      }

      try {
        this.container.setPointerCapture?.(event.pointerId);
      } catch {
        // Pointer capture is optional on embedded or older browsers.
      }
    });

    this.container.addEventListener('pointermove', event => {
      if (!activePointers.has(event.pointerId)) return;
      activePointers.set(event.pointerId, { x: event.clientX, y: event.clientY });

      if (activePointers.size > 1) {
        const distance = pointerDistance();
        if (pinchStartDistance > 0 && distance > 0) {
          this.cameraZoom = THREE.MathUtils.clamp(
            pinchStartZoom - (distance - pinchStartDistance) * 0.05,
            12,
            68
          );
          this.updateCameraTransform();
        }
        return;
      }

      updateRayFromPointer(event);
      const dx = event.clientX - prevPointerX;
      const dy = event.clientY - prevPointerY;
      prevPointerX = event.clientX;
      prevPointerY = event.clientY;
      dragDist += Math.abs(dx) + Math.abs(dy);

      if (isObjectDragging && this.isDecorMode) {
        if (this.raycaster.ray.intersectPlane(this.floorPlane, this.planeIntersectPoint)) {
          this.store.updateGhostPosition(this.planeIntersectPoint);
        }
        return;
      }

      if (isCameraDragging) {
        panCamera(dx, dy);
      }
    });

    const endPointer = (event, cancelled = false) => {
      activePointers.delete(event.pointerId);
      if (activePointers.size > 0) {
        const remaining = [...activePointers.values()][0];
        prevPointerX = remaining.x;
        prevPointerY = remaining.y;
        pinchStartDistance = 0;
        dragDist = 8;
        isCameraDragging = !isObjectDragging;
        return;
      }

      try {
        this.container.releasePointerCapture?.(event.pointerId);
      } catch {
        // Pointer capture is optional on embedded or older browsers.
      }
      resetPointerState(event, { activateClick: !cancelled });
    };

    this.container.addEventListener('pointerup', event => endPointer(event));
    this.container.addEventListener('pointercancel', event => endPointer(event, true));
    this.container.addEventListener('lostpointercapture', event => {
      if (activePointers.has(event.pointerId)) endPointer(event, true);
    });
    this.container.addEventListener('contextmenu', event => event.preventDefault());

    this.container.addEventListener('wheel', event => {
      event.preventDefault();
      this.cameraZoom = THREE.MathUtils.clamp(this.cameraZoom + event.deltaY * 0.03, 12, 68);
      this.updateCameraTransform();
    }, { passive: false });
  }

  updateCameraTransform() {
    const { width, height } = this.getViewportSize();
    const aspect = width / height;
    const d = this.cameraZoom;
    this.camera.left = -d * aspect;
    this.camera.right = d * aspect;
    this.camera.top = d;
    this.camera.bottom = -d;
    this.camera.updateProjectionMatrix();

    this.camera.position.set(24 + this.cameraPan.x, 28 + this.cameraPan.y, 24 + this.cameraPan.z);
    this.camera.lookAt(this.cameraPan.x, 1.0 + this.cameraPan.y, this.cameraPan.z);
  }

  // 滑鼠點擊 3D 物件 (點紙箱補貨、點貨架管理、點顧客互動、點小偷抓小偷、裝潢點選)
  handleSceneClick(e) {
    const rect = this.container.getBoundingClientRect();
    const width = Math.max(rect.width, 1);
    const height = Math.max(rect.height, 1);
    this.mouse.x = ((e.clientX - rect.left) / width) * 2 - 1;
    this.mouse.y = -((e.clientY - rect.top) / height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.scene.children, true);

    if (intersects.length === 0) {
      if (this.isDecorMode) {
        this.store.deselectObject();
        const selBox = document.getElementById('decor-selection-box');
        if (selBox) selBox.style.display = 'none';
      }
      return;
    }

    // 裝潢模式下的點選互動
    if (this.isDecorMode) {
      this.handleDecorSceneClick(intersects);
      return;
    }

    for (let hit of intersects) {
      let obj = hit.object;

      while (obj && !obj.userData?.isBox && !obj.userData?.isCustomer && !obj.userData?.isShelf && obj.parent) {
        obj = obj.parent;
      }

      // 1. 抓小偷 (經典橘子便利商店事件！)
      if (obj?.userData?.isCustomer && obj.userData?.isThief) {
        this.catchThief(obj.userData.customer);
        return;
      }

      // 2. 點擊進貨紙箱 -> 迅速補貨到貨架
      if (obj?.userData?.isBox) {
        this.clickRestockBox(obj);
        return;
      }

      // 3. 點擊貨架 -> 快速補滿與查看商品詳情
      if (obj?.userData?.isShelf) {
        this.clickShelfQuickManage(obj.userData.shelfId);
        return;
      }

      // 4. 點擊顧客 -> 顧客發出喜悅並給予小費
      if (obj?.userData?.isCustomer) {
        this.clickCustomerInteract(obj.userData.customer);
        return;
      }
    }
  }

  // 裝潢模式專用點選判斷
  handleDecorSceneClick(intersects) {
    for (let hit of intersects) {
      let obj = hit.object;
      while (obj && !obj.userData?.isShelf && !obj.userData?.isDecor && obj.parent) {
        obj = obj.parent;
      }
      if (obj?.userData?.isShelf) {
        this.selectDecorItem(obj.userData.shelfId, 'shelf');
        return;
      } else if (obj?.userData?.isDecor) {
        this.selectDecorItem(obj.userData.decorId, 'decor');
        return;
      }
    }

    this.store.deselectObject();
    const selBox = document.getElementById('decor-selection-box');
    if (selBox) selBox.style.display = 'none';
  }

  // 選中貨架或擺飾並展開調整工具列
  selectDecorItem(id, type) {
    const sel = this.store.selectObject(id, type);
    if (!sel) return;

    sounds.playClick();
    const selBox = document.getElementById('decor-selection-box');
    if (selBox) selBox.style.display = 'flex';

    const nameEl = document.getElementById('selected-obj-name');
    const catEl = document.getElementById('selected-obj-cat');
    const shelfItemGroup = document.getElementById('shelf-item-tool-group');
    const shelfThemeGroup = document.getElementById('shelf-theme-tool-group');

    if (nameEl) nameEl.textContent = sel.target.name || sel.id;
    const catName = sel.target.category || (type === 'shelf' ? '營業貨架' : '店面美化');
    if (catEl) catEl.textContent = catName;

    if (type === 'shelf') {
      if (shelfItemGroup) shelfItemGroup.style.display = 'flex';
      if (shelfThemeGroup) shelfThemeGroup.style.display = 'flex';
      document.querySelectorAll('.btn-chip').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.item === sel.target.itemId);
      });
    } else {
      if (shelfItemGroup) shelfItemGroup.style.display = 'none';
      if (shelfThemeGroup) shelfThemeGroup.style.display = 'none';
    }

    this.showTopBanner(`✨ 已選中【${sel.target.name || '擺設'}】！請用滑鼠直接在地面按住拖曳或使用下方方向鍵微調！`);
  }

  // 抓小偷事件處理！
  catchThief(thiefCustomer) {
    sounds.playCatchThief();
    const bounty = 300;
    this.money += bounty;
    this.dayStats.revenue += bounty;
    this.dayStats.thievesCaught++;
    this.reputation = Math.min(100, this.reputation + 5);

    try {
      confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 } });
    } catch {}

    this.showTopBanner(`🚨 成功抓到小偷！店長眼明手快，獲得警民合作獎金 NT$ ${bounty}！`);
    thiefCustomer.destroy();
    this.updateHUD();
  }

  // 點擊紙箱補貨
  clickRestockBox(boxGroup) {
    const data = boxGroup.userData;
    const itemDef = ITEM_DEFINITIONS[data.itemId];
    const shelf = this.store.shelves[data.targetShelfId];

    if (!itemDef || !shelf) {
      this.showTopBanner('⚠️ 這箱貨品找不到對應貨架，請重新進貨。');
      sounds.playDisappointed();
      return;
    }

    const space = shelf.capacity - shelf.currentCount;
    if (space <= 0) {
      this.showTopBanner(`【${shelf.name}】貨架已經補滿囉！`);
      sounds.playClick();
      return;
    }

    const restockAmount = Math.min(space, data.itemCount);
    shelf.currentCount += restockAmount;
    data.itemCount -= restockAmount;
    this.store.refreshShelfItems(shelf.id);
    sounds.playRestockSound();

    this.showTopBanner(`✨ 已將 ${restockAmount} 件【${itemDef.name}】迅速上架！(庫存: ${shelf.currentCount}/${shelf.capacity})`);

    if (data.itemCount <= 0) {
      this.store.removeBox(boxGroup);
    }
    this.updateHUD();
  }

  // 點擊貨架快速補滿
  clickShelfQuickManage(shelfId) {
    const shelf = this.store.shelves[shelfId];
    if (!shelf) return;

    const itemDef = ITEM_DEFINITIONS[shelf.itemId];
    const needed = shelf.capacity - shelf.currentCount;

    if (needed <= 0) {
      this.showTopBanner(`✨【${shelf.name}】貨架庫存充足！`);
      sounds.playClick();
      return;
    }

    const cost = itemDef.cost * needed;
    if (this.money < cost) {
      this.showTopBanner(`❌ 補滿需要 NT$ ${cost}，資金不足！`);
      sounds.playDisappointed();
      return;
    }

    this.money -= cost;
    this.dayStats.cogs += cost;
    shelf.currentCount = shelf.capacity;
    this.store.refreshShelfItems(shelf.id);
    sounds.playCashRegister();

    this.showTopBanner(`⚡ 已花費 NT$ ${cost} 將【${shelf.name}】瞬間補滿！`);
    this.updateHUD();
  }

  // 點擊顧客互動
  clickCustomerInteract(customer) {
    if (!customer || customer.isThief || customer.state === 'DONE') return;
    if (customer.tipClaimed) {
      this.showTopBanner(`🤗 ${customer.archetype.name} 已經送過小費囉！`);
      return;
    }

    customer.tipClaimed = true;
    customer.setMood('🥰');
    const tip = 20;
    this.money += tip;
    this.dayStats.revenue += tip;
    sounds.playCashRegister();

    const greetings = [
      '這間超商的便當真是太好吃了！',
      '店員親切又熱情，給五星好評！',
      '綠茶好清爽回甘，明天還要來買～',
      '店裡音樂真放鬆！'
    ];
    const greet = greetings[Math.floor(Math.random() * greetings.length)];
    this.showTopBanner(`💖 ${customer.archetype.name} 顧客說：「${greet}」給予小費 +${tip} 金幣！`);
    this.updateHUD();
  }

  // 一鍵補滿全店所有貨架 (經典一鍵爽快功能)
  restockAllShelves() {
    let totalRestocked = 0;
    let totalCost = 0;
    let hasShortage = false;
    let hasNeed = false;

    Object.values(this.store.shelves).forEach(shelf => {
      const itemDef = ITEM_DEFINITIONS[shelf.itemId];
      if (!itemDef) return;
      const needed = shelf.capacity - shelf.currentCount;
      if (needed <= 0) return;

      hasNeed = true;
      const affordable = Math.floor(this.money / itemDef.cost);
      const restockAmount = Math.min(needed, affordable);
      if (restockAmount > 0) {
        const cost = itemDef.cost * restockAmount;
        this.money -= cost;
        totalCost += cost;
        shelf.currentCount += restockAmount;
        totalRestocked += restockAmount;
        this.store.refreshShelfItems(shelf.id);
      }
      if (restockAmount < needed) {
        hasShortage = true;
      }
    });

    if (totalRestocked > 0) {
      this.dayStats.cogs += totalCost;
      sounds.playCashRegister();
      const shortageMessage = hasShortage ? '（資金不足，已先補能負擔的數量）' : '';
      this.showTopBanner(`🎉 一鍵補貨完成！補齊 ${totalRestocked} 件商品 (總支出 NT$ ${totalCost})${shortageMessage}`);
    } else if (hasNeed && hasShortage) {
      this.showTopBanner('❌ 目前資金不足，無法進貨；請先提高售價、完成交易或進行行銷。');
      sounds.playDisappointed();
    } else {
      this.showTopBanner('✨ 全店貨架目前都是滿滿的狀態！');
      sounds.playClick();
    }
    this.updateHUD();
  }

  // 行銷宣傳活動 (Gamania 便利商店經典行銷模式)
  executeMarketing(type) {
    if (type === 'flyer') {
      // 派發傳單 (NT$ 120)
      if (this.money < 120) {
        this.showTopBanner('❌ 資金不足！派發傳單需要 NT$ 120');
        sounds.playDisappointed();
        return;
      }
      this.money -= 120;
      this.dayStats.marketingCost += 120;
      this.reputation = Math.min(100, this.reputation + 4);
      sounds.playMarketing();
      this.showTopBanner('📣 發送傳單成功！周邊顧客紛紛前來搶購！');

      // 立即生成 3 位熱情顧客
      for (let i = 0; i < 3; i++) {
        setTimeout(() => {
          if (this.customers.length < 7) {
            const c = this.createCustomer(Date.now() + i);
            this.customers.push(c);
          }
        }, i * 600);
      }
    } else if (type === 'sale') {
      // 買一送一特賣會 (NT$ 300)
      if (this.money < 300) {
        this.showTopBanner('❌ 資金不足！特賣會需要 NT$ 300');
        sounds.playDisappointed();
        return;
      }
      this.money -= 300;
      this.dayStats.marketingCost += 300;
      this.reputation = Math.min(100, this.reputation + 10);
      sounds.playMarketing();
      this.showTopBanner('🎊 舉辦買一送一特賣會！知名度大增，人潮滾滾！');
      try {
        confetti({ particleCount: 70, spread: 60, origin: { y: 0.5 } });
      } catch {}

      // 湧入 4 位顧客
      for (let i = 0; i < 4; i++) {
        setTimeout(() => {
          if (this.customers.length < 8) {
            const c = this.createCustomer(Date.now() + i);
            this.customers.push(c);
          }
        }, i * 500);
      }
    }
    this.updateHUD();
  }

  // 顧客結帳回呼
  onCustomerCheckout(customer, totalSpent, items) {
    this.money += totalSpent;
    this.dayStats.revenue += totalSpent;
    this.dayStats.customersServed++;
    this.dayStats.itemsSold += items.length;

    if (!this.dailyQuest.isCompleted) {
      this.dailyQuest.currentCount += items.length;
      if (this.dailyQuest.currentCount >= this.dailyQuest.targetCount) {
        this.dailyQuest.currentCount = this.dailyQuest.targetCount;
        this.dailyQuest.isCompleted = true;
        this.showTopBanner(`🏆 今日目標完成！請點擊領取獎勵 +${this.dailyQuest.reward} 金幣！`);
        sounds.playDayComplete();
      }
      this.updateQuestCard();
    }
    this.updateHUD();
  }

  claimQuestReward() {
    if (this.dailyQuest.isCompleted && !this.dailyQuest.isClaimed) {
      this.dailyQuest.isClaimed = true;
      this.money += this.dailyQuest.reward;
      sounds.playCashRegister();
      this.showTopBanner(`🎁 恭喜領取今日目標獎勵 +${this.dailyQuest.reward} 金幣！`);
      try { confetti({ particleCount: 80, spread: 60, origin: { y: 0.5 } }); } catch {}
      this.updateHUD();
      this.updateQuestCard();
    }
  }

  onCustomerLostSale(itemDef, reason) {
    if (reason === 'out_of_stock') {
      this.dayStats.lostSalesStock++;
      this.reputation = Math.max(0, this.reputation - 1);
      this.showTopBanner(`⚠️ 顧客因【${itemDef.name}】缺貨失望離開！`);
    } else if (reason === 'too_expensive') {
      this.dayStats.lostSalesPrice++;
      this.showTopBanner(`⚠️ 顧客嫌【${itemDef.name}】售價 NT$ ${itemDef.currentPrice} 太貴了！`);
    }
  }

  createCustomer(id, isThief = false) {
    const activeCharacterSet = this.testCharactersEnabled
      ? CHARACTER_SET_IDS.TEST
      : this.characterSet;
    return new Customer(
      id,
      this.store,
      this.onCustomerCheckout.bind(this),
      this.onCustomerLostSale.bind(this),
      isThief,
      activeCharacterSet
    );
  }

  setCharacterSet(characterSet) {
    const supportedSets = [
      CHARACTER_SET_IDS.MODERN,
      CHARACTER_SET_IDS.CHIBI,
      CHARACTER_SET_IDS.KAYKIT
    ];
    const nextSet = supportedSets.includes(characterSet)
      ? characterSet
      : CHARACTER_SET_IDS.MODERN;

    if (nextSet === this.characterSet) return false;

    if (nextSet === CHARACTER_SET_IDS.CHIBI) {
      const requiredAssets = ['chibiArcher', 'chibiBaseMesh', 'chibiKnight', 'chibiMerchant', 'chibiNinja', 'chibiStudent'];
      if (!requiredAssets.every(key => modelManager.hasStoreAsset(key))) {
        this.showTopBanner('⚠️ Q版角色素材尚未載入完成，請重新整理後再試。');
        sounds.playDisappointed();
        return false;
      }
    }

    if (nextSet === CHARACTER_SET_IDS.KAYKIT) {
      const requiredAssets = ['kayKnight', 'kayBarbarian', 'kayMage', 'kayRogue', 'kayRogueHooded'];
      if (!requiredAssets.every(key => modelManager.hasStoreAsset(key))) {
        this.showTopBanner('角色 C 素材尚未載入，請重新整理後再試一次');
        sounds.playDisappointed();
        return false;
      }
    }

    this.characterSet = nextSet;
    if (!this.testCharactersEnabled) {
      this.customers.forEach(customer => customer.setCharacterSet(nextSet));
    }

    const button = document.getElementById('btn-character-set');
    if (button) {
      button.textContent = nextSet === CHARACTER_SET_IDS.CHIBI ? '角色 B' : '角色 A';
      button.title = nextSet === CHARACTER_SET_IDS.CHIBI ? '切換回原本角色素材' : '切換至 Q 版角色素材';
      button.classList.toggle('is-chibi', nextSet === CHARACTER_SET_IDS.CHIBI);
      if (nextSet === CHARACTER_SET_IDS.KAYKIT) {
        button.textContent = '角色 C';
        button.title = '切換 KayKit Adventurers 角色素材';
      }
      button.classList.toggle('is-kaykit', nextSet === CHARACTER_SET_IDS.KAYKIT);
    }

    sounds.playClick();
    this.showTopBanner(nextSet === CHARACTER_SET_IDS.CHIBI
      ? '✨ 已切換至 B 套 Q 版角色素材！'
      : '🎨 已切換回 A 套原本角色素材！');
    if (nextSet === CHARACTER_SET_IDS.KAYKIT) {
      this.showTopBanner('已切換角色 C：KayKit Adventurers 奇幻旅人');
    }
    return true;
  }

  // 動畫主迴圈
  setTestCharactersEnabled(enabled) {
    const nextEnabled = Boolean(enabled);
    if (nextEnabled === this.testCharactersEnabled) return false;

    if (nextEnabled) {
      const requiredAssets = ['testRobot', 'testSoldier'];
      if (!requiredAssets.every(key => modelManager.hasStoreAsset(key))) {
        this.showTopBanner('⚠️ 測試角色模型尚未載入完成。');
        sounds.playDisappointed();
        return false;
      }
    }

    this.testCharactersEnabled = nextEnabled;
    const activeCharacterSet = nextEnabled ? CHARACTER_SET_IDS.TEST : this.characterSet;
    this.customers.forEach(customer => customer.setCharacterSet(activeCharacterSet));

    const button = document.getElementById('btn-test-characters');
    if (button) {
      button.textContent = nextEnabled ? '測試 ON' : '測試 OFF';
      button.title = nextEnabled ? '關閉 RobotExpressive／Soldier 測試角色' : '開啟 RobotExpressive／Soldier 測試角色';
      button.classList.toggle('is-enabled', nextEnabled);
    }

    sounds.playClick();
    this.showTopBanner(nextEnabled
      ? '🧪 已開啟測試角色：RobotExpressive／Soldier'
      : '🧪 已關閉測試角色，恢復目前角色套組');
    return true;
  }

  animate() {
    requestAnimationFrame(this.animate);
    const delta = this.clock.getDelta();

    if (!this.isPaused && this.isStoreOpen) {
      // 推進時間 (08:00 到 22:00)
      this.timeOfDay += delta * 0.08 * this.timeSpeed;
      if (this.timeOfDay >= 22.0) {
        this.timeOfDay = 22.0;
        this.endBusinessDay();
      }

      // 生成常態顧客
      this.customerSpawnTimer += delta * this.timeSpeed;
      if (this.customerSpawnTimer >= 4.5 && this.customers.length < 6) {
        this.customerSpawnTimer = 0;
        const newCustomer = this.createCustomer(Date.now());
        this.customers.push(newCustomer);
      }

      // 突發小偷事件計時 (每 45 秒有機會偷溜進來一個小偷)
      this.thiefTimer += delta * this.timeSpeed;
      if (this.thiefTimer >= 35.0) {
        this.thiefTimer = 0;
        if (!this.customers.some(c => c.isThief)) {
          const thief = this.createCustomer(Date.now(), true);
          this.customers.push(thief);
          this.showTopBanner('🚨 注意！有蒙面小偷鬼鬼祟祟溜進超商了！快用滑鼠點擊逮捕他！');
          sounds.playDisappointed();
        }
      }
    }

    // 更新所有顧客
    for (let i = this.customers.length - 1; i >= 0; i--) {
      const c = this.customers[i];
      c.update(delta * this.timeSpeed);
      if (c.state === 'DONE') {
        this.customers.splice(i, 1);
      }
    }

    // 更新場景動態 (店員微動、招財貓招手、選中環呼吸) 與日夜時間光影
    this.store.updateScene(delta);
    this.store.updateTimeOfDay(this.timeOfDay);

    this.renderer.render(this.scene, this.camera);
  }

  // 一天打烊結算
  endBusinessDay() {
    this.isStoreOpen = false;
    sounds.playDayComplete();
    this.showDailyReport();
    try { confetti({ particleCount: 120, spread: 70, origin: { y: 0.6 } }); } catch {}
  }

  showDailyReport() {
    const modal = document.getElementById('daily-report-modal');
    if (!modal) return;

    const netProfit = this.dayStats.revenue - this.dayStats.cogs - this.dayStats.marketingCost;
    let rating = 'B 級 平穩營運';
    if (netProfit > 1200 && this.dayStats.lostSalesStock === 0) rating = '🍊 S 級 傳奇超商金店長';
    else if (netProfit > 600 && this.dayStats.lostSalesStock <= 2) rating = 'A 級 優秀連鎖店長';
    else if (netProfit >= 0) rating = 'B 級 穩健營運';
    else rating = 'C 級 虧損需多加補貨';

    document.getElementById('report-day-num').textContent = `第 ${this.day} 天`;
    document.getElementById('report-revenue').textContent = `NT$ ${this.dayStats.revenue.toLocaleString()}`;
    document.getElementById('report-cogs').textContent = `NT$ ${(this.dayStats.cogs + this.dayStats.marketingCost).toLocaleString()}`;
    
    const netEl = document.getElementById('report-net-profit');
    netEl.textContent = `NT$ ${netProfit.toLocaleString()}`;
    netEl.className = netProfit >= 0 ? 'profit-positive' : 'profit-negative';

    document.getElementById('report-customers').textContent = `${this.dayStats.customersServed} 位`;
    document.getElementById('report-items-sold').textContent = `${this.dayStats.itemsSold} 件`;
    document.getElementById('report-lost-sales').textContent = `${this.dayStats.lostSalesStock} 位 (缺貨) / 逮捕小偷 ${this.dayStats.thievesCaught} 名`;
    document.getElementById('report-rating').textContent = rating;

    modal.classList.add('visible');
  }

  advanceToNextDay() {
    const modal = document.getElementById('daily-report-modal');
    if (modal) modal.classList.remove('visible');

    this.day++;
    this.timeOfDay = 8.0;
    this.isStoreOpen = true;

    this.dayStats = {
      revenue: 0,
      cogs: 0,
      marketingCost: 0,
      customersServed: 0,
      itemsSold: 0,
      lostSalesStock: 0,
      lostSalesPrice: 0,
      thievesCaught: 0
    };

    this.dailyQuest.currentCount = 0;
    this.dailyQuest.isCompleted = false;
    this.dailyQuest.isClaimed = false;

    this.customers.forEach(c => c.destroy());
    this.customers = [];

    this.showTopBanner(`🌅 早安！橘子超商第 ${this.day} 天開始，祝您今天業績長紅！`);
    this.updateHUD();
    this.updateQuestCard();
  }

  updateHUD() {
    document.getElementById('hud-money').textContent = this.money.toLocaleString();
    document.getElementById('hud-sales-acc').textContent = this.dayStats.revenue.toLocaleString();
    document.getElementById('hud-customers-count').textContent = `${this.customers.length} / 6`;
    document.getElementById('hud-reputation').textContent = `${this.reputation} %`;

    const aesthetics = this.store.calculateAestheticsScore();
    const aesEl = document.getElementById('hud-aesthetics');
    if (aesEl) aesEl.textContent = `${aesthetics} ★`;

    const hours = Math.floor(this.timeOfDay);
    const minutes = Math.floor((this.timeOfDay - hours) * 60);
    document.getElementById('hud-time-str').textContent = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }

  updateQuestCard() {
    const qTitle = document.getElementById('quest-title');
    const qDesc = document.getElementById('quest-desc');
    const qCount = document.getElementById('quest-count');
    const qBar = document.getElementById('quest-bar');
    const qBtn = document.getElementById('quest-claim-btn');

    if (qTitle) qTitle.textContent = this.dailyQuest.title;
    if (qDesc) qDesc.textContent = this.dailyQuest.description;
    if (qCount) qCount.textContent = `${this.dailyQuest.currentCount} / ${this.dailyQuest.targetCount}`;
    if (qBar) {
      const pct = Math.min(100, Math.round((this.dailyQuest.currentCount / this.dailyQuest.targetCount) * 100));
      qBar.style.width = `${pct}%`;
    }

    if (qBtn) {
      if (this.dailyQuest.isClaimed) {
        qBtn.textContent = '已領取獎勵 ✓';
        qBtn.disabled = true;
        qBtn.className = 'btn-quest claimed';
      } else if (this.dailyQuest.isCompleted) {
        qBtn.textContent = `領取獎勵 +${this.dailyQuest.reward}`;
        qBtn.disabled = false;
        qBtn.className = 'btn-quest ready';
      } else {
        qBtn.textContent = `進行中 (+${this.dailyQuest.reward} 金幣)`;
        qBtn.disabled = true;
        qBtn.className = 'btn-quest ongoing';
      }
    }
  }

  showTopBanner(msg) {
    const banner = document.getElementById('top-center-banner');
    if (!banner) return;
    banner.textContent = msg;
    banner.classList.add('visible');

    if (this.bannerTimeout) clearTimeout(this.bannerTimeout);
    this.bannerTimeout = setTimeout(() => {
      banner.classList.remove('visible');
    }, 3800);
  }

  bindUIEvents() {
    // 暫停/播放
    const btnPause = document.getElementById('btn-pause-play');
    if (btnPause) {
      btnPause.onclick = () => {
        this.isPaused = !this.isPaused;
        btnPause.textContent = this.isPaused ? '▶' : '⏸';
        this.showTopBanner(this.isPaused ? '已暫停營業' : '繼續營業中');
        sounds.playClick();
      };
    }

    // 倍速
    const btnSpeed = document.getElementById('btn-speed-toggle');
    if (btnSpeed) {
      btnSpeed.onclick = () => {
        this.timeSpeed = this.timeSpeed === 1.0 ? 2.0 : 1.0;
        btnSpeed.textContent = `${this.timeSpeed}x`;
        sounds.playClick();
      };
    }

    // 顧客角色素材套組切換
    const btnCharacterSet = document.getElementById('btn-character-set');
    if (btnCharacterSet) {
      btnCharacterSet.onclick = () => {
        const characterSets = [
          CHARACTER_SET_IDS.MODERN,
          CHARACTER_SET_IDS.CHIBI,
          CHARACTER_SET_IDS.KAYKIT
        ];
        const currentIndex = characterSets.indexOf(this.characterSet);
        const nextSet = characterSets[(currentIndex + 1) % characterSets.length];
        this.setCharacterSet(nextSet);
      };
    }

    // 一鍵補滿
    const btnTestCharacters = document.getElementById('btn-test-characters');
    if (btnTestCharacters) {
      btnTestCharacters.onclick = () => {
        this.setTestCharactersEnabled(!this.testCharactersEnabled);
      };
    }

    const btnRestockAll = document.getElementById('btn-restock-all');
    if (btnRestockAll) {
      btnRestockAll.onclick = () => this.restockAllShelves();
    }

    // 進貨與調價按鈕
    const btnOrder = document.getElementById('btn-open-order');
    if (btnOrder) {
      btnOrder.onclick = () => this.toggleOrderModal();
    }

    // 行銷宣傳按鈕
    const btnMarketing = document.getElementById('btn-open-marketing');
    if (btnMarketing) {
      btnMarketing.onclick = () => this.toggleMarketingModal();
    }

    // 打烊按鈕
    const btnCloseStore = document.getElementById('btn-close-store');
    if (btnCloseStore) {
      btnCloseStore.onclick = () => {
        sounds.playClick();
        this.endBusinessDay();
      };
    }

    const mobileStatusToggle = document.getElementById('btn-toggle-mobile-status');
    if (mobileStatusToggle) {
      mobileStatusToggle.onclick = () => {
        const open = !document.body.classList.contains('mobile-status-open');
        document.body.classList.toggle('mobile-status-open', open);
        mobileStatusToggle.setAttribute('aria-expanded', String(open));
        if (open) {
          document.body.classList.remove('mobile-actions-open');
          document.getElementById('btn-toggle-mobile-actions')?.setAttribute('aria-expanded', 'false');
        }
      };
    }

    const mobileActionsToggle = document.getElementById('btn-toggle-mobile-actions');
    if (mobileActionsToggle) {
      mobileActionsToggle.onclick = () => {
        const open = !document.body.classList.contains('mobile-actions-open');
        document.body.classList.toggle('mobile-actions-open', open);
        mobileActionsToggle.setAttribute('aria-expanded', String(open));
        if (open) {
          document.body.classList.remove('mobile-status-open');
          document.getElementById('btn-toggle-mobile-status')?.setAttribute('aria-expanded', 'false');
        }
      };
    }
    document.querySelectorAll('.bottom-actions-container .btn-big-action').forEach(button => {
      button.addEventListener('click', () => {
        document.body.classList.remove('mobile-actions-open');
        mobileActionsToggle?.setAttribute('aria-expanded', 'false');
      });
    });

    // 領取任務按鈕
    const qBtn = document.getElementById('quest-claim-btn');
    if (qBtn) {
      qBtn.onclick = () => this.claimQuestReward();
    }

    // 縮放按鈕
    const btnZoomIn = document.getElementById('btn-zoom-in');
    if (btnZoomIn) {
      btnZoomIn.onclick = () => {
        this.cameraZoom = Math.max(12, this.cameraZoom - 3);
        this.updateCameraTransform();
      };
    }
    const btnZoomOut = document.getElementById('btn-zoom-out');
    if (btnZoomOut) {
      btnZoomOut.onclick = () => {
        this.cameraZoom = Math.min(68, this.cameraZoom + 3);
        this.updateCameraTransform();
      };
    }

    // 結算下一天
    const btnNext = document.getElementById('btn-next-day');
    if (btnNext) {
      btnNext.onclick = () => this.advanceToNextDay();
    }

    // 關閉進貨視窗
    const btnCloseModal = document.getElementById('btn-close-order');
    if (btnCloseModal) {
      btnCloseModal.onclick = () => this.toggleOrderModal();
    }

    // 關閉行銷視窗
    const btnCloseMarketing = document.getElementById('btn-close-marketing');
    if (btnCloseMarketing) {
      btnCloseMarketing.onclick = () => this.toggleMarketingModal();
    }

    // 行銷彈窗按鈕
    const btnFlyer = document.getElementById('btn-market-flyer');
    if (btnFlyer) {
      btnFlyer.onclick = () => {
        this.executeMarketing('flyer');
        this.toggleMarketingModal();
      };
    }
    const btnSale = document.getElementById('btn-market-sale');
    if (btnSale) {
      btnSale.onclick = () => {
        this.executeMarketing('sale');
        this.toggleMarketingModal();
      };
    }

    // ================= 自由裝潢擺設模式相關按鈕綁定 =================
    const btnToggleDecor = document.getElementById('btn-toggle-decor');
    if (btnToggleDecor) {
      btnToggleDecor.onclick = () => this.toggleDecorMode(true);
    }

    const btnExitDecor = document.getElementById('btn-exit-decor');
    if (btnExitDecor) {
      btnExitDecor.onclick = () => this.toggleDecorMode(false);
    }

    const btnCollapseDecor = document.getElementById('btn-collapse-decor');
    if (btnCollapseDecor) {
      btnCollapseDecor.onclick = () => this.toggleDecorPanelCollapsed();
    }

    const btnDismissClerkBubble = document.getElementById('btn-dismiss-clerk-bubble');
    if (btnDismissClerkBubble) {
      btnDismissClerkBubble.onclick = () => this.dismissClerkHint();
    }

    const btnOpenDecorShop = document.getElementById('btn-open-decor-shop');
    if (btnOpenDecorShop) {
      btnOpenDecorShop.onclick = () => this.openDecorShopModal();
    }

    const btnCloseDecorShop = document.getElementById('btn-close-decor-shop');
    if (btnCloseDecorShop) {
      btnCloseDecorShop.onclick = () => this.closeDecorShopModal();
    }

    // 網格方向微調鍵與旋轉鍵
    const btnMoveUp = document.getElementById('btn-move-up');
    if (btnMoveUp) btnMoveUp.onclick = () => this.nudgeSelectedObject(0, -0.6);

    const btnMoveDown = document.getElementById('btn-move-down');
    if (btnMoveDown) btnMoveDown.onclick = () => this.nudgeSelectedObject(0, 0.6);

    const btnMoveLeft = document.getElementById('btn-move-left');
    if (btnMoveLeft) btnMoveLeft.onclick = () => this.nudgeSelectedObject(-0.6, 0);

    const btnMoveRight = document.getElementById('btn-move-right');
    if (btnMoveRight) btnMoveRight.onclick = () => this.nudgeSelectedObject(0.6, 0);

    const btnRotateObj = document.getElementById('btn-rotate-obj');
    if (btnRotateObj) btnRotateObj.onclick = () => {
      const result = this.store.rotateSelectedObject(Math.PI / 2);
      if (result?.valid === false) {
        this.showTopBanner('⚠️ 這個方向會和其它佈置重疊，請先移到空位。');
        sounds.playDisappointed();
        return;
      }
      sounds.playClick();
    };

    // 貨架販售商品自由切換 (御飯糰、綠茶、洋芋片、泡麵、咖啡、關東煮)
    document.querySelectorAll('.btn-chip').forEach(btn => {
      btn.onclick = () => {
        if (!this.store.selectedObject || this.store.selectedObject.type !== 'shelf') return;
        const itemId = btn.dataset.item;
        const shelfId = this.store.selectedObject.id;
        const ok = this.store.changeShelfItem(shelfId, itemId);
        if (ok) {
          sounds.playScanBeep();
          const itemDef = ITEM_DEFINITIONS[itemId];
          this.showTopBanner(`🏷️ 成功將貨架調整為陳列販售【${itemDef.name}】！`);
          document.querySelectorAll('.btn-chip').forEach(b => b.classList.toggle('active', b === btn));
          const nameEl = document.getElementById('selected-obj-name');
          if (nameEl) nameEl.textContent = this.store.selectedObject.target.name;
        }
      };
    });

    // 貨架主題色彩風格更換
    document.querySelectorAll('.btn-theme-swatch').forEach(btn => {
      btn.onclick = () => {
        if (!this.store.selectedObject || this.store.selectedObject.type !== 'shelf') return;
        const theme = btn.dataset.theme;
        this.store.changeShelfTheme(this.store.selectedObject.id, theme);
        sounds.playClick();
      };
    });

    // 貨架促銷牌標籤 (HOT, SALE, RECOMMEND)
    document.querySelectorAll('.btn-promo-tag').forEach(btn => {
      btn.onclick = () => {
        if (!this.store.selectedObject || this.store.selectedObject.type !== 'shelf') return;
        const tag = btn.dataset.tag === 'none' ? null : btn.dataset.tag;
        this.store.setShelfPromoTag(this.store.selectedObject.id, tag);
        sounds.playCashRegister();
        this.showTopBanner(`✨ 貨架已換上促銷立牌，吸引更多顧客選購！`);
        this.updateHUD();
      };
    });

    // 撤除 / 收起選中物件
    const btnRemoveObj = document.getElementById('btn-remove-selected');
    if (btnRemoveObj) {
      btnRemoveObj.onclick = () => {
        const res = this.store.removeSelectedObject();
        if (res && res.success) {
          sounds.playClick();
          const selBox = document.getElementById('decor-selection-box');
          if (selBox) selBox.style.display = 'none';
          this.showTopBanner('🗑️ 已將選中的擺設收回倉庫！');
          this.updateHUD();
        } else if (res && res.reason) {
          this.showTopBanner(`⚠️ ${res.reason}`);
          sounds.playDisappointed();
        }
      };
    }
  }

  nudgeSelectedObject(dx, dz) {
    const result = this.store.moveSelectedObject(dx, dz);
    if (result?.valid === false) {
      this.showTopBanner('⚠️ 這個位置會和牆面或其它佈置重疊。');
      sounds.playDisappointed();
      return result;
    }
    sounds.playClick();
    return result;
  }

  // 開啟 / 關閉自由裝潢擺設模式
  toggleDecorPanelCollapsed(collapsed = !this.decorPanelCollapsed) {
    this.decorPanelCollapsed = Boolean(collapsed);
    document.body.classList.toggle('decor-panel-collapsed', this.decorPanelCollapsed);

    const button = document.getElementById('btn-collapse-decor');
    if (!button) return;
    button.setAttribute('aria-expanded', String(!this.decorPanelCollapsed));
    button.setAttribute(
      'aria-label',
      this.decorPanelCollapsed ? '展開擺設設定' : '收合擺設設定',
    );
    button.setAttribute(
      'title',
      this.decorPanelCollapsed ? '展開擺設設定' : '收合擺設設定',
    );
    button.textContent = this.decorPanelCollapsed ? '+' : '⌄';
  }

  dismissClerkHint() {
    this.clerkHintDismissed = true;
    this.updateClerkHintVisibility();
  }

  updateClerkHintVisibility() {
    const bubble = document.getElementById('clerk-bubble');
    if (!bubble) return;
    const visible = !this.clerkHintDismissed && !this.isDecorMode;
    bubble.classList.toggle('is-dismissed', !visible);
    bubble.setAttribute('aria-hidden', String(!visible));
  }

  toggleDecorMode(enabled) {
    this.isDecorMode = Boolean(enabled);
    this.store.setDecorMode(this.isDecorMode);
    document.body.classList.toggle('decor-mode-active', this.isDecorMode);
    document.body.classList.remove('mobile-actions-open', 'mobile-status-open');
    document.getElementById('btn-toggle-mobile-actions')?.setAttribute('aria-expanded', 'false');
    document.getElementById('btn-toggle-mobile-status')?.setAttribute('aria-expanded', 'false');

    this.toggleDecorPanelCollapsed(false);
    this.updateClerkHintVisibility();

    if (this.isDecorMode) {
      sounds.playMarketing();
      this.showTopBanner('🎨 已進入自由裝潢擺設模式！點選店內貨架或擺飾即可自由調整位置、旋轉與更換商品！');
    } else {
      sounds.playDayComplete();
      const score = this.store.calculateAestheticsScore();
      this.showTopBanner(`✅ 裝潢佈置完成！當前店鋪美觀度評分：${score} ★！`);
      this.updateHUD();
    }
  }

  // 開啟裝潢商城視窗
  openDecorShopModal() {
    const modal = document.getElementById('decor-shop-modal');
    if (!modal) return;
    modal.classList.add('visible');
    this.renderDecorShop();
    sounds.playClick();
  }

  closeDecorShopModal() {
    const modal = document.getElementById('decor-shop-modal');
    if (modal) modal.classList.remove('visible');
    sounds.playClick();
  }

  // 渲染裝潢精品商城商品清單
  renderDecorShop() {
    const container = document.getElementById('decor-shop-items');
    if (!container) return;
    container.innerHTML = '';

    const DECOR_SHOP_ITEMS = [
      { type: 'island_gondola', name: '雙面中島零食架', category: '營業貨架', price: 350, icon: '📦', desc: '寬敞雙面中島架，可自由陳列各類零食或泡麵，容量 14 件。', isShelf: true, defaultItem: 'chips' },
      { type: 'double_fridge', name: '大型雙門飲料冰櫃', category: '營業貨架', price: 550, icon: '🧊', desc: '低溫雙門透明冰櫃，甘醇綠茶與咖啡首選，容量 16 瓶。', isShelf: true, defaultItem: 'green_tea' },
      { type: 'oden_bar', name: '暖呼呼鮮食熟食台', category: '營業貨架', price: 450, icon: '🍢', desc: '誘人香氣四溢的熟食展售台，容量 12 份，美觀加分。', isShelf: true, defaultItem: 'oden' },
      { type: 'ficus_plant', name: '室內闊葉發光盆栽', category: '綠植美化', price: 120, icon: '🪴', desc: '天然翠綠大葉盆栽，提升店鋪自然清爽舒適度與美觀度 +5 點！' },
      { type: 'lucky_cat', name: '開運金光招財貓', category: '招財吉祥', price: 280, icon: '🐱', desc: '金光閃閃不停揮動金爪招來好運，提升顧客來店進店率 +15%！' },
      { type: 'magazine_rack', name: '潮流書報雜誌架', category: '休閒設施', price: 220, icon: '📚', desc: '精選當季少年Jump與時尚雜誌，大幅提升顧客在店停留滿意度。' },
      { type: 'gashapon', name: '復古雙層彩色扭蛋機', category: '娛樂設施', price: 320, icon: '🎰', desc: '大人小孩最愛的驚喜扭蛋，帶來額外顧客回訪率與歡笑聲！' },
      { type: 'atm', name: '24H 銀行 ATM 機台', category: '便民金融', price: 400, icon: '🏧', desc: '跨行提款超方便，間接提升顧客消費預算與單筆花費金額！' },
      { type: 'dining_set', name: '休閒原木內用桌椅', category: '舒適休憩', price: 180, icon: '🪑', desc: '提供顧客坐下品嚐熱食與咖啡的雅座，心情滿意度直線上升！' }
    ];

    DECOR_SHOP_ITEMS.forEach(item => {
      const card = document.createElement('div');
      card.className = 'decor-card';
      const canAfford = this.money >= item.price;

      card.innerHTML = `
        <div class="decor-card-top">
          <div class="decor-card-icon">${item.icon}</div>
          <div>
            <div class="decor-card-name">${item.name}</div>
            <span class="selected-cat" style="font-size:0.68rem; padding:2px 8px;">${item.category}</span>
          </div>
        </div>
        <div class="decor-card-desc">${item.desc}</div>
        <div class="decor-card-bottom">
          <span class="decor-card-price">NT$ ${item.price}</span>
          <button class="btn-buy-decor" ${!canAfford ? 'disabled' : ''}>
            ${canAfford ? '購買放置 🛒' : '金幣不足'}
          </button>
        </div>
      `;

      card.querySelector('.btn-buy-decor').onclick = () => {
        if (this.money < item.price) {
          this.showTopBanner(`❌ 金幣不足！購買【${item.name}】需要 NT$ ${item.price}`);
          sounds.playDisappointed();
          return;
        }

        this.money -= item.price;
        sounds.playCashRegister();

        let newId = null;
        if (item.isShelf) {
          newId = this.store.addNewShelf(item.type, item.defaultItem);
        } else {
          newId = this.store.addNewDecoration(item.type);
        }

        if (!newId) {
          this.money += item.price;
          sounds.playDisappointed();
          this.showTopBanner('⚠️ 店內沒有不重疊的可放置空間，已退回金幣。');
          this.updateHUD();
          return;
        }

        this.store.selectObject(newId, item.isShelf ? 'shelf' : 'decor');

        try { confetti({ particleCount: 70, spread: 60, origin: { y: 0.5 } }); } catch {}
        this.showTopBanner(`🎉 成功購買【${item.name}】並已放置於店內！您可以用滑鼠點選自由移動它的位置！`);
        this.updateHUD();
        this.closeDecorShopModal();
      };

      container.appendChild(card);
    });
  }

  toggleOrderModal() {
    const modal = document.getElementById('order-modal');
    if (!modal) return;
    const isVis = modal.classList.contains('visible');
    if (isVis) {
      modal.classList.remove('visible');
    } else {
      modal.classList.add('visible');
      this.renderOrderList();
    }
    sounds.playClick();
  }

  toggleMarketingModal() {
    const modal = document.getElementById('marketing-modal');
    if (!modal) return;
    const isVis = modal.classList.contains('visible');
    if (isVis) {
      modal.classList.remove('visible');
    } else {
      modal.classList.add('visible');
    }
    sounds.playClick();
  }

  renderOrderList() {
    const list = document.getElementById('order-items-list');
    if (!list) return;
    list.innerHTML = '';

    Object.values(ITEM_DEFINITIONS).forEach(item => {
      // 動態匹配販售該商品的貨架
      const shelf = Object.values(this.store.shelves).find(s => s.itemId === item.id) || this.store.shelves[item.shelfId];
      const stock = shelf ? shelf.currentCount : 0;
      const cap = shelf ? shelf.capacity : 0;
      const profit = item.currentPrice - item.cost;
      const margin = Math.round((profit / item.currentPrice) * 100);

      const card = document.createElement('div');
      card.className = 'cozy-order-card';
      card.innerHTML = `
        <div class="card-top">
          <span class="card-badge" style="background:${item.color}">${item.category}</span>
          <span class="card-stock">庫存 ${stock}/${cap}</span>
        </div>
        <div class="card-title">${item.name}</div>
        <div class="card-info">進價: NT$ ${item.cost} • 毛利: ${margin}%</div>
        <div class="card-price-row">
          <span>售價：</span>
          <button class="btn-step" data-action="down">-</button>
          <span class="price-val">NT$ ${item.currentPrice}</span>
          <button class="btn-step" data-action="up">+</button>
        </div>
        <button class="btn-buy-box">進貨 1 箱 (NT$ ${item.cost * item.boxCapacity})</button>
      `;

      card.querySelector('[data-action="down"]').onclick = () => {
        item.currentPrice = Math.max(1, item.currentPrice - 1);
        this.renderOrderList();
      };
      card.querySelector('[data-action="up"]').onclick = () => {
        item.currentPrice++;
        this.renderOrderList();
      };
      card.querySelector('.btn-buy-box').onclick = () => {
        const cost = item.cost * item.boxCapacity;
        if (this.money < cost) {
          this.showTopBanner(`❌ 資金不足！進貨需要 NT$ ${cost}`);
          sounds.playDisappointed();
          return;
        }
        this.money -= cost;
        this.dayStats.cogs += cost;
        this.store.spawnDeliveryBox(item, item.boxCapacity);
        sounds.playCashRegister();
        this.showTopBanner(`📦【${item.name}】已送達店外卸貨區，滑鼠點擊紙箱即可直接上架！`);
        this.updateHUD();
        this.renderOrderList();
      };

      list.appendChild(card);
    });
  }
}
