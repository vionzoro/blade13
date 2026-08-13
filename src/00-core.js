// ===== BLADE:13 / core =====
let W = 960, H = 600, CX = 480, CY = 300;
// FC 八位机: 世界渲染进 320x200 缓冲, 再 3 倍无插值放大 = 真·大像素
let BW = 320, BH = 200, BCX = 160, BCY = 100;
const VS = .5;
let TOUCH = 0;
// NES 调色板取样(只用得起这几个色, 正是八位机的味道)
const C_AMB = '#f8b800', C_ICE = '#3cbcfc', C_RED = '#f83800', C_XP = '#58f898';
const C_MAG = '#f878f8', C_CHR = '#bcbcbc';            // 品红霓虹 / 铬合金
const C_BG = '#08060f', C_G1 = '#100c22', C_G2 = '#17103c';
const RAINBOW = [C_RED, '#fc9838', C_AMB, C_XP, C_ICE, '#6844fc', C_MAG];

let _s = 1;
const srnd = s => { _s = (s >>> 0) || 1; };
const rnd = () => { _s ^= _s << 13; _s >>>= 0; _s ^= _s >>> 17; _s ^= _s << 5; _s >>>= 0; return _s / 4294967296; };
const ri = n => rnd() * n | 0;
const cl = (v, a, b) => v < a ? a : v > b ? b : v;
const hyp = (x, y) => Math.sqrt(x * x + y * y);
const AD = (a, b) => { let d = a - b; while (d > Math.PI) d -= 6.283; while (d < -Math.PI) d += 6.283; return d; };
// 坐标哈希: 顶视夜城的街区布局由它长出来, 零存储零随机数消耗
const hsh = (x, y) => { let h = ((x * 73856093) ^ (y * 19349663)) >>> 0; h ^= h >>> 13; h = (h * 1274126177) >>> 0; return (h >>> 8) / 16777216; };
const GS = 64;                                          // 地格边长
// 地刺格 + 伸缩相位(逐格错开, 有预警期)
const spikeCell = (gx, gy) => { const h = hsh(gx, gy); return h > .885 && h < .93; };
const spikeW = (gx, gy) => Math.sin(T * 1.5 + hsh(gx, gy) * 62);

// 玩家角色: 一切成长都落在这些字段上
let P, E, G, PR, FX, DN, SL, cam, T, spawnT, bossT, ST, CARDS, shake, kills, tier, best = 0;

function reset(seed) {
  srnd(seed || (Math.random() * 1e9 | 0));
  P = {
    x: 0, y: 0, hp: 120, mhp: 120, lv: 1, xp: 0, nxt: 5,
    dmg: 11, as: 1.55, rng: 82, arc: 1.8, crit: .05, cd: 0, face: 0,
    ls: 0, ms: 162, tdmg: 0, echo: 0, pull: 84, regen: 0, still: 0,
    dchg: 2, dmc: 2, dlock: 0, dmax: 3.4, dn: 3, dkill: 0, inv: 0, dash: null,
    rage: 0, rmax: 10, fren: 0, swing: 0, md: 0, hbud: 0, cmul: 2.4, ginv: 0, thorn: 0, frail: 1
  };
  E = []; G = []; PR = []; FX = []; DN = []; SL = [];
  cam = { x: 0, y: 0 };
  T = 0; spawnT = .3; bossT = 40; ST = 0; CARDS = []; shake = 0; kills = 0; tier = 1;
  clearJuice();
  own = {};
  for (let i = 0; i < 18; i++) spawn(ri(2));            // 开局即满屏: 这个类型不需要热身
}
let own = {};
