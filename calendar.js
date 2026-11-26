"use strict";
/* ===== Calendar ===== */
function calendarCells(){
  const y=state.viewY,m=state.viewM;
  const first=weekCol(y,m,1);
  const dim=new Date(y,m+1,0).getDate();
  const prevDim=new Date(y,m,0).getDate();
  const cells=[];
  for(let i=first-1;i>=0;i--){ const d=prevDim-i; const pm=m===0?11:m-1, py=m===0?y-1:y; cells.push({y:py,m:pm,d,iso:isoOf(py,pm,d),dim:true}); }
  for(let d=1;d<=dim;d++) cells.push({y,m,d,iso:isoOf(y,m,d),dim:false});
  let nd=1; while(cells.length%7!==0 || cells.length<42){ const nm=m===11?0:m+1, ny=m===11?y+1:y; cells.push({y:ny,m:nm,d:nd,iso:isoOf(ny,nm,nd),dim:true}); nd++; if(cells.length>=42)break; }
  return cells;
}
function weekTotalOf(iso){ // total estimated pay for the week (region weekStart-aware) containing iso
  const [y,m,d]=iso.split('-').map(Number), dt=new Date(y,m-1,d), back=(dt.getDay()-state.region.weekStart+7)%7; let sum=0; const bhC={};
  for(let i=0;i<7;i++){ const c=new Date(y,m-1,d-back+i), cy=c.getFullYear(), cm=c.getMonth(), k=cy+'.'+cm;
    const [bh,cap]=bhC[k]||(bhC[k]=[baseHourly(cy,cm),monthTotals(cy,cm).cap]); // per month: a week spans ≤2 months, so don't recompute 7×
    const b=dayBreakdown({iso:isoOf(cy,cm,c.getDate()),y:cy,m:cm,d:c.getDate()},bh,cap); if(b)sum+=b.total; }
  return sum;
}
function daybarInner(){ // selected-day card body — shared by screenCalendar (initial) and selectDay (surgical update)
  const [sy,sm,sd]=state.selISO.split('-').map(Number);
  const selShift=assignedShift(state.selISO), bh=baseHourly(sy,sm-1), tb=selShift?selShift.color:'#8C8598'; // the day's own month, not the viewed one
  const b=dayBreakdown({iso:state.selISO,y:sy,m:sm-1,d:sd},bh,monthTotals(sy,sm-1).cap);
  const smeta=metaOf(state.selISO), swe=isWeekend(sy,sm-1,sd), shol=isHolISO(state.selISO);
  const SC=state.salary;
  const bl=(full,short)=>`<span class="bfull">${full}</span><span class="bshort" aria-hidden="true">${short}</span>`; // full label; short screens show only the short value (the label stays for screen readers)
  const badges = (selShift&&selShift.vac) ? `<span class="badge" style="background:var(--accent-soft);color:var(--accent-ink)">${tr('Paid leave')}</span>` : [
    (selShift&&selShift.night&&SC.night.on)?`<span class="badge" style="background:#6366F122;color:color-mix(in srgb,#818CF8 55%,var(--text))">+${SC.night.pct}%</span>`:'',
    (swe&&SC.weekend.on)?`<span class="badge" style="background:#14B8A622;color:color-mix(in srgb,#14B8A6 55%,var(--text))">${bl(`+${SC.weekend.pct}% ${tr('wknd')}`,`+${SC.weekend.pct}%`)}</span>`:'',
    (shol&&SC.holiday.on)?`<span class="badge" style="background:color-mix(in srgb,var(--red) 13%,transparent);color:color-mix(in srgb,var(--red) 55%,var(--text))"><i class="bdot" aria-hidden="true" style="background:var(--red)"></i>${bl(tr('Holiday +{p}%',{p:SC.holiday.pct}),`+${SC.holiday.pct}%`)}</span>`:'',
    (smeta.otDay&&SC.overtime.on)?`<span class="badge" style="background:#F2A63C22;color:color-mix(in srgb,var(--gold) 55%,var(--text))"><i class="bdot" aria-hidden="true" style="background:var(--gold)"></i>${bl(tr('Day overtime {h} h',{h:smeta.otDay}),`+${smeta.otDay} h`)}</span>`:'',
    (smeta.otNight&&SC.overtime.on)?`<span class="badge" style="background:#8B5CF622;color:color-mix(in srgb,#8B5CF6 55%,var(--text))"><i class="bdot" aria-hidden="true" style="background:var(--gold)"></i>${bl(tr('Night overtime {h} h',{h:smeta.otNight}),`+${smeta.otNight} h`)}</span>`:''
  ].filter(Boolean).join('');
  const amt=b?`≈ <span class="num dbamt">${fmtN(b.total)}</span> ${cur()}`:'';
  const sub = badges ? (amt?`<span>${amt}</span>`:'')+badges
    : selShift ? `<span class="num">${timeRange(selShift)}</span>${amt?`<span><span class="dsep" aria-hidden="true">·</span>${amt}</span>`:''}`
    : `<span>${tr('no shift')}</span>${amt?`<span><span class="dsep" aria-hidden="true">·</span>${amt}</span>`:''}`;
  return `<div class="dbi" style="background:${selShift?tb:'var(--fill)'};color:${selShift?onColor(tb):'var(--text)'}">${selShift?I[selShift.icon]:I.xmark}</div>
    <div class="dbc"><span class="dbl1">${dayNum(sd)} ${monthName(sm-1,false)} · ${selShift?shiftLabel(selShift):tr('Off')}</span>
      <div class="dbl2 shint">${sub}</div></div>
    <span class="glass dbbolt" aria-hidden="true">${I.bolt}</span>`;
}
function weekDaysOf(iso){ const [y,m,d]=iso.split('-').map(Number), dt=new Date(y,m-1,d), back=(dt.getDay()-state.region.weekStart+7)%7, out=[]; // 7 ISO days of the week containing iso, weekStart-aware (same math as weekTotalOf)
  for(let i=0;i<7;i++){ const c=new Date(y,m-1,d-back+i); out.push(isoOf(c.getFullYear(),c.getMonth(),c.getDate())); } return out; }
function weekRangeLabel(a,b){ const [,am,ad]=a.split('-').map(Number),[,bm,bd]=b.split('-').map(Number);
  return am===bm ? `${dayNum(ad)}–${dayNum(bd)} ${monthName(am-1,true)}` : `${dayNum(ad)} ${monthName(am-1,true)} – ${dayNum(bd)} ${monthName(bm-1,true)}`; }
function repeatWeekPanel(){ const wk=weekDaysOf(state.selISO); // shown in the daybar slot while in Edit mode
  return `<div class="rephd">
      <div class="dbi" style="background:var(--fill);color:var(--text)">${I.repeat}</div>
      <div class="dbc"><div class="rept">${tr('Repeat this week')}</div><div class="reps">${weekRangeLabel(wk[0],wk[6])}</div></div>
    </div>
    <div class="repbtns">${[1,2,4].map(n=>`<button class="glass press chit repbtn" data-action="repweek:${n}" aria-label="${n} ${tr(n===1?'week':'weeks')}">${n}<i aria-hidden="true">${tr(n===1?'week':'weeks')}</i></button>`).join('')}</div>`; }
function repeatWeek(n){ const src=weekDaysOf(state.selISO), pat=src.map(iso=>state.assignments[iso]); let filled=0;
  for(let w=1;w<=n;w++) for(let i=0;i<7;i++){ const id=pat[i]; if(!id) continue; // source Off → nothing to stamp
    const [y,m,d]=src[i].split('-').map(Number), c=new Date(y,m-1,d+w*7), t=isoOf(c.getFullYear(),c.getMonth(),c.getDate());
    if(state.assignments[t]) continue; // fill gaps only — never overwrite an existing day
    state.assignments[t]=id; calFxSet(t,undefined,id,120+filled*90); filled++; } // each drop starts 90 ms after the previous one
  if(filled){ state.hubDirty=true; saveState(); renderScreen(); hap(12); toast(tr('Week copied forward')); }
  else { hap(6); toast(tr('Nothing to copy')); } }
let calFx={}; // one-shot assignment motion for the NEXT render: iso → {k:'in'|'out', c:colour, d:delay ms}; consumed (and emptied) by screenCalendar
function calFxSet(iso,prevId,nextId,delay){ if(reduce)return; const was=shiftById(prevId), now=shiftById(nextId);
  if(now&&nextId!==prevId) calFx[iso]={k:'in',d:delay||0}; else if(!now&&was) calFx[iso]={k:'out',c:was.color}; }
function calCell(c,todayISO,fxm,sel){ // one day tile: the Calendar grid and the onboarding practice week share it
  const s=assignedShift(c.iso), work=!!s, today=todayISO===c.iso;
  const mm=metaOf(c.iso), hasOt=(mm.otDay+mm.otNight)>0, hol=isHolISO(c.iso);
  const wknd=isWeekend(c.y,c.m,c.d);
  const fg = work ? onColor(s.color) : (hol&&!c.dim ? 'var(--red)' : 'var(--text)'); // a holiday's red number wins even on today (an out-of-month day stays plain: red at its dimmed opacity is under 4.5:1; the dot still marks it)
  const fx=fxm[c.iso], fin=fx&&fx.k==='in'&&work, sty=(work?`--on:${fg}`:'')+(fin&&fx.d?`;--pd:${fx.d}ms`:'');
  return `<button${sty?` style="${sty}"`:''} class="cell${work?' work':''}${sel?' sel':''}${today?' today':''}${wknd?' wknd':''}${c.dim?' dim':''}${c.dim?'':' paintable'}${fin?' fx-in':''}" data-iso="${c.iso}" data-action="selday:${c.iso}"
    aria-label="${dayNum(c.d)} ${monthName(c.m,true)}, ${work?shiftLabel(s):tr('Off')}${hol?', '+tr('holiday'):''}">
    ${fx&&fx.k==='out'?`<span class="was" style="background:${fx.c}"></span>`:''}<span class="circ${work?npc(s.color):''}" style="background:${work?s.color:'transparent'};color:${fg}"><span class="dn">${c.d}</span><span class="ci" aria-hidden="true">${work?I[s.icon]||'':''}</span></span>
    ${hasOt?'<span class="ot"></span>':''}${hol?'<span class="hol"></span>':''}${fin?`<span class="rip" style="border-color:${s.color}${fx.d?`;--pd:${fx.d}ms`:''}"></span>`:''}
  </button>`;
}
function calBrushes(){ // the shift chips (plus Off) of Edit mode; the onboarding practice shares them
  return [{id:'off',name:'Off',color:'#8C8598'}].concat(state.shifts).map(bk=>{
    const on=state.brush===bk.id;
    return `<button class="brush glass press${on?' on':''}" data-action="brush:${bk.id}" aria-pressed="${on}"><span class="sw" style="background:${bk.color}"></span>${bk.id==='off'?tr('Off'):shiftLabel(bk)}</button>`;
  }).join('');
}
function screenCalendar(){
  const wd=[]; for(let i=0;i<7;i++){ const g=(state.region.weekStart+i)%7; wd.push({l:dowNarrow(g),we:state.region.weekendDays.includes(g)}); }
  const todayISO=isoOf(TODAY.getFullYear(),TODAY.getMonth(),TODAY.getDate());
  const fxm=calFx; calFx={}; // this render takes the pending assignment motion
  const cells=calendarCells().map(c=>calCell(c,todayISO,fxm,state.selISO===c.iso)).join('');
  const brushes=calBrushes();

  const offCur = state.viewY!==TODAY.getFullYear()||state.viewM!==TODAY.getMonth();
  const ebw=Math.max(tr('Edit').length,tr('Done').length)*8.8+28, // the Edit pill's widest label: the dot-font title takes what is left of the row (same size in both modes)
    title=dotGlyphSVG(tr('Calendar'),2.6,2,13,80,hubW()-32-ebw-16)||esc(tr('Calendar'));
  const lblIn=calToggle&&!reduce, monPop=gridSlide&&!reduce;
  return `
  <div class="chdr"><h1 class="big caltitle">${title}</h1>
    <button class="glass press chit ebtn${state.editMode?' on':''}" data-action="toggleEdit" aria-pressed="${state.editMode}"><span class="elbl${lblIn?' lin':''}">${state.editMode?tr('Done'):tr('Edit')}</span></button></div>

  <div class="cmon">
    <button class="glass press chit cnav" data-action="prevMonth" aria-label="${tr('Previous month')}">${I.chevL}</button>
    <div class="cmid"><span class="cmlbl${monPop?' pop':''}"><span class="mfull">${cap(monthName(state.viewM,true))} ${state.viewY}</span><span class="mabbr" aria-hidden="true">${cap(monthName(state.viewM,false))} ${state.viewY}</span></span>
      ${offCur?`<button class="press ctoday" data-action="today"><span class="glass">${tr('Today')}</span></button>`:''}</div>
    <button class="glass press chit cnav" data-action="nextMonth" aria-label="${tr('Next month')}">${I.chevR}</button>
  </div>

  ${state.editMode?`<div class="cacc"><div><div class="brushbar shint">${brushes}</div></div></div>`:''}

  <div class="weekhdr">${wd.map(w=>`<span class="${w.we?'we':''}">${w.l}</span>`).join('')}</div>
  <div class="grid ${gridSlide}" id="calgrid"${state.editMode&&calGridH?` style="flex:none;height:${calGridH}px"`:''}>${cells}</div>
  ${!state.editMode&&monthISOs(state.viewY,state.viewM).every(x=>!assignedShift(x.iso))
    ? `<div class="card cempty"><span class="dbi">${I.calendar}</span>
      <div class="dbc"><b>${tr('Nothing scheduled this month')}</b></div></div>`:''}

  ${state.editMode
    ? `<div class="card daybar rep ${editSlide}">${repeatWeekPanel()}</div>`
    : `<button class="card daybar press" data-action="dayMeta">${daybarInner()}</button><button class="srbtn" data-action="quickSel" aria-label="${tr('Assign a shift')}"></button>`}`;
}
