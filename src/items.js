// 遊戲橘子《便利商店》風格商品數據庫
export const ITEM_DEFINITIONS = {
  onigiri: {
    id: 'onigiri',
    name: '御飯糰 (鮪魚海苔)',
    category: '鮮食便當',
    cost: 15,           // 進價 (NT$)
    suggestedPrice: 30,  // 建議售價
    currentPrice: 30,    // 目前售價
    boxCapacity: 12,     // 一箱數量
    shelfId: 'fresh_shelf_1',
    color: '#15803d',
    shape: 'triangle',
    popularity: 0.9,     // 基礎熱門度
    priceTolerance: 1.3, // 顧客價格容忍倍率
    description: '經典越光米搭配特調鮪魚，鮮食熱銷榜第一名！'
  },
  green_tea: {
    id: 'green_tea',
    name: '日式極品綠茶',
    category: '飲料冷藏',
    cost: 12,
    suggestedPrice: 25,
    currentPrice: 25,
    boxCapacity: 16,
    shelfId: 'fridge_shelf_1',
    color: '#10b981',
    shape: 'bottle',
    popularity: 0.95,
    priceTolerance: 1.25,
    description: '甘醇不澀的冷泡綠茶，上班族與學生解渴首選。'
  },
  chips: {
    id: 'chips',
    name: '海鹽經典洋芋片',
    category: '休閒零食',
    cost: 18,
    suggestedPrice: 35,
    currentPrice: 35,
    boxCapacity: 12,
    shelfId: 'snack_shelf_1',
    color: '#f59e0b',
    shape: 'bag',
    popularity: 0.85,
    priceTolerance: 1.35,
    description: '香脆厚切洋芋片，聚會與消夜不可或缺的零嘴。'
  },
  instant_noodles: {
    id: 'instant_noodles',
    name: '蔥燒牛肉風味泡麵',
    category: '速食泡麵',
    cost: 20,
    suggestedPrice: 40,
    currentPrice: 40,
    boxCapacity: 12,
    shelfId: 'snack_shelf_2',
    color: '#ef4444',
    shape: 'cup',
    popularity: 0.9,
    priceTolerance: 1.3,
    description: '香濃牛肉湯頭與香蔥，夜貓子與學生最愛。'
  },
  canned_coffee: {
    id: 'canned_coffee',
    name: '現磨醇黑美式咖啡',
    category: '飲料冷藏',
    cost: 16,
    suggestedPrice: 35,
    currentPrice: 35,
    boxCapacity: 16,
    shelfId: 'fridge_shelf_2',
    color: '#78350f',
    shape: 'can',
    popularity: 0.88,
    priceTolerance: 1.4,
    description: '阿拉比卡精選深焙豆，早晨提神必備黑金液體。'
  },
  oden: {
    id: 'oden',
    name: '暖呼呼綜合關東煮',
    category: '鮮食便當',
    cost: 22,
    suggestedPrice: 45,
    currentPrice: 45,
    boxCapacity: 10,
    shelfId: 'fresh_shelf_2',
    color: '#d97706',
    shape: 'bowl',
    popularity: 0.85,
    priceTolerance: 1.3,
    description: '柴魚高湯精心熬煮的蘿蔔、黑輪與黃金魚蛋。'
  }
};
