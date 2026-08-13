// 把 Math.random 换成可复现的 LCG, 扫一批种子找间歇性崩溃
import fs from 'fs'; import vm from 'node:vm';
const code = fs.readFileSync(new URL('../build/game.js', import.meta.url), 'utf8');

function run(seed) {
  let st = seed >>> 0 || 1;
  const rand = () => { st = (st * 1664525 + 1013904223) >>> 0; return st / 4294967296; };
  const M = Object.create(Math); M.random = rand;
  const calls = {}, L = { w: {}, c: {} };
  const cx = new Proxy({}, {
    get(t, k) {
      if (k in t) return t[k];
      if (k === 'measureText') return () => ({ width: 60 });
      if (k === 'createRadialGradient' || k === 'createLinearGradient') return () => ({ addColorStop() {} });
      if (k === 'createPattern') return () => 'p';
      return () => { calls[k] = (calls[k] || 0) + 1; };
    }, set(t, k, v) { t[k] = v; return true; }
  });
  const cvs = { width: 0, height: 0, style: {}, getContext: () => cx, getBoundingClientRect: () => ({ left: 0, top: 0, width: 960, height: 600 }), addEventListener: (n, f) => { L.c[n] = f; } };
  let raf = null;
  const sb = {
    document: { getElementById: () => cvs, createElement: () => cvs },
    devicePixelRatio: 2, innerWidth: 1280, innerHeight: 800,
    addEventListener: (n, f) => { L.w[n] = f; }, requestAnimationFrame: f => { raf = f; return 1; },
    setTimeout: f => { try { f(); } catch (e) { throw e; } return 1; }, localStorage: {}, console, Math: M
  };
  sb.window = sb; sb.globalThis = sb;
  vm.runInContext(code, vm.createContext(sb));
  let ts = 16;
  const f = n => { for (let i = 0; i < n; i++) { const cb = raf; raf = null; if (!cb) throw new Error('循环断了'); cb(ts); ts += 16.7; } };
  f(1);
  L.c.pointerdown({ clientX: 640, clientY: 457, pointerId: 1 });
  // 8 分钟高强度对局: 频繁突进 + 摇杆乱走 + 自动选卡
  for (let blk = 0; blk < 30; blk++) {
    f(300);
    L.w.keydown({ key: ' ', preventDefault() {} });
    L.c.pointerdown({ clientX: 200 + (blk * 37) % 600, clientY: 200 + (blk * 53) % 300, pointerId: 9 });
    L.c.pointermove({ clientX: 300 + (blk * 71) % 400, clientY: 250 + (blk * 29) % 200, pointerId: 9 });
    f(30);
    L.c.pointerup({ pointerId: 9 });
    for (const k of ['1', '2', '3', ' ', 'w', 'd']) L.w.keydown({ key: k, preventDefault() {} });
    for (const k of ['w', 'd']) L.w.keyup({ key: k });
    f(30);
  }
  return calls;
}

let bad = 0;
for (let s = 1; s <= 14; s++) {
  try { run(s * 7919); }
  catch (e) { bad++; console.log('种子 ' + (s * 7919) + ' 崩溃: ' + e.message + '\n' + (e.stack || '').split('\n').slice(1, 3).join('\n')); }
}
console.log(bad ? bad + "/14 种子崩溃" : "14 个种子 × 每局约 2.7 分钟高强度对局: 全部无崩溃");
process.exit(bad ? 1 : 0);
