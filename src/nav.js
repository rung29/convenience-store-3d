// 3D 智慧超商路徑導航與 A* 尋路系統 (A* Navigation Grid & Pathfinding)
import * as THREE from 'three';

export class NavGrid {
  constructor() {
    // 地圖範圍與網格解析度 (解析度 0.4m，精準避開貨架與擺設)
    this.minX = -7.6;
    this.maxX = 7.6;
    this.minZ = -7.6;
    this.maxZ = 11.2;
    this.cellSize = 0.4;

    this.cols = Math.ceil((this.maxX - this.minX) / this.cellSize);
    this.rows = Math.ceil((this.maxZ - this.minZ) / this.cellSize);

    // 二維走道可行走性陣列 (true: 可行走走道, false: 障礙物/貨架/牆壁)
    this.grid = new Array(this.cols * this.rows).fill(true);
  }

  // 根據超商最新擺設即時動態重建導航網格
  rebuild(store) {
    // 預設全地圖可行走
    this.grid.fill(true);

    // 1. 標記店鋪外牆與邊界障礙
    // 左牆 (X: -7.0)
    this.markBoxObstacle(-7.4, 0, 0.8, 14.8);
    // 後牆 (Z: -7.0)
    this.markBoxObstacle(0, -7.4, 14.8, 0.8);
    // 前側玻璃門兩側矮牆與花槽 (門口中央 X: -1.5 ~ 1.5 保留為暢通入口)
    this.markBoxObstacle(-4.5, 7.0, 5.8, 0.8);
    this.markBoxObstacle(4.5, 7.0, 5.8, 0.8);
    // 右側矮牆
    this.markBoxObstacle(7.4, 1.5, 0.8, 11.5);

    // 2. 標記服務櫃檯與店員收銀後台 (顧客不可穿過收銀台或進入店員後方)
    this.markBoxObstacle(0.5, -4.6, 4.6, 1.8);
    this.markBoxObstacle(0.5, -6.0, 4.6, 1.5); // 店員專屬站立空間

    // 3. 標記所有營業貨架 (Shelves)
    if (store && store.shelves) {
      Object.values(store.shelves).forEach(shelf => {
        if (!shelf.shelfGroup) return;
        const pos = shelf.shelfGroup.position;
        const rotY = shelf.shelfGroup.rotation.y;
        const w = shelf.config.w || 1.8;
        const d = shelf.config.d || 0.9;

        // 計算旋轉後之碰撞包圍盒
        const isRotated = Math.abs(Math.sin(rotY)) > 0.5;
        const boundW = isRotated ? d : w;
        const boundD = isRotated ? w : d;

        // 加上人物碰撞厚度緩衝 (0.25m)，確保人物完全不會穿模磨蹭
        this.markBoxObstacle(pos.x, pos.z, boundW + 0.35, boundD + 0.35);
      });
    }

    // 4. 標記內用桌椅 (Tables)
    if (store && store.tables) {
      store.tables.forEach(table => {
        // 桌子本體為障礙
        this.markBoxObstacle(table.worldPos.x, table.worldPos.z, 1.6, 1.0);
      });
    }

    // 5. 標記大型美化裝飾物 (ATM、書報架、自動販賣機、扭蛋機、大型盆栽)
    if (store && store.decorations) {
      Object.values(store.decorations).forEach(decor => {
        if (!decor.group) return;
        const pos = decor.group.position;
        const name = decor.name || '';
        let dw = 1.0;
        let dd = 1.0;

        if (name.includes('自動販賣機')) { dw = 1.6; dd = 1.2; }
        else if (name.includes('ATM')) { dw = 1.2; dd = 1.2; }
        else if (name.includes('雜誌架')) { dw = 1.8; dd = 0.8; }
        else if (name.includes('扭蛋機')) { dw = 0.9; dd = 0.9; }
        else if (name.includes('盆栽')) { dw = 1.0; dd = 1.0; }
        else if (name.includes('回收桶')) { dw = 1.8; dd = 0.8; }

        this.markBoxObstacle(pos.x, pos.z, dw + 0.3, dd + 0.3);
      });
    }

    // 6. 確保大門入口通道與結帳點周圍絕對暢通
    this.clearWalkableArea(0, 7.0, 2.2, 2.0); // 雙向自動門
    this.clearWalkableArea(-0.3, -3.2, 1.0, 1.0); // 櫃台結帳點
  }

  // 標記特定長寬區域為障礙 (不可行走)
  markBoxObstacle(cx, cz, w, d) {
    const minX = cx - w / 2;
    const maxX = cx + w / 2;
    const minZ = cz - d / 2;
    const maxZ = cz + d / 2;

    const gMin = this.worldToGrid(minX, minZ);
    const gMax = this.worldToGrid(maxX, maxZ);

    for (let gx = Math.max(0, gMin.gx); gx <= Math.min(this.cols - 1, gMax.gx); gx++) {
      for (let gz = Math.max(0, gMin.gz); gz <= Math.min(this.rows - 1, gMax.gz); gz++) {
        this.grid[gz * this.cols + gx] = false;
      }
    }
  }

  // 清除特定區域為可行走 (確保走道暢通)
  clearWalkableArea(cx, cz, w, d) {
    const minX = cx - w / 2;
    const maxX = cx + w / 2;
    const minZ = cz - d / 2;
    const maxZ = cz + d / 2;

    const gMin = this.worldToGrid(minX, minZ);
    const gMax = this.worldToGrid(maxX, maxZ);

    for (let gx = Math.max(0, gMin.gx); gx <= Math.min(this.cols - 1, gMax.gx); gx++) {
      for (let gz = Math.max(0, gMin.gz); gz <= Math.min(this.rows - 1, gMax.gz); gz++) {
        this.grid[gz * this.cols + gx] = true;
      }
    }
  }

  worldToGrid(x, z) {
    const gx = Math.floor((x - this.minX) / this.cellSize);
    const gz = Math.floor((z - this.minZ) / this.cellSize);
    return { gx, gz };
  }

  gridToWorld(gx, gz) {
    const x = this.minX + (gx + 0.5) * this.cellSize;
    const z = this.minZ + (gz + 0.5) * this.cellSize;
    return new THREE.Vector3(x, 0, z);
  }

  isWalkable(gx, gz) {
    if (gx < 0 || gx >= this.cols || gz < 0 || gz >= this.rows) return false;
    return this.grid[gz * this.cols + gx] === true;
  }

  // 尋找目標點周圍最近的可行走網格點
  findClosestWalkable(gx, gz) {
    if (this.isWalkable(gx, gz)) return { gx, gz };

    for (let r = 1; r <= 8; r++) {
      for (let dx = -r; dx <= r; dx++) {
        for (let dz = -r; dz <= r; dz++) {
          if (Math.abs(dx) === r || Math.abs(dz) === r) {
            const nx = gx + dx;
            const nz = gz + dz;
            if (this.isWalkable(nx, nz)) {
              return { gx: nx, gz: nz };
            }
          }
        }
      }
    }
    return { gx, gz };
  }

  // ============================================
  // A* 最佳路徑搜尋演算法 (A* Pathfinding Algorithm)
  // ============================================
  findPath(startWorldPos, targetWorldPos) {
    const startG = this.worldToGrid(startWorldPos.x, startWorldPos.z);
    const targetG = this.worldToGrid(targetWorldPos.x, targetWorldPos.z);

    const start = this.findClosestWalkable(startG.gx, startG.gz);
    const target = this.findClosestWalkable(targetG.gx, targetG.gz);

    if (start.gx === target.gx && start.gz === target.gz) {
      return [targetWorldPos.clone()];
    }

    const openSet = [];
    const closedSet = new Uint8Array(this.cols * this.rows);
    const gScore = new Float32Array(this.cols * this.rows).fill(Infinity);
    const fScore = new Float32Array(this.cols * this.rows).fill(Infinity);
    const cameFrom = new Int32Array(this.cols * this.rows).fill(-1);

    const startIndex = start.gz * this.cols + start.gx;
    const targetIndex = target.gz * this.cols + target.gx;

    gScore[startIndex] = 0;
    fScore[startIndex] = this.heuristic(start.gx, start.gz, target.gx, target.gz);
    openSet.push({ index: startIndex, gx: start.gx, gz: start.gz, f: fScore[startIndex] });

    // 8 個方向 (上下左右 + 斜角對角線移動)
    const neighbors = [
      { dx: 1, dz: 0, cost: 1.0 },
      { dx: -1, dz: 0, cost: 1.0 },
      { dx: 0, dz: 1, cost: 1.0 },
      { dx: 0, dz: -1, cost: 1.0 },
      { dx: 1, dz: 1, cost: 1.414 },
      { dx: -1, dz: 1, cost: 1.414 },
      { dx: 1, dz: -1, cost: 1.414 },
      { dx: -1, dz: -1, cost: 1.414 }
    ];

    while (openSet.length > 0) {
      // 取出 f 值最小的節點
      let bestIdx = 0;
      for (let i = 1; i < openSet.length; i++) {
        if (openSet[i].f < openSet[bestIdx].f) bestIdx = i;
      }

      const current = openSet.splice(bestIdx, 1)[0];
      const curIndex = current.index;

      // 抵達目標點！
      if (curIndex === targetIndex) {
        return this.reconstructPath(cameFrom, curIndex, targetWorldPos);
      }

      closedSet[curIndex] = 1;

      for (let n of neighbors) {
        const nx = current.gx + n.dx;
        const nz = current.gz + n.dz;
        const nIndex = nz * this.cols + nx;

        if (!this.isWalkable(nx, nz) || closedSet[nIndex] === 1) {
          continue;
        }

        // 對角線移動防止穿牆削角檢驗 (Corner-cutting check)
        if (n.dx !== 0 && n.dz !== 0) {
          if (!this.isWalkable(current.gx + n.dx, current.gz) || !this.isWalkable(current.gx, current.gz + n.dz)) {
            continue;
          }
        }

        const tentativeG = gScore[curIndex] + n.cost;

        if (tentativeG < gScore[nIndex]) {
          cameFrom[nIndex] = curIndex;
          gScore[nIndex] = tentativeG;
          fScore[nIndex] = tentativeG + this.heuristic(nx, nz, target.gx, target.gz);

          const existing = openSet.find(item => item.index === nIndex);
          if (!existing) {
            openSet.push({ index: nIndex, gx: nx, gz: nz, f: fScore[nIndex] });
          } else {
            existing.f = fScore[nIndex];
          }
        }
      }
    }

    // 若無完整路徑則退回直線逼近
    return [targetWorldPos.clone()];
  }

  heuristic(x1, z1, x2, z2) {
    const dx = Math.abs(x1 - x2);
    const dz = Math.abs(z1 - z2);
    return Math.sqrt(dx * dx + dz * dz);
  }

  // 重構路徑航點並進行走道平滑化 (Smooth Path Waypoints)
  reconstructPath(cameFrom, currentIdx, finalTargetPos) {
    const rawPath = [];
    let curr = currentIdx;

    while (curr !== -1) {
      const gx = curr % this.cols;
      const gz = Math.floor(curr / this.cols);
      rawPath.unshift(this.gridToWorld(gx, gz));
      curr = cameFrom[curr];
    }

    // 確保終點為精確的目標站立點
    if (rawPath.length > 0) {
      rawPath[rawPath.length - 1] = finalTargetPos.clone();
    }

    // 走道平滑化：拉直無阻礙的長走道，減少鋸齒狀轉彎
    return this.smoothWaypoints(rawPath);
  }

  smoothWaypoints(points) {
    if (points.length <= 2) return points;

    const smoothed = [points[0]];
    let currentIdx = 0;

    while (currentIdx < points.length - 1) {
      let furthest = currentIdx + 1;

      // 往前探測最遠可以直接走到的航點 (視線檢驗 Line of Sight)
      for (let nextIdx = points.length - 1; nextIdx > currentIdx + 1; nextIdx--) {
        if (this.hasLineOfSight(points[currentIdx], points[nextIdx])) {
          furthest = nextIdx;
          break;
        }
      }

      smoothed.push(points[furthest]);
      currentIdx = furthest;
    }

    return smoothed;
  }

  // 視線射線檢驗兩點之間是否有障礙物擋住
  hasLineOfSight(p1, p2) {
    const dist = p1.distanceTo(p2);
    const steps = Math.ceil(dist / (this.cellSize * 0.5));

    for (let i = 1; i < steps; i++) {
      const t = i / steps;
      const x = p1.x + (p2.x - p1.x) * t;
      const z = p1.z + (p2.z - p1.z) * t;
      const g = this.worldToGrid(x, z);
      if (!this.isWalkable(g.gx, g.gz)) {
        return false;
      }
    }
    return true;
  }
}
