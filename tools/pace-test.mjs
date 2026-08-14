import assert from 'node:assert/strict';
import fs from 'node:fs';

const code = fs.readFileSync(new URL('../build/logic.js', import.meta.url), 'utf8');
const game = new Function('setTimeout', code + `;
return {
  reset,
  state:()=>({enemies:E.length,bossT,tier,boss:E.some(e=>e.boss)}),
  typesAt:(t,n)=>{T=t;let s=new Set;for(let i=0;i<n;i++)s.add(pickTy());return s},
  advance:dt=>{T+=dt;wave(dt)}
}`)(() => 0);

game.reset(20260814);
assert.equal(game.state().enemies, 22, 'opening enemy count');
assert.equal(game.state().bossT, 32, 'first boss timer');
assert.ok(game.typesAt(5, 500).has(1), 'runner unlocked after 4s');
assert.ok(game.typesAt(13, 500).has(2), 'heavy unlocked after 12s');
assert.ok(game.typesAt(20, 500).has(4), 'splitter unlocked after 19s');
assert.ok(game.typesAt(30, 500).has(3), 'caster unlocked after 29s');
assert.ok(game.typesAt(33, 500).has(6), 'nest unlocked after 32s');
assert.ok(game.typesAt(41, 500).has(5), 'exploder unlocked after 40s');
game.reset(20260814); game.advance(22.01);
assert.equal(game.state().tier, 2, 'threat rises at 22s');
game.advance(10.01);
assert.ok(game.state().boss, 'first boss arrives at 32s');
console.log('pace curve matches the 22s threat / 32s boss design');
