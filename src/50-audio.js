// ===== BLADE:13 / 音频 =====
// 自写微合成器: 噪声打击层 + 音高层. 无音频文件, 无外部库

let AC, NB, MG, MF, RV, RG, mute = 0, musT = 0, mstep = 0, PN = 0;

function ac() {
  if (!AC) try {
    AC = new (window.AudioContext || window.webkitAudioContext)();
    const n = AC.sampleRate * .5;
    NB = AC.createBuffer(1, n, AC.sampleRate);
    const d = NB.getChannelData(0);
    for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    MG = AC.createGain(); MG.gain.value = .55;
    MF = AC.createBiquadFilter(); MF.type = 'lowpass'; MF.frequency.value = 18000; MF.Q.value = .7;
    MG.connect(MF); MF.connect(AC.destination);
    // 卷积混响: 指数衰减噪声脉冲, 让每一刀都有空间感
    const rl = AC.sampleRate * 1.05, rb = AC.createBuffer(2, rl, AC.sampleRate);
    for (let c = 0; c < 2; c++) { const d = rb.getChannelData(c); for (let i = 0; i < rl; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / rl, 2.8); }
    RV = AC.createConvolver(); RV.buffer = rb;
    RG = AC.createGain(); RG.gain.value = .26;
    MG.connect(RV); RV.connect(RG); RG.connect(MF);
  } catch (e) { }
  return AC;
}
const now = () => AC ? AC.currentTime : 0;
// 声像节点: PN 非零时插一层立体声定位
function pn() {
  if (!PN || !AC.createStereoPanner) return MG;
  const p = AC.createStereoPanner(); p.pan.value = cl(PN, -1, 1); p.connect(MG); return p;
}
// 受击瞬间压低并闷住整个混音 = 耳鸣感
function duck() {
  if (!ac() || mute) return;
  const t = now();
  MG.gain.cancelScheduledValues(t); MG.gain.setValueAtTime(.16, t);
  MG.gain.linearRampToValueAtTime(.55, t + .5);
  MF.frequency.cancelScheduledValues(t); MF.frequency.setValueAtTime(420, t);
  MF.frequency.exponentialRampToValueAtTime(18000, t + .6);
}

// 音高层
function tone(f, dur, ty, sl, vol, at) {
  if (!ac() || mute) return;
  const t = at || now(), o = AC.createOscillator(), g = AC.createGain();
  o.type = ty || 'square'; o.frequency.setValueAtTime(f, t);
  if (sl && sl != 1) o.frequency.exponentialRampToValueAtTime(Math.max(22, f * sl), t + dur);
  g.gain.setValueAtTime(.0001, t);
  g.gain.linearRampToValueAtTime(vol, t + .006);
  g.gain.exponentialRampToValueAtTime(.0001, t + dur);
  o.connect(g); g.connect(pn()); o.start(t); o.stop(t + dur + .02);
}
// 噪声层(带通扫频): 挥砍的破空声与打击的"噗"全靠它
function noiz(dur, f0, f1, vol, q, at) {
  if (!ac() || mute) return;
  const t = at || now(), s = AC.createBufferSource(), b = AC.createBiquadFilter(), g = AC.createGain();
  s.buffer = NB;
  b.type = 'bandpass'; b.Q = q || 1.2;
  b.frequency.setValueAtTime(f0, t);
  b.frequency.exponentialRampToValueAtTime(Math.max(40, f1), t + dur);
  g.gain.setValueAtTime(.0001, t);
  g.gain.linearRampToValueAtTime(vol, t + .005);
  g.gain.exponentialRampToValueAtTime(.0001, t + dur);
  s.connect(b); b.connect(g); g.connect(pn()); s.start(t); s.stop(t + dur + .02);
}

// ---- 音效表 ----
const sSwing = () => { noiz(.12, 2800, 620, .05, 1.1); };
const sHit = (cr, px) => {
  PN = px || 0;
  noiz(.06, cr ? 4600 : 1900, 260, cr ? .15 : .085, 1.7);
  tone(cr ? 320 : 190, .08, 'square', .42, cr ? .09 : .055);
  if (cr) tone(1320, .16, 'sine', 1.8, .05);
  PN = 0;
};
const sKill = () => {                                   // 连杀升调: 越砍越high
  const p = Math.pow(2, Math.min(combo, 15) / 12);
  tone(165 * p, .09, 'triangle', .55, .06);
  noiz(.05, 1500, 200, .05, 1);
};
const sDash = () => { noiz(.22, 280, 3800, .085, .8); tone(430, .15, 'sawtooth', 2.8, .045); };
const sHurt = () => { duck(); noiz(.2, 950, 80, .13, .7); tone(140, .18, 'square', .4, .075); };
const sGem = () => tone(880 + ri(300), .045, 'sine', 1.5, .022);
const sLevel = () => { if (!ac()) return; [0, 4, 7, 12].forEach((n, i) => tone(392 * Math.pow(2, n / 12), .28, 'triangle', 1, .055, now() + i * .05)); };
const sFrenzy = () => {
  tone(110, .55, 'sawtooth', 6.5, .085); noiz(.45, 180, 4200, .06, .6);
  tone(41, 5, 'sawtooth', 1, .035);                    // 超频期间的低频嗡鸣
  tone(1230, 5, 'sine', 1, .012);                      // 义体耳鸣高频
};
const sBoss = () => { tone(62, .85, 'sawtooth', .5, .11); noiz(.65, 320, 55, .09, .5); };

// ---- 程序化配乐: 五声音阶 + 前瞻调度, 强度随时间与狂化爬升 ----
const SCL = [0, 3, 5, 7, 10, 12];
function music() {
  if (!ac() || mute || ST != 1) return;
  const bt = 60 / 150 / 2;
  if (!musT || musT < now()) musT = now() + .08;
  const int = cl(T / 200, 0, 1);
  while (musT < now() + .3) {
    const s = mstep % 16, bar = mstep / 16 | 0;
    if (s % 4 == 0) tone(43.7 * Math.pow(2, SCL[(bar + (s ? 2 : 0)) % 5] / 12), .32, 'sawtooth', 1, .05 + .02 * int, musT);
    if (s == 0 || s == 6 || s == 10) {                 // 底鼓: 整首曲子的骨架
      tone(56, .12, 'sine', .42, .11, musT);
      noiz(.05, 150, 45, .06, 1.3, musT);
    }
    if (s == 4 || s == 12) noiz(.09, 3200, 1400, .05 + .03 * int, 1.8, musT);   // 军鼓
    if (s % 2 == 0) tone(349 * Math.pow(2, SCL[(mstep * 5) % 6] / 12), .1, 'triangle', 1, .016 + .022 * int, musT);
    if (T > 35 && s % 2 == 1) noiz(.035, 7600, 4200, .018 + .022 * int, 2.2, musT);
    if (P.fren > 0) tone(698 * Math.pow(2, SCL[(mstep * 3) % 6] / 12), .06, 'square', 1, .02, musT);
    musT += bt; mstep++;
  }
}
