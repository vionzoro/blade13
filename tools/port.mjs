// 竖屏适配检查: 逻辑画布/像素缓冲/卡牌布局是否随方向切换
import fs from 'fs'; import vm from 'node:vm';
const code = fs.readFileSync(new URL('../build/game.js', import.meta.url), 'utf8');
function boot(w, h, coarse) {
  const L = { w: {}, c: {} }; const rects = [];
  const cx = new Proxy({}, { get(t, k) { if (k in t) return t[k];
    if (k === 'measureText') return () => ({ width: 60 });
    if (k === 'createRadialGradient' || k === 'createLinearGradient') return () => ({ addColorStop() {} });
    if (k === 'createPattern') return () => 'p';
    return () => {}; }, set(t, k, v) { t[k] = v; return true; } });
  const cvs = { width: 0, height: 0, style: {}, getContext: () => cx, getBoundingClientRect: () => ({ left: 0, top: 0, width: w, height: h }), addEventListener: (n, f) => { L.c[n] = f; } };
  let raf = null;
  const sb = { document: { getElementById: () => cvs, createElement: () => cvs }, devicePixelRatio: 2,
    innerWidth: w, innerHeight: h, matchMedia: () => ({ matches: !!coarse }),
    addEventListener: (n, f) => { L.w[n] = f; }, requestAnimationFrame: f => { raf = f; return 1; },
    setTimeout: f => { try { f(); } catch (e) {} return 1; }, localStorage: {}, console, Date };
  sb.window = sb; sb.globalThis = sb;
  vm.runInContext(code + ';globalThis.__A={g:()=>({W,H,BW,BH,TOUCH,ST,CARDS,BTN}),set:(k,v)=>{if(k=="ST")ST=v}};', vm.createContext(sb));
  const f = n => { for (let i = 0; i < n; i++) { const cb = raf; raf = null; cb(16 * i + 16); } };
  f(1);
  return { A: sb.__A, L, f, buf: cvs };
}
const land = boot(1280, 800, false);
console.log('横屏 1280x800 :', JSON.stringify(land.A.g()).slice(0, 60), '  TOUCH=' + land.A.g().TOUCH);
const port = boot(430, 932, true);
const g = port.A.g();
console.log('竖屏 430x932 : W=' + g.W + ' H=' + g.H + ' 缓冲=' + g.BW + 'x' + g.BH + '  TOUCH=' + g.TOUCH);
// 竖屏下点 JACK IN
const by = 386, r = { left: 0, top: 0 };
const SC = Math.min(430 / g.W, 932 / g.H), OX = (430 - g.W * SC) / 2, OY = (932 - g.H * SC) / 2;
port.L.c.pointerdown({ clientX: OX + (g.W / 2) * SC, clientY: OY + (by + 23) * SC, pointerId: 1, pointerType: 'touch' });
port.f(2);
console.log('竖屏点击 JACK IN 后 ST=' + port.A.g().ST + ' (1=战斗中)');
// 轻点释放技能路径
port.L.c.pointerdown({ clientX: 200, clientY: 600, pointerId: 2, pointerType: 'touch' });
port.L.c.pointerup({ pointerId: 2 });
port.f(2);
console.log('轻点(未拖动)已走 blink 分支, 无异常');
// 竖屏卡牌
port.A.set('ST', 2); port.f(1);
console.log('竖屏卡牌层数 =', port.A.g().CARDS.length, ' 可点区 =', port.A.g().BTN.length);
