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
function weeklineHTML(){ const wk=weekTotalOf(state.selISO); return wk>0?`<div class="muted" style="text-align:center;margin-top:11px;font-size:12.5px">${tr('This week')} · <span class="num" style="font-weight:700;color:var(--text)">${fmtN(wk)}</span> ${cur()}</div>`:''; }
function daybarInner(){ // selected-day card body — shared by screenCalendar (initial) and selectDay (surgical update)
  const [sy,sm,sd]=state.selISO.split('-').map(Number);
  const selShift=assignedShift(state.selISO), bh=baseHourly(sy,sm-1); // the day's own month, not the viewed one
  const b=dayBreakdown({iso:state.selISO,y:sy,m:sm-1,d:sd},bh,monthTotals(sy,sm-1).cap);
  const smeta=metaOf(state.selISO), swe=isWeekend(sy,sm-1,sd), shol=isHolISO(state.selISO);
  const SC=state.salary;
  const badges = (selShift&&selShift.vac) ? `<span class="badge" style="background:var(--accent-soft);color:var(--accent)">${tr('Paid leave')}</span>` : [
    (selShift&&selShift.night&&SC.night.on)?`<span class="badge" style="background:#6366F122;color:#818CF8">+${SC.night.pct}%</span>`:'',
    (swe&&SC.weekend.on)?`<span class="badge" style="background:#14B8A622;color:#14B8A6">+${SC.weekend.pct}% we</span>`:'',
    (shol&&SC.holiday.on)?`<span class="badge" style="background:var(--red);color:#fff;opacity:.85">+${SC.holiday.pct}% hol</span>`:'',
    (smeta.otDay&&SC.overtime.on)?`<span class="badge" style="background:#F2A63C22;color:var(--gold)">${smeta.otDay}h OT</span>`:'',
    (smeta.otNight&&SC.overtime.on)?`<span class="badge" style="background:#8B5CF622;color:#8B5CF6">${smeta.otNight}h OT·n</span>`:''
  ].filter(Boolean).join('');
  return `<div class="row" style="gap:11px">
      <div class="tile" style="width:34px;height:34px;border-radius:10px;background:${selShift?selShift.color:'#8C8598'}">${selShift?I[selShift.icon]:I.xmark}</div>
      <div class="col" style="gap:2px;min-width:0;flex:1">
        <div class="row" style="gap:7px"><span style="font-size:15px;font-weight:700">${sd} ${monthName(sm-1,false)} · ${selShift?shiftLabel(selShift):tr('Off')}</span></div>
        <div class="row" style="gap:5px;flex-wrap:wrap">${badges||`<span class="muted num" style="font-size:12px">${selShift?timeRange(selShift):tr('no shift')}</span>`}</div>
      </div>
      ${b?`<div class="col" style="align-items:flex-end;gap:0"><span style="font-size:16px;font-weight:800" class="num">${fmtN(b.total)}</span><span class="muted" style="font-size:10px">${cur()}</span></div>`:''}
      <span style="width:14px;height:14px;display:flex;color:var(--accent)">${I.bolt}</span>
    </div>`;
}
function weekDaysOf(iso){ const [y,m,d]=iso.split('-').map(Number), dt=new Date(y,m-1,d), back=(dt.getDay()-state.region.weekStart+7)%7, out=[]; // 7 ISO days of the week containing iso, weekStart-aware (same math as weekTotalOf)
  for(let i=0;i<7;i++){ const c=new Date(y,m-1,d-back+i); out.push(isoOf(c.getFullYear(),c.getMonth(),c.getDate())); } return out; }
function weekRangeLabel(a,b){ const [,am,ad]=a.split('-').map(Number),[,bm,bd]=b.split('-').map(Number);
  return am===bm ? `${ad}–${bd} ${monthName(am-1,true)}` : `${ad} ${monthName(am-1,true)} – ${bd} ${monthName(bm-1,true)}`; }
function repeatWeekPanel(){ const wk=weekDaysOf(state.selISO); // shown in the daybar slot while in Edit mode
  return `<div class="col" style="gap:10px">
    <div class="row" style="gap:11px;align-items:center">
      <div class="tile" style="width:34px;height:34px;border-radius:10px;background:var(--accent-soft);color:var(--accent)">${I.calendar}</div>
      <div class="col" style="gap:1px;flex:1;min-width:0">
        <span style="font-size:15px;font-weight:700">${tr('Repeat this week')}</span>
        <span class="muted" style="font-size:12px">${weekRangeLabel(wk[0],wk[6])}</span>
      </div>
    </div>
    <div class="row" style="gap:8px;align-items:center">
      ${[1,2,4].map(n=>`<button class="brush press" data-action="repweek:${n}" style="flex:1;justify-content:center;font-weight:700;font-size:15px">${n}</button>`).join('')}
      <span class="muted" style="font-size:12.5px;flex:0 0 auto">${tr('wks')}</span>
    </div>
  </div>`; }
function repeatWeek(n){ const src=weekDaysOf(state.selISO), pat=src.map(iso=>state.assignments[iso]); let filled=0;
  for(let w=1;w<=n;w++) for(let i=0;i<7;i++){ const id=pat[i]; if(!id) continue; // source Off → nothing to stamp
    const [y,m,d]=src[i].split('-').map(Number), c=new Date(y,m-1,d+w*7), t=isoOf(c.getFullYear(),c.getMonth(),c.getDate());
    if(state.assignments[t]) continue; // fill gaps only — never overwrite an existing day
    state.assignments[t]=id; filled++; }
  if(filled){ state.hubDirty=true; saveState(); renderScreen(); hap(12); toast(tr('Week copied forward')); }
  else { hap(6); toast(tr('Nothing to copy')); } }
function screenCalendar(){
  const DOW=['S','M','T','W','T','F','S']; // by getDay(): 0=Sun..6=Sat
  const wd=[]; for(let i=0;i<7;i++){ const g=(state.region.weekStart+i)%7; wd.push({l:dowNarrow(g),we:state.region.weekendDays.includes(g)}); }
  const todayISO=isoOf(TODAY.getFullYear(),TODAY.getMonth(),TODAY.getDate());
  const cells=calendarCells().map(c=>{
    const s=assignedShift(c.iso), work=!!s;
    const sel=state.selISO===c.iso, today=todayISO===c.iso;
    const mm=metaOf(c.iso), hasOt=(mm.otDay+mm.otNight)>0, hol=isHolISO(c.iso);
    const wknd=isWeekend(c.y,c.m,c.d);
    const bg = work ? s.color : (today ? 'var(--accent-soft)' : 'var(--fill)'); // today (with no shift) reads as an accent chip so it stands out from the tiny outline alone
    const fg = work ? '#fff' : (hol ? 'var(--red)' : (today ? 'var(--accent)' : 'var(--text2)')); // holiday red still wins the text colour even on today, so a holiday-today isn't silently de-flagged
    return `<button class="cell${work?' work':''}${sel?' sel':''}${today?' today':''}${wknd?' wknd':''}${c.dim?' dim':''}${c.dim?'':' paintable'}" data-iso="${c.iso}" data-action="selday:${c.iso}"
      aria-label="${c.d} ${monthName(c.m,true)}, ${work?shiftLabel(s):tr('Off')}${hol?', '+tr('holiday'):''}">
      <span class="circ" style="background:${bg};color:${fg}"><span class="dn">${c.d}</span></span>
      ${hasOt?'<span class="ot"></span>':''}${hol?'<span class="hol"></span>':''}
    </button>`;
  }).join('');

  const brushes = [{id:'off',name:'Off',color:'#8C8598'}].concat(state.shifts).map(bk=>{
    const on=state.brush===bk.id;
    return `<button class="brush press${on?' on':''}" data-action="brush:${bk.id}"><span class="sw" style="background:${bk.color}"></span>${bk.id==='off'?tr('Off'):shiftLabel(bk)}</button>`;
  }).join('');

  const offCur = state.viewY!==TODAY.getFullYear()||state.viewM!==TODAY.getMonth();
  return `
  <div class="row" style="margin-bottom:10px"><h1 class="big" style="font-size:26px">${tr('Calendar')}</h1><div class="sp"></div>
    ${offCur?`<button class="editbtn press" data-action="today" style="margin-right:8px">${tr('Today')}</button>`:''}
    <button class="editbtn press${state.editMode?' on':''}" data-action="toggleEdit">${state.editMode?tr('Done'):tr('Edit')}</button></div>

  <div class="row" style="margin-bottom:10px;gap:10px">
    <button class="navbtn press" data-action="prevMonth" aria-label="Previous month">${I.chevL}</button>
    <div style="flex:1;text-align:center;font-size:19px;font-weight:800;letter-spacing:-.3px">${cap(monthName(state.viewM,true))} ${state.viewY}</div>
    <button class="navbtn press" data-action="nextMonth" aria-label="Next month">${I.chevR}</button>
  </div>

  ${state.editMode?`<div class="brushbar ${editSlide}">${brushes}</div>`:''}

  <div class="weekhdr" style="margin-bottom:5px">${wd.map(w=>`<span class="${w.we?'we':''}">${w.l}</span>`).join('')}</div>
  <div class="grid ${gridSlide}" id="calgrid">${cells}</div>
  ${(()=>{
    const monthEmpty=monthISOs(state.viewY,state.viewM).every(x=>!assignedShift(x.iso));
    if(monthEmpty&&!state.editMode) return `<button class="card press" data-action="toggleEdit" style="padding:12px 14px;margin-top:11px;display:flex;align-items:center;gap:11px;text-align:left;width:100%">
      <span style="width:32px;height:32px;border-radius:10px;background:var(--accent-soft);color:var(--accent);display:flex;align-items:center;justify-content:center;flex:0 0 auto"><span style="width:15px;height:15px;display:flex">${I.plus}</span></span>
      <div class="col" style="gap:1px;flex:1;min-width:0"><span style="font-size:14px;font-weight:700">${tr('Nothing scheduled this month')}</span><span class="muted" style="font-size:12.5px">${tr('Tap any day to paint a shift')}</span></div></button>`;
    return `<div id="weekline">${weeklineHTML()}</div>`;
  })()}

  ${state.editMode
    ? `<div class="card daybar ${editSlide}" style="padding:11px 13px;margin-top:10px">${repeatWeekPanel()}</div>`
    : `<button class="card daybar press" data-action="dayMeta" style="padding:11px 13px;margin-top:10px;width:100%;text-align:left">${daybarInner()}</button>`}`;
}
