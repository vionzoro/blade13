// 三种"苟活流"压力测试: 吸血流 / 纯逃跑流 / 草丛潜行流
import fs from 'fs';
const code = fs.readFileSync(new URL('../build/logic.js', import.meta.url), 'utf8');
const h = (x, y) => { let v = ((x * 73856093) ^ (y * 19349663)) >>> 0; v ^= v >>> 13; v = (v * 1274126177) >>> 0; return (v >>> 8) / 16777216; };
function play(seed, mode, PREF) {
  const s = new Function('setTimeout', code +
    ';return{reset,step,juice,dash,take,overclock,spikeCell,spikeW,g:()=>({P,E,T,ST,CARDS,kills}),setST:v=>{ST=v}}')(f => { try { f(); } catch (e) {} });
  s.reset(seed); s.setST(1);
  let ang = 0, runDir = 0;
  for (let i = 0; i < 60 * 900; i++) {
    const G = s.g();
    if (G.ST === 2) { let b = G.CARDS[0], bv = -1; for (const c of G.CARDS) { const v = PREF[c.i] || 1; if (v > bv) { bv = v; b = c; } } if (b) s.take(b); else s.setST(1); continue; }
    if (G.ST === 3) break;
    let ix = 0, iy = 0;
    if (mode === 'run') { runDir += .004; ix = Math.cos(runDir); iy = Math.sin(runDir); }      // 一路直线逃
    else {
      let tx = 0, ty = 0, nd = 1e9;
      for (const e of G.E) { const dx = G.P.x - e.x, dy = G.P.y - e.y, d2 = dx * dx + dy * dy; if (d2 > 90000) continue; const w = 1 / (d2 + 400); tx += dx * w; ty += dy * w; const d = Math.sqrt(d2); if (d < nd) nd = d; }
      const m = Math.hypot(tx, ty);
      if (m > 0) { tx /= m; ty /= m; ang += .02; const rad = mode === 'brush' ? 1 : (nd < 58 ? 1 : nd > 96 ? -1 : 0), tg = Math.sign(Math.sin(ang)); ix = tx * rad + (-ty) * .95 * tg; iy = ty * rad + tx * .95 * tg; const mm = Math.hypot(ix, iy) || 1; ix /= mm; iy /= mm; }
      if (nd < 70) s.dash();
    }
    s.overclock();
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
  const g = s.g();
  return g.T;
}
const LS = { bg: 20, vl: 20, ih: 12, bw: 12, sw: 9, he: 9 };     // 吸血坦克流
const RUN = { ff: 20, qd: 15, gh: 15, pc: 12, ls: 10 };          // 逃跑流
const NORM = { sw: 9, he: 9, ap: 10, bl: 10, gc: 8, ws: 7, fo: 7, wh: 7, ex: 8 };
for (const [nm, mode, pref] of [['吸血坦克流', 'kite', LS], ['纯逃跑流', 'run', RUN], ['原地硬苟流', 'brush', LS], ['正常打法', 'kite', NORM]]) {
  const r = [11, 22, 33].map(sd => play(sd * 3571, mode, pref));
  console.log(nm.padEnd(6, ' ') + ' 存活: ' + r.map(x => x.toFixed(0) + 's').join(' / '));
}
