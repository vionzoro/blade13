// 无限点点检测: 每帧狂按突进的机器人, 应该会死
import fs from 'fs';
const code = fs.readFileSync(new URL('../build/logic.js', import.meta.url), 'utf8');
const PREF = { mo: 20, qd: 20, gh: 20, pc: 18, sw: 9, he: 9, ap: 10, bl: 10 };   // 故意专挑突进流
function play(seed, spam) {
  const s = new Function('setTimeout', code +
    ';return{reset,step,juice,dash,take,g:()=>({P,E,T,ST,CARDS,kills}),setST:v=>{ST=v}}')(f => { try { f(); } catch (e) {} });
  s.reset(seed); s.setST(1);
  let dashes = 0, invFrames = 0, ang = 0;
  for (let i = 0; i < 60 * 600; i++) {
    const G = s.g();
    if (G.ST === 2) { let b = G.CARDS[0], bv = -1; for (const c of G.CARDS) { const v = PREF[c.i] || 1; if (v > bv) { bv = v; b = c; } } if (b) s.take(b); else s.setST(1); continue; }
    if (G.ST === 3) break;
    let tx = 0, ty = 0, nd = 1e9;
    for (const e of G.E) { const dx = G.P.x - e.x, dy = G.P.y - e.y, d2 = dx * dx + dy * dy; if (d2 > 90000) continue; const w = 1 / (d2 + 400); tx += dx * w; ty += dy * w; const d = Math.sqrt(d2); if (d < nd) nd = d; }
    let ix = 0, iy = 0; const m = Math.hypot(tx, ty);
    if (m > 0) { tx /= m; ty /= m; ang += .02; const rad = nd < 58 ? 1 : nd > 96 ? -1 : 0, tg = Math.sign(Math.sin(ang)); ix = tx * rad + (-ty) * .95 * tg; iy = ty * rad + tx * .95 * tg; const mm = Math.hypot(ix, iy) || 1; ix /= mm; iy /= mm; }
    if (spam) { const before = s.g().P.dchg; s.dash(); if (s.g().P.dchg < before) dashes++; }
    s.step(1 / 60, ix, iy); s.juice(1 / 60);
    if (s.g().P.inv > 0) invFrames++;
  }
  const g = s.g();
  return { t: g.T, lv: g.P.lv, dashes, invPct: invFrames / (g.T * 60) * 100, dead: g.ST === 3 };
}
for (const sd of [11, 22, 33, 44]) {
  const r = play(sd * 3571, 1);
  console.log('种子' + sd + ' 狂点突进: 存活 ' + r.t.toFixed(0) + 's  Lv' + r.lv + '  实际突进 ' + r.dashes + ' 次(' + (r.dashes / r.t).toFixed(1) + '/秒)  无敌帧占比 ' + r.invPct.toFixed(1) + '%  ' + (r.dead ? '已死亡 ✓' : '未死 ✗'));
}
