// 地形检查: 障碍确实挡人 / 草丛确实断敌 / 出生点不会被墙埋
import fs from 'fs';
const code = fs.readFileSync(new URL('../build/logic.js', import.meta.url), 'utf8');
const api = () => new Function('setTimeout', code +
  ';return{reset,step,juice,spikeCell,spikeW,hsh,g:()=>({P,E,T,ST}),setST:v=>{ST=v},put:(x,y)=>{P.x=x;P.y=y}}')(f => { try { f(); } catch (e) {} });

const s = api(); s.reset(20260813); s.setST(1);
// 1. 密度
let bc = 0, n = 0;
for (let gx = -20; gx < 20; gx++) for (let gy = -20; gy < 20; gy++) { n++; if (s.spikeCell(gx, gy)) bc++; }
console.log('地格取样 ' + n + ' 个: 地刺 ' + (bc / n * 100).toFixed(1) + '%  (实心墙已移除)');

// 4. 地刺: 站上去应该掉血
let sp = null;
for (let gx = 2; gx < 60 && !sp; gx++) for (let gy = -20; gy < 20; gy++) if (s.spikeCell(gx, gy)) { sp = [gx, gy]; break; }
console.log('地刺格 ' + sp + '  当前相位 ' + s.spikeW(sp[0], sp[1]).toFixed(2));
s.put(sp[0] * 64 + 32, sp[1] * 64 + 32);
const hp0 = s.g().P.hp;
for (let i = 0; i < 60 * 6; i++) s.step(1 / 60, 0, 0);
const hp1 = s.g().P.hp;
console.log('在地刺上站 6 秒: 血量 ' + hp0.toFixed(0) + ' -> ' + hp1.toFixed(0) + (hp1 < hp0 ? '  ✓ 会掉血' : '  ✗ 没伤害'));
// 5. 空地站 6 秒不该掉血
const s2 = api(); s2.reset(20260813); s2.setST(1); s2.put(0, 0);
const a0 = s2.g().P.hp;
for (let i = 0; i < 60 * 6; i++) s2.step(1 / 60, 0, 0);
console.log('对照: 出生点站 6 秒 ' + a0.toFixed(0) + ' -> ' + s2.g().P.hp.toFixed(0) + ' (只应被怪打掉)');
