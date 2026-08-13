import assert from 'node:assert/strict';
import fs from 'node:fs';

const code = fs.readFileSync(new URL('../build/logic.js', import.meta.url), 'utf8');
const game = new Function('setTimeout', code + `
  ;return {
    reset,
    step,
    addRunner: () => {
      E = [];
      P.dmg = 0;
      P.rng = 0;
      spawn(1, 0, P.x + 240, P.y);
      return E[0];
    },
    setPlaying: () => { ST = 1; }
  }
`)(() => 0);

game.reset(20260813);
game.setPlaying();
const runner = game.addRunner();

assert.ok(Number.isFinite(runner.bc), 'runner charge timer must start finite');
assert.ok(Number.isFinite(runner.bt), 'runner burst timer must start finite');

let enteredBurst = false;
for (let frame = 0; frame < 60 * 4; frame++) {
  game.step(1 / 60, 0, 0);
  assert.ok(Number.isFinite(runner.bc), `runner charge timer became non-finite at frame ${frame}`);
  assert.ok(Number.isFinite(runner.bt), `runner burst timer became non-finite at frame ${frame}`);
  if (runner.bt > 0) enteredBurst = true;
}

assert.ok(enteredBurst, 'runner must enter its telegraphed burst within four seconds');
console.log('runner timers stay finite and the runner enters a burst');
