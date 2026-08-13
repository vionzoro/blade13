// ===== BLADE:13 / 手感层 =====
// 打击停顿 + 冲击环 + 残影 + 连杀计数 + 屏幕反馈. 这一层不改数值, 只改"爽"

let RING = [], GH = [], HS = 0, combo = 0, comboT = 0, cpop = 0;
let hurtF = 0, lvlF = 0, shX = 0, shY = 0, flashF = 0;
let HALF = [], DEC = [], zoom = 1, uiT = 0, cardT = 0;                        // 尸块 / 地面血渍 / 镜头推近

const ring = (x, y, r, mr, t, c, w) => { RING.push({ x, y, r, mr, t, mt: t, c, w: w || 3 }); if (RING.length > 64) RING.shift(); };
const prismRing = (x, y, r, mr, t, w) => { ring(x, y, r, mr, t, C_BG, w + 6); ring(x, y, r, mr, t, RAINBOW, w); };
const ghost = (x, y, f) => { GH.push({ x, y, f, t: .26 }); if (GH.length > 26) GH.shift(); };
const hs = v => { HS = Math.min(.15, HS + v); };            // 打击停顿(上限防卡死)
const kick = (x, y, v) => {                                  // 定向震屏: 从冲击点推开
  const dx = P.x - x, dy = P.y - y, d = hyp(dx, dy) || 1;
  shX += dx / d * v; shY += dy / d * v;
  shake = Math.max(shake, v);
};
let mile = '', mileT = 0;
const bump = () => {
  combo++; comboT = 1.7; cpop = 1;
  if (combo == 10 || combo == 25 || combo == 50 || combo == 100) { mile = 'x' + combo + '!'; mileT = 1.1; flashF = .5; }
};
const punch = v => { zoom = Math.min(1.13, zoom + v); };   // 镜头冲击

// 斩断: 沿刀锋方向裂成两半飞开
function cut(e) {
  if (HALF.length > 34 || E.length > 220) return;
  const a = P.face;
  for (let s = -1; s <= 1; s += 2)
    HALF.push({
      x: e.x, y: e.y, r: e.r, c: ETY[e.ty].c, a, s,
      vx: Math.cos(a + s * 1.57) * (60 + rnd() * 60) + (rnd() - .5) * 30,
      vy: Math.sin(a + s * 1.57) * (60 + rnd() * 60) - 40,
      rot: 0, vr: (rnd() - .5) * 9, t: .55
    });
}
// 地面血渍: 整局累积, 越打越血腥
const decal = (x, y, r, c) => { DEC.push({ x, y, r: r * (.9 + rnd() * .7), c }); if (DEC.length > 130) DEC.shift(); };

function juice(dt) {
  if (HS > 0) HS -= dt;                                    // 停顿倒计时随手感层走, 不依赖主循环
  for (let i = RING.length - 1; i >= 0; i--) { RING[i].t -= dt; if (RING[i].t <= 0) RING.splice(i, 1); }
  for (let i = GH.length - 1; i >= 0; i--) { GH[i].t -= dt; if (GH[i].t <= 0) GH.splice(i, 1); }
  for (let i = HALF.length - 1; i >= 0; i--) {
    const h = HALF[i];
    h.x += h.vx * dt; h.y += h.vy * dt;
    h.vx *= .9; h.vy = h.vy * .9 + 210 * dt; h.rot += h.vr * dt; h.t -= dt;
    if (h.t <= 0) HALF.splice(i, 1);
  }
  zoom += (1 - zoom) * Math.min(1, dt * 7);
  comboT -= dt; if (comboT <= 0) combo = 0;
  mileT -= dt;
  cpop *= .85; hurtF *= .89; lvlF *= .9; flashF *= .82;
  shX *= .78; shY *= .78;
}
function clearJuice() { mile = ''; mileT = 0; RING = []; GH = []; HALF = []; DEC = []; zoom = 1; HS = 0; combo = 0; comboT = 0; cpop = 0; hurtF = 0; lvlF = 0; shX = 0; shY = 0; flashF = 0; }

// 血雾: 沿击退方向喷溅, 比四散更有方向感
function spray(x, y, nx, ny, n, c) {
  for (let i = 0; i < n; i++) {
    const a = Math.atan2(ny, nx) + (rnd() - .5) * 1.5, s = 70 + rnd() * 260;
    FX.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, t: .3 + rnd() * .3, c });
  }
  for (let i = 0; i < 2; i++) {                        // 火花: 沿刃口甩出的白线
    const a = Math.atan2(ny, nx) + (rnd() - .5) * 2.2, s = 220 + rnd() * 320;
    FX.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, t: .12 + rnd() * .1, c: '#fff', l: 1 });
  }
}
