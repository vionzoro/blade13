// 姿态检查: 收势=逆手(刀身在身后), 挥砍=顺手(刀身在身前), 围巾始终背向移动
import fs from 'fs'; import vm from 'node:vm';
const code = fs.readFileSync(new URL('../build/game.js', import.meta.url), 'utf8');
const seg = [];              // 记录刀身/围巾的线段终点
const L = { w: {}, c: {} };
let cur = { fillStyle: '', strokeStyle: '' };
const cx = new Proxy({}, {
  get(t, k) {
    if (k in t) return t[k];
    if (k === 'measureText') return () => ({ width: 60 });
    if (k === 'createRadialGradient' || k === 'createLinearGradient') return () => ({ addColorStop() {} });
    if (k === 'createPattern') return () => 'p';
    if (k === 'quadraticCurveTo') return (a, b, c, d) => seg.push({ s: t.strokeStyle, x: c, y: d });
    return () => {};
  }, set(t, k, v) { t[k] = v; return true; }
});
const cvs = { width: 0, height: 0, style: {}, getContext: () => cx, getBoundingClientRect: () => ({ left: 0, top: 0, width: 960, height: 600 }), addEventListener: (n, f) => { L.c[n] = f; } };
let raf = null;
const sb = { document: { getElementById: () => cvs, createElement: () => cvs }, devicePixelRatio: 1, innerWidth: 960, innerHeight: 600,
  addEventListener: (n, f) => { L.w[n] = f; }, requestAnimationFrame: f => { raf = f; return 1; },
  setTimeout: f => { try { f(); } catch (e) {} return 1; }, localStorage: {}, console };
sb.window = sb; sb.globalThis = sb;
vm.runInContext(code + ';globalThis.__A={set:(o)=>{Object.assign(P,o)},g:()=>({P})};', vm.createContext(sb));
const A = sb.__A;
const f = n => { for (let i = 0; i < n; i++) { const cb = raf; raf = null; cb(16 * i + 16); } };
f(1); L.c.pointerdown({ clientX: 480, clientY: 343, pointerId: 1 }); f(2);

// 收势(不挥砍): 面朝 +x, 刀身应落在身后(x<0)
A.set({ swing: 0, face: 0, still: 1, md: 0 });
seg.length = 0; f(1);
const mag = seg.filter(s => s.s === '#f878f8');
console.log('收势 逆手刀身终点 x =', mag.length ? mag.map(s => s.x.toFixed(0)).join(',') : '(未找到)', '  → 负值=贴臂向后 ✓');

// 挥砍中: 刀身应甩到身前
A.set({ swing: .06, face: 0 });
seg.length = 0; f(1);
const mag2 = seg.filter(s => s.s === '#f878f8');
console.log('挥砍 刀身终点 x =', mag2.length ? mag2.map(s => s.x.toFixed(0)).join(',') : '(未找到)', '  → 正值=甩向身前 ✓');

// 围巾: 向右跑时应飘向左
A.set({ swing: 0, still: 0, md: 0 });
seg.length = 0; f(1);
const sc = seg.filter(s => s.s === '#c0429c' || (s.s === '#f878f8' && s.y < 0));
console.log('围巾段终点 x =', sc.map(s => s.x.toFixed(0)).join(','), '  → 负值=拖在身后 ✓');
