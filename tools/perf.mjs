// 绘制负载对比: 统计满屏时每帧真实绘制调用
import fs from 'fs'; import vm from 'node:vm';
const code = fs.readFileSync(new URL('../build/game.js', import.meta.url), 'utf8');
function run(label) {
  const calls = {}; const L = { w: {}, c: {} };
  const cx = new Proxy({}, { get(t, k) { if (k in t) return t[k];
    if (k === 'measureText') return () => ({ width: 60 });
    if (k === 'createRadialGradient' || k === 'createLinearGradient') return () => ({ addColorStop() {} });
    if (k === 'createPattern') return () => 'p';
    return () => { calls[k] = (calls[k] || 0) + 1; }; }, set(t, k, v) { t[k] = v; return true; } });
  const cvs = { width: 0, height: 0, style: {}, getContext: () => cx, getBoundingClientRect: () => ({ left: 0, top: 0, width: 1280, height: 800 }), addEventListener: (n, f) => { L.c[n] = f; } };
  let raf = null; let _st = 7;
  const M = Object.create(Math); M.random = () => { _st = (_st * 1664525 + 1013904223) >>> 0; return _st / 4294967296; };
  const sb = { document: { getElementById: () => cvs, createElement: () => cvs }, devicePixelRatio: 2, innerWidth: 1280, innerHeight: 800,
    addEventListener: (n, f) => { L.w[n] = f; }, requestAnimationFrame: f => { raf = f; return 1; },
    setTimeout: f => { try { f(); } catch (e) {} return 1; }, localStorage: {}, console, Math: M, Date };
  sb.window = sb; sb.globalThis = sb;
  vm.runInContext(code + ';globalThis.__A={g:()=>({E:E.length,ST,T})};', vm.createContext(sb));
  const A = sb.__A;
  const f = n => { for (let i = 0; i < n; i++) { const cb = raf; raf = null; if (!cb) return; cb(16.7 * i + 17); } };
  f(1); L.c.pointerdown({ clientX: 640, clientY: 545, pointerId: 1 }); f(1);
  f(60 * 70);                                    // 跑到 70 秒, 场上怪很多
  const before = { ...calls };
  f(60);                                          // 再跑 1 秒统计
  const g = A.g();
  const per = k => (((calls[k] || 0) - (before[k] || 0)) / 60) | 0;
  console.log(label + ': 同屏 ' + g.E + ' 只  每帧 fillRect=' + per('fillRect') + ' beginPath=' + per('beginPath') + ' stroke=' + per('stroke') + ' fill=' + per('fill') + ' drawImage=' + per('drawImage'));
}
run('当前(带剔除)');
