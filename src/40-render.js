// ===== BLADE:13 / 渲染 =====
let ctx, BTN = [];
const glow = (c, b) => { ctx.shadowColor = c; ctx.shadowBlur = b; };
// 8x8 位图图标(每行两位十六进制) —— 八位机该有的图标
const ICONS = {
  sw: '0e1c387e1c3870e0', he: '03060c183078f060', ws: '3c42810000181800',
  bg: '18183c3c7e7e3c18', fo: '18187ee7e77e1818', wh: '183c7effff7e3c18',
  ih: 'ffffffff7e3c1800', ff: '60606060787cfefe', ls: '66e7c3c3c3e77e3c',
  pc: '3c42423c3c42423c', mo: '10387cfe10387cfe', st: '3c4281818181423c',
  ec: '2412091224000000', wr: '18183c3c7efefe7c', qd: '3c4299998d81423c',
  bo: '3c18183c7e7e7e3c'
};
function pix(hex, x, y, px, c) {
  ctx.fillStyle = c;
  for (let r = 0; r < 8; r++) {
    const b = parseInt(hex.substr(r * 2, 2), 16);
    for (let k = 0; k < 8; k++) if (b & (128 >> k)) ctx.fillRect(x + k * px, y + r * px, px, px);
  }
}
// FC 风双线边框
function frame8(x, y, w, h, c) {
  ctx.strokeStyle = c; ctx.lineWidth = 3;
  ctx.strokeRect(x, y, w, h);
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 6, y + 6, w - 12, h - 12);
}
const noglow = () => { ctx.shadowBlur = 0; };
const rr = (x, y, w, h, r) => {
  ctx.beginPath(); ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
};

// 可见性: 屏外对象直接跳过绘制
let VX = 0, VY = 0;
const vis = (x, y, m) => Math.abs(x - cam.x) < VX + m && Math.abs(y - cam.y) < VY + m;

function drawWorld() {
  VX = BW / 2 / VS + 40; VY = BH / 2 / VS + 40;
  ctx.save();
  const sk = shake > .3 ? shake : 0;
  ctx.translate(BCX, BCY); ctx.scale(zoom * VS, zoom * VS);
  ctx.translate(-cam.x + shX + (rnd() - .5) * sk, -cam.y + shY + (rnd() - .5) * sk);

  // 顶视夜城: 街区地砖 + 楼顶暗块 + 霓虹边条(全部由坐标哈希决定, 零存储)
  const gs = 64, vw = BW / VS, vh = BH / VS;
  const x0 = Math.floor((cam.x - vw / 2) / gs) * gs, y0 = Math.floor((cam.y - vh / 2) / gs) * gs;
  const NEON = RAINBOW;
  for (let x = x0; x < x0 + vw + gs * 2; x += gs)
    for (let y = y0; y < y0 + vh + gs * 2; y += gs) {
      const gx = x / gs | 0, gy = y / gs | 0;
      const h = hsh(gx, gy);
      ctx.fillStyle = ((gx + gy) & 1) ? C_G1 : C_G2;
      ctx.fillRect(x, y, gs, gs);
      if (spikeCell(gx, gy)) {                  // 地刺: 收起 -> 预警 -> 弹出
        const w = spikeW(gx, gy), up = w > .55, warn = w > .15 && !up;
        ctx.fillStyle = '#1a0d12'; ctx.fillRect(x + 3, y + 3, gs - 6, gs - 6);
        ctx.strokeStyle = warn ? C_RED : '#402634'; ctx.lineWidth = warn ? 2 : 1;
        ctx.strokeRect(x + 3, y + 3, gs - 6, gs - 6);
        const ex = up ? 1 : warn ? .28 : .1;
        ctx.fillStyle = up ? '#e8e8f0' : '#5a4a58';
        for (let q = 0; q < 4; q++) {
          const px3 = x + 12 + (q % 2) * 26, py3 = y + 12 + (q > 1 ? 26 : 0);
          ctx.beginPath();
          ctx.moveTo(px3, py3 + 13); ctx.lineTo(px3 + 6, py3 + 13 - 15 * ex); ctx.lineTo(px3 + 12, py3 + 13);
          ctx.fill();
        }
        if (up) { ctx.fillStyle = C_RED; ctx.globalAlpha = .5; ctx.fillRect(x + 3, y + 3, gs - 6, 2); ctx.globalAlpha = 1; }
      } else if (h < .2) {                             // 楼顶(纯装饰)
        ctx.fillStyle = '#070512';
        ctx.fillRect(x + 6, y + 6, gs - 12, gs - 12);
        const nc = NEON[(h * 97 | 0) % 7];
        ctx.globalAlpha = .5 + Math.sin(T * 2 + gx * 1.7 + gy) * .4;
        ctx.fillStyle = nc; ctx.fillRect(x + 6, y + 6, gs - 12, 2);
        ctx.globalAlpha = 1;
      } else if (h > .95) {                            // 街面导光带
        ctx.fillStyle = RAINBOW[((gx * 3 + gy * 5) & 255) % 7]; ctx.globalAlpha = .18;
        ctx.fillRect(x, y + gs / 2 - 1, gs, 2); ctx.globalAlpha = 1;
      }
    }

  // 地面血渍: 一局打下来会积成一片战场
  for (const d of DEC) {
    if (!vis(d.x, d.y, d.r)) continue;
    ctx.globalAlpha = .17; ctx.fillStyle = d.c;
    ctx.beginPath(); ctx.ellipse(d.x, d.y, d.r, d.r * .42, 0, 0, 6.283); ctx.fill();
  }
  ctx.globalAlpha = 1;

  // 尸块
  for (const h of HALF) {
    if (!vis(h.x, h.y, h.r)) continue;
    ctx.save(); ctx.translate(h.x, h.y); ctx.rotate(h.rot);
    ctx.globalAlpha = cl(h.t * 2.4, 0, 1);
    ctx.fillStyle = h.c;
    ctx.beginPath();
    ctx.arc(0, 0, h.r, h.a + (h.s > 0 ? 0 : Math.PI), h.a + (h.s > 0 ? Math.PI : 6.283));
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.4; ctx.stroke();
    ctx.globalAlpha = 1; ctx.restore();
  }

  // 经验球
  if (G.length < 70) glow(C_XP, 8);
  for (let i = 0; i < G.length; i++) {
    const g = G[i], gc = RAINBOW[(i + kills) % 7];
    if (!vis(g.x, g.y, 12)) continue;
    ctx.globalAlpha = .9;
    if (g.hl) {                                       // 血包: 红十字, 与绿色经验分开
      const pz = 1 + Math.sin(T * 6) * .12;
      ctx.fillStyle = '#ff5a7a';
      ctx.fillRect(g.x - 2, g.y - 7 * pz, 4, 14 * pz); ctx.fillRect(g.x - 7 * pz, g.y - 2, 14 * pz, 4);
    } else {
      ctx.fillStyle = gc;
      ctx.beginPath(); ctx.moveTo(g.x, g.y - 5); ctx.lineTo(g.x + 4, g.y); ctx.lineTo(g.x, g.y + 5); ctx.lineTo(g.x - 4, g.y); ctx.fill();
    }
    const sp = hyp(g.vx, g.vy);
    if (sp > 90) {                                   // 被吸走时拉出拖尾
      ctx.globalAlpha = .35; ctx.strokeStyle = gc; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(g.x, g.y); ctx.lineTo(g.x - g.vx * .05, g.y - g.vy * .05); ctx.stroke();
    }
  }
  ctx.globalAlpha = 1; noglow();

  // 怪物
  const lod = E.length > 90;
  for (const e of E) if (vis(e.x, e.y, e.r + 24)) creature(e, lod);

  // 敌方子弹: 红色 + 拖尾, 与绿色经验球一眼分开
  ctx.strokeStyle = 'rgba(248,56,0,.55)'; ctx.lineWidth = 3;
  ctx.beginPath();
  for (const p of PR) { ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - p.vx * .045, p.y - p.vy * .045); }
  ctx.stroke();
  for (const p of PR) {
    ctx.fillStyle = C_RED; ctx.beginPath(); ctx.arc(p.x, p.y, 5, 0, 6.283); ctx.fill();
    ctx.fillStyle = '#ffd0a0'; ctx.beginPath(); ctx.arc(p.x, p.y, 2, 0, 6.283); ctx.fill();
  }

  // 刀光: 实心月牙 + 发光锋线
  for (const s of SL) {
    const k = s.t / s.mt, e = 1 - k;
    const pc = P.fren > 0 ? RAINBOW[(((T * 12 + s.a * 3) | 0) & 255) % 7] : C_ICE;
    const r0 = s.r * (.42 + e * .34), r1 = s.r * (1.04 + e * .16);
    const gd = ctx.createRadialGradient(s.x, s.y, r0, s.x, s.y, r1);
    gd.addColorStop(0, 'rgba(62,224,247,0)');
    gd.addColorStop(.72, 'rgba(210,250,255,' + (k * .5).toFixed(3) + ')');
    gd.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = gd;
    ctx.beginPath();
    ctx.arc(s.x, s.y, r1, s.a - s.arc / 2, s.a + s.arc / 2);
    ctx.arc(s.x, s.y, r0, s.a + s.arc / 2, s.a - s.arc / 2, 1);
    ctx.closePath(); ctx.fill();
    glow(pc, 14);
    ctx.strokeStyle = pc; ctx.lineWidth = 1.6 + k * 3.4;
    ctx.beginPath(); ctx.arc(s.x, s.y, r1 * .95, s.a - s.arc / 2, s.a + s.arc / 2); ctx.stroke();
    noglow();
  }

  // 粒子
  for (const f of FX) {
    if (!vis(f.x, f.y, 10)) continue;
    ctx.globalAlpha = cl(f.t * 2.4, 0, 1);
    if (f.l) {                                        // 火花: 短线更锋利
      ctx.strokeStyle = f.c; ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.moveTo(f.x, f.y); ctx.lineTo(f.x - f.vx * .045, f.y - f.vy * .045); ctx.stroke();
    } else { ctx.fillStyle = f.c; ctx.fillRect(f.x - 2, f.y - 2, 4, 4); }
  }
  ctx.globalAlpha = 1;

  // 突进残影
  for (const g of GH) {
    const k = g.t / .26;
    const pc = P.fren > 0 ? RAINBOW[(T * 12 | 0) % 7] : C_ICE;
    ctx.globalAlpha = k * .5;
    ctx.fillStyle = pc;
    ctx.beginPath(); ctx.ellipse(g.x, g.y - 4, 9, 15, 0, 0, 6.283); ctx.fill();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(g.x, g.y); ctx.lineTo(g.x + Math.cos(g.f) * 34, g.y + Math.sin(g.f) * 34); ctx.stroke();
    ctx.globalAlpha = 1;
  }
  // 主角
  hero();
  // 冲击环
  glow('#fff', 10);
  for (const r of RING) {
    const k = 1 - r.t / r.mt, e = 1 - Math.pow(1 - k, 3);
    const n = r.c == RAINBOW ? 7 : 1;
    ctx.globalAlpha = (1 - k) * .9; ctx.lineWidth = r.w * (1 - k * .7);
    for (let i = 0; i < n; i++) {
      ctx.strokeStyle = n > 1 ? r.c[i] : r.c;
      ctx.beginPath(); ctx.arc(r.x, r.y, r.r + (r.mr - r.r) * e, i * 6.283 / n, (i + 1) * 6.283 / n); ctx.stroke();
    }
  }
  ctx.globalAlpha = 1; noglow();

  // 伤害数字
  ctx.textAlign = 'center';
  for (const d of DN) {
    if (!vis(d.x, d.y, 30)) continue;
    const k = 1 - d.t / (d.mt || .62), pop = k < .18 ? 1 + (1 - k / .18) * .8 : 1;
    ctx.globalAlpha = cl(d.t * 2, 0, 1);
    ctx.save(); ctx.translate(d.x, d.y); ctx.scale(pop, pop);
    ctx.font = (d.cr ? 'bold 18px' : '13px') + ' monospace';
    ctx.fillStyle = d.cr ? C_AMB : '#fff';
    if (d.cr) { ctx.strokeStyle = '#7a3a00'; ctx.lineWidth = 3; ctx.strokeText(d.v, 0, 0); }
    ctx.fillText(d.v, 0, 0); ctx.restore();
  }
  ctx.globalAlpha = 1;
  ctx.restore();

  // 酸雨: 缓冲空间直接算, 无状态无分配
  ctx.strokeStyle = 'rgba(140,190,255,.22)'; ctx.lineWidth = 1;
  ctx.beginPath();
  for (let i = 0; i < 64; i++) {
    const x = (i * 137.5 + T * 46) % (BW + 40) - 20;
    const y = (i * 91.3 + T * 300) % (BH + 30) - 15;
    ctx.moveTo(x, y); ctx.lineTo(x - 3, y + 10);
  }
  ctx.stroke();
}

function drawUI() {
  if (P.dash) speedLines();
  screenFX();
  hud();
  if (ST == 0) center('BLADE:13 — PRISM BREAK', 'SEVER THE UNICORN NETWORK.', '', 'JACK IN');
  if (ST == 2) cardScreen();
  if (ST == 3) center('FLATLINED', 'Uptime ' + mmss(T) + '   Level ' + P.lv + '   Kills ' + kills, 'Best ' + mmss(best), 'REBOOT');
}

function speedLines() {
  ctx.strokeStyle = 'rgba(190,240,255,.5)'; ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = 0; i < 18; i++) {
    const a = rnd() * 6.283, r0 = 200 + rnd() * 150, l = 60 + rnd() * 130;
    ctx.moveTo(CX + Math.cos(a) * r0, CY + Math.sin(a) * r0);
    ctx.lineTo(CX + Math.cos(a) * (r0 + l), CY + Math.sin(a) * (r0 + l));
  }
  ctx.stroke();
}

function screenFX() {
  const lo = P.hp / P.mhp < .35 ? 1 - P.hp / P.mhp / .35 : 0;
  const a = Math.max(hurtF * .6, lo * .38 * (.62 + Math.sin(T * 7) * .38));
  if (a > .012) {
    const g = ctx.createRadialGradient(CX, CY, 170, CX, CY, 580);
    g.addColorStop(0, 'rgba(255,40,30,0)'); g.addColorStop(1, 'rgba(255,32,20,' + a.toFixed(3) + ')');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  }
  if (P.fren > 0) {
    const fg = ctx.createRadialGradient(CX, CY, 120, CX, CY, 620);
    fg.addColorStop(0, 'rgba(255,190,90,0)');
    fg.addColorStop(1, 'rgba(255,170,60,' + (.16 + Math.sin(T * 14) * .05).toFixed(3) + ')');
    ctx.fillStyle = fg; ctx.fillRect(0, 0, W, H);
  }
  if (lvlF > .02) {
    ctx.fillStyle = 'rgba(126,247,200,' + (lvlF * .3).toFixed(3) + ')'; ctx.fillRect(0, 0, W, H);
    // 升级横幅: 色散抖动的霓虹条
    const bh2 = 44 * lvlF;
    ctx.fillStyle = 'rgba(8,6,15,.85)'; ctx.fillRect(0, CY - bh2 / 2, W, bh2);
    if (lvlF > .3) {
      ctx.textAlign = 'center'; ctx.font = 'bold 26px monospace';
      ctx.fillStyle = C_MAG; ctx.fillText('LEVEL UP', CX - 3, CY + 9);
      ctx.fillStyle = C_ICE; ctx.fillText('LEVEL UP', CX + 3, CY + 9);
      ctx.fillStyle = '#fff'; ctx.fillText('LEVEL UP', CX, CY + 9);
    }
    ctx.fillStyle = C_XP; ctx.fillRect(0, CY - bh2 / 2, W, 1); ctx.fillRect(0, CY + bh2 / 2, W, 1);
  }
  // 场外目标指示: 孵化巢与首领在屏幕边缘留箭头, 阻力线必须可见
  for (const e of E) {
    if (e.ty != 6 && !e.boss) continue;
    const dx = (e.x - cam.x) * VS, dy = (e.y - cam.y) * VS;
    if (Math.abs(dx) < BW / 2 - 14 && Math.abs(dy) < BH / 2 - 14) continue;
    const a = Math.atan2(dy, dx), R = 246;
    const ax = CX + Math.cos(a) * R, ay = CY + Math.sin(a) * R;
    ctx.save(); ctx.translate(ax, ay); ctx.rotate(a);
    ctx.fillStyle = e.boss ? C_RED : '#c878f8';
    ctx.globalAlpha = .55 + Math.sin(T * 7) * .35;
    ctx.beginPath(); ctx.moveTo(13, 0); ctx.lineTo(-8, 8); ctx.lineTo(-8, -8); ctx.fill();
    ctx.globalAlpha = 1; ctx.restore();
  }
  // 首领蓄力: 屏幕四边告警条
  let tel = 0;
  for (const e of E) if (e.boss && e.tel > 0) tel = Math.max(tel, e.tel / .95);
  if (tel > 0) {
    const a = (.25 + Math.sin(T * 20) * .2) * tel;
    ctx.fillStyle = 'rgba(248,56,0,' + a.toFixed(3) + ')';
    ctx.fillRect(0, 0, W, 10); ctx.fillRect(0, H - 10, W, 10);
    ctx.fillRect(0, 0, 10, H); ctx.fillRect(W - 10, 0, 10, H);
    ctx.textAlign = 'center'; ctx.font = 'bold 13px monospace'; ctx.fillStyle = C_RED;
    ctx.fillText('!! INCOMING !!', CX, 78);
  }
  if (flashF > .02) { ctx.fillStyle = 'rgba(255,214,138,' + (flashF * .42).toFixed(3) + ')'; ctx.fillRect(0, 0, W, H); }
  if (mileT > 0) {
    const k = cl(mileT / 1.1, 0, 1), sc = 1 + (1 - k) * .9;
    ctx.save(); ctx.translate(CX, 168); ctx.scale(sc, sc); ctx.textAlign = 'center';
    ctx.globalAlpha = k;
    glow(C_AMB, 16);
    ctx.font = 'bold 40px monospace'; ctx.fillStyle = '#fff'; ctx.fillText(mile, 0, 0);
    noglow(); ctx.globalAlpha = 1; ctx.restore();
  }
  if (combo > 2) {
    const sc = 1 + cpop * .55;
    ctx.save(); ctx.translate(CX, 104); ctx.scale(sc, sc); ctx.textAlign = 'center';
    ctx.font = 'bold 32px monospace';
    ctx.fillStyle = [C_AMB, '#f87858', C_MAG, C_ICE, '#fff'][Math.min(4, combo / 12 | 0)];
    ctx.fillText(combo, 0, 0);
    ctx.font = '10px monospace'; ctx.fillStyle = '#9a93b5'; ctx.fillText('COMBO', 0, 15);
    ctx.restore();
  }
}

function hud() {
  // HP
  ctx.fillStyle = '#000a'; ctx.fillRect(14, 14, 260, 15);
  ctx.fillStyle = C_RED; ctx.fillRect(14, 14, 260 * cl(P.hp / P.mhp, 0, 1), 15);
  ctx.fillStyle = '#fff'; ctx.font = '11px monospace'; ctx.textAlign = 'left';
  ctx.fillText((P.hp | 0) + ' / ' + (P.mhp | 0), 20, 26);
  // XP
  ctx.fillStyle = '#000a'; ctx.fillRect(14, 33, 260, 7);
  ctx.fillStyle = C_XP; ctx.fillRect(14, 33, 260 * cl(P.xp / P.nxt, 0, 1), 7);
  ctx.fillStyle = C_XP; ctx.font = '13px monospace'; ctx.fillText('LV ' + P.lv, 282, 30);
  // 狂化槽
  ctx.fillStyle = '#000a'; ctx.fillRect(14, 45, 260, 5);
  ctx.fillStyle = P.fren > 0 ? RAINBOW[(T * 12 | 0) % 7] : C_AMB; ctx.fillRect(14, 45, 260 * cl(P.fren > 0 ? 1 : P.rage / P.rmax, 0, 1), 5);
  ctx.font = '10px monospace'; ctx.fillStyle = P.fren > 0 ? C_MAG : '#6a6480';
  ctx.fillText(P.fren > 0 ? 'PRISM BREAK ' + P.fren.toFixed(1) : P.rage >= P.rmax ? 'PRISM BREAK READY' : 'PRISM BREAK', 282, 50);
  // 时间 / 击杀
  ctx.textAlign = 'right'; ctx.font = '22px monospace'; ctx.fillStyle = '#fff';
  ctx.fillText(mmss(T), W - 16, 32);
  ctx.font = '12px monospace'; ctx.fillStyle = '#9a93b5';
  ctx.fillText(kills + ' kills', W - 16, 50);
  // 突进冷却
  const rdy = P.dchg >= 1 && P.dlock <= 0;
  ctx.textAlign = 'center';
  ctx.strokeStyle = rdy ? C_ICE : '#4a4560'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(W - 62, H - 62, 34, 0, 6.283); ctx.stroke();
  ctx.strokeStyle = C_ICE; ctx.lineWidth = 3;              // 充能进度
  ctx.beginPath(); ctx.arc(W - 62, H - 62, 34, -1.57, -1.57 + 6.283 * cl(P.dchg / P.dmc, 0, 1)); ctx.stroke();
  ctx.fillStyle = rdy ? C_ICE : '#6a6480'; ctx.font = '12px monospace';
  ctx.fillText('BLINK', W - 62, H - 62);
  for (let i = 0; i < P.dmc; i++) {                        // 充能格: 剩几发一目了然
    const px2 = W - 62 + (i - (P.dmc - 1) / 2) * 13;
    ctx.fillStyle = P.dchg >= i + 1 ? C_ICE : '#3a3550';
    ctx.beginPath(); ctx.moveTo(px2, H - 48); ctx.lineTo(px2 + 4, H - 44); ctx.lineTo(px2, H - 40); ctx.lineTo(px2 - 4, H - 44); ctx.fill();
  }
  BTN = [{ x: W - 96, y: H - 96, w: 68, h: 68, a: 'dash' }];
  if (P.rage >= P.rmax && P.fren <= 0) {                 // 只在可用时出现的按钮
    const ox2 = 20, oy2 = H - 96;
    ctx.globalAlpha = .6 + Math.sin(T * 9) * .4;
    rr(ox2, oy2, 116, 44, 6); ctx.fillStyle = 'rgba(248,120,248,.2)'; ctx.fill();
    ctx.strokeStyle = C_MAG; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = '#fff'; ctx.font = 'bold 13px monospace'; ctx.textAlign = 'center';
    ctx.fillText(TOUCH ? 'PRISM BREAK' : 'PRISM BREAK [F]', ox2 + 58, oy2 + 27);
    ctx.globalAlpha = 1; ctx.textAlign = 'left';
    BTN.push({ x: ox2, y: oy2, w: 116, h: 44, a: 'oc' });
  }
}

// 键帽: PC 玩家一眼看懂按什么
function cap(x, y, w, lb) {
  rr(x, y, w, 26, 4);
  ctx.fillStyle = 'rgba(60,188,252,.14)'; ctx.fill();
  ctx.strokeStyle = C_ICE; ctx.lineWidth = 1.2; ctx.stroke();
  ctx.fillStyle = C_ICE; ctx.font = 'bold 12px monospace'; ctx.textAlign = 'center';
  ctx.fillText(lb, x + w / 2, y + 18);
}
function howto(y) {
  ctx.textAlign = 'center';
  if (TOUCH) {
    ctx.font = '13px monospace'; ctx.fillStyle = '#fff';
    ctx.fillText('DRAG anywhere to move', CX, y + 4);
    ctx.fillStyle = C_MAG; ctx.fillText('TAP to BLINK through them', CX, y + 26);
    ctx.font = '11px monospace'; ctx.fillStyle = '#7a7496';
    ctx.fillText('one thumb does everything', CX, y + 46);
  } else {
    const bx = CX - 128;
    cap(bx + 30, y - 30, 26, 'W');
    cap(bx, y, 26, 'A'); cap(bx + 30, y, 26, 'S'); cap(bx + 60, y, 26, 'D');
    ctx.font = '12px monospace'; ctx.fillStyle = '#fff'; ctx.textAlign = 'left';
    ctx.fillText('MOVE', bx + 96, y + 18);
    cap(CX + 44, y, 84, 'SPACE');
    ctx.fillStyle = C_MAG; ctx.fillText('BLINK', CX + 136, y + 18);
    ctx.textAlign = 'center';
  }
}

function center(t1, t2, t3, btn) {
  ctx.fillStyle = 'rgba(6,5,12,.86)'; ctx.fillRect(0, 0, W, H);
  ctx.textAlign = 'center';
  ctx.font = 'bold ' + (t1.length > 14 ? 32 : 46) + 'px monospace';
  ctx.fillStyle = C_MAG; ctx.fillText(t1, CX - 3 + Math.sin(T * 9) * 1.6, 210);
  ctx.fillStyle = C_ICE; ctx.fillText(t1, CX + 3 - Math.sin(T * 9) * 1.6, 210);
  glow(C_AMB, 14); ctx.fillStyle = '#fff'; ctx.fillText(t1, CX, 210); noglow();
  ctx.font = '15px monospace'; ctx.fillStyle = '#fff'; ctx.fillText(t2, CX, 252);
  if (t3) { ctx.font = '12px monospace'; ctx.fillStyle = '#9a93b5'; ctx.fillText(t3, CX, 280); }
  if (ST == 0) howto(300);
  const by = ST == 0 ? 386 : 320;
  rr(CX - 90, by, 180, 46, 8); ctx.fillStyle = 'rgba(251,176,59,.16)'; ctx.fill();
  ctx.strokeStyle = C_AMB; ctx.lineWidth = 1.5; ctx.stroke();
  ctx.globalAlpha = .65 + Math.sin(T * 5) * .35;
  ctx.fillStyle = C_AMB; ctx.font = '16px monospace'; ctx.fillText(btn, CX, by + 29);
  ctx.globalAlpha = 1;
  BTN = [{ x: CX - 90, y: by, w: 180, h: 46, a: 'go' }];
}

function cardScreen() {
  // 背景: 缓慢滚动的彩条(迷幻底)
  ctx.fillStyle = 'rgba(6,4,14,.93)'; ctx.fillRect(0, 0, W, H);
  ctx.globalAlpha = .09;
  for (let i = 0; i < 10; i++) {
    ctx.fillStyle = ['#f83800', '#fca044', '#f8b800', '#58f898', '#3cbcfc', '#6844fc'][i % 6];
    const yy = ((T * 26 + i * 62) % (H + 62)) - 62;
    ctx.fillRect(0, yy, W, 26);
  }
  ctx.globalAlpha = 1;

  ctx.textAlign = 'center';
  glow(C_XP, 12);
  ctx.font = 'bold 30px monospace'; ctx.fillStyle = '#fff'; ctx.fillText('LEVEL ' + P.lv, CX, 104);
  noglow();
  ctx.font = '12px monospace'; ctx.fillStyle = '#9a93b5'; ctx.fillText('CHOOSE ONE', CX, 128);
  BTN = [];
  const port = H > W;
  CARDS.forEach((c, i) => {
    const w = port ? 340 : 236, h = port ? 190 : 250;
    const y = port ? 190 + i * (h + 18) : 162;
    const x = port ? CX - w / 2 : CX - (CARDS.length * (w + 20) - 20) / 2 + i * (w + 20);
    const iy = port ? 36 : 44, ny = port ? 100 : 104, dy = port ? 128 : 140, ip = port ? 3 : 4;
    // 入场: 逐张弹出
    const age = cl((uiT - cardT - i * .075) / .22, 0, 1);
    if (age <= 0) return;
    const e = 1 - Math.pow(1 - age, 3), sc = .82 + e * .18;
    const col = c.k == 2 ? C_RED : c.k ? C_AMB : C_ICE;
    ctx.save();
    ctx.translate(x + w / 2, y + h / 2); ctx.scale(sc, sc); ctx.translate(-w / 2, -h / 2);
    ctx.globalAlpha = age;
    ctx.fillStyle = c.k == 2 ? 'rgba(248,56,0,.12)' : c.k ? 'rgba(252,160,68,.10)' : 'rgba(60,188,252,.10)';
    ctx.fillRect(0, 0, w, h);
    frame8(0, 0, w, h, col);
    ctx.fillStyle = col; ctx.font = '11px monospace';
    ctx.fillText(c.k == 2 ? '\u25c6 OVERLOAD' : c.k ? '\u25c6 CHROME' : '\u25c6 PROGRAM', w / 2, 30);
    pix(ICONS[c.ic || c.i] || ICONS.bo, w / 2 - ip * 4, iy, ip, col);   // 32x32 像素图标
    ctx.fillStyle = '#fff'; ctx.font = 'bold 18px monospace';
    ctx.fillText(c.n, w / 2, ny);
    ctx.font = '13px monospace';
    wrap(c.d, 24).forEach((l, j) => {
      ctx.fillStyle = l.indexOf('BUT') >= 0 || j && c.k == 2 ? C_RED : '#c9c3e0';   // 代价用红字标出
      ctx.fillText(l, w / 2, dy + j * 19);
    });
    const st = own[c.i] || 0;
    ctx.fillStyle = '#7a7496'; ctx.font = '11px monospace';
    ctx.fillText(st ? 'OWNED ' + st + '/' + c.m : 'NEW', w / 2, h - (port ? 30 : 44));
    ctx.fillStyle = col; ctx.font = '14px monospace';
    ctx.fillText('[' + (i + 1) + ']', w / 2, h - (port ? 11 : 18));
    ctx.globalAlpha = 1; ctx.restore();
    BTN.push({ x, y, w, h, a: 'c' + i });
  });
}

function wrap(s, n) {
  const w = s.split(' '), o = []; let c = '';
  for (const x of w) { if ((c + ' ' + x).trim().length > n) { o.push(c.trim()); c = x; } else c += ' ' + x; }
  if (c.trim()) o.push(c.trim());
  return o;
}
