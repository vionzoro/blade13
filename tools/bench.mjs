// 会走位的机器人: 绕圈拉扯 + 危险时才突进 + 按权重选卡. 用它测难度才有意义
import fs from 'fs';
const code = fs.readFileSync(new URL('../build/logic.js', import.meta.url), 'utf8');
const PREF = { sw: 9, he: 9, ws: 7, fo: 7, wh: 7, bg: 6, ih: 6, ec: 6, pc: 5, mo: 5, ff: 4, st: 3, ls: 2, qd: 3, bo: 1 };

function play(seed) {
  const s = new Function('setTimeout', code +
    ';return{reset,step,juice,dash,take,spikeCell,spikeW,g:()=>({P,E,T,ST,CARDS,kills,tier}),setST:v=>{ST=v}}')(f => { try { f(); } catch (e) {} });
  s.reset(seed); s.setST(1);
  let ang = 0;
  for (let i = 0; i < 60 * 900; i++) {
    const G = s.g();
    if (G.ST === 2) {                                  // 按偏好选卡, 不再乱拿
      let best = G.CARDS[0], bv = -1;
      for (const c of G.CARDS) { const v = PREF[c.i] || 1; if (v > bv) { bv = v; best = c; } }
      if (best) s.take(best); else s.setST(1);
      continue;
    }
    if (G.ST === 3) break;
    // 威胁向量: 近处敌人按 1/d^2 加权
    let tx = 0, ty = 0, close = 0, nd = 1e9;
    for (const e of G.E) {
      const dx = G.P.x - e.x, dy = G.P.y - e.y, d2 = dx * dx + dy * dy;
      if (d2 > 90000) continue;
      const w = 1 / (d2 + 400);
      tx += dx * w; ty += dy * w;
      const d = Math.sqrt(d2);
      if (d < nd) nd = d;
      if (d < 90) close++;
    }
    let ix = 0, iy = 0;
    const m = Math.hypot(tx, ty);
    if (m > 0) {
      tx /= m; ty /= m;                                // 远离方向
      ang += .02;
      // 贴着攻击距离边缘打: 太近就退, 太远就压上去, 中间绕圈
      const radial = nd < 58 ? 1 : nd > 96 ? -1 : 0;
      const tang = Math.sign(Math.sin(ang));
      ix = tx * radial + (-ty) * .95 * tang;
      iy = ty * radial + (tx) * .95 * tang;
      const mm = Math.hypot(ix, iy) || 1; ix /= mm; iy /= mm;
    } else { ix = Math.cos(ang * 3); iy = Math.sin(ang * 3); ang += .02; }
    if (close > 5 || (G.P.hp / G.P.mhp < .45 && nd < 70)) s.dash();   // 被围/血线才突进
    // 躲刺: 脚下的刺要弹出来了就往外挪
    const cgx = Math.floor(G.P.x / 64), cgy = Math.floor(G.P.y / 64);
    if (s.spikeCell(cgx, cgy) && s.spikeW(cgx, cgy) > -.1) {
      const ex2 = G.P.x - (cgx * 64 + 32), ey2 = G.P.y - (cgy * 64 + 32);
      const em = Math.hypot(ex2, ey2) || 1;
      ix = ix * .3 + ex2 / em * 1.2; iy = iy * .3 + ey2 / em * 1.2;
      const nm2 = Math.hypot(ix, iy) || 1; ix /= nm2; iy /= nm2;
    }
    s.step(1 / 60, ix, iy); s.juice(1 / 60);
  }
  return s.g();
}

const res = [];
for (const sd of [11, 22, 33, 44, 55, 66, 77, 88, 99, 111, 123, 234]) {
  const g = play(sd * 3571);
  res.push(g.T);
  console.log('种子' + sd + ': ' + g.T.toFixed(0) + 's  Lv' + g.P.lv + '  威胁' + g.tier + '  ' + g.kills + '杀');
}
res.sort((a, b) => a - b);
const md = (res[5] + res[6]) / 2;
console.log('中位 ' + md.toFixed(0) + 's   区间 ' + res[0].toFixed(0) + '~' + res[res.length - 1].toFixed(0) + 's');
