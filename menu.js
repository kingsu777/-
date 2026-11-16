// Official 炭烤说 poster menu. Prices in yuan. Do not invent dishes.
export const CATS = ['推荐', '烤类', '凉菜', '啤酒', '其他', '饮料'];

export const MENU = [
  // 推荐
  { id: 'qjhj', cat: '推荐', name: '青花椒鸡肉串', price: 2.9, skewer: true, rec: true, style: 'chicken' },
  { id: 'nsn', cat: '推荐', name: '牛上脑大串', price: 3.9, skewer: true, rec: true, style: 'beef-big' },
  { id: 'gyj', cat: '推荐', name: '羔羊肋间串', price: 3.9, skewer: true, rec: true, style: 'lamb' },
  { id: 'cxr', cat: '推荐', name: '超鲜羊肉串', price: 3.9, skewer: true, rec: true, style: 'lamb' },
  { id: 'xlnt', cat: '推荐', name: '西冷牛肋条', price: 4.9, skewer: true, rec: true, style: 'beef' },
  { id: 'bjyb', cat: '推荐', name: '爆汁油边', price: 4.5, skewer: true, rec: true, style: 'fatty' },
  { id: 'nnj', cat: '推荐', name: '牛腩筋', price: 4.9, skewer: true, rec: true, style: 'tendon' },
  { id: 'csb', cat: '推荐', name: '炭香松板肉', price: 3.5, skewer: true, rec: true, style: 'fatty' },

  // 烤类
  { id: 'hsh', cat: '烤类', name: '炭烤黑虎虾', price: 8.9, unit: '只', skewer: true, style: 'shrimp' },
  { id: 'gyp', cat: '烤类', name: '谷饲羊排', price: 4.9, skewer: true, style: 'lamb-rib' },
  { id: 'ybg', cat: '烤类', name: '炭烤油包肝', price: 3.5, skewer: true, style: 'liver' },
  { id: 'xc', cat: '烤类', name: '满口香肥肠', price: 3.9, skewer: true, style: 'intestine' },
  { id: 'zpi', cat: '烤类', name: '丹麦皇冠猪皮', price: 2.9, skewer: true, style: 'skin' },
  { id: 'zzb', cat: '烤类', name: '掌中宝', price: 3.5, skewer: true, style: 'cartilage' },
  { id: 'jcz', cat: '烤类', name: '秘制鸡翅中', price: 7.9, skewer: true, style: 'wing' },
  { id: 'kcc', cat: '烤类', name: '猪肉烤肠', price: 3, skewer: true, style: 'sausage' },
  { id: 'kxg', cat: '烤类', name: '烤香菇', price: 2, skewer: true, style: 'mushroom' },
  { id: 'hwr', cat: '烤类', name: '五花肉卷金针菇', price: 4.9, skewer: true, style: 'baconenoki' },
  { id: 'scj', cat: '烤类', name: '蔬菜卷', price: 2.5, skewer: true, style: 'veg' },
  { id: 'klj', cat: '烤类', name: '烤辣椒', price: 2.5, skewer: true, style: 'pepper' },
  { id: 'fmb', cat: '烤类', name: '蜂蜜烤面包', price: 4, skewer: true, style: 'bread' },
  { id: 'ydf', cat: '烤类', name: '鱼豆腐', price: 2.5, skewer: true, style: 'tofu' },
  { id: 'tdp', cat: '烤类', name: '土豆片', price: 0.9, skewer: true, style: 'potato' },

  // 凉菜
  { id: 'blsq', cat: '凉菜', name: '凉拌三圈', price: 15, kind: 'plate-mix' },
  { id: 'ljhg', cat: '凉菜', name: '捞汁花蛤', price: 19, kind: 'bowl-clam' },
  { id: 'mdhs', cat: '凉菜', name: '毛豆花生', price: 12, kind: 'bowl-edamame' },
  { id: 'qshg', cat: '凉菜', name: '清爽黄瓜', price: 10, kind: 'plate-cuke' },

  // 啤酒
  { id: 'kirin', cat: '啤酒', name: '麒麟一番榨', price: 15.8, kind: 'mug-beer' },
  { id: 'kirin6', cat: '啤酒', name: '麒麟一番榨 一炮6扎', price: 92.9, kind: 'pitcher-beer' },
  { id: 'qd', cat: '啤酒', name: '青岛啤酒·经典', price: 4, kind: 'bottle-green' },
  { id: 'yj', cat: '啤酒', name: '燕京U8', price: 5.5, kind: 'bottle-u8' },
  { id: 'ys', cat: '啤酒', name: '原浆鲜啤', price: 7.8, kind: 'mug-fresh' },
  { id: 'ys6', cat: '啤酒', name: '原浆鲜啤 一炮6扎', price: 45.9, kind: 'pitcher-fresh' },

  // 其他
  { id: 'yblm', cat: '其他', name: '延边冷面', price: 12, kind: 'bowl-noodle' },
  { id: 'cjdf', cat: '其他', name: '醋椒豆腐', price: 12, kind: 'bowl-tofu' },
  { id: 'xht', cat: '其他', name: '小馄饨', price: 9.9, kind: 'pot-wonton' },
  { id: 'kb', cat: '其他', name: '烤饼', price: 2, kind: 'bing' },
  { id: 'xlm', cat: '其他', name: '辛拉面', price: 9.9, kind: 'pot-ramen' },

  // 饮料
  { id: 'nmc', cat: '饮料', name: '暴打柠檬茶', price: 15.9, kind: 'pitcher-tea' },
  { id: 'dyjb', cat: '饮料', name: '大窑嘉宾', price: 4, kind: 'bottle-amber' },
  { id: 'dycn', cat: '饮料', name: '大窑橙诺', price: 4, kind: 'bottle-orange' },
  { id: 'dyla', cat: '饮料', name: '大窑荔爱', price: 4, kind: 'bottle-pink' },
  { id: 'xb', cat: '饮料', name: '雪碧', price: 3, kind: 'can-green' },
  { id: 'kl', cat: '饮料', name: '可乐', price: 3, kind: 'can-red' },
  { id: 'nfsq', cat: '饮料', name: '农夫山泉', price: 2, kind: 'bottle-water' },
];

export const MENU_BY_ID = Object.fromEntries(MENU.map((item) => [item.id, item]));

export function formatPrice(price, unit) {
  const n = Number.isInteger(price) ? String(price) : price.toFixed(1);
  return unit ? `${n}/${unit}` : n;
}

export const CHAT_LINES = [
  '这串够大',
  '再加点青花椒鸡换换口',
  '还是炭火香',
  '先烤羊肉',
  '不够再加就行',
  '这牛上脑真香',
  '慢点烤，别急',
  '再来碟凉菜解解腻',
  '羊排先翻一下',
  '炭火就是不一样',
  '串是真的大',
  '我再加两串肥肠',
  '先吃着，不够再加',
  '这油边爆汁了',
  '来，碰一下',
  '土豆片也挺香',
  '喝口再烤',
  '鸡翅可以翻了',
  '这炉子火正好',
  '先把羊肉烤上',
];

export const MANAGER_LINE = '串大少点，不够再加';

export const MANAGER_CHIRPS = [
  '不够再加就行',
  '慢慢烤，别着急',
  '火候刚好',
  '坐吧，点完我来看一下',
];
