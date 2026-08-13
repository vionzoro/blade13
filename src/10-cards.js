// ===== BLADE:13 / 升级卡池 =====
// k:0=技能(蓝) 1=装备(琥珀)   m=最大层数   f=生效
// k: 0=程序(青) 1=义体(黄) 2=超载(红, 有代价)   req: 需要先持有某卡若干层
const POOL = [
  { i: 'sw', n: 'Swift Edge', d: '+20% attack speed', k: 1, m: 4, f: () => P.as *= 1.2 },
  { i: 'he', n: 'Heavy Edge', d: '+7 damage', k: 1, m: 4, f: () => P.dmg += 7 },
  { i: 'ws', n: 'Wide Sweep', d: '+25 deg arc, +14 reach', k: 1, m: 3, f: () => { P.arc += .44; P.rng += 14; } },
  { i: 'bg', n: 'Bloodgroove', d: '+5% lifesteal', k: 1, m: 3, f: () => P.ls += .05 },
  { i: 'fo', n: 'Focus', d: '+10% crit', k: 1, m: 3, f: () => P.crit += .1 },
  { i: 'wh', n: 'Whetstone', d: '+5 true damage', k: 1, m: 3, f: () => P.tdmg += 5 },
  { i: 'ih', n: 'Ironhide', d: '+30 max hp, heal 30', k: 1, m: 3, f: () => { P.mhp += 30; P.hp = Math.min(P.mhp, P.hp + 30); } },
  { i: 'ff', n: 'Fleetfoot', d: '+14% move speed', k: 1, m: 3, f: () => P.ms *= 1.14 },
  { i: 'ls', n: 'Lodestone', d: '+70% pickup range', k: 1, m: 2, f: () => P.pull *= 1.7 },

  // ---- 超载: 每张都有真实代价, 逼你选一条路 ----
  { i: 'gc', n: 'Glass Chrome', d: '+55% damage BUT -30% max hp', k: 2, m: 2, ic: 'wh',
    f: () => { P.dmg *= 1.55; P.mhp = Math.round(P.mhp * .7); P.hp = Math.min(P.hp, P.mhp); } },
  { i: 'rl', n: 'Redline', d: '+50% attack speed BUT -25% reach', k: 2, m: 2, ic: 'sw',
    f: () => { P.as *= 1.5; P.rng *= .75; } },
  { i: 'vl', n: 'Vampiric Load', d: '+12% lifesteal BUT -20% max hp', k: 2, m: 2, ic: 'bg',
    f: () => { P.ls += .12; P.mhp = Math.round(P.mhp * .8); P.hp = Math.min(P.hp, P.mhp); } },
  { i: 'hl', n: 'Heavy Load', d: '+45% damage BUT +55% recharge time', k: 2, m: 2, ic: 'he',
    f: () => { P.dmg *= 1.45; P.dmax *= 1.55; } },
  { i: 'bw', n: 'Bulwark', d: '+65% max hp BUT -22% attack speed', k: 2, m: 2, ic: 'ih',
    f: () => { const a = Math.round(P.mhp * .65); P.mhp += a; P.hp += a; P.as *= .78; } },
  { i: 'sk', n: 'Siphon Skin', d: 'touching foes burn BUT you take +25%', k: 2, m: 2, ic: 'wr',
    f: () => { P.thorn += 26; P.frail = (P.frail || 1) * 1.25; } },

  // ---- 进阶: 需要先走通一条路才会出现 ----
  { i: 'ap', n: 'Apex Edge', d: '+26 damage', k: 0, m: 2, ic: 'he', req: ['he', 3],
    f: () => P.dmg += 26 },
  { i: 'bl', n: 'Blur', d: '+38% attack speed', k: 0, m: 2, ic: 'sw', req: ['sw', 3],
    f: () => P.as *= 1.38 },
  { i: 'ex', n: 'Execute', d: 'crits deal x3.6 instead of x2.4', k: 0, m: 1, ic: 'fo', req: ['fo', 2],
    f: () => P.cmul = 3.6 },
  { i: 'gh', n: 'Ghostwalk', d: '+1 blink charge', k: 0, m: 1, ic: 'pc', req: ['pc', 2],
    f: () => P.dmc++ },

  { i: 'pc', n: 'Phantom Chain', d: 'dash strikes +2 foes', k: 0, m: 5, f: () => P.dn += 2 },
  { i: 'mo', n: 'Momentum', d: 'kills speed up blink recharge', k: 0, m: 4, f: () => P.dkill += .4 },
  { i: 'st', n: 'Stillness', d: 'stand still 0.8s: regen', k: 0, m: 4, f: () => P.regen += 9 },
  { i: 'ec', n: 'Echo', d: '+22% chance to swing twice', k: 0, m: 4, f: () => P.echo += .22 },
  { i: 'wr', n: 'Wrath', d: 'frenzy fills 25% faster', k: 0, m: 4, f: () => P.rmax = Math.max(4, P.rmax * .75) },
  { i: 'qd', n: 'Quickdraw', d: '-25% dash cooldown', k: 0, m: 3, f: () => P.dmax *= .75 }
];

// 抽三张: 已满层的剔除, 技能与装备混合
const FILL = { i: 'bo', n: 'Blade Oil', d: '+5 damage, heal 25', k: 1, m: 1e9, f: () => { P.dmg += 5; P.hp = Math.min(P.mhp, P.hp + 25); } };
const OFF = ['sw', 'he', 'ws', 'fo', 'wh'];              // 进攻线
function roll() {
  const av = POOL.filter(c => (own[c.i] || 0) < c.m && (!c.req || (own[c.req[0]] || 0) >= c.req[1]));
  const out = [];
  if (P.lv <= 4) {                                     // 开局保底一张进攻卡, 消除抽卡悬崖
    const oi = av.filter(c => OFF.indexOf(c.i) >= 0);
    if (oi.length) { const pick1 = oi[ri(oi.length)]; out.push(pick1); av.splice(av.indexOf(pick1), 1); }
  }
  for (let n = 0; n < 3 && av.length; n++) out.push(av.splice(ri(av.length), 1)[0]);
  while (out.length < 3) out.push(FILL);          // 卡池抽空: 永远有回报, 不空手
  return out;
}
function take(c) {
  own[c.i] = (own[c.i] || 0) + 1;
  c.f();
  ST = 1;
  CARDS = [];
}
