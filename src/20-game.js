// ===== BLADE:13 / 战斗与刷怪 =====
// 手感三件套: 打击停顿 / 击退 / 屏幕震动. 割草爽感全靠这三样

const ETY = [
  { hp: 20, sp: 48, dm: 7, r: 12, xp: 1, c: '#f85898' },   // 0 爬行兽
  { hp: 13, sp: 96, dm: 6, r: 10, xp: 1, c: '#f87858' },   // 1 疾行者
  { hp: 78, sp: 33, dm: 18, r: 19, xp: 3, c: '#9878f8' },   // 2 重装兽
  { hp: 30, sp: 40, dm: 11, r: 12, xp: 2, c: '#00b800' },   // 3 咒术体
  { hp: 36, sp: 44, dm: 9, r: 15, xp: 2, c: '#00e8d8' },   // 4 分裂体: 死后一分为二
  { hp: 26, sp: 60, dm: 12, r: 13, xp: 2, c: '#f8b800' },   // 5 引爆体: 死时炸开
  { hp: 95, sp: 19, dm: 8, r: 21, xp: 8, c: '#a848d8' }     // 6 孵化巢: 不杀它, 屏幕永远清不干净
];

function spawn(ty, boss, ax, ay) {
  // 七成刷在你前进方向的锥形里 —— 逃跑等于自投罗网
  const a = rnd() < .55 ? P.md + (rnd() - .5) * 2.7 : rnd() * 6.283;
  const d = 470 + ri(90);
  const b = ETY[ty], k = 1 + Math.pow(T / 64, 1.95) * 2.5;   // 前松后紧的指数压力
  const el = !boss && T > 20 && rnd() < .05 + cl(T / 1300, 0, .13);   // 精英: 品红描边, 更肉更快
  E.push({
    el: el ? 1 : 0,
    x: ax !== undefined ? ax : P.x + Math.cos(a) * d, y: ay !== undefined ? ay : P.y + Math.sin(a) * d, ty, boss: boss ? 1 : 0,
    hp: b.hp * k * (boss ? 7 : el ? 2.4 : 1), mhp: b.hp * k * (boss ? 7 : el ? 2.4 : 1),
    sp: b.sp * (1 + cl(T / 105, 0, 2.7)) * (boss ? .6 : el ? 1.22 : 1), dm: b.dm * (1 + Math.pow(T / 70, 1.6) * 1.2) * (boss ? 1.25 : el ? 1.35 : 1),
    r: b.r * (boss ? 2.6 : el ? 1.2 : 1), flash: 0, kx: 0, ky: 0, atk: 0, bc: 0, bt: 0, sh: 1.6 + rnd(), ph: rnd() * 6.28, cast: 4, tel: 0
  });
  if (boss) { mile = 'BLACK UNICORN'; mileT = 1.6; }
}

function pickTy() {
  const r = rnd();
  return T > 40 && r > .95 ? 6 : T > 50 && r > .85 ? 5 : T > 36 && r > .74 ? 3 : T > 24 && r > .63 ? 4
    : T > 15 && r > .5 ? 2 : T > 6 && r > .3 ? 1 : 0;
}

function wave(dt) {
  // 威胁等级: 每 28 秒跳一级, 跳级瞬间从一个方向压来一波涌潮
  const nt = 1 + (T / 28 | 0);
  if (nt > tier) {
    tier = nt;
    mile = 'THREAT ' + tier; mileT = 1.6; flashF = .55; sBoss();
    const a0 = rnd() * 6.283;
    for (let i = 0; i < tier * tier + 1; i++) {   // 涌潮平方级增长: 前期小骚扰, 后期灭顶
      const a = a0 + (rnd() - .5) * 1.15, d = 470 + ri(130);
      if (E.length < 460) spawn(pickTy(), 0, P.x + Math.cos(a) * d, P.y + Math.sin(a) * d);
    }
  }
  spawnT -= dt;
  if (spawnT <= 0) {
    spawnT = Math.max(.14, .8 - T / 190);
    let n = 2 + (T / 26 | 0);
    for (let i = 0; i < n; i++) if (E.length < 460) spawn(pickTy());
  }
  bossT -= dt;
  if (bossT <= 0) { bossT = 32; spawn(2, 1); shake = 9; sBoss(); const b = E[E.length - 1]; if (b) ring(b.x, b.y, 10, 220, .8, C_RED, 4); }
}

// ---- 攻击: 扇形横扫, 同时命中范围内所有敌人 ----
function swing(mul) {
  const tg = near(P.rng + 30);
  if (!tg) return 0;
  P.face = Math.atan2(tg.y - P.y, tg.x - P.x);
  SL.push({ x: P.x, y: P.y, a: P.face, arc: P.arc, r: P.rng, t: .17, mt: .17 });
  sSwing();
  let hit = 0;
  for (const e of E) {
    const dx = e.x - P.x, dy = e.y - P.y, d = hyp(dx, dy);
    if (d > P.rng + e.r) continue;
    if (Math.abs(AD(Math.atan2(dy, dx), P.face)) > P.arc / 2) continue;
    dmgE(e, (P.dmg * (mul || 1)), dx / d, dy / d);
    hit++;
  }
  if (hit) shake = Math.max(shake, 1.6);
  return hit;
}

function dmgE(e, base, nx, ny, big) {
  const cr = rnd() < P.crit;
  let v = Math.round(base * (cr ? P.cmul : 1) + P.tdmg);
  e.hp -= v; e.flash = .12;
  e.kx += (nx || 0) * (big ? 260 : 118) * (e.boss ? .18 : 1);
  e.ky += (ny || 0) * (big ? 260 : 118) * (e.boss ? .18 : 1);
  DN.push({ x: e.x, y: e.y - e.r, v, cr, t: .62, mt: .62 });
  if (DN.length > 46) DN.shift();
  spray(e.x, e.y, nx || 0, ny || 0, cr ? 7 : 3, cr ? '#fff' : ETY[e.ty].c);
  // 停顿与冲击环只留给暴击/突进斩 —— 稀有才有分量
  if (cr || big) {
    ring(e.x, e.y, e.r * .5, e.r * 2.4, .26, '#fff', 3);
    hs(big ? .06 : .03); punch(big ? .05 : .025);
  }
  kick(e.x, e.y, big ? 7 : cr ? 4 : 1.2);
  sHit(cr, cl((e.x - P.x) / 340, -1, 1));
  if (P.ls && P.hbud > 0) {                              // 吸血走每秒预算, 不再按人头无限叠
    const hl2 = Math.min(v * P.ls, P.hbud);
    P.hp = Math.min(P.mhp, P.hp + hl2); P.hbud -= hl2;
  }
  if (e.hp <= 0) kill(e);
}

function overclock() {                                   // ① 由玩家掐时机释放
  if (P.rage < P.rmax || P.fren > 0) return 0;
  P.rage = 0; P.fren = 5; P.rmax += 3;
  shake = 8; hs(.12); flashF = 1; sFrenzy(); ring(P.x, P.y, 20, 300, .5, C_AMB, 5);
  return 1;
}

function kill(e) {
  e.dead = 1; kills++;
  bump(); sKill(); cut(e);
  decal(e.x, e.y + e.r * .5, e.r * .9, ETY[e.ty].c);
  ring(e.x, e.y, e.r * .8, e.r * (e.boss ? 7 : 3.2), e.boss ? .6 : .28, e.boss ? C_RED : '#fff', e.boss ? 6 : 2.5);
  if (e.boss) { hs(.16); punch(.1); levelUp(); } else if (!(kills % 7)) punch(.02);
  const b = ETY[e.ty];
  for (let i = 0; i < (e.boss ? 14 : 3); i++)
    G.push({ x: e.x + ri(20) - 10, y: e.y + ri(20) - 10, v: b.xp * (e.boss ? 4 : 1), vx: 0, vy: 0 });
  for (let i = 0; i < (e.boss ? 22 : 7); i++) {
    const a = rnd() * 6.283, s = 40 + rnd() * 190;
    FX.push({ x: e.x, y: e.y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, t: .42, c: b.c });
  }
  if (e.ty == 4 && !e.boss) for (let i = 0; i < 2; i++) spawn(0, 0, e.x + ri(30) - 15, e.y + ri(30) - 15);
  if (e.ty == 5) {                                   // 引爆: 波及范围内的一切
    ring(e.x, e.y, 6, 120, .34, '#f8b800', 4); kick(e.x, e.y, 5);
    for (const o of E) if (!o.dead && o.ty != 5 && hyp(o.x - e.x, o.y - e.y) < 100) dmgE(o, 34 + T * .3, (o.x - e.x) / 60, (o.y - e.y) / 60);
    if (hyp(P.x - e.x, P.y - e.y) < 78) hurt(e.dm * 1.5);
  }
  if (P.dkill) P.dchg = Math.min(P.dmc, P.dchg + P.dkill * .12 / P.dmax);
  P.rage = Math.min(P.rmax, P.rage + 1);
  if (P.fren > 0) P.fren = Math.min(8, P.fren + .07);    // ④ 超频中击杀延长时长, 追着连杀跑
  if (e.boss) shake = 12;
}

function near(r) {
  let b = null, bd = r;
  for (const e of E) { const d = hyp(e.x - P.x, e.y - P.y); if (d < bd) { bd = d; b = e; } }
  return b;
}

// ---- 突进斩: 连续闪击最近 N 个敌人 (击杀回冷却 = 滚雪球) ----
function dash() {
  if (P.dchg < 1 || P.dlock > 0 || P.dash) return;
  const c = E.filter(e => hyp(e.x - P.x, e.y - P.y) < 340).sort((a, b) =>
    hyp(a.x - P.x, a.y - P.y) - hyp(b.x - P.x, b.y - P.y)).slice(0, P.dn);
  if (!c.length) return;
  P.dash = { list: c, i: 0, t: 0, sx: P.x, sy: P.y };
  P.dchg -= 1; P.dlock = P.fren > 0 ? .6 : .85;   // 硬锁远长于无敌窗口
  P.inv = .35;                                   // 无敌固定, 不随目标数膨胀
  shake = Math.max(shake, 4); sDash();
  ring(P.x, P.y, 8, 90, .22, C_ICE, 3);
}
function dashTick(dt) {
  const d = P.dash; if (!d) return;
  d.t += dt;
  const seg = .3 / d.list.length, i = Math.min(d.list.length - 1, d.t / seg | 0), k = (d.t % seg) / seg;
  const tgt = d.list[i];
  if (!tgt) { P.dash = null; return; }                 // 护栏: 目标列表异常即安全退出
  const px = i ? d.list[i - 1].x : d.sx, py = i ? d.list[i - 1].y : d.sy;
  P.x = px + (tgt.x - px) * k; P.y = py + (tgt.y - py) * k;
  ghost(P.x, P.y, P.face);
  if (!tgt.struck && k > .5) {
    tgt.struck = 1;
    const dx = tgt.x - px, dy = tgt.y - py, m = hyp(dx, dy) || 1;
    dmgE(tgt, tgt.ty == 5 ? tgt.hp + 1 : P.dmg * 2.3, dx / m, dy / m, 1);   // 撞引爆体=当场引爆
    const ca = Math.atan2(dy, dx);                       // 交叉斩: 穿身而过后刀痕才浮现
    SL.push({ x: tgt.x, y: tgt.y, a: ca + .8, arc: .55, r: 68, t: .24, mt: .24 });
    SL.push({ x: tgt.x, y: tgt.y, a: ca - .8, arc: .55, r: 68, t: .24, mt: .24 });
  }
  if (d.t >= seg * d.list.length) { P.x = tgt.x; P.y = tgt.y; P.dash = null; P.cd = Math.max(P.cd, .42); }
}

// ---- 主更新 ----
function step(dt, ix, iy) {
  T += dt;
  if (P.fren > 0) P.fren -= dt;
  if (P.inv > 0) P.inv -= dt;
  if (P.dlock > 0) P.dlock -= dt;                      // 硬锁: 任何加成都绕不过
  P.dchg = Math.min(P.dmc, P.dchg + dt / P.dmax);
  P.hbud = Math.min(P.mhp * .06, P.hbud + P.mhp * .06 * dt);
  shake *= .86;

  // 移动
  if (P.dash) dashTick(dt);
  else if (ix || iy) {
    const m = hyp(ix, iy) || 1, sp = P.ms * (P.fren > 0 ? 1.3 : 1);
    P.x += ix / m * sp * dt; P.y += iy / m * sp * dt;
    P.still = 0; P.md = Math.atan2(iy, ix);
  } else {
    P.still += dt;
    if (P.regen && P.still > .8) P.hp = Math.min(P.mhp, P.hp + P.regen * dt);
  }

  // 地刺: 踩在伸出的刺上持续掉血, 安全区被切碎
  const sgx = Math.floor(P.x / GS), sgy = Math.floor(P.y / GS);
  if (spikeCell(sgx, sgy) && spikeW(sgx, sgy) > .55) hurt(12 + T * .1);

  // 攻击节奏
  P.cd -= dt * (P.fren > 0 ? 2 : 1);
  if (P.cd <= 0) {
    P.cd = 1 / P.as;
    if (swing()) { P.swing = .12; if (rnd() < P.echo) setTimeout(() => { if (ST == 1) swing(.75); }, 90); }
  }

  wave(dt);

  // 敌人
  for (const e of E) {
    const dx = P.x - e.x, dy = P.y - e.y, d = hyp(dx, dy) || 1;
    if (e.flash > 0) e.flash -= dt;
    e.x += e.kx * dt; e.y += e.ky * dt; e.kx *= .86; e.ky *= .86;
    if (e.ty == 3) {                                   // 远程: 停在外圈射击
      if (d > 230) { e.x += dx / d * e.sp * dt; e.y += dy / d * e.sp * dt; }
      e.atk -= dt;
      if (e.atk <= 0 && d < 340) { e.atk = e.sh; PR.push({ x: e.x, y: e.y, vx: dx / d * 210, vy: dy / d * 210, dm: e.dm, t: 3 }); }
    } else {
      if (e.boss) {                                  // 首领: 蓄力震地
        if (e.tel > 0) {
          e.tel -= dt;
          if (e.tel <= 0) {
            e.cast = 4.6; ring(e.x, e.y, 12, 160, .34, '#fff', 6);
            kick(e.x, e.y, 10); hs(.05); sBoss(); punch(.06);
            if (hyp(P.x - e.x, P.y - e.y) < 150) hurt(e.dm * 1.3);
          }
        } else if ((e.cast -= dt) <= 0) { e.tel = 1.05; ring(e.x, e.y, 24, 150, 1.05, C_RED, 3); }
      }
      if (e.ty == 6) {                               // 孵化巢: 持续产兵, 且会先鼓胀预告
        e.atk -= dt;
        if (e.atk <= 0 && E.length < 440) {
          e.atk = 2.6;
          ring(e.x, e.y, e.r * .6, e.r * 2.6, .4, '#a848d8', 3);
          for (let q = 0; q < 2; q++) spawn(ri(2), 0, e.x + ri(46) - 23, e.y + ri(46) - 23);
        }
      }
      let mul = e.tel > 0 ? .15 : 1;
      if (e.ty == 1) {                               // 疾行者: 蓄一下再暴冲
        if ((e.bc -= dt) <= 0) { e.bc = 2.3 + rnd(); e.bt = .5; }
        if (e.bt > 0) { e.bt -= dt; mul = e.bt > .34 ? .12 : 3.1; }
      }
      e.x += dx / d * e.sp * dt * mul; e.y += dy / d * e.sp * dt * mul;
      if (d < e.r + 13) {
        e.atk -= dt;
        if (e.atk <= 0) { e.atk = .62; hurt(e.dm); if (P.thorn) dmgE(e, P.thorn, dx / d, dy / d); }
      }
    }
  }
  for (let i = E.length - 1; i >= 0; i--) if (E[i].dead) E.splice(i, 1);

  // 投射物
  for (let i = PR.length - 1; i >= 0; i--) {
    const p = PR[i]; p.x += p.vx * dt; p.y += p.vy * dt; p.t -= dt;
    if (hyp(p.x - P.x, p.y - P.y) < 15) { hurt(p.dm); p.t = 0; }
    if (p.t <= 0) PR.splice(i, 1);
  }

  // 经验球
  for (let i = G.length - 1; i >= 0; i--) {
    const g = G[i], dx = P.x - g.x, dy = P.y - g.y, d = hyp(dx, dy) || 1;
    if (d < P.pull) { g.vx += dx / d * 900 * dt; g.vy += dy / d * 900 * dt; }
    g.x += g.vx * dt; g.y += g.vy * dt; g.vx *= .93; g.vy *= .93;
    if (d < 17) { if (g.hl) P.hp = Math.min(P.mhp, P.hp + g.hl); else gain(g.v); sGem(); G.splice(i, 1); }
  }

  // 粒子 / 伤害数字 / 刀光
  for (let i = FX.length - 1; i >= 0; i--) { const f = FX[i]; f.x += f.vx * dt; f.y += f.vy * dt; f.vx *= .9; f.vy *= .9; f.t -= dt; if (f.t <= 0) FX.splice(i, 1); }
  for (let i = DN.length - 1; i >= 0; i--) { DN[i].y -= 34 * dt; DN[i].t -= dt; if (DN[i].t <= 0) DN.splice(i, 1); }
  for (let i = SL.length - 1; i >= 0; i--) { SL[i].t -= dt; if (SL[i].t <= 0) SL.splice(i, 1); }
  if (P.swing > 0) P.swing -= dt;

  cam.x += (P.x - cam.x) * Math.min(1, dt * 8);
  cam.y += (P.y - cam.y) * Math.min(1, dt * 8);
}

function hurt(v) {
  if (P.inv > 0) return;
  P.hp -= v * P.frail; shake = Math.max(shake, 3); P.inv = .42; hurtF = 1; hs(.05); sHurt();
  if (P.hp <= 0) { P.hp = 0; ST = 3; try { best = Math.max(best, T | 0); localStorage.b13 = best; } catch (e) { } }
}
function gain(v) {
  P.xp += v;
  while (P.xp >= P.nxt) { P.xp -= P.nxt; P.lv++; P.nxt = 3 + P.lv * 2 + P.lv * P.lv * .44 | 0; levelUp(); }
}
function levelUp() {
  P.hp = Math.min(P.mhp, P.hp + 2);
  lvlF = 1; sLevel(); ring(P.x, P.y, 14, 210, .45, C_XP, 4);
  CARDS = roll(); cardT = uiT;
  if (CARDS.length) ST = 2;
}
const mmss = s => (s / 60 | 0) + ':' + ('0' + (s % 60 | 0)).slice(-2);
