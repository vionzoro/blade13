// BLADE:13 渲染冒烟: canvas 桩 Proxy 化, 覆盖开场/战斗/选卡/死亡四态与输入路径
import fs from 'fs'; import vm from 'node:vm';
const code = fs.readFileSync(new URL('../build/game.js', import.meta.url), 'utf8');
const calls = {}, texts = [], styles = new Set(), playerStrokeStyles = new Set(), L = { w: {}, c: {} };
let fillStyle = '', strokeStyle = '', path = [], prismTargets = [], hornFills = 0, positiveBlurs = 0;
let ringTarget = null, ringStyles = new Set();
const cx = new Proxy({}, {
  get(t, k) { if (k in t) return t[k];
    if (k === 'measureText') return () => ({ width: 60 });
    if (k === 'createRadialGradient' || k === 'createLinearGradient') return () => ({ addColorStop() {} });
    if (k === 'fillText') return s => { calls[k] = (calls[k] || 0) + 1; texts.push(String(s)); };
    if (k === 'beginPath') return () => { calls[k] = (calls[k] || 0) + 1; path = []; };
    if (k === 'moveTo' || k === 'lineTo') return (x, y) => { calls[k] = (calls[k] || 0) + 1; path.push([x, y]); };
    if (k === 'arc') return (x, y, r, a, b) => { calls[k] = (calls[k] || 0) + 1; path.push(['arc', x, y, r, a, b]); };
    if (k === 'fill') return () => {
      calls[k] = (calls[k] || 0) + 1;
      if (path.length === 3 && path.every(p => typeof p[0] === 'number')) hornFills++;
      if (path.length === 4 && prismTargets.some(([x, y]) => path[0][0] === x && path[0][1] === y - 5 && path[1][0] === x + 4 && path[1][1] === y && path[2][0] === x && path[2][1] === y + 5 && path[3][0] === x - 4 && path[3][1] === y)) styles.add(fillStyle);
    };
    if (k === 'stroke') return () => {
      calls[k] = (calls[k] || 0) + 1;
      if (ringTarget && path.some(p => p[0] === 'arc' && p[1] === ringTarget[0] && p[2] === ringTarget[1])) ringStyles.add(strokeStyle);
    };
    return () => { calls[k] = (calls[k] || 0) + 1; }; },
  set(t, k, v) {
    t[k] = v;
    if (k === 'fillStyle' && typeof v === 'string') fillStyle = v;
    if (k === 'strokeStyle' && typeof v === 'string') { strokeStyle = v; playerStrokeStyles.add(v); }
    if (k === 'shadowBlur' && v > 0) positiveBlurs++;
    return true;
  }
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

run('装载无异常', () => vm.runInContext(code + ';globalThis.__A={g:()=>({ST,P,E,G,CARDS,kills}),set:(k,v)=>{if(k==="ST")ST=v},rain:()=>typeof RAINBOW==="undefined"?[]:RAINBOW,horn:()=>typeof horn==="undefined"?null:horn,creature:()=>typeof creature==="undefined"?null:creature,boss:()=>spawn(2,1),bossFx:p=>{RING=[];E=[];T=0;tier=1;spawnT=bossT=99;P.x=P.y=0;let e;if(!p){bossT=0;wave(0);e=E[E.length-1]}else{spawn(2,1,220,0);e=E[0];e.cast=p==1?0:4.6;e.tel=p==2?.001:0;const x=e.x,y=e.y;step(.01,0,0);return[x,y]}return[e.x,e.y]},restart:()=>reset(20260813),prism:()=>{P.fren=1;return G=(typeof RAINBOW==="undefined"?[]:RAINBOW).map((c,i)=>({x:P.x+i*8,y:P.y,v:1,vx:0,vy:0}))},rainAction:a=>{RING=[];if(a==="blink"){E=[];spawn(0,0,P.x+80,P.y);P.dchg=1;P.dlock=0;P.dash=null;dash()}else{P.rage=P.rmax;P.fren=0;overclock()}return RING.some(r=>r.c===RAINBOW)},bladeAt:t=>{T=t;P.fren=0;blade(0,1,0)}};', C));
const A = sb.__A;
ok(!!raf, '主循环启动');
run('开场帧', () => frames(1));
ok((calls.fillText || 0) > 0, '开场有文字绘制');
ok(texts.includes('BLADE:13 — PRISM BREAK'), '主题标题已绘制');
ok(texts.includes('SEVER THE UNICORN NETWORK.'), '主题目标已绘制');
const fillBeforeHorn = calls.fill || 0;
run('独角路径可绘制', () => A.horn()({ ty: 0, boss: 0, el: 0 }, 12));
ok(typeof A.horn() === 'function', '公共 horn 绘制器存在');
ok((calls.fill || 0) > fillBeforeHorn, 'horn 产生填充路径');
const lodHornBefore = hornFills, lodBlurBefore = positiveBlurs;
run('LOD 独角剪影', () => A.creature()({ ty: 0, boss: 0, el: 0, r: 12, x: 0, y: 0, flash: 0, ph: 0 }, 1));
ok(hornFills > lodHornBefore, 'LOD 仍填充 horn 多边形');
ok(positiveBlurs === lodBlurBefore, 'LOD horn 不启用 shadow blur');
ok(A.rain().length === 7, '共享光谱包含七色');
ok(A.rainAction('blink'), 'BLINK 释放七色棱镜环');
ok(A.rainAction('prism'), 'PRISM BREAK 释放七色棱镜环');
playerStrokeStyles.clear();
for (let i = 0; i < 7; i++) A.bladeAt(i / 12);
ok(A.rain().filter(c => playerStrokeStyles.has(c)).length >= 2, '普通刀光轮换至少两种彩虹色');
for (const [phase, label] of [[0, '入场'], [1, '蓄力预警'], [2, '震地冲击']]) {
  run('BLACK UNICORN ' + label, () => { ringTarget = A.bossFx(phase); ringStyles.clear(); A.set('ST', 2); frames(1); });
  ok(ringStyles.has('#08060f'), label + '冲击波绘制黑色棱镜核');
  ok(A.rain().every(c => ringStyles.has(c)), label + '冲击波绘制七色边缘');
}
ringTarget = null;
run('恢复开场状态', () => { A.restart(); frames(1); });
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
styles.clear();
run('七色棱镜战斗帧', () => { prismTargets = A.prism().map(g => [g.x, g.y]); A.set('ST', 2); frames(2); });
ok(A.rain().every(c => styles.has(c)), '战斗帧绘制完整七色光谱');
A.g().G.length = 0; A.g().P.fren = 0; A.set('ST', 1);
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
