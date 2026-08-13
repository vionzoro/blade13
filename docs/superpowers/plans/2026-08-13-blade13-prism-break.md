# BLADE:13 — PRISM BREAK Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 js13kGames 2026 的 “Unicorns and Rainbows” 主题融入 BLADE:13，同时保持现有玩法、双端操作、确定性构建和不超过 13,100 字节的目标包体。

**Architecture:** 主题层只读取现有 `kills`、`P.fren`、`e.boss` 和敌人类型，不增加新的玩法状态机。共享七色光谱常量由核心模块提供，战斗模块负责 BLACK UNICORN 提示和爆发粒子，渲染与美术模块负责独角、棱镜碎片、城市导光带和 PRISM BREAK 反馈。

**Tech Stack:** 原生 JavaScript、Canvas 2D、Node.js `vm` 测试、Python 构建脚本、Terser 5.50.0、Roadroller 2.1.0。

## Global Constraints

- js13kGames ZIP 硬上限为 13,312 字节；本功能目标不超过 13,100 字节。
- ZIP 根目录只允许一个 `index.html`。
- 不新增外部资源、外部请求、依赖、伙伴 AI、关卡、资源条或战斗数值变化。
- Desktop 与 Mobile 的输入和布局行为必须保持不变。
- 所有主题表现只读取已有状态，不反向影响敌人或玩家数值。
- 每个任务完成后运行对应测试并提交；发布前必须运行 `npm run verify`。

## File Map

- `src/00-core.js`：提供共享 `RAINBOW` 七色数组。
- `src/20-game.js`：BLACK UNICORN 生成提示、PRISM BREAK 击杀粒子和冲击环。
- `src/40-render.js`：标题、目标、HUD、棱镜碎片、城市光谱、爆发刀光和残影。
- `src/45-art.js`：公共 `horn(e, r)` 独角绘制和爆发刀刃颜色。
- `tools/render-smoke.mjs`：可读构建的主题行为测试。
- `tools/packed-smoke.mjs`：Roadroller 打包版的主题文案冒烟测试。
- `README.md`、`HANDOFF.md`、`提交清单.md`：主题版说明和提交文案。
- `BLADE13-js13k-submission.zip`、`BLADE13-submission-index.html`、`BLADE13-playtest-dev.html`：验证通过后更新的交付物。

---

### Task 1: Establish the theme contract and PRISM BREAK copy

**Files:**
- Modify: `tools/render-smoke.mjs:3-39`
- Modify: `src/00-core.js:8-10`
- Modify: `src/20-game.js:12-25`
- Modify: `src/40-render.js:217-221,306-349`

**Interfaces:**
- Consumes: existing `kills`, `P.rage`, `P.rmax`, `P.fren`, `spawn(ty,boss,ax,ay)`, `mile`, and `mileT`.
- Produces: `const RAINBOW: string[7]`; exact visible strings `BLADE:13 — PRISM BREAK`, `SEVER THE UNICORN NETWORK.`, `PRISM BREAK`, and `BLACK UNICORN`.

- [ ] **Step 1: Write failing copy, palette, and boss-alert tests**

In `tools/render-smoke.mjs`, capture rendered text before the generic proxy fallback:

```js
const calls = {}, texts = [], L = { w: {}, c: {} };
const cx = new Proxy({}, {
  get(t, k) { if (k in t) return t[k];
    if (k === 'measureText') return () => ({ width: 60 });
    if (k === 'createRadialGradient' || k === 'createLinearGradient') return () => ({ addColorStop() {} });
    if (k === 'fillText') return s => { calls[k] = (calls[k] || 0) + 1; texts.push(String(s)); };
    return () => { calls[k] = (calls[k] || 0) + 1; }; },
  set(t, k, v) { t[k] = v; return true; }
});
```

Extend the injected test API without directly referencing a possibly missing lexical binding:

```js
run('装载无异常', () => vm.runInContext(code + ';globalThis.__A={g:()=>({ST,P,E,CARDS,kills}),set:(k,v)=>{if(k==="ST")ST=v},rain:()=>typeof RAINBOW==="undefined"?[]:RAINBOW,boss:()=>spawn(2,1)};', C));
```

Add these assertions after the first opening frame:

```js
ok(texts.includes('BLADE:13 — PRISM BREAK'), '主题标题已绘制');
ok(texts.includes('SEVER THE UNICORN NETWORK.'), '主题目标已绘制');
ok(A.rain().length === 7, '共享光谱包含七色');
```

After entering battle, force the existing meter ready, trigger the existing `F` input, and assert the renamed HUD:

```js
run('触发 PRISM BREAK', () => {
  A.g().P.rage = A.g().P.rmax;
  L.w.keydown({ key: 'f', preventDefault() {} });
  frames(2);
});
ok(texts.some(x => x.indexOf('PRISM BREAK') === 0), '爆发 HUD 使用 PRISM BREAK');
```

Create a boss through the real spawn path and check its warning:

```js
run('BLACK UNICORN 入场', () => { A.boss(); frames(1); });
ok(texts.includes('BLACK UNICORN'), '首领警告已绘制');
```

- [ ] **Step 2: Build and verify the new contract fails**

Run: `python3 build.py`  
Expected: build succeeds.

Run: `node tools/render-smoke.mjs`  
Expected: FAIL for the missing theme title, objective, seven-color palette, PRISM BREAK HUD, and BLACK UNICORN alert.

- [ ] **Step 3: Add the shared seven-color palette**

In `src/00-core.js`, directly after the existing color constants, add one array that reuses existing colors where possible:

```js
const RAINBOW = [C_RED, '#fc9838', C_AMB, C_XP, C_ICE, '#6844fc', C_MAG];
```

No other module defines its own seven-color list.

- [ ] **Step 4: Make boss spawn own the BLACK UNICORN alert**

In `spawn()` in `src/20-game.js`, immediately after `E.push(...)`, add:

```js
  if (boss) { mile = 'BLACK UNICORN'; mileT = 1.6; }
```

This keeps every current and future boss spawn consistent without adding a new boss type.

- [ ] **Step 5: Replace only player-facing Overclock copy**

In `src/40-render.js`, use:

```js
if (ST == 0) center('BLADE:13 — PRISM BREAK', 'SEVER THE UNICORN NETWORK.', '', 'JACK IN');
```

In `center()`, keep the longer title inside portrait layouts without changing the canvas layout:

```js
ctx.font = 'bold ' + (t1.length > 14 ? 32 : 46) + 'px monospace';
```

Replace all three HUD/button labels while retaining the internal `overclock()` function and `oc` action:

```js
ctx.fillText(P.fren > 0 ? 'PRISM BREAK ' + P.fren.toFixed(1) : P.rage >= P.rmax ? 'PRISM BREAK READY' : 'PRISM BREAK', 282, 50);
```

```js
ctx.fillText(TOUCH ? 'PRISM BREAK' : 'PRISM BREAK [F]', ox2 + 58, oy2 + 27);
```

- [ ] **Step 6: Run the focused test and budget check**

Run: `python3 build.py`  
Expected: ZIP is at most 13,312 bytes and the build reports remaining bytes.

Run: `node tools/render-smoke.mjs`  
Expected: all assertions pass, including the four new theme assertions.

- [ ] **Step 7: Commit the theme contract**

```bash
git add src/00-core.js src/20-game.js src/40-render.js tools/render-smoke.mjs
git commit -m "feat: establish prism break theme contract"
```

---

### Task 2: Give every enemy a readable unicorn silhouette

**Files:**
- Modify: `tools/render-smoke.mjs:31-55`
- Modify: `src/45-art.js:152-170,288-299`

**Interfaces:**
- Consumes: `RAINBOW`, enemy fields `ty`, `boss`, `el`, and existing Canvas helpers `glow()` and `noglow()`.
- Produces: `horn(e: Enemy, r: number): void`, called once per rendered enemy before the LOD branch.

- [ ] **Step 1: Write the failing horn-render test**

Add `horn:()=>typeof horn==='undefined'?null:horn` to the injected `__A` API in `tools/render-smoke.mjs`.

After the opening frame initializes `ctx`, add:

```js
const fillBeforeHorn = calls.fill || 0;
run('独角路径可绘制', () => A.horn()({ ty: 0, boss: 0, el: 0 }, 12));
ok(typeof A.horn() === 'function', '公共 horn 绘制器存在');
ok((calls.fill || 0) > fillBeforeHorn, 'horn 产生填充路径');
```

- [ ] **Step 2: Verify the horn test fails**

Run: `python3 build.py`  
Expected: build succeeds.

Run: `node tools/render-smoke.mjs`  
Expected: FAIL because `A.horn()` is not a function.

- [ ] **Step 3: Implement the shared horn renderer**

Insert before `creature()` in `src/45-art.js`:

```js
function horn(e, r) {
  const c = e.boss ? C_BG : RAINBOW[e.ty % 7], l = e.boss ? 1.8 : 1;
  ctx.save(); glow(e.boss ? '#fff' : c, e.boss ? 6 : 3);
  ctx.fillStyle = c; ctx.beginPath();
  ctx.moveTo(r * .12, -r * .45); ctx.lineTo(r * .7, -r * l); ctx.lineTo(r * .46, -r * .25); ctx.fill();
  if (e.boss) { ctx.strokeStyle = '#fff'; ctx.lineWidth = 1; ctx.stroke(); }
  noglow(); ctx.restore();
}
```

In `creature()`, call it after enemy translation and facing have been applied, but before `if (lod)`:

```js
  ctx.translate(0, bob); ctx.scale(fx, 1);
  horn(e, r);
```

Because the call precedes the LOD branch, dense enemy groups retain the horn silhouette. Remove the five-prong crown loop from the existing boss post-pass; retain the boss pulse ring and health bar so the single long black horn remains the defining shape.

- [ ] **Step 4: Run art and render regression tests**

Run: `python3 build.py`  
Expected: ZIP remains at most 13,312 bytes.

Run: `node tools/render-smoke.mjs`  
Expected: horn test and existing four-state render/input tests pass.

Run: `node tools/pose.mjs`  
Expected: existing blade and scarf pose assertions pass.

- [ ] **Step 5: Commit the unicorn silhouette**

```bash
git add src/45-art.js tools/render-smoke.mjs
git commit -m "feat: give prism beasts unicorn silhouettes"
```

---

### Task 3: Render the seven-color combat loop

**Files:**
- Modify: `tools/render-smoke.mjs:3-55`
- Modify: `src/20-game.js:106-127`
- Modify: `src/40-render.js:25-210,306-349`
- Modify: `src/45-art.js:125-149`

**Interfaces:**
- Consumes: `RAINBOW`, `kills`, `P.fren`, `G`, `SL`, `GH`, enemy family colors, and existing particle/ring functions.
- Produces: seven-color experience shards, low-density city spectrum, PRISM BREAK blade/ghost/slash colors, and spectrum kill particles without new gameplay state.

- [ ] **Step 1: Write a failing rendered-spectrum test**

In `tools/render-smoke.mjs`, track color assignments in the proxy setter:

```js
const calls = {}, texts = [], styles = new Set(), L = { w: {}, c: {} };
```

```js
set(t, k, v) {
  t[k] = v;
  if ((k === 'fillStyle' || k === 'strokeStyle') && typeof v === 'string') styles.add(v);
  return true;
}
```

Add this helper to the injected API:

```js
prism:()=>{P.fren=1;G=(typeof RAINBOW==='undefined'?[]:RAINBOW).map((c,i)=>({x:P.x+i*8,y:P.y,v:1,vx:0,vy:0}))}
```

After entering battle, render the controlled prism state and require all seven colors:

```js
run('七色棱镜战斗帧', () => { A.prism(); frames(2); });
ok(A.rain().every(c => styles.has(c)), '战斗帧绘制完整七色光谱');
```

- [ ] **Step 2: Verify the spectrum test fails**

Run: `python3 build.py`  
Expected: build succeeds.

Run: `node tools/render-smoke.mjs`  
Expected: FAIL at `战斗帧绘制完整七色光谱` because experience shards still use `C_XP`.

- [ ] **Step 3: Reuse RAINBOW for city and experience rendering**

In `drawWorld()` in `src/40-render.js`, replace the local five-color `NEON` literal with:

```js
const NEON = RAINBOW;
```

For the rare street guide strip, choose a deterministic non-negative color index without new state:

```js
ctx.fillStyle = RAINBOW[((gx * 3 + gy * 5) & 255) % 7];
```

Change the experience loop to an indexed loop. Health packs remain red; ordinary gems use all seven colors:

```js
for (let i = 0; i < G.length; i++) {
  const g = G[i], gc = RAINBOW[(i + kills) % 7];
  if (!vis(g.x, g.y, 12)) continue;
  ctx.globalAlpha = .9;
  if (g.hl) {
    // keep the existing red cross block unchanged
  } else {
    ctx.fillStyle = gc;
    ctx.beginPath(); ctx.moveTo(g.x, g.y - 5); ctx.lineTo(g.x + 4, g.y); ctx.lineTo(g.x, g.y + 5); ctx.lineTo(g.x - 4, g.y); ctx.fill();
  }
  // keep attraction trail logic, but use gc instead of C_XP for its stroke
}
```

- [ ] **Step 4: Map PRISM BREAK visuals to the existing frenzy state**

In the slash loop in `src/40-render.js`, compute one spectrum color:

```js
const pc = P.fren > 0 ? RAINBOW[(((T * 12 + s.a * 3) | 0) & 255) % 7] : C_ICE;
```

Use `pc` for slash glow and the bright slash stroke while retaining the existing radial alpha gradient. Use the same rule for `GH` dash ghosts and the HUD meter when `P.fren > 0`:

```js
const pc = P.fren > 0 ? RAINBOW[(T * 12 | 0) % 7] : C_ICE;
```

```js
ctx.fillStyle = P.fren > 0 ? RAINBOW[(T * 12 | 0) % 7] : C_AMB;
```

In `blade()` in `src/45-art.js`, define:

```js
const bc = P.fren > 0 ? RAINBOW[(T * 12 | 0) % 7] : C_MAG;
```

Use `bc` in place of `C_MAG` for blade glow and blade-edge strokes in both held and swinging paths.

- [ ] **Step 5: Color PRISM BREAK kills without changing damage or rewards**

In `kill()` in `src/20-game.js`, use the existing `kills` and `P.fren` only:

```js
ring(e.x, e.y, e.r * .8, e.r * (e.boss ? 7 : 3.2), e.boss ? .6 : .28,
  e.boss ? C_RED : P.fren > 0 ? RAINBOW[kills % 7] : '#fff', e.boss ? 6 : 2.5);
```

For the existing seven ordinary kill particles, assign:

```js
c: P.fren > 0 ? RAINBOW[(kills + i) % 7] : b.c
```

Do not modify HP, damage, XP, rage, cooldown, extension duration, spawn rates, or enemy AI.

- [ ] **Step 6: Run focused gameplay, visual, and size tests**

Run: `python3 build.py`  
Expected: ZIP is at most 13,100 bytes. If it is between 13,101 and 13,312 bytes, apply the spec trimming order before proceeding.

Run: `node tools/render-smoke.mjs`  
Expected: full seven-color assertion and all existing render assertions pass.

Run: `node tools/bot-test.mjs`  
Expected: deterministic five-minute simulation passes with existing ranges.

Run: `node tools/cheese.mjs`  
Expected: all four anti-cheese simulations pass because no combat values changed.

- [ ] **Step 7: Commit the rainbow combat loop**

```bash
git add src/20-game.js src/40-render.js src/45-art.js tools/render-smoke.mjs
git commit -m "feat: render rainbow prism combat"
```

---

### Task 4: Verify the packed build and update submission materials

**Files:**
- Modify: `tools/packed-smoke.mjs:3-39`
- Modify: `README.md:1-35`
- Modify: `HANDOFF.md:1-75,130-145,226-260`
- Modify: `提交清单.md:1-45`
- Replace: `BLADE13-js13k-submission.zip`
- Replace: `BLADE13-submission-index.html`
- Replace: `BLADE13-playtest-dev.html`

**Interfaces:**
- Consumes: the final `build/dist/index.html`, `build/BLADE13.zip`, and `build/BLADE13-dev.html` produced by `build.py`.
- Produces: a packed-runtime theme assertion and synchronized local submission artifacts.

- [ ] **Step 1: Add packed-runtime theme assertions**

Make `tools/packed-smoke.mjs` capture `fillText` exactly as Task 1 did for `render-smoke.mjs`:

```js
const calls = {}, texts = [], L = { w: {}, c: {} };
```

```js
if (k === 'fillText') return s => { calls[k] = (calls[k] || 0) + 1; texts.push(String(s)); };
```

After the opening frame, add:

```js
ok(texts.includes('BLADE:13 — PRISM BREAK'), '打包版主题标题已绘制');
ok(texts.includes('SEVER THE UNICORN NETWORK.'), '打包版主题目标已绘制');
```

- [ ] **Step 2: Build and run the packed smoke test**

Run: `python3 build.py`  
Expected: ZIP is at most 13,100 bytes.

Run: `node tools/packed-smoke.mjs`  
Expected: Roadroller self-extracts, starts the loop, renders both theme strings, and completes existing input paths without error.

- [ ] **Step 3: Update public documentation with exact approved copy**

In `README.md`:

- Change the title to `# BLADE:13 — PRISM BREAK`.
- Replace the theme placeholder with `> js13kGames 2026 entry — Theme: Unicorns and Rainbows — Desktop + Mobile`.
- Describe the UNICORN AI, prism beasts, seven-color shards, BLACK UNICORN, and PRISM BREAK before the existing feature list.
- Rename player-facing Overclock references to PRISM BREAK while documenting that its mechanics are unchanged.

In `HANDOFF.md`:

- Replace “主题未公布” and the P0 theme-adaptation items with the approved Unicorns and Rainbows interpretation.
- Rename player-facing OVERCLOCK references to PRISM BREAK.
- Replace the stale byte snapshot with `主题版目标 ≤ 13,100 字节；最终大小以 build.py 最新输出为准`.
- Leave repository publication and final form submission as pending external actions.

In `提交清单.md`, use this exact title and opening description:

```text
BLADE:13 — PRISM BREAK
```

```text
UNICORN, the city’s rainbow-energy AI, has corrupted every machine into a prism beast. Sever the network with three monomolecular blades, collect seven-color shards, and trigger PRISM BREAK before the Black Unicorn ends your run.
```

Replace controls copy with `F to trigger PRISM BREAK`, retain Desktop and Mobile category selections, and remove every “theme pending” warning.

- [ ] **Step 4: Run documentation and release guards**

Run: `node tools/release-guard.mjs`  
Expected: PASS with no blocked names or external-request strings.

Run: `rg -n "Theme note|主题未公布|OVERCLOCK|Overclock" README.md HANDOFF.md 提交清单.md`  
Expected: no matches.

- [ ] **Step 5: Run the full release verification**

Run: `npm run verify`  
Expected: every QA, packed, portrait, performance, seed, and reproducible-build test passes; final ZIP is at most 13,100 bytes.

- [ ] **Step 6: Synchronize the three local deliverables**

Run these commands separately after the successful verification:

```bash
cp build/BLADE13.zip BLADE13-js13k-submission.zip
cp build/dist/index.html BLADE13-submission-index.html
cp build/BLADE13-dev.html BLADE13-playtest-dev.html
```

Verify archive shape and hash:

```bash
unzip -l BLADE13-js13k-submission.zip
shasum -a 256 BLADE13-js13k-submission.zip
```

Expected: exactly one root `index.html`; archive size at most 13,100 bytes; SHA-256 prints successfully.

- [ ] **Step 7: Commit the verified theme release**

```bash
git add tools/packed-smoke.mjs README.md HANDOFF.md 提交清单.md BLADE13-js13k-submission.zip BLADE13-submission-index.html BLADE13-playtest-dev.html
git commit -m "docs: prepare prism break submission"
```

---

### Task 5: Manual visual acceptance and handoff

**Files:**
- No source changes unless an acceptance failure is found.

**Interfaces:**
- Consumes: `BLADE13-playtest-dev.html` and `BLADE13-js13k-submission.zip` from Task 4.
- Produces: evidence that theme, readability, desktop input, mobile input, and the packed artifact meet the approved design.

- [ ] **Step 1: Run the local preview**

From the repository root, run `python3 -m http.server 4181` and open `http://127.0.0.1:4181/BLADE13-playtest-dev.html`. Do not upload or publish anything.

- [ ] **Step 2: Check the first-ten-seconds theme requirement**

Confirm all of the following in a fresh run:

- `BLADE:13 — PRISM BREAK` and `SEVER THE UNICORN NETWORK.` are legible;
- ordinary enemies visibly carry a single luminous horn, including dense LOD groups;
- at least two rainbow elements appear without waiting for PRISM BREAK;
- spikes, hostile bullets, health packs, and experience shards remain distinguishable.

- [ ] **Step 3: Check active combat feedback**

Trigger Blink, level selection, and PRISM BREAK. Confirm blade edges, slash arcs, dash ghosts, particles, and rings use the spectrum without washing out hit warnings.

- [ ] **Step 4: Check BLACK UNICORN**

Wait for the first timed boss. Confirm the warning text, singular long black horn with white edge, off-screen indicator, health bar, and slam telegraph are all readable.

- [ ] **Step 5: Check desktop and mobile layouts**

Desktop: WASD/arrows, Space, F, 1/2/3, and M all work.  
Mobile portrait: drag moves, tap Blinks, PRISM BREAK button appears only when ready, card layout remains usable, and synthesized audio starts after input.

- [ ] **Step 6: Final gate**

If a source or packed-runtime acceptance item fails, first add a focused assertion to `tools/render-smoke.mjs` or `tools/packed-smoke.mjs`. If portrait input or layout fails, first add the reproduction to `tools/port.mjs`. Then make the smallest fix, rerun `npm run verify`, rebuild and resynchronize all three deliverables. Do not create a GitHub repository, upload the ZIP, or submit the competition form without a separate action-time confirmation.
