// BLADE:13 渲染冒烟: canvas 桩 Proxy 化, 覆盖开场/战斗/选卡/死亡四态与输入路径
import fs from 'fs'; import vm from 'node:vm';
const code = fs.readFileSync(new URL('../build/game.js', import.meta.url), 'utf8');
const calls = {}, texts = [], L = { w: {}, c: {} };
const cx = new Proxy({}, {
  get(t, k) { if (k in t) return t[k];
    if (k === 'measureText') return () => ({ width: 60 });
    if (k === 'createRadialGradient' || k === 'createLinearGradient') return () => ({ addColorStop() {} });
    if (k === 'fillText') return s => { calls[k] = (calls[k] || 0) + 1; texts.push(String(s)); };
    return () => { calls[k] = (calls[k] || 0) + 1; }; },
  set(t, k, v) { t[k] = v; return true; }
});
const cvs = { width: 0, height: 0, style: {}, getContext: () => cx,
  getBoundingClientRect: () => ({ left: 0, top: 0, width: 960, height: 600 }),
  addEventListener: (n, f) => { L.c[n] = f; } };
let raf = null;
// LCG: 让冒烟结果可复现, 间歇性 bug 才抓得住
let _st = 20260813;
const _M = Object.create(Math);
_M.random = () => { _st = (_st * 1664525 + 1013904223) >>> 0; return _st / 4294967296; };
const sb = { document: { getElementById: () => cvs, createElement: () => cvs }, devicePixelRatio: 2, innerWidth: 1280, innerHeight: 800,
  addEventListener: (n, f) => { L.w[n] = f; }, requestAnimationFrame: f => { raf = f; return 1; },
  setTimeout: f => { try { f(); } catch (e) {} return 1; }, localStorage: {}, console, Math: _M };
sb.window = sb; sb.globalThis = sb;
const C = vm.createContext(sb);
let pass = 0, fail = 0;
const ok = (c, m) => { c ? (pass++, console.log('  ok  ' + m)) : (fail++, console.log('  FAIL ' + m)); };
const run = (l, f) => { try { f(); ok(1, l); } catch (e) { ok(0, l + ' -> ' + e.message); } };
const frames = n => { let ts = performance.now ? 16 : 16; for (let i = 0; i < n; i++) { const cb = raf; raf = null; cb(ts); ts += 16.7; } };

run('装载无异常', () => vm.runInContext(code + ';globalThis.__A={g:()=>({ST,P,E,CARDS,kills}),set:(k,v)=>{if(k==="ST")ST=v},rain:()=>typeof RAINBOW==="undefined"?[]:RAINBOW,boss:()=>spawn(2,1)};', C));
const A = sb.__A;
ok(!!raf, '主循环启动');
run('开场帧', () => frames(1));
ok((calls.fillText || 0) > 0, '开场有文字绘制');
ok(texts.includes('BLADE:13 — PRISM BREAK'), '主题标题已绘制');
ok(texts.includes('SEVER THE UNICORN NETWORK.'), '主题目标已绘制');
ok(A.rain().length === 7, '共享光谱包含七色');
run('点 BEGIN 进入战斗', () => L.c.pointerdown({ clientX: 640, clientY: 545, pointerId: 1 }));
ok(A.g().ST === 1, '状态=战斗中');
run('触发 PRISM BREAK', () => {
  A.g().P.rage = A.g().P.rmax;
  L.w.keydown({ key: 'f', preventDefault() {} });
  frames(2);
});
ok(texts.some(x => x.indexOf('PRISM BREAK') === 0), '爆发 HUD 使用 PRISM BREAK');
run('BLACK UNICORN 入场', () => { A.boss(); frames(1); });
ok(texts.includes('BLACK UNICORN'), '首领警告已绘制');
run('战斗 1800 帧(=30秒)', () => frames(1800));
ok(A.g().E.length > 0, '敌人已刷出 ' + A.g().E.length + ' 个');
ok(A.g().kills > 0, '已产生击杀 ' + A.g().kills);
run('虚拟摇杆 拖动/抬起', () => {
  L.c.pointerdown({ clientX: 300, clientY: 400, pointerId: 2 });
  L.c.pointermove({ clientX: 360, clientY: 430, pointerId: 2 });
  frames(60);
  L.c.pointerup({ pointerId: 2 });
});
run('空格突进', () => { L.w.keydown({ key: ' ', preventDefault() {} }); frames(20); });
run('WASD 移动', () => { L.w.keydown({ key: 'w', preventDefault() {} }); frames(30); L.w.keyup({ key: 'w' }); });
run('选卡界面 draw + 按键选择', () => {
  A.set('ST', 2); frames(1);
  if (A.g().CARDS.length) L.w.keydown({ key: '1', preventDefault() {} });
  frames(5);
});
run('死亡界面', () => { A.set('ST', 3); frames(2); });
run('重开', () => { L.w.keydown({ key: ' ', preventDefault() {} }); frames(30); });
run('resize', () => L.w.resize());
console.log('\n绘制统计:', Object.entries(calls).sort((a,b)=>b[1]-a[1]).slice(0,5).map(x=>x[0]+'='+x[1]).join(' '));
console.log(`${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
