"use strict";
/* ===== HUB ===== */
function upcomingShifts(n){ // today's assignment and the next assigned days within ~5 weeks, at most n
  const out=[];
  for(let i=0;i<35&&out.length<n;i++){ const dt=new Date(TODAY.getFullYear(),TODAY.getMonth(),TODAY.getDate()+i),
    iso=isoOf(dt.getFullYear(),dt.getMonth(),dt.getDate()), s=assignedShift(iso);
    if(s) out.push({iso,s,i,dt}); }
  return out;
}
function histData(){ const out=[]; for(let i=5;i>=0;i--){ let mm=TODAY.getMonth()-i, yy=TODAY.getFullYear(); while(mm<0){mm+=12;yy--;} out.push({y:yy,m:mm,total:monthTotals(yy,mm).grand}); } return out; } // last 6 real months, oldest→current
const hubW=()=>(document.getElementById('screen')?.clientWidth||innerWidth); // width the HUB lays out in
function dtitle(text,i,maxW){ return dotGlyphSVG(text,1.4,2,14,330+i*45,maxW)||`<span class="dfbt">${esc(text)}</span>`; } // card title in the dot font (assembles glyph by glyph on entrance), plain text when a glyph is missing
// dot-font number the count-up can repaint: data-count is the final value, data-pre / data-suf the text around it, data-now the value on screen; plain text when a glyph is missing
function dnum(v,k,pitch,o={}){ const r=Math.round(v), pre=o.pre||'', suf=o.suf||'', f=pre+fmtN(r)+suf, n=dotNorm(f),
  at=`data-k="${k}" data-count="${r}" data-now="${r}"${pre?` data-pre="${pre}"`:''}${suf?` data-suf="${suf}"`:''}`;
  return dotCovers(n) ? `<span class="dnum" ${at} data-pitch="${pitch}" role="img" aria-label="${esc(o.aria||f)}">${dotNumSVG(n,pitch,n)}</span>`
    : `<span class="${o.fb||'dfb'}" ${at}>${esc(f)}</span>`; }
function histCard(){ const H=histData(); if(H.every(h=>h.total<=0)&&!(yearTotals(TODAY.getFullYear()).grand>0)) return ''; // hide until there is any history to show (or this year has pay: the year row stays reachable)
  const max=Math.max(1,...H.map(h=>h.total)), sel=H.length-1,
    bars=H.map((h,i)=>`<button class="histbar${i===sel?' on':''}" data-action="histBar:${i}" aria-label="${cap(monthName(h.m,true))} ${h.y}: ${fmtN(h.total)} ${cur()}">
      <span class="hbtrack"><span class="hbfill" style="height:${Math.max(4,Math.round(h.total/max*100))}%;--j:${i}"><span class="htip" aria-hidden="true">${fmtN(h.total)}</span></span></span>
      <span class="hblbl">${cap(monthName(h.m,false)).slice(0,3)}</span></button>`).join('');
  return `<div class="card hchart in" style="--i:7">
    <div class="hhdr">${dtitle(tr('Last 6 months'),7,hubW()-72-118)}<button class="glass press hpill" data-action="openYear"><span>${tr('Total {y}',{y:TODAY.getFullYear()})}</span><i>${I.chevron}</i></button></div>
    <div class="histchart">${bars}</div></div>`; }
function histSelect(i){ if(!histData()[i]) return; // surgical: the tapped bar takes the tooltip, no hub re-render
  document.querySelectorAll('.histbar').forEach((b,idx)=>{ b.classList.toggle('on', idx===i); b.classList.toggle('pop', idx===i); }); hap(6); }
const BASE_COLOR='var(--g0)', OT_COLOR='var(--g1)', PREM_COLOR='var(--g2)', EXTRA_COLOR='var(--g3)'; // pay groups, in greys: one per group in the composition bar, its key rows and the breakdown rows
// pay groups [label, amount, color] — only the ones this workplace uses; the composition bar and its key rows (the summary) share them. Any totals object (month or year).
function payGroups(t){ const S=state.salary, g=[[tr('Base pay'),t.base,BASE_COLOR]];
  if(S.overtime.on) g.push([tr('overtime'),t.otTotal,OT_COLOR]);
  if(S.night.on||S.weekend.on||S.holiday.on) g.push([tr('premiums'),t.night+t.weekend+t.holiday,PREM_COLOR]);
  if(t.additions>0) g.push([tr('Extra earnings'),t.additions,EXTRA_COLOR]);
  return g; }
function payComp(t){ const g=payGroups(t), dot=c=>`<i class="kdot" style="background:${c}"></i>`; // [composition bar, key rows] shared by the year sheet
  return [g.filter(x=>x[1]>0).map(x=>`<i style="width:${t.grand>0?x[1]/t.grand*100:0}%;background:${x[2]}"></i>`).join('')||'<i style="width:100%;background:var(--fill)"></i>',
    g.map(x=>`<div class="sumrow"><span class="sl">${dot(x[2])}${cap(x[0])}</span><span class="srv num">${fmtN(x[1])}</span></div>`).join('')]; }
function weekCard(){ const ti=isoOf(TODAY.getFullYear(),TODAY.getMonth(),TODAY.getDate()), days=weekDaysOf(ti), wk=weekTotalOf(ti), // always the real current week, whatever month the hero shows
    nf=new Intl.DateTimeFormat(state.lang||'en',{weekday:'narrow'}), lf=new Intl.DateTimeFormat(state.lang||'en',{weekday:'long'}); let n=0,hrs=0;
  const tiles=days.map((iso,j)=>{ const [y,m,d]=iso.split('-').map(Number), dt=new Date(y,m-1,d), s=assignedShift(iso), today=iso===ti;
    if(s&&!s.vac){ n++; hrs+=paidHours(s); }
    return `<button class="wday${s?npc(s.color):' off'}${today?' today':''}" data-action="gotoDay:${iso}" style="--j:${j}${s?`;background:${s.color};color:${onColor(s.color)}`:''}" aria-label="${lf.format(dt)} ${dayNum(d)}, ${s?shiftLabel(s):tr('Off')}${today?', '+tr('Today'):''}"><span class="wl">${nf.format(dt)}</span><span class="wn">${d}</span><i class="wi">${s?I[s.icon]:''}</i></button>`; }).join('');
  return `<div class="card hweek in" style="--i:5">
    <div class="hhdr">${dtitle(tr('This week'),5,hubW()-68-120)}<span class="hrange">${weekRangeLabel(days[0],days[6])}</span></div>
    <div class="wdays">${tiles}</div>
    <div class="wfoot"><span class="wtot">${dnum(wk,'wk',Math.min(1.8,(hubW()-116)/(dotLayout(dotNorm('≈ '+fmtN(Math.round(wk)))).cols+.2)),{pre:'≈ ',aria:'≈ '+fmtN(wk)+' '+cur()})}<span class="wcur">${cur()}</span></span>
      <span class="wmeta"><span>${tr(n===1?'{n} work day':'{n} work days',{n,de:deOf(n)})} · ${tr('{h} H',{h:fmtN(hrs)})}</span><button class="glass press hcirc" data-action="tab:calendar" aria-label="${tr('Calendar')}">${I.chevron}</button></span></div></div>`; }
function screenHub(){
  const t=monthTotals(state.viewY,state.viewM), S=state.salary, y=state.viewY, m=state.viewM, cs=cur();
  const payH = t.paidH+t.vacH+t.otDayH+t.otNightH;          // paid hours: worked + paid leave + overtime
  const effHourly = payH>0 ? (t.grand-t.additions)/payH : 0; // separate bonuses (13th salary…) stay out of the hourly rate
  const bonusPct  = t.grand>0 ? Math.round((t.night+t.weekend+t.holiday)/t.grand*100) : 0; // premiums' share of the month (overtime is its own group)
  const noShifts=Object.keys(state.assignments).length===0; // brand-new user: guide them to the calendar
  const needBackup=!noShifts&&!(Date.now()-state.lastBackupAt<30*864e5); // data only on this phone: nudge when never backed up or >30 days ago
  const pm=m?m-1:11, py=m?y:y-1, pt=monthTotals(py,pm).grand, diff=t.grand-pt; // vs the month before
  const hp=Math.min(4.1,Math.floor((hubW()-40-(cs.length*14+10))/Math.max(1,dotLayout(dotNorm(fmtN(t.grand))).cols)*100)/100); // the pay always fits the width, 1.234.567 at 320 included
  const chev=`<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>`;
  const ups=upcomingShifts(3), n=ups.length;
  const stack=n?`<div class="hstw in" style="--i:4"><div class="hstack" role="group" aria-label="${tr('Upcoming shifts')}"><div class="hs3d">${ups.map((u,k)=>{ const s=u.s, x={iso:u.iso,y:u.dt.getFullYear(),m:u.dt.getMonth(),d:u.dt.getDate()},
        b=dayBreakdown(x,baseHourly(x.y,x.m),monthTotals(x.y,x.m).cap), when=u.i===0?tr('Today'):u.i===1?tr('Tomorrow'):`${dowShort(u.dt.getDay())} ${dayNum(x.d)} ${monthName(x.m,true)}`;
      return `<button class="hcard" data-p="${k}" data-action="gotoDay:${u.iso}"${k?' tabindex="-1" aria-hidden="true"':''}><span class="hci${npc(s.color)}" style="background:${s.color};color:${onColor(s.color)}">${I[s.icon]}</span>
        <span class="hct"><b>${when} · ${shiftLabel(s)}</b>${s.vac?'':`<span class="num">${timeRange(s)}<i class="hh"> · ${tr('{h} H',{h:fmtN(paidHours(s))})}</i></span>`}</span>
        <span class="hca"><b class="num">≈ ${fmtN(b.total)}</b><span>${cs}</span></span></button>`; }).join('')}</div></div>
    ${n>1?`<button class="srbtn" data-action="stackNext">${tr('Show next shift')}</button><div class="hdots" aria-hidden="true">${ups.map((_,k)=>`<i${k?'':' class="on"'}></i>`).join('')}<b style="--hx:${-(n-1)*8.5}px"></b></div>`:''}</div>`:'';
  const wd=workingDaysInMonth(y,m), tile=(l,v,u)=>`<div class="htile"><div class="tl">${l}</div><div class="tv">${v}${u?`<span class="tu">${u}</span>`:''}</div></div>`;
  const rows=[[tr('Base pay'),tr('from net salary'),BASE_COLOR,t.base,tr('{h} H paid',{h:t.paidH.toFixed(0)})]];
  if(S.overtime.on){
    rows.push([tr('Day overtime'),`+${S.overtime.pct}%`,OT_COLOR,t.otDay,tr('{h} H',{h:fmtN(t.otDayH)})]);
    rows.push([tr('Night overtime'),`+${S.overtime.pct}%${S.night.on?' +'+S.night.pct+'%':''}`,OT_COLOR,t.otNight,tr('{h} H',{h:fmtN(t.otNightH)})]);
  }
  if(S.night.on)rows.push([tr('Night premium'),`+${S.night.pct}%${state.shifts.some(s=>s.night&&nightHours(s)<paidHours(s))?'':' · '+tr('full shift')}`,PREM_COLOR,t.night,tr('{h} night H',{h:t.nightH.toFixed(0)})]);
  if(S.weekend.on)rows.push([tr('Weekend premium'),`+${S.weekend.pct}%`,PREM_COLOR,t.weekend,weekendLabel()]);
  if(S.holiday.on)rows.push([tr('Holiday premium'),`+${S.holiday.pct}%`,PREM_COLOR,t.holiday,tr('public holidays')]);
  // extra earnings that pay out this month, each as its own traceable row
  (S.additions||[]).forEach(a=>{ const amt=additionForMonth(a,y,m); if(amt>0){
    const sub=(a.freq==='annual'||a.freq==='once')?freqLabel(a.freq)+' · '+cap(monthName((a.month||1)-1,true)):freqLabel(a.freq);
    rows.push([esc(a.name||tr('Bonus')),sub,EXTRA_COLOR,amt,'']); } });
  const guide=(act,ico,txt)=>`<button class="card press hguide in" style="--i:5" data-action="${act}"><span class="gi">${ico}</span><span class="gt">${txt}</span><span class="gc">${I.chevron}</span></button>`;
  return `
  <h1 class="srbtn" tabindex="-1">HUB</h1>
  <section class="hero">
    <div class="htop in" style="--i:0"><div class="hl hubmonth">
      <button class="glass press hmonth" data-action="openMonth" aria-haspopup="dialog" aria-label="${tr('Choose month')}: ${cap(monthName(m,true))} ${y}"><span>${cap(monthName(m,true))} ${y}</span>${chev}</button>
      ${y!==TODAY.getFullYear()||m!==TODAY.getMonth()?`<button class="glass press htoday" data-action="today">${tr('Today')}</button>`:''}
      <button class="navbtn press" data-action="prevMonth" aria-label="${tr('Previous month')}">${I.chevL}</button>
      <button class="navbtn press" data-action="nextMonth" aria-label="${tr('Next month')}">${I.chevR}</button></div>
      <button class="glass press hgear" data-action="openSettings" aria-label="${tr('Settings')}">${I.gear}</button></div>
    <div class="hmid ${gridSlide}">
      <div class="hlbl in" style="--i:1">${tr('Estimated net')}</div>
      <div class="v in" style="--i:2"><span class="hv">${dnum(t.grand,'h',hp,{aria:fmtN(t.grand)+' '+cs,fb:'dfb hfb'})}<span class="hcur">${cs}</span></span></div>
      ${t.grand>0&&pt>0&&Math.round(diff)!==0?`<div class="in" style="--i:3;margin-top:12px"><span class="glass hchip"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${diff>0?'<path d="M12 19V5"/><path d="M5 12l7-7 7 7"/>':'<path d="M12 5v14"/><path d="M19 12l-7 7-7-7"/>'}</svg><span>${tr('{v} vs {m}',{v:(diff>0?'+':'−')+fmtN(Math.abs(diff))+' '+cs,m:monthName(pm,true)})}</span></span></div>`:''}
    </div>
    ${stack}
  </section>
  ${state.salary.net===0?guide('hubSalary',I.wallet,tr('Set your salary to see your estimated pay.')):noShifts?guide('tab:calendar',I.calendar,tr('Add your shifts in the Calendar to see your estimated pay.')):''}
  ${needBackup?`<button class="card press hguide in" style="--i:5" data-action="hubBackup"><span class="gi">${I.upload}</span><span class="gt"><b>${tr('Last backup')}: ${state.lastBackupAt?relBackup(state.lastBackupAt):tr('never')}</b></span><span class="gc">${I.chevron}</span></button>`:''}
  ${noShifts?'':weekCard()}
  ${t.grand===0?'':`<div class="card hdet in" style="--i:6">
    <button class="brktoggle press" data-action="brkToggle" aria-expanded="${state.brkOpen}">${dtitle(tr('Pay details'),6,hubW()-72-52)}<span class="glass hcirc"><span class="chevd${state.brkOpen?' open':''}">${I.chevD}</span></span></button>
    <div class="htiles">${tile(tr('Work days'),dnum(t.days,'wd',1.6,{suf:'/'+wd,aria:t.days+'/'+wd}))}${tile(tr('Paid hours'),dnum(payH,'ph',1.6),'h')}${tile(tr('Net per hour'),dnum(effHourly,'nh',1.6),cs+'/h')}${tile(tr('From premiums'),dnum(bonusPct,'pr',1.6,{suf:'%'}))}</div>
    <div class="brkwrap${state.brkOpen?' open':''}"><div class="brkinner"><div class="hbar">${payGroups(t).filter(x=>x[1]>0).map((x,j)=>`<i class="sg" style="--j:${j};flex:${x[1]/t.grand} 1 0;background:${x[2]}"></i>`).join('')}</div>
      <div class="hrows">${rows.map((r,j)=>`<div class="rw" style="--j:${j}"><i class="rdot" style="background:${r[2]}"></i><div class="rmid"><div class="rn">${r[0]}</div><div class="rs">${r[4]?r[1]+' · '+r[4]:r[1]}</div></div>
        <div class="rr"><div class="ra num" style="color:${r[3]>0?'var(--text)':'var(--text3)'}">${fmtN(r[3])}</div><div class="rp num">${Math.round(r[3]/t.grand*100)}%</div></div></div>`).join('')}</div>
      <div class="rw rtot" style="--j:${rows.length}"><div class="rn">${tr('Total')}</div><div class="rtv">${dnum(t.grand,'t',2.4)}<span class="rcur">${cs}</span></div></div></div></div>
  </div>`}
  ${histCard()}`;
}
const cuJobs=new Map(); let cuRaf=0; // concurrent count-ups, one rAF loop
function cuPaint(el,v){ const d=el.dataset, pre=d.pre||'', suf=d.suf||'', hm=d.fmt==='hm', f=hm?hmDots(Math.round(v)):pre+fmtN(v)+suf; d.now=Math.round(v); // el.dataset.now: the value on screen
  if(d.pitch) el.innerHTML=dotNumSVG(dotNorm(f),+d.pitch,dotNorm(hm||el.closest('.preview')?f:pre+fmtN(d.count)+suf)); else el.textContent=f; } // the shift preview's fixed columns size the dots to the value shown (left-aligned)
function cuStep(now){ cuRaf=0;
  for(const [el,j] of cuJobs){ const p=Math.min(1,Math.max(0,(now-j.t0)/j.dur)); cuPaint(el,p<1?j.from+(j.to-j.from)*(1-Math.pow(1-p,3)):j.to); if(p>=1)cuJobs.delete(el); }
  if(cuJobs.size)cuRaf=requestAnimationFrame(cuStep); }
function countStop(fin){ cancelAnimationFrame(cuRaf); cuRaf=0; if(fin)for(const [el,j] of cuJobs)cuPaint(el,j.to); cuJobs.clear(); } // fin: finish at the final values, else drop
function countUp(el,to,dur,from=0,delay=0){ to=+to||0; cuJobs.delete(el);
  if(reduce||to===from){ cuPaint(el,to); return; }
  cuPaint(el,from); cuJobs.set(el,{from,to,dur:dur||700,t0:performance.now()+delay}); if(!cuRaf)cuRaf=requestAnimationFrame(cuStep); }
let hubEnter=true, enT=0; // true at launch: the HUB's first render plays the entrance
function hubAfterRender(el){ // entrance (cascade + numbers count from 0) at launch and after onboarding; never on a tab switch or a plain re-render
  const ent=hubEnter||state.celebrate; hubEnter=state.celebrate=false; clearTimeout(enT);
  if(state.tab!=='hub'||!ent){ el.classList.remove('enter'); return; }
  el.classList.add('enter'); enT=setTimeout(()=>el.classList.remove('enter'),1200);
  el.querySelectorAll('[data-k]').forEach(e=>countUp(e,e.dataset.count,700,0,e.dataset.k==='h'?180:320));
}
