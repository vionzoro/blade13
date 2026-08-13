// ===== BLADE:13 / 主循环·输入·音频 =====
const cv = document.getElementById('c');
const MX = cv.getContext('2d');
const BUF = document.createElement('canvas');
BUF.width = BW; BUF.height = BH;
const BX = BUF.getContext('2d');
ctx = MX;
// CRT 扫描线: 1x3 图案平铺, 一次 fillRect 盖满
let SCAN = 0;
try {
  const sc = document.createElement('canvas'); sc.width = 1; sc.height = 3;
  const sx = sc.getContext('2d'); sx.fillStyle = 'rgba(0,0,0,.3)'; sx.fillRect(0, 2, 1, 1);
  SCAN = MX.createPattern(sc, 'repeat');
} catch (e) { }
let SC = 1, OX = 0, OY = 0, K = {};
let JOY = null;                                    // 虚拟摇杆 {ox,oy,x,y,id}

// 竖屏自动重排: 逻辑画布与像素缓冲一起换比例
function layout() {
  const port = innerHeight > innerWidth;
  W = port ? 600 : 960; H = port ? 960 : 600;
  CX = W / 2; CY = H / 2;
  BW = W / 3 | 0; BH = H / 3 | 0;
  BCX = BW / 2; BCY = BH / 2;
  BUF.width = BW; BUF.height = BH;
}
try { TOUCH = matchMedia('(pointer:coarse)').matches ? 1 : 0; } catch (e) { }

function fit() {
  layout();
  const dpr = Math.min(devicePixelRatio || 1, 2), w = innerWidth, h = innerHeight;
  SC = Math.min(w / W, h / H);
  cv.width = w * dpr; cv.height = h * dpr;
  cv.style.width = w + 'px'; cv.style.height = h + 'px';
  OX = (w - W * SC) / 2; OY = (h - H * SC) / 2;
}
addEventListener('resize', fit); fit();


const pt = e => { const r = cv.getBoundingClientRect(); return { x: ((e.clientX - r.left) - OX) / SC, y: ((e.clientY - r.top) - OY) / SC }; };
const inB = (p, b) => p.x > b.x && p.x < b.x + b.w && p.y > b.y && p.y < b.y + b.h;

function act(a) {
  if (a == 'go') { if (ST == 3) reset(); ST = 1; ac(); tone(300, .22, 'sawtooth', 2.4, .07); return 1; }
  if (a == 'dash') { dash(); return 1; }
  if (a == 'oc') { overclock(); return 1; }
  if (a[0] == 'c') { const c = CARDS[+a[1]]; if (c) { take(c); tone(587, .22, 'triangle', 1.5, .07); } return 1; }
}

addEventListener('keydown', e => {
  const k = e.key.toLowerCase(); K[k] = 1; TOUCH = 0;
  if (k == 'm') { mute ^= 1; if (MG) MG.gain.value = mute ? 0 : .55; }
  if (ST == 0 || ST == 3) { if (k == ' ' || k == 'enter') act('go'); return; }
  if (ST == 2) { if (k >= '1' && k <= '3') act('c' + (+k - 1)); return; }
  if (k == ' ') { e.preventDefault(); act('dash'); }
  if (k == 'shift' || k == 'f') act('oc');
});
addEventListener('keyup', e => { K[e.key.toLowerCase()] = 0; });

cv.addEventListener('pointerdown', e => {
  ac();
  const p = pt(e);
  for (const b of BTN) if (inB(p, b)) { act(b.a); return; }
  if (e.pointerType == 'touch') TOUCH = 1;
  if (ST == 1) JOY = { ox: p.x, oy: p.y, x: p.x, y: p.y, id: e.pointerId, t0: Date.now(), mv: 0 };
});
cv.addEventListener('pointermove', e => {
  if (JOY && e.pointerId == JOY.id) {
    const p = pt(e); JOY.x = p.x; JOY.y = p.y;
    if (hyp(p.x - JOY.ox, p.y - JOY.oy) > 15) JOY.mv = 1;
  }
});
const up = e => {
  if (!JOY || e.pointerId != JOY.id) return;
  // 没拖动且很快松手 = 轻点 -> 释放技能. 一根拇指同时管移动和技能
  if (!JOY.mv && Date.now() - JOY.t0 < 260 && ST == 1) act('dash');
  JOY = null;
};
cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);

function input() {
  let ix = (K.d || K.arrowright ? 1 : 0) - (K.a || K.arrowleft ? 1 : 0);
  let iy = (K.s || K.arrowdown ? 1 : 0) - (K.w || K.arrowup ? 1 : 0);
  if (JOY) {
    const dx = JOY.x - JOY.ox, dy = JOY.y - JOY.oy, d = hyp(dx, dy);
    if (d > 12) { ix = dx / d; iy = dy / d; }
  }
  return [ix, iy];
}

function joyDraw() {
  if (!JOY) return;
  ctx.strokeStyle = 'rgba(255,255,255,.22)'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(JOY.ox, JOY.oy, 46, 0, 6.283); ctx.stroke();
  const dx = JOY.x - JOY.ox, dy = JOY.y - JOY.oy, d = hyp(dx, dy) || 1, k = Math.min(1, d / 46);
  ctx.fillStyle = 'rgba(251,176,59,.55)';
  ctx.beginPath(); ctx.arc(JOY.ox + dx / d * 46 * k, JOY.oy + dy / d * 46 * k, 17, 0, 6.283); ctx.fill();
}

let last = 0, ft = 16, LQ = 0;
function loop(ts) {
  const rdt = Math.min(.05, (ts - last) / 1000 || 0); last = ts;
  ft += (rdt * 1000 - ft) * .05;                       // 平滑帧时
  LQ = ft > 26 ? 1 : ft < 19 ? 0 : LQ;                 // 迟滞: 卡了降质, 顺了恢复
  let dt = rdt; uiT += rdt;
  if (HS > 0) dt = rdt * .05;                      // 打击停顿: 只冻模拟, 画面照渲
  if (ST == 1) {
    const [ix, iy] = input();
    step(dt, ix, iy);
    juice(rdt);
    music();
  }
  render();
  requestAnimationFrame(loop);
}

// 迷幻强度: 连杀 + 狂化 + 生存时长. 砍得越猛, 世界越扭曲
const trip = () => cl(combo / 45, 0, .5) + (P.fren > 0 ? .42 : 0) + cl(T / 700, 0, .14);

function render() {
  const tr = ST == 1 ? trip() : 0;
  // 世界 -> 320x200 缓冲. 不全清 = 拖影, 迷幻感的来源
  ctx = BX;
  BX.setTransform(1, 0, 0, 1, 0, 0);
  BX.globalAlpha = 1;
  BX.fillStyle = C_BG;
  BX.globalAlpha = 1 - tr * .42;
  BX.fillRect(0, 0, BW, BH);
  BX.globalAlpha = 1;
  drawWorld();

  // 合成到主画布: 无插值放大 + 色相漂移 + 扫描带扭曲
  ctx = MX;
  const dpr = Math.min(devicePixelRatio || 1, 2);
  MX.setTransform(1, 0, 0, 1, 0, 0);
  MX.fillStyle = '#000'; MX.fillRect(0, 0, cv.width, cv.height);
  MX.setTransform(dpr * SC, 0, 0, dpr * SC, dpr * OX, dpr * OY);
  MX.imageSmoothingEnabled = false;
  try { MX.filter = 'hue-rotate(' + ((T * 11 + tr * 260) | 0) + 'deg) saturate(' + (1 + tr * 1.4).toFixed(2) + ')'; } catch (e) { }
  const glitch = hurtF > .3 ? hurtF : 0;              // 受击瞬间: 数字信号撕裂
  if (tr > .05 || glitch) {
    const nb = LQ ? 5 : 16, bh = BH / nb, sh2 = H / nb;
    for (let i = 0; i < nb; i++) {
      const wob = Math.sin(T * 2.6 + i * .55) * tr * 13;
      const tear = glitch && ((i * 7 + (T * 40 | 0)) % 5 < 2) ? (rnd() - .5) * glitch * 70 : 0;
      MX.drawImage(BUF, 0, i * bh, BW, bh, wob + tear, i * sh2, W, sh2);
    }
  } else MX.drawImage(BUF, 0, 0, BW, BH, 0, 0, W, H);
  // 超频: RGB 色散(品红/青分离), 这是超频态最强的辨识信号
  if (P.fren > 0 && ST == 1 && !LQ) {
    MX.globalCompositeOperation = 'screen'; MX.globalAlpha = .3;
    try { MX.filter = 'hue-rotate(300deg) saturate(3)'; } catch (e) { }
    MX.drawImage(BUF, 0, 0, BW, BH, -5, 0, W, H);
    try { MX.filter = 'hue-rotate(170deg) saturate(3)'; } catch (e) { }
    MX.drawImage(BUF, 0, 0, BW, BH, 5, 0, W, H);
    MX.globalAlpha = 1; MX.globalCompositeOperation = 'source-over';
  }
  try { MX.filter = 'none'; } catch (e) { }
  MX.imageSmoothingEnabled = true;
  if (SCAN) { MX.fillStyle = SCAN; MX.fillRect(0, 0, W, H); }

  drawUI();
  joyDraw();
}

reset();
try { best = +localStorage.b13 || 0; } catch (e) { }
requestAnimationFrame(loop);
