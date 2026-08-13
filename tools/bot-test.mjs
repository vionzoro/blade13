// BLADE:13 自动机器人: 无人操作跑满 5 分钟, 抓崩溃/失衡/数值爆炸
import fs from 'fs';
const code = fs.readFileSync(new URL('../build/logic.js', import.meta.url), 'utf8');
const mk = () => new Function('setTimeout', code + `
return {reset,step,dash,take,roll,levelUp,gain,
 g:()=>({P,E,G,T,ST,CARDS,kills}),
 setST:v=>{ST=v}, own:()=>own};`)((f)=>{try{f()}catch(e){}});

let pass=0, fail=0;
const ok=(c,m)=>{c?(pass++,console.log('  ok  '+m)):(fail++,console.log('  FAIL '+m))};

// 1. 确定性
{
  const a=mk(), b=mk();
  a.reset(777); b.reset(777);
  for(let i=0;i<600;i++){ a.step(1/60,1,0); b.step(1/60,1,0); }
  ok(a.g().E.length===b.g().E.length && a.g().kills===b.g().kills, '同种子 -> 同战局 ('+a.g().E.length+'敌 '+a.g().kills+'杀)');
}

// 2. 五分钟机器人(会走位+会突进+自动选卡)
{
  const s=mk(); s.reset(20260813); s.setST(1);
  let err=null, lv=0, picks=0, maxE=0, t=0;
  try{
    for(let i=0;i<60*300;i++){
      const G=s.g();
      if(G.ST===2){ const c=G.CARDS[0]; if(c){s.take(c);picks++;} else s.setST(1); continue; }
      if(G.ST===3) break;
      // 简易走位: 远离最近敌人 + 定期突进
      let ix=0,iy=0;
      if(G.E.length){ let n=G.E[0],bd=1e9;
        for(const e of G.E){const d=(e.x-G.P.x)**2+(e.y-G.P.y)**2; if(d<bd){bd=d;n=e}}
        ix=-(n.x-G.P.x); iy=-(n.y-G.P.y);
        const m=Math.hypot(ix,iy)||1; ix/=m; iy/=m;
      }
      if(i%90===0) s.dash();
      s.step(1/60, ix, iy);
      maxE=Math.max(maxE,s.g().E.length); lv=s.g().P.lv; t=s.g().T;
    }
  }catch(e){ err=e }
  ok(!err, '五分钟无异常'+(err?' -> '+err.message:''));
  ok(picks>=3, '升级选卡触发 '+picks+' 次');
  ok(lv>=5, '等级成长到 Lv'+lv);
  ok(maxE>40 && maxE<=470, '同屏敌人峰值 '+maxE+' (上限内)');
  const G=s.g();
  ok(isFinite(G.P.dmg)&&isFinite(G.P.as)&&G.P.as<200, '数值未爆炸 dmg='+G.P.dmg.toFixed(1)+' as='+G.P.as.toFixed(2));
  ok(G.kills>30, '击杀数 '+G.kills+' (割草量达标)');
  ok(t>25, '存活 '+t.toFixed(0)+'s (天真机器人下限)');
}

// 3. 挂机必死(有威胁 = 有游戏)
{
  const s=mk(); s.reset(5); s.setST(1);
  let died=0;
  for(let i=0;i<60*180;i++){ const G=s.g(); if(G.ST===2){s.setST(1);continue;} if(G.ST===3){died=1;break;} s.step(1/60,0,0); }
  ok(died, '完全挂机会死亡(压力曲线成立)');
}

// 4. 卡池不会抽空/不越层
{
  const s=mk(); s.reset(9); s.setST(1);
  for(let n=0;n<200;n++){ const c=s.roll(); if(!c.length) break; s.take(c[0]); }
  const o=s.own(); let bad=0;
  for(const k in o) if(k!=='bo' && o[k]>6) bad++;
  ok(bad===0, '卡池层数上限生效 (已拿 '+Object.keys(o).length+' 种)');
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail?1:0);
