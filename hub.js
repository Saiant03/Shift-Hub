"use strict";
/* ===== HUB ===== */
function upcomingShift(){ // today's assignment, else the next assigned day within ~5 weeks
  for(let i=0;i<35;i++){ const dt=new Date(TODAY.getFullYear(),TODAY.getMonth(),TODAY.getDate()+i);
    const iso=isoOf(dt.getFullYear(),dt.getMonth(),dt.getDate()), s=assignedShift(iso);
    if(s) return {iso,s,i,dt}; }
  return null;
}
function upcomingCard(){
  const up=upcomingShift(); if(!up) return '';
  const when = up.i===0?tr('Today'):up.i===1?tr('Tomorrow'):`${dowShort(up.dt.getDay())} ${up.dt.getDate()} ${monthName(up.dt.getMonth(),true)}`;
  const sub = up.s.vac ? tr('Paid leave') : timeRange(up.s);
  return `<button class="card press" data-action="gotoDay:${up.iso}" style="padding:13px 14px;margin-bottom:14px;display:flex;align-items:center;gap:12px;text-align:left;width:100%">
    <div class="tile" style="width:38px;height:38px;background:${up.s.color}">${I[up.s.icon]}</div>
    <div class="col" style="gap:1px;flex:1;min-width:0">
      <span class="muted" style="font-size:10.5px;font-weight:700;text-transform:uppercase;letter-spacing:.5px">${up.i===0?tr('Today'):tr('Next shift')}</span>
      <span style="font-size:15px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${shiftLabel(up.s)}<span class="muted" style="font-weight:500;font-size:13px"> · ${when}</span></span>
      <span class="muted num" style="font-size:12.5px">${sub}</span>
    </div>
    <span style="width:14px;height:14px;display:flex;color:var(--accent);flex:0 0 auto">${I.chevron}</span>
  </button>`;
}
function histData(){ const out=[]; for(let i=5;i>=0;i--){ let mm=TODAY.getMonth()-i, yy=TODAY.getFullYear(); while(mm<0){mm+=12;yy--;} out.push({y:yy,m:mm,total:monthTotals(yy,mm).grand}); } return out; } // last 6 real months, oldest→current
function histLabelHTML(h){ return `${cap(monthName(h.m,false))} · <span class="num">${fmtN(h.total)}</span> ${cur()}`; }
function histCard(){ const H=histData(); if(H.every(h=>h.total<=0)) return ''; // hide until there is any history to show
  const max=Math.max(1,...H.map(h=>h.total)), sel=H.length-1;
  const bars=H.map((h,i)=>`<button class="histbar${i===sel?' on':''}" data-action="histBar:${i}" aria-label="${cap(monthName(h.m,true))} ${h.y}: ${fmtN(h.total)} ${cur()}">
      <span class="hbtrack"><span class="hbfill" style="height:${Math.max(4,Math.round(h.total/max*100))}%"></span></span>
      <span class="hblbl">${cap(monthName(h.m,false)).slice(0,3)}</span></button>`).join('');
  return `<div class="card" style="padding:14px 16px;margin-bottom:22px">
    <div class="row" style="margin-bottom:12px"><span class="muted" style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.5px">${tr('Income history')}</span><div class="sp"></div>
      <span id="histlabel" style="font-size:13px;font-weight:700">${histLabelHTML(H[sel])}</span></div>
    <div class="histchart">${bars}</div>
  </div>`; }
function histSelect(i){ const H=histData(), s=H[i]; if(!s) return; // surgical: highlight the tapped bar + update the label, no hub re-render
  document.querySelectorAll('.histbar').forEach((b,idx)=>b.classList.toggle('on', idx===i));
  const lbl=document.getElementById('histlabel'); if(lbl) lbl.innerHTML=histLabelHTML(s); hap(6); }
function screenHub(){
  const t=monthTotals(state.viewY,state.viewM), S=state.salary;
  const effHourly = t.paidH>0 ? t.grand/t.paidH : 0;        // net actually earned per worked hour
  const bonusPct  = t.grand>0 ? Math.round(t.bonusTotal/t.grand*100) : 0; // share of pay coming from premiums
  const noShifts=Object.keys(state.assignments).length===0; // brand-new user: guide them to the calendar
  // composition + breakdown include ONLY the bonuses this workplace uses
  const comp=[['Base',t.base,'var(--accent)']];
  if(S.overtime.on){comp.push(['OT day',t.otDay,'#F2A63C']);comp.push(['OT night',t.otNight,'#8B5CF6']);}
  if(S.night.on)comp.push(['Night',t.night,'#6366F1']);
  if(S.weekend.on)comp.push(['Weekend',t.weekend,'#14B8A6']);
  if(S.holiday.on)comp.push(['Holiday',t.holiday,'#F2607D']);
  const compBar=comp.filter(c=>c[1]>0).map(c=>`<i style="width:${t.grand>0?c[1]/t.grand*100:0}%;background:${c[2]}"></i>`).join('')||'<i style="width:100%;background:var(--fill)"></i>';
  const rows=[[tr('Base pay'),tr('from net salary'),'var(--accent)','briefcase',t.base,tr('{h} H paid',{h:t.paidH.toFixed(0)})]];
  if(S.overtime.on){
    rows.push([tr('Day overtime'),`+${S.overtime.pct}%`,'#F2A63C','bolt',t.otDay,tr('{h} H',{h:fmtN(t.otDayH)})]);
    rows.push([tr('Night overtime'),`+${S.overtime.pct}%${S.night.on?' +'+S.night.pct+'%':''}`,'#8B5CF6','bolt',t.otNight,tr('{h} H',{h:fmtN(t.otNightH)})]);
  }
  if(S.night.on)rows.push([tr('Night premium'),`+${S.night.pct}% · ${tr('full shift')}`,'#6366F1','moonstars',t.night,tr('{h} night H',{h:t.nightH.toFixed(0)})]);
  if(S.weekend.on)rows.push([tr('Weekend premium'),`+${S.weekend.pct}%`,'#14B8A6','calendar',t.weekend,weekendLabel()]);
  if(S.holiday.on)rows.push([tr('Holiday premium'),`+${S.holiday.pct}%`,'#F2607D','gift',t.holiday,tr('public holidays')]);
  // extra earnings that pay out this month, each as its own traceable row
  (S.additions||[]).forEach(a=>{ const amt=additionForMonth(a,state.viewY,state.viewM); if(amt>0){
    const sub=(a.freq==='annual'||a.freq==='once')?freqLabel(a.freq)+' · '+cap(monthName((a.month||1)-1,true)):freqLabel(a.freq);
    rows.push([esc(a.name||tr('Bonus')),sub,'#22C08A','star',amt,'']); } });
  const brk=rows.map((r,i)=>`<div class="brk"><div class="bd" style="background:${r[2]}">${I[r[3]]}</div>
    <div style="flex:1;min-width:0"><div class="nm">${r[0]}</div><div class="sub">${r[5]?r[1]+' · '+r[5]:r[1]}</div></div>
    <div class="amt" data-count="${Math.round(r[4])}" style="color:${r[4]>0?'var(--text)':'var(--text3)'}">${fmtN(r[4])}</div></div>${i<rows.length-1?'<hr class="divider">':''}`).join('');
  const anyBonus=S.night.on||S.weekend.on||S.holiday.on;
  // Concise summary shown collapsed; the granular rows above (brk) are revealed on expand
  const sum=[[tr('Base pay'),t.base]];
  if(S.overtime.on) sum.push([tr('overtime'),t.otTotal]);
  if(anyBonus) sum.push([tr('premiums'),t.night+t.weekend+t.holiday]);
  if(t.additions>0) sum.push([tr('Extra earnings'),t.additions]);
  const sumRows=sum.map(r=>`<div class="sumrow"><span class="sl">${cap(r[0])}</span><span class="srv num">${fmtN(r[1])}</span></div>`).join('');
  const kpis=[`<div class="statcol"><div class="v"><span data-count="${Math.round(t.base)}">${fmtN(t.base)}</span></div><div class="l">${tr('base (net)')}</div></div>`];
  if(S.overtime.on)kpis.push(`<div class="statcol"><div class="v"><span data-count="${Math.round(t.otTotal)}">${fmtN(t.otTotal)}</span></div><div class="l">${tr('overtime')}</div></div>`);
  if(anyBonus)kpis.push(`<div class="statcol"><div class="v"><span data-count="${Math.round(t.night+t.weekend+t.holiday)}">${fmtN(t.night+t.weekend+t.holiday)}</span></div><div class="l">${tr('premiums')}</div></div>`);
  return `
  <div class="row" style="align-items:flex-start;margin-bottom:18px">
    <h1 class="big">HUB</h1>
    <div class="sp"></div>
    <button class="card press" data-action="openSettings" style="width:40px;height:40px;border-radius:13px;display:flex;align-items:center;justify-content:center" aria-label="${tr('Settings')}">
      <span style="width:19px;height:19px;display:flex;color:var(--accent)">${I.gear}</span></button>
  </div>
  <div class="hero" style="margin-bottom:14px">
    <div class="k" style="position:relative;z-index:1">${tr('Estimated net pay for {m} {y}',{m:monthName(state.viewM,true),y:state.viewY})}</div>
    <div class="v" style="position:relative;z-index:1"><span class="gradtext" data-count="${Math.round(t.grand)}">${fmtN(t.grand)}</span><span style="font-size:16px;font-weight:600;opacity:.7"> ${cur()}</span></div>
    <div class="s" style="position:relative;z-index:1">${tr(t.days===1?'{n} work day':'{n} work days',{n:t.days})}${t.vacDays>0?' · '+tr('{n} leave',{n:t.vacDays}):''} · ${tr('{h} H paid',{h:t.paidH.toFixed(0)})}</div>
  </div>
  ${upcomingCard()}
  ${noShifts?`<button class="card press" data-action="tab:calendar" style="padding:14px 16px;margin-bottom:14px;display:flex;align-items:center;gap:12px;text-align:left;width:100%">
    <span style="width:34px;height:34px;border-radius:11px;background:var(--accent-soft);color:var(--accent);display:flex;align-items:center;justify-content:center;flex:0 0 auto">${I.calendar}</span>
    <span style="flex:1;font-size:13.5px;line-height:1.4;color:var(--text2)">${tr('Add your shifts in the Calendar to see your estimated pay.')}</span>
    <span style="width:14px;height:14px;display:flex;color:var(--accent);flex:0 0 auto">${I.chevron}</span></button>`:''}
  <div class="card" style="padding:16px;margin-bottom:22px">
    <div class="row" style="gap:8px;margin-bottom:12px">${kpis.join('')}</div>
    <div class="compbar">${compBar}</div>
    ${t.paidH>0?`<div class="muted" style="font-size:12px;margin-top:11px;text-align:center">${tr('Effective net')} <span class="num" style="font-weight:700;color:var(--text)">${fmtN(effHourly)} ${cur()}/h</span> · <span class="num" style="font-weight:700;color:var(--text)">${bonusPct}%</span> ${tr('premiums')}</div>`:''}
  </div>
  <div class="card" style="overflow:hidden;margin-bottom:22px">
    <button class="brk brktoggle press" data-action="brkToggle" aria-expanded="${state.brkOpen}" style="width:100%;text-align:left">
      <div class="bd" style="background:var(--accent)">${I.wallet}</div>
      <div style="flex:1;min-width:0"><div class="nm">${tr('Pay breakdown')}</div><div class="sub">${state.brkOpen?tr('Tap to hide details'):tr('Tap to see every component')}</div></div>
      <span class="chevd${state.brkOpen?' open':''}" style="width:14px;height:14px;display:flex;color:var(--text3)">${I.chevron}</span>
    </button>
    ${sumRows}
    <div class="brkwrap${state.brkOpen?' open':''}"><div class="brkinner"><hr class="divider">${brk}</div></div>
    <hr class="divider">
    <div class="sumrow tot"><span class="sl">${tr('Total')}</span><span class="srv num">${fmtN(t.grand)} ${cur()}</span></div>
  </div>
  ${histCard()}`;
}
function countUp(el,to,dur){ to=+to||0; if(reduce||to===0){el.textContent=fmtN(to);return;}
  const start=performance.now(); const ease=p=>1-Math.pow(1-p,3);
  function step(now){ const p=Math.min(1,(now-start)/(dur||700)); el.textContent=fmtN(to*ease(p)); if(p<1)requestAnimationFrame(step); else el.textContent=fmtN(to); }
  requestAnimationFrame(step);
}
let hubIntroDone=false; // reset on every fresh page load (app relaunch) → the hero shimmer plays once per launch, not on every hub visit
function animateHub(){
  const el=document.getElementById('screen'); if(!el||state.tab!=='hub')return;
  const intro=!hubIntroDone; // the first hub paint since app launch: play the full intro (shimmer + count-up). Later hub visits keep the numbers stable (they're already the final values in the HTML) so the hub doesn't feel like it "refreshes".
  if(reduce){hubIntroDone=true;state.celebrate=false;return;}
  el.querySelectorAll('.hero').forEach(c=>{
    if(intro){ const s=document.createElement('div'); s.className='shimfx'; c.appendChild(s); setTimeout(()=>s.remove(),1100); } // shimmer sweep plays ONCE per app launch
    if(state.celebrate){ c.classList.add('celebrate'); setTimeout(()=>c.classList.remove('celebrate'),640); } }); // one-time achievement pop after setup
  hubIntroDone=true;state.celebrate=false;
  if(intro) el.querySelectorAll('[data-count]').forEach(n=>{ n.textContent=fmtN(0); countUp(n,n.getAttribute('data-count'),720); }); // count-up only on launch
}
