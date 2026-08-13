// ===== BLADE:13 / 角色作画 =====
// 全部 Canvas 路径现画, 零贴图. 剪影优先: 小尺寸下靠轮廓+发光眼睛读懂

// ---- 主角 ----
function hero() {
  const oc = P.fren > 0, inv = P.inv > 0;
  if (oc && P.still < .06) ghost(P.x, P.y, P.face);      // 超频: 每帧残影
  const fx = Math.cos(P.face) < 0 ? -1 : 1;
  const run = P.still < .06, t = T * 11;
  const bob = run ? Math.sin(t) * 1.6 : Math.sin(T * 2.6) * .9;
  const skin = inv ? '#fff' : '#f0c090';
  const jkt = inv ? '#fff' : oc ? '#fcfcfc' : C_AMB;      // 霓虹黄夹克
  const chr = inv ? '#fff' : C_CHR;                       // 义体铬

  ctx.save(); ctx.translate(P.x, P.y);
  ctx.fillStyle = 'rgba(0,0,0,.45)';
  ctx.beginPath(); ctx.ellipse(0, 15, 13, 5, 0, 0, 6.283); ctx.fill();
  if (oc) {
    glow(C_MAG, 12);
    ctx.strokeStyle = C_MAG; ctx.globalAlpha = .6; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(0, 0, 27 + Math.sin(T * 18) * 3, 0, 6.283); ctx.stroke();
    ctx.globalAlpha = 1; noglow();
  }

  scarf();                                               // 拖在身后的围巾
  ctx.save(); ctx.scale(fx, 1);
  ctx.rotate(run ? .13 : .05);                           // 忍者前倾
  const ls = run ? Math.sin(t) * 6.5 : 0;
  ctx.lineCap = 'round';
  // 义体小腿: 沉腰马步, 重心压低
  ctx.strokeStyle = chr; ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(-5, 5); ctx.lineTo(-9 + ls, 15);
  ctx.moveTo(4, 5); ctx.lineTo(8 - ls, 15); ctx.stroke();
  ctx.strokeStyle = C_ICE; ctx.lineWidth = 1;             // 关节冷光
  ctx.beginPath(); ctx.moveTo(-8, 10); ctx.lineTo(-6, 10); ctx.moveTo(6, 10); ctx.lineTo(8, 10); ctx.stroke();
  // 风衣下摆(跑动外翻)
  ctx.fillStyle = inv ? '#fff' : '#2a2438';
  ctx.beginPath();
  ctx.moveTo(-8, -3 + bob); ctx.lineTo(8, -3 + bob);
  ctx.lineTo(10 + (run ? 4 : 0), 13); ctx.lineTo(2, 9); ctx.lineTo(-5, 13);
  ctx.lineTo(-13 - (run ? 5 : 0), 9); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = C_MAG; ctx.lineWidth = 1;             // 品红滚边
  ctx.beginPath(); ctx.moveTo(-8, -3 + bob); ctx.lineTo(-12 - (run ? 6 : 0), 10); ctx.stroke();
  // 夹克
  ctx.fillStyle = jkt; rr(-7, -11 + bob, 13, 9, 2); ctx.fill();
  ctx.fillStyle = '#1a1626'; ctx.fillRect(-1.5, -11 + bob, 3, 9);   // 拉链
  ctx.strokeStyle = C_MAG; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(-7, -7 + bob); ctx.lineTo(6, -7 + bob); ctx.stroke();
  // 铬合金持刀臂
  ctx.strokeStyle = chr; ctx.lineWidth = 3.6;
  if (P.swing > 0) { ctx.beginPath(); ctx.moveTo(2, -8 + bob); ctx.lineTo(11, -3 + bob); ctx.stroke(); }
  else { ctx.beginPath(); ctx.moveTo(2, -8 + bob); ctx.lineTo(-2, 2 + bob); ctx.stroke(); }  // 逆手收刀
  ctx.strokeStyle = chr; ctx.lineWidth = 3;               // 前伸的空手(忍者起手式)
  ctx.beginPath(); ctx.moveTo(-3, -8 + bob); ctx.lineTo(9, -10 + bob); ctx.stroke();
  // 头
  ctx.fillStyle = skin;
  ctx.beginPath(); ctx.arc(0, -16 + bob, 6, 0, 6.283); ctx.fill();
  if (oc) {                                              // 超频起势: 系上头巾, 尾带随风
    ctx.fillStyle = '#1a1626'; ctx.fillRect(-7, -22 + bob, 14, 3.4);
    ctx.strokeStyle = '#1a1626'; ctx.lineWidth = 2.4;
    const bw2 = Math.sin(T * 9) * 4;
    ctx.beginPath(); ctx.moveTo(-6, -21 + bob);
    ctx.quadraticCurveTo(-16, -18 + bob + bw2, -22, -9 + bob); ctx.stroke();
  }
  // 尖刺发
  ctx.fillStyle = inv ? '#fff' : '#e04040';
  for (let i = -2; i < 3; i++) {
    ctx.beginPath();
    ctx.moveTo(i * 2.6 - 1.4, -20 + bob); ctx.lineTo(i * 2.6 + .6, -27 - Math.abs(i) * -1.4 + bob);
    ctx.lineTo(i * 2.6 + 1.8, -20 + bob); ctx.fill();
  }
  // 口中横刀: 第三把刃
  ctx.strokeStyle = '#2a2438'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(-9, -12 + bob); ctx.lineTo(11, -12.6 + bob); ctx.stroke();
  ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.4;
  ctx.beginPath(); ctx.moveTo(-8, -12.8 + bob); ctx.lineTo(11, -13.4 + bob); ctx.stroke();
  ctx.fillStyle = '#8c3b2a'; ctx.fillRect(-11, -13.6 + bob, 4, 3);      // 刀柄缠绳
  // 左眼旧伤
  ctx.strokeStyle = '#a8523c'; ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.moveTo(-6, -21 + bob); ctx.lineTo(-3, -14 + bob); ctx.stroke();
  // 义眼护目条(赛博的招牌)
  glow(C_ICE, 10);
  ctx.fillStyle = C_ICE; ctx.fillRect(-6, -17.6 + bob, 12, 2.4);
  noglow();
  ctx.fillStyle = C_MAG; ctx.fillRect(3, -17.6 + bob, 3, 2.4);       // 右眼品红
  // 颈后神经接口
  ctx.fillStyle = C_ICE;
  ctx.fillRect(-7, -13 + bob, 1.6, 1.6); ctx.fillRect(-7, -10 + bob, 1.6, 1.6);
  ctx.restore();

  // 单分子刃
  if (P.swing > 0) {                                     // 三刀横扫: 主刀 + 副刀 + 口中刀各走一条弧
    const sw = 1 - P.swing / .12;
    const sa = P.face - 1.45 + sw * 2.9;
    for (let i = 1; i < 4; i++) blade(sa - i * .3, .16 * (4 - i), 0);
    if (oc) for (let i = -1; i < 2; i += 2) blade(sa + i * .95, .3, 0);   // 超频: 鬼形分身刀
    blade(sa, 1, 0);
    blade(sa - .52, .8, 0);
    blade(sa + .44, .62, 0);
  } else {                                               // 收势: 双刀逆手贴臂
    blade(P.face + 2.5, 1, 1);
    blade(P.face + 2.02, .72, 1);
  }
  ctx.restore();
}

// 围巾: 永远拖在移动方向的反面, 忍者剪影的灵魂
function scarf() {
  const a = (P.still < .06 ? P.md : P.face) + Math.PI;
  ctx.lineCap = 'round';
  for (let i = 0; i < 2; i++) {
    const w = Math.sin(T * 8.5 + i * 1.5) * .55;
    ctx.strokeStyle = i ? '#c0429c' : C_MAG;
    ctx.lineWidth = 3.4 - i * 1.4;
    ctx.globalAlpha = 1 - i * .4;
    ctx.beginPath();
    ctx.moveTo(0, -9);
    ctx.quadraticCurveTo(Math.cos(a + w * .5) * 15, -11 + Math.sin(a + w * .5) * 9,
      Math.cos(a + w) * 30, -8 + Math.sin(a + w) * 18);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}
function blade(a, al, rev) {
  const bc = P.fren > 0 ? RAINBOW[(T * 12 | 0) % 7] : C_MAG;
  ctx.save(); ctx.rotate(a); ctx.globalAlpha = al;
  ctx.lineCap = 'round';
  if (rev) {                                             // 逆手: 刀身贴前臂向后
    ctx.strokeStyle = '#3a3444'; ctx.lineWidth = 3.4;
    ctx.beginPath(); ctx.moveTo(3, 0); ctx.lineTo(11, 0); ctx.stroke();
    ctx.strokeStyle = '#1e1a2c'; ctx.lineWidth = 3.2;
    ctx.beginPath(); ctx.moveTo(11, 1); ctx.quadraticCurveTo(-4, 4, -22, 10); ctx.stroke();
    glow(bc, 9);
    ctx.strokeStyle = bc; ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.moveTo(11, -.6); ctx.quadraticCurveTo(-4, 2.2, -22, 8); ctx.stroke();
    noglow();
    ctx.globalAlpha = 1; ctx.restore(); return;
  }
  ctx.strokeStyle = '#3a3444'; ctx.lineWidth = 3.6;          // 铬柄
  ctx.beginPath(); ctx.moveTo(3, 0); ctx.lineTo(12, 0); ctx.stroke();
  ctx.fillStyle = C_ICE; ctx.fillRect(11, -1, 2, 2);         // 发射器
  ctx.strokeStyle = '#1e1a2c'; ctx.lineWidth = 3.4;          // 刃芯(暗)
  ctx.beginPath(); ctx.moveTo(14, 1); ctx.quadraticCurveTo(30, -1, 46, -6); ctx.stroke();
  glow(bc, 11);                                           // 单分子刃口
  ctx.strokeStyle = bc; ctx.lineWidth = 1.6;
  ctx.beginPath(); ctx.moveTo(14, -.4); ctx.quadraticCurveTo(30, -2.4, 46, -7.2); ctx.stroke();
  ctx.strokeStyle = '#fff'; ctx.lineWidth = .8; ctx.globalAlpha = al * .9;
  ctx.beginPath(); ctx.moveTo(15, 2); ctx.quadraticCurveTo(30, 0, 45, -4.6); ctx.stroke();
  ctx.globalAlpha = 1; ctx.restore();
}

// ---- 怪物 ----
function horn(e, r) {
  const c = e.boss ? C_BG : RAINBOW[e.ty % 7], l = e.boss ? 1.8 : 1;
  ctx.save(); glow(e.boss ? '#fff' : c, e.boss ? 6 : 3);
  ctx.fillStyle = c; ctx.beginPath();
  ctx.moveTo(r * .12, -r * .45); ctx.lineTo(r * .7, -r * l); ctx.lineTo(r * .46, -r * .25); ctx.fill();
  if (e.boss) { ctx.strokeStyle = '#fff'; ctx.lineWidth = 1; ctx.stroke(); }
  noglow(); ctx.restore();
}
function creature(e, lod) {
  const b = ETY[e.ty], r = e.r, hit = e.flash > 0;
  const col = hit ? '#fff' : b.c;
  const dk = hit ? '#fff' : '#1a1018';
  const fx = e.x > P.x ? -1 : 1;
  const t = T * 6 + e.ph, bob = Math.sin(t) * (e.ty == 3 ? 2.6 : 1.3);

  ctx.save(); ctx.translate(e.x, e.y);
  ctx.fillStyle = 'rgba(0,0,0,.3)';
  ctx.beginPath(); ctx.ellipse(0, r * .92, r * .8, r * .28, 0, 0, 6.283); ctx.fill();
  ctx.translate(0, bob); ctx.scale(fx, 1);
  horn(e, r);

  if (lod) {                                       // 密集时降级: 剪影+眼睛
    ctx.fillStyle = col;
    ctx.beginPath(); ctx.ellipse(0, 0, r, r * .86, 0, 0, 6.283); ctx.fill();
    eyes(r * .34, -r * .24, r * .17, hit);
    ctx.restore(); return;
  }

  if (e.ty == 0) {                                 // 爬行兽: 弓背 + 双角 + 獠牙
    const lg = Math.sin(t) * r * .3;
    ctx.strokeStyle = dk; ctx.lineWidth = r * .26; ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-r * .5, r * .3); ctx.lineTo(-r * .5 + lg, r * .95);
    ctx.moveTo(r * .5, r * .3); ctx.lineTo(r * .5 - lg, r * .95); ctx.stroke();
    ctx.fillStyle = col;
    ctx.beginPath(); ctx.ellipse(0, 0, r, r * .82, -.12, 0, 6.283); ctx.fill();
    ctx.fillStyle = dk;                            // 背脊
    ctx.beginPath(); ctx.moveTo(-r * .7, -r * .5); ctx.lineTo(-r * .2, -r * 1.05); ctx.lineTo(r * .1, -r * .55); ctx.fill();
    ctx.strokeStyle = col; ctx.lineWidth = r * .2;  // 角
    ctx.beginPath();
    ctx.moveTo(r * .35, -r * .55); ctx.quadraticCurveTo(r * .95, -r * 1.1, r * .55, -r * 1.45);
    ctx.moveTo(r * .05, -r * .6); ctx.quadraticCurveTo(r * .5, -r * 1.2, r * .15, -r * 1.5); ctx.stroke();
    eyes(r * .42, -r * .2, r * .16, hit);
    ctx.fillStyle = '#fff';                        // 獠牙
    ctx.beginPath(); ctx.moveTo(r * .55, r * .1); ctx.lineTo(r * .78, r * .42); ctx.lineTo(r * .42, r * .3); ctx.fill();
  } else if (e.ty == 1) {                          // 疾行者: 前倾 + 四足 + 背刺
    const lg = Math.sin(t * 2) * r * .5;
    ctx.strokeStyle = dk; ctx.lineWidth = r * .17; ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-r * .55, r * .1); ctx.lineTo(-r * .8 + lg, r * .95);
    ctx.moveTo(-r * .2, r * .15); ctx.lineTo(-r * .1 - lg, r * .95);
    ctx.moveTo(r * .35, r * .1); ctx.lineTo(r * .5 + lg, r * .95);
    ctx.moveTo(r * .7, r * .05); ctx.lineTo(r * .85 - lg, r * .9); ctx.stroke();
    ctx.fillStyle = col;
    ctx.beginPath(); ctx.ellipse(0, 0, r * 1.25, r * .58, -.3, 0, 6.283); ctx.fill();
    ctx.fillStyle = dk;                            // 背刺
    for (let i = -1; i < 2; i++) {
      ctx.beginPath();
      ctx.moveTo(i * r * .45 - r * .2, -r * .35); ctx.lineTo(i * r * .45 - r * .05, -r * 1.05);
      ctx.lineTo(i * r * .45 + r * .12, -r * .3); ctx.fill();
    }
    ctx.fillStyle = hit ? '#fff' : '#ffd23a';      // 单条裂隙眼
    ctx.beginPath(); ctx.ellipse(r * .82, -r * .28, r * .3, r * .1, -.36, 0, 6.283); ctx.fill();
  } else if (e.ty == 2) {                          // 重装兽: 肩甲 + 獠牙 + 胸核
    const lg = Math.sin(t * .8) * r * .18;
    ctx.strokeStyle = dk; ctx.lineWidth = r * .34; ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-r * .45, r * .5); ctx.lineTo(-r * .45 + lg, r * 1);
    ctx.moveTo(r * .45, r * .5); ctx.lineTo(r * .45 - lg, r * 1); ctx.stroke();
    ctx.fillStyle = col; rr(-r * .82, -r * .75, r * 1.64, r * 1.45, r * .3); ctx.fill();
    ctx.fillStyle = dk;                            // 肩甲
    ctx.beginPath(); ctx.moveTo(-r * .95, -r * .7); ctx.lineTo(r * .95, -r * .7);
    ctx.lineTo(r * .72, -r * 1.02); ctx.lineTo(-r * .72, -r * 1.02); ctx.fill();
    ctx.fillStyle = col;                           // 缩在肩间的小头
    ctx.beginPath(); ctx.arc(r * .12, -r * .5, r * .34, 0, 6.283); ctx.fill();
    eyes(r * .26, -r * .55, r * .13, hit);
    ctx.strokeStyle = '#fff'; ctx.lineWidth = r * .14;   // 獠牙
    ctx.beginPath();
    ctx.moveTo(r * .3, -r * .3); ctx.lineTo(r * .62, -r * .62);
    ctx.moveTo(-r * .05, -r * .3); ctx.lineTo(-r * .3, -r * .6); ctx.stroke();
    ctx.fillStyle = hit ? '#fff' : '#ff7a4a';      // 胸核
    ctx.beginPath(); ctx.arc(0, r * .18, r * .22 + Math.sin(t * 2) * r * .05, 0, 6.283); ctx.fill();
  } else if (e.ty == 3) {                          // 咒术体: 悬浮兜帽 + 环绕法球
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.moveTo(0, -r * 1.15);
    ctx.quadraticCurveTo(r * .95, -r * .5, r * .78, r * .95);
    ctx.quadraticCurveTo(0, r * .5, -r * .78, r * .95);
    ctx.quadraticCurveTo(-r * .95, -r * .5, 0, -r * 1.15); ctx.fill();
    ctx.fillStyle = '#0d0a12';                     // 兜帽内的虚空
    ctx.beginPath(); ctx.ellipse(0, -r * .45, r * .5, r * .42, 0, 0, 6.283); ctx.fill();
    eyes(r * .22, -r * .45, r * .13, hit);
    const oa = T * 3 + e.ph;                        // 法球
    ctx.fillStyle = hit ? '#fff' : '#58f898';
    ctx.beginPath(); ctx.arc(Math.cos(oa) * r * 1.2, Math.sin(oa) * r * .5 + r * .1, r * .2, 0, 6.283); ctx.fill();
  } else if (e.ty == 4) {                          // 分裂体: 中缝明显, 一看就知道会裂
    const w = 1 + Math.sin(t * 1.6) * .09;
    ctx.fillStyle = col;
    ctx.beginPath(); ctx.ellipse(0, 0, r * w, r * .92 / w, 0, 0, 6.283); ctx.fill();
    ctx.strokeStyle = dk; ctx.lineWidth = r * .16;   // 中缝
    ctx.beginPath(); ctx.moveTo(0, -r * .9); ctx.lineTo(0, r * .9); ctx.stroke();
    eyes(r * .5, -r * .22, r * .15, hit);
    eyes(-r * .18, -r * .22, r * .15, hit);
    ctx.fillStyle = dk;                              // 底部黏足
    for (let i = -1; i < 2; i++) { ctx.beginPath(); ctx.arc(i * r * .5, r * .82, r * .18, 0, 6.283); ctx.fill(); }
  } else if (e.ty == 6) {                          // 孵化巢: 分节外壳 + 临产时鼓胀的卵囊
    const pu = cl(1 - e.atk / 2.6, 0, 1);
    ctx.fillStyle = col;
    ctx.beginPath(); ctx.ellipse(0, 0, r * (1 + pu * .12), r * .95, 0, 0, 6.283); ctx.fill();
    ctx.strokeStyle = dk; ctx.lineWidth = r * .13;
    for (let i = -1; i < 2; i++) {
      ctx.beginPath(); ctx.arc(0, 0, r * (.4 + i * .26 + .5), -2.2, -.9); ctx.stroke();
    }
    ctx.fillStyle = hit ? '#fff' : '#f878f8';        // 卵囊: 越接近产出越亮
    ctx.globalAlpha = .45 + pu * .55;
    ctx.beginPath(); ctx.arc(0, r * .1, r * (.3 + pu * .3), 0, 6.283); ctx.fill();
    ctx.globalAlpha = 1;
    eyes(r * .3, -r * .42, r * .12, hit);
    eyes(-r * .34, -r * .42, r * .12, hit);
  } else {                                         // 引爆体: 引信 + 搏动的核
    const pu = .5 + Math.sin(t * 5) * .5;
    ctx.fillStyle = col;
    ctx.beginPath(); ctx.arc(0, 0, r, 0, 6.283); ctx.fill();
    ctx.fillStyle = hit ? '#fff' : '#f83800';        // 核
    ctx.beginPath(); ctx.arc(0, 0, r * (.34 + pu * .26), 0, 6.283); ctx.fill();
    ctx.strokeStyle = dk; ctx.lineWidth = r * .16;   // 引信
    ctx.beginPath(); ctx.moveTo(0, -r); ctx.quadraticCurveTo(r * .5, -r * 1.5, r * .18, -r * 1.7); ctx.stroke();
    ctx.fillStyle = pu > .5 ? '#fcfcfc' : '#f8b800';
    ctx.beginPath(); ctx.arc(r * .18, -r * 1.75, r * .2, 0, 6.283); ctx.fill();
    eyes(r * .42, -r * .3, r * .13, hit);
  }
  if (e.el) {                                      // 精英: 品红脉冲描边
    ctx.strokeStyle = C_MAG; ctx.lineWidth = 1.6;
    ctx.globalAlpha = .55 + Math.sin(T * 8 + e.ph) * .35;
    ctx.beginPath(); ctx.arc(0, 0, r * 1.28, 0, 6.283); ctx.stroke();
    ctx.globalAlpha = 1;
  }
  if (e.bt > 0 && e.bt < .34) {                    // 暴冲拖影
    ctx.strokeStyle = b.c; ctx.globalAlpha = .5; ctx.lineWidth = r * .5;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(r * 1.6, 0); ctx.stroke();
    ctx.globalAlpha = 1;
  }
  ctx.restore();

  if (e.boss) {                                    // 首领: 脉冲环 + 血条
    ctx.save(); ctx.translate(e.x, e.y);
    ctx.strokeStyle = C_RED; ctx.lineWidth = 2; ctx.globalAlpha = .55;
    ctx.beginPath(); ctx.arc(0, 0, r * 1.35 + Math.sin(T * 5) * 2, 0, 6.283); ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#000a'; ctx.fillRect(-34, -r - 22, 68, 6);
    ctx.fillStyle = C_RED; ctx.fillRect(-34, -r - 22, 68 * cl(e.hp / e.mhp, 0, 1), 6);
    ctx.restore();
  }
}
function eyes(dx, y, s, hit) {
  ctx.fillStyle = hit ? '#fff' : '#ffe14a';
  ctx.beginPath(); ctx.arc(dx, y, s, 0, 6.283); ctx.arc(dx - s * 2.6, y, s, 0, 6.283); ctx.fill();
}
