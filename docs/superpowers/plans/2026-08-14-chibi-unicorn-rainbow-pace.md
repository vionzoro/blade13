# Chibi Unicorn Hero, Rainbow Skills, and Faster Pace Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the three-blade human hero with a standing chibi `🦄`-profile unicorn using one sword, make every combat action visibly rainbow, and accelerate the difficulty curve while keeping the final ZIP at or below 13,100 bytes.

**Architecture:** Keep all runtime work inside the existing eight-module Canvas game. Reuse `P`, `RAINBOW`, `prismRing`, `ghost`, `SL`, the existing `fx` horizontal flip, and the existing attack/dash/frenzy states; replace old player drawing rather than layering a second character system on top. Difficulty changes are constant substitutions in reset, enemy selection, wave scheduling, and boss scheduling, so no new runtime state is introduced.

**Tech Stack:** Vanilla JavaScript, Canvas 2D, Node.js VM smoke tests, Python deterministic build, Terser, Roadroller, ZIP/HTML offline artifact.

## Global Constraints

- Final ZIP target: no more than 13,100 bytes; absolute hard limit: 13,312 bytes.
- No external images, fonts, audio files, network requests, runtime dependencies, or new runtime modules.
- Preserve desktop keyboard, touch controls, audio unlock, upgrades, deterministic RNG, collision radius, hit detection, damage, player health, and player skill timing.
- Preserve the existing yellow jacket, dark coat, magenta scarf, cyber limbs, forward-leaning motion, and one primary reverse-grip sword.
- The head must be an emoji-style side profile: white horse muzzle, one large eye, gold horn, and rainbow rear mane; the whole hero flips with movement direction.
- Normal swing, BLINK, and PRISM BREAK must all use rainbow feedback at increasing intensity; injury and danger warnings remain red.
- Difficulty increases through spawn density, earlier enemy mixes, earlier threat waves, and earlier bosses—not through higher base damage or base health.
- Do not remove inputs, audio unlock, hazards, enemy types, upgrade cards, warnings, performance guards, tests, or core hit feedback to save bytes.

---

## File Map

- `src/45-art.js`: replace the human player drawing with the standing chibi unicorn and reduce all hero blade poses to one blade.
- `src/40-render.js`: make normal slash arcs and player ghosts use the shared rainbow palette outside PRISM BREAK.
- `src/20-game.js`: use prism rings for BLINK/PRISM BREAK and accelerate wave, type, and boss timing.
- `src/00-core.js`: set opening enemy count and first boss timer.
- `tools/pose.mjs`: turn the existing pose report into assertions that the hero draws exactly one blade in idle and swing states.
- `tools/render-smoke.mjs`: assert rainbow action rings and retain the full render-state smoke coverage.
- `tools/pace-test.mjs`: add deterministic timing and type-unlock coverage.
- `tools/qa.sh`: run the new pace test in the standard verification path.
- `build.py`: enforce the 13,100-byte delivery target while still reporting the 13,312-byte competition limit.
- `README.md`, `HANDOFF.md`, `提交清单.md`: replace obsolete human/three-blade and 40-second boss descriptions with the shipped design and final measurements.

---

### Task 1: Standing Chibi Unicorn and One-Sword Contract

**Files:**
- Modify: `tools/pose.mjs`
- Modify: `src/45-art.js:4-151`

**Interfaces:**
- Consumes: global `P`, `T`, `ctx`, `RAINBOW`, `C_AMB`, `C_ICE`, `C_MAG`, `C_CHR`, `glow()`, `noglow()`, `rr()`, and `scarf()`.
- Produces: unchanged `hero(): void` and `blade(a: number, alpha: number, reverse: 0|1): void` interfaces; `hero()` calls `blade()` exactly once per rendered frame.

- [ ] **Step 1: Add failing one-sword assertions to the pose test**

Append a blade-call probe to the VM export in `tools/pose.mjs`:

```js
vm.runInContext(code + `;globalThis.__A={
  set:o=>Object.assign(P,o),
  blades:s=>{P.swing=s;let n=0,o=blade;blade=(...a)=>n++;hero();blade=o;return n},
  g:()=>({P})
};`, vm.createContext(sb));
```

Import strict assertions and check both poses:

```js
import assert from 'node:assert/strict';
assert.equal(A.blades(0), 1, 'idle hero must draw exactly one sword');
assert.equal(A.blades(.06), 1, 'swinging hero must draw exactly one sword');
```

- [ ] **Step 2: Build and prove the new contract fails against the current three-blade hero**

Run: `python3 build.py && node tools/pose.mjs`  
Expected: FAIL because idle calls `blade()` twice and swing calls it more than once.

- [ ] **Step 3: Replace the human hero paths with a compact standing chibi unicorn**

Keep the existing outer transform and horizontal flip:

```js
ctx.save(); ctx.translate(P.x, P.y);
// existing shadow, scarf, fx flip, bob, run lean, jacket, coat and limbs
ctx.save(); ctx.scale(fx, 1);
```

Replace the human face, hair, mouth sword, scar, visor, neural ports, and headband with a side-profile horse head. Use a forward muzzle and rear mane rather than a centered round face:

```js
// gold horn and ear
ctx.fillStyle = inv ? '#fff' : C_AMB;
ctx.beginPath(); ctx.moveTo(-1,-23+bob); ctx.lineTo(8,-39+bob); ctx.lineTo(6,-20+bob); ctx.fill();
ctx.fillStyle = '#fff';
ctx.beginPath(); ctx.moveTo(3,-23+bob); ctx.lineTo(11,-31+bob); ctx.lineTo(10,-20+bob); ctx.fill();

// emoji-style white side-profile head and projecting muzzle
ctx.beginPath();
ctx.moveTo(-8,-24+bob); ctx.quadraticCurveTo(6,-29+bob,12,-20+bob);
ctx.lineTo(10,-11+bob); ctx.quadraticCurveTo(-4,-7+bob,-16,-12+bob);
ctx.quadraticCurveTo(-23,-17+bob,-16,-21+bob); ctx.closePath(); ctx.fill();

// one large side eye
ctx.fillStyle = '#292138'; ctx.beginPath(); ctx.ellipse(-2,-20+bob,2.7,3.4,0,0,6.283); ctx.fill();
ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(-3,-21+bob,.9,0,6.283); ctx.fill();

// four compact rear mane tufts reuse the shared palette
for (let i=0;i<4;i++) {
  ctx.fillStyle=RAINBOW[(i+4)%7];
  ctx.beginPath(); ctx.moveTo(8,-25+i*4+bob); ctx.lineTo(16,-22+i*5+bob); ctx.lineTo(9,-17+i*4+bob); ctx.fill();
}
```

Redraw the lower limbs as compact cyber hind legs ending in white split hooves while preserving `bob`, `run`, and `ls`:

```js
ctx.strokeStyle=chr;ctx.lineWidth=4;
ctx.beginPath();ctx.moveTo(-5,5);ctx.lineTo(-9+ls,14);ctx.moveTo(4,5);ctx.lineTo(8-ls,14);ctx.stroke();
ctx.fillStyle=inv?'#fff':'#ddd';
ctx.fillRect(-12+ls,13,7,3);ctx.fillRect(5-ls,13,7,3);
```

Keep the existing coat, scarf, and jacket path blocks verbatim. Keep two forelegs in the existing arm block: the sword foreleg follows `P.swing`, and the empty foreleg remains extended as a fighting pose. Do not add a second `blade()` call for the empty foreleg.

- [ ] **Step 4: Reduce blade calls to one in both animation branches**

Replace the multi-blade block with:

```js
if (P.swing > 0) {
  const sw = 1 - P.swing / .12;
  blade(P.face - 1.45 + sw * 2.9, 1, 0);
} else blade(P.face + 2.5, 1, 1);
```

Do not change `swing()`, `P.arc`, `P.rng`, `P.as`, or damage calculation in `src/20-game.js`.

- [ ] **Step 5: Rebuild and make the pose test pass**

Run: `python3 build.py && node tools/pose.mjs`  
Expected: PASS; idle and swing each report one blade, while reverse-grip and scarf-direction diagnostics remain valid.

- [ ] **Step 6: Run the focused render and logic suite**

Run: `npm test`  
Expected: all existing QA checks pass before rainbow or pacing changes.

- [ ] **Step 7: Commit the character replacement**

```bash
git add src/45-art.js tools/pose.mjs
git commit -m "feat: replace hero with single-blade chibi unicorn"
```

---

### Task 2: Rainbow Feedback for Every Combat Action

**Files:**
- Modify: `tools/render-smoke.mjs`
- Modify: `src/45-art.js:132-151`
- Modify: `src/40-render.js:140-176`
- Modify: `src/20-game.js:100-105,140-170`

**Interfaces:**
- Consumes: shared `RAINBOW: string[7]`, `prismRing(x,y,r,mr,t,w)`, `RING`, `GH`, `SL`, `P.fren`, and `P.dash`.
- Produces: no new runtime state; normal blades/slashes use a time-indexed palette color, while BLINK and PRISM BREAK enqueue existing full-spectrum prism rings.

- [ ] **Step 1: Add failing rainbow-action assertions**

Extend the `__A` export string in `tools/render-smoke.mjs` with an in-context helper so array identity remains testable inside the VM:

```js
rainAction:a=>{
  RING=[];
  if(a==='blink'){
    E=[];spawn(0,0,P.x+80,P.y);P.dchg=1;P.dlock=0;P.dash=null;dash();
  }else{
    P.rage=P.rmax;P.fren=0;overclock();
  }
  return RING.some(r=>r.c===RAINBOW)
}
```

Add:

```js
ok(A.rainAction('blink'), 'BLINK emits a full-spectrum prism ring');
ok(A.rainAction('prism'), 'PRISM BREAK emits a full-spectrum prism ring');
```

Also capture all assigned string stroke styles in a `Set` at the context setter:

```js
const playerStrokeStyles=new Set();
// inside Proxy set(...)
if(k==='strokeStyle'&&typeof v==='string')playerStrokeStyles.add(v);
```

Render seven normal combat frames after setting `P.fren=0` and `P.swing=.06`, then assert:

```js
playerStrokeStyles.clear();
for(let i=0;i<7;i++){A.g().P.fren=0;A.g().P.swing=.06;frames(1)}
ok(A.rain().filter(c=>playerStrokeStyles.has(c)).length>=2,
  'normal sword and slash rotate through rainbow colors');
```

This prevents the ordinary attack from remaining permanently ice-blue or magenta.

- [ ] **Step 2: Prove the rainbow tests fail**

Run: `python3 build.py && node tools/render-smoke.mjs`  
Expected: FAIL because BLINK uses `C_ICE`, PRISM BREAK uses `C_AMB`, and normal slash arcs are rainbow only during frenzy.

- [ ] **Step 3: Make the single sword and normal slash always use the shared palette**

In `blade()` replace the frenzy conditional with:

```js
const bc = RAINBOW[(T * 12 | 0) % 7];
```

In both player slash render branches in `src/40-render.js`, replace the `P.fren > 0 ? ... : C_ICE` conditional with the existing time/angle rainbow expression:

```js
const pc = RAINBOW[(((T * 12 + s.a * 3) | 0) & 255) % 7];
```

For player ghosts, use:

```js
const pc = RAINBOW[(T * 12 | 0) % 7];
```

Enemy, injury, low-health, and warning colors remain unchanged.

- [ ] **Step 4: Upgrade BLINK and PRISM BREAK activation rings without changing timing**

Replace only the ring calls:

```js
// overclock()
prismRing(P.x, P.y, 20, 300, .5, 5);

// dash()
prismRing(P.x, P.y, 8, 90, .22, 3);
```

Do not alter `P.fren`, `P.rmax`, `P.dchg`, `P.dlock`, `P.inv`, dash target selection, dash damage, or dash segment duration.

- [ ] **Step 5: Rebuild and pass the focused rainbow test**

Run: `python3 build.py && node tools/render-smoke.mjs`  
Expected: all render checks pass, including BLACK UNICORN black-core rings and the new player rainbow checks.

- [ ] **Step 6: Run QA and record size**

Run: `npm test`  
Expected: all checks pass; record the ZIP byte count printed by the build.

- [ ] **Step 7: Commit rainbow action feedback**

```bash
git add src/20-game.js src/40-render.js src/45-art.js tools/render-smoke.mjs
git commit -m "feat: add rainbow feedback to every combat action"
```

---

### Task 3: Faster Waves and Earlier Difficulty Curve

**Files:**
- Create: `tools/pace-test.mjs`
- Modify: `tools/qa.sh`
- Modify: `src/00-core.js:40-44`
- Modify: `src/20-game.js:30-56`

**Interfaces:**
- Consumes: `reset(seed)`, `pickTy()`, `wave(dt)`, `E`, `T`, `tier`, `bossT`, and deterministic `srnd()`/`rnd()`.
- Produces: unchanged gameplay APIs and object shapes; only schedule constants change.

- [ ] **Step 1: Create a deterministic failing pace test**

Create `tools/pace-test.mjs` with:

```js
import assert from 'node:assert/strict';
import fs from 'node:fs';

const code=fs.readFileSync(new URL('../build/logic.js',import.meta.url),'utf8');
const g=new Function('setTimeout',code+`;
return {
  reset,
  state:()=>({enemies:E.length,bossT,tier,boss:E.some(e=>e.boss)}),
  typesAt:(t,n)=>{T=t;let s=new Set;for(let i=0;i<n;i++)s.add(pickTy());return s},
  advance:dt=>{T+=dt;wave(dt)}
}`)(()=>0);

g.reset(20260814);
assert.equal(g.state().enemies,22,'opening enemy count');
assert.equal(g.state().bossT,32,'first boss timer');
assert.ok(g.typesAt(5,500).has(1),'runner unlocked after 4s');
assert.ok(g.typesAt(13,500).has(2),'heavy unlocked after 12s');
assert.ok(g.typesAt(20,500).has(4),'splitter unlocked after 19s');
assert.ok(g.typesAt(30,500).has(3),'caster unlocked after 29s');
assert.ok(g.typesAt(33,500).has(6),'nest unlocked after 32s');
assert.ok(g.typesAt(41,500).has(5),'exploder unlocked after 40s');
g.reset(20260814);g.advance(22.01);
assert.equal(g.state().tier,2,'threat rises at 22s');
g.advance(10.01);
assert.ok(g.state().boss,'first boss arrives at 32s');
console.log('pace curve matches the 22s threat / 32s boss design');
```

Add `node tools/pace-test.mjs` immediately after `node tools/runner-test.mjs` in `tools/qa.sh`.

- [ ] **Step 2: Build and prove the pace test fails on baseline constants**

Run: `python3 build.py && node tools/pace-test.mjs`  
Expected: FAIL on opening enemy count and first boss timer.

- [ ] **Step 3: Apply reset schedule constants**

In `src/00-core.js`:

```js
T = 0; spawnT = .3; bossT = 32; ST = 0; CARDS = []; shake = 0; kills = 0; tier = 1;
for (let i = 0; i < 22; i++) spawn(ri(2));
```

- [ ] **Step 4: Apply earlier enemy type thresholds**

Replace `pickTy()` with the same probability ordering and these thresholds:

```js
return T > 32 && r > .95 ? 6 : T > 40 && r > .85 ? 5 : T > 29 && r > .74 ? 3 : T > 19 && r > .63 ? 4
  : T > 12 && r > .5 ? 2 : T > 4 && r > .3 ? 1 : 0;
```

- [ ] **Step 5: Apply faster wave and boss schedules**

Use:

```js
const nt = 1 + (T / 22 | 0);
spawnT = Math.max(.12, .68 - T / 170);
let n = 2 + (T / 22 | 0);
if (bossT <= 0) { bossT = 28; /* existing spawn/effects remain */ }
```

Keep enemy count caps at 460/440 and keep enemy HP, speed, damage, telegraphs, and player stats unchanged.

- [ ] **Step 6: Pass pace and balance tests**

Run: `python3 build.py && node tools/pace-test.mjs && node tools/bot-test.mjs && node tools/perf.mjs`  
Expected: pace assertions pass; bot still survives more than 25 seconds, reaches at least level 5, and kills more than 30 enemies; performance stays within current object caps.

If the deterministic bot falls below the existing 25-second safety floor, reduce opening enemies from 22 to 20 while retaining every other faster schedule. Update the pace test to expect 20; do not reduce threat, type, spawn, or boss timing.

- [ ] **Step 7: Run full QA and commit**

Run: `npm test`  
Expected: all QA checks pass.

```bash
git add src/00-core.js src/20-game.js tools/pace-test.mjs tools/qa.sh
git commit -m "feat: accelerate threat and boss pacing"
```

---

### Task 4: Enforce and Optimize the 13KB Delivery Budget

**Files:**
- Modify: `build.py`
- Conditionally modify: `src/45-art.js`

**Interfaces:**
- Consumes: deterministic `build/BLADE13.zip` output.
- Produces: build failure when ZIP exceeds the 13,100-byte delivery target; still reports remaining bytes against the 13,312-byte competition limit.

- [ ] **Step 1: Add a failing delivery-target guard if the new build is oversized**

In `build.py` define:

```python
LIMIT = 13312
TARGET = 13100
```

After the existing hard-limit check add:

```python
if z > TARGET:
    print(f'!! 超出交付目标 {TARGET} B')
    sys.exit(1)
```

- [ ] **Step 2: Run the build and inspect the exact byte result**

Run: `python3 build.py`  
Expected: PASS at or below 13,100 bytes. If it passes, skip Steps 3–4 and continue to Step 5.

- [ ] **Step 3: If oversized, remove non-gameplay player ornaments in this order**

First remove the two short leg-joint cold-light strokes and the jacket zipper `fillRect` from `hero()`. Keep the jacket body, magenta seam, limbs, hooves, scarf, face, horn, mane, eye, and sword.

Rebuild after this exact cut:

```bash
python3 build.py
```

Stop trimming as soon as ZIP is at or below 13,100 bytes.

- [ ] **Step 4: If still oversized, remove only the secondary white blade highlight**

Delete the final white `.8`-pixel quadratic stroke in the forward branch of `blade()`. Keep the dark blade core, rainbow edge, reverse-grip blade, hit arc, and all combat feedback. Re-run `python3 build.py` and require no more than 13,100 bytes.

- [ ] **Step 5: Prove deterministic packaging and the single-file archive shape**

Run: `node tools/repro-build.mjs && unzip -l build/BLADE13.zip`  
Expected: two builds have identical size/hash; archive contains exactly one root `index.html`.

- [ ] **Step 6: Commit budget enforcement and any exact visual cuts**

```bash
git add build.py src/45-art.js
git commit -m "build: enforce 13kb delivery budget"
```

If `src/45-art.js` did not require trimming, omit it from `git add`.

---

### Task 5: Documentation, Full Verification, Browser Acceptance, and Deliverables

**Files:**
- Modify: `README.md`
- Modify: `HANDOFF.md`
- Modify: `提交清单.md`
- Update generated artifact: `BLADE13-js13k-submission.zip`
- Update generated artifact: `BLADE13-submission-index.html`
- Sync external deliverables: `/Users/vion/Documents/Codex/2026-08-13/xish/outputs/BLADE13-js13k-submission.zip`
- Sync external deliverables: `/Users/vion/Documents/Codex/2026-08-13/xish/outputs/BLADE13-play.html`
- Sync external deliverables: `/Users/vion/Documents/Codex/2026-08-13/xish/outputs/BLADE13-verification-report.md`

**Interfaces:**
- Consumes: verified `build/BLADE13.zip` and `build/dist/index.html`.
- Produces: submission ZIP, standalone play HTML, verification report, exact size, and SHA-256.

- [ ] **Step 1: Update public descriptions and remove obsolete three-blade/40-second wording**

Document these exact shipped facts:

- standing chibi emoji-profile unicorn hero;
- one reverse-grip monomolecular sword;
- rainbow normal swing, BLINK, and PRISM BREAK;
- 22-second threat cadence and 32-second first BLACK UNICORN;
- final ZIP byte count and 13,100/13,312 limits.

Run:

```bash
rg -n "三刀|three.blade|mouth.*blade|40 秒|40-second|boss.*40" README.md HANDOFF.md 提交清单.md
```

Expected: no obsolete player or boss-timing statements remain.

- [ ] **Step 2: Run the complete automated verification suite**

Run: `npm run verify`  
Expected: QA, terrain, pose, port, performance, seed sweep, reproducible build, packed smoke, and all new tests pass; ZIP is at or below 13,100 bytes.

- [ ] **Step 3: Run desktop browser acceptance**

Open the standalone play HTML through the local game server and verify:

1. start screen and first input;
2. idle and moving hero read as a standing `🦄`-profile chibi unicorn;
3. left/right movement flips the side-profile head correctly;
4. idle and swing never show more than one sword;
5. normal swing is lightly rainbow;
6. BLINK has a full-spectrum ring and rainbow ghosts;
7. PRISM BREAK is the strongest rainbow state;
8. danger and injury remain red;
9. threat increases near 22 seconds and BLACK UNICORN appears near 32 seconds;
10. no browser console error or warning is produced.

- [ ] **Step 4: Run portrait/touch acceptance**

At a phone-like portrait viewport, verify drag movement, tap BLINK, tap PRISM BREAK after charging, upgrade card selection, safe-area layout, and no clipped controls. Record physical-device audio/touch latency as unproven unless tested on a real device.

- [ ] **Step 5: Generate and sync the final artifacts**

Copy the verified bytes, without rebuilding between copy and hash:

```bash
cp build/BLADE13.zip BLADE13-js13k-submission.zip
cp build/dist/index.html BLADE13-submission-index.html
cp build/BLADE13.zip /Users/vion/Documents/Codex/2026-08-13/xish/outputs/BLADE13-js13k-submission.zip
cp build/dist/index.html /Users/vion/Documents/Codex/2026-08-13/xish/outputs/BLADE13-play.html
shasum -a 256 build/BLADE13.zip
```

Write the exact automated results, browser observations, byte count, remaining bytes, SHA-256, and physical-device limitations into `outputs/BLADE13-verification-report.md` using `apply_patch`.

- [ ] **Step 6: Cross-check copied artifacts**

Run:

```bash
cmp build/BLADE13.zip BLADE13-js13k-submission.zip
cmp build/BLADE13.zip /Users/vion/Documents/Codex/2026-08-13/xish/outputs/BLADE13-js13k-submission.zip
cmp build/dist/index.html BLADE13-submission-index.html
cmp build/dist/index.html /Users/vion/Documents/Codex/2026-08-13/xish/outputs/BLADE13-play.html
unzip -t /Users/vion/Documents/Codex/2026-08-13/xish/outputs/BLADE13-js13k-submission.zip
```

Expected: every comparison exits 0; ZIP integrity passes.

- [ ] **Step 7: Commit the final source, docs, and in-repository artifacts**

```bash
git add README.md HANDOFF.md 提交清单.md BLADE13-js13k-submission.zip BLADE13-submission-index.html
git commit -m "docs: publish chibi unicorn submission build"
git status --short
```

Expected: final status is clean; external `outputs/` artifacts are byte-identical but remain outside this repository.

---

## Final Self-Review Checklist

- [ ] Every confirmed design requirement maps to a task: chibi body and emoji-profile head (Task 1), single blade (Task 1), rainbow actions (Task 2), faster difficulty (Task 3), byte target and safe cuts (Task 4), docs/browser/deliverables (Task 5).
- [ ] No task changes player damage, player health, hitbox, skill timing, touch/keyboard input, enemy base damage, or enemy base health.
- [ ] New tests fail on the current baseline before implementation and pass after the relevant task.
- [ ] The final build is deterministic, offline, single-file, at or below 13,100 bytes, and below the 13,312-byte hard limit.
- [ ] Browser acceptance covers desktop, portrait, all three rainbow actions, one-sword silhouette, 22-second threat timing, and 32-second boss timing.
