"use strict";
/* ===== Sheets ===== */
function stepRow(lbl,val,minus,plus){return `<div class="row" style="padding:12px 15px;min-height:46px"><span style="font-size:15px;flex:1">${lbl}</span>
  <div class="stepper"><button data-action="${minus}" aria-label="${esc(tr('Decrease {x}',{x:lbl}))}">${I.minus}</button><span class="sv"><b>${val}</b></span><button data-action="${plus}" aria-label="${esc(tr('Increase {x}',{x:lbl}))}">${I.plus}</button></div></div>`;}
const timeRow=(id,lbl,m)=>`<div class="row" style="padding:12px 15px;min-height:46px"><div class="col" style="flex:1;gap:1px;min-width:0" aria-hidden="true"><span style="font-size:16px;font-weight:600">${lbl}</span><span class="muted" style="font-size:12px">${tr('Tap to set time')}</span></div><input type="time" class="tpick" id="${id}" value="${timeStr(m)}" aria-label="${esc(lbl)}"></div>`;
function stepRowInline(lbl,sub,val,minus,plus){return `<div class="col" style="flex:1;gap:1px;min-width:0"><span style="font-size:15px;font-weight:500">${lbl}</span><span class="muted" style="font-size:11.5px">${sub}</span></div>
  <div class="stepper"><button data-action="${minus}" aria-label="${esc(tr('Decrease {x}',{x:lbl}))}">${I.minus}</button><span class="sv"><b>${val}</b></span><button data-action="${plus}" aria-label="${esc(tr('Increase {x}',{x:lbl}))}">${I.plus}</button></div>`;}

function sheetDayMeta(){
  const [sy,sm,sd]=state.selISO.split('-').map(Number);
  const swe=isWeekend(sy,sm-1,sd);
  const autoHol=isPublicHoliday(sy,sm-1,sd);
  const ho=state.draftHoliday||autoHol;
  const S=state.salary, s=assignedShift(state.selISO), vac=!!(s&&s.vac), otOn=S.overtime.on&&!vac, holOn=S.holiday.on; // paid leave: no overtime, no premiums
  const bh=baseHourly(sy,sm-1);
  const dayBase=s?bh*paidHours(s):0;
  const fO=pctOf('overtime'),fN=pctOf('night'),fW=pctOf('weekend'),fH=pctOf('holiday');
  const otDayPay=otOn?bh*(1+fO+(swe?fW:0)+(ho?fH:0))*state.draftOtDay:0;
  const otNightPay=otOn?bh*(1+fO+fN+(swe?fW:0)+(ho?fH:0))*state.draftOtNight:0;
  const holPay=(holOn&&ho&&!vac)?fH*dayBase:0, wePay=(swe&&!vac)?fW*dayBase:0;
  const extra=otDayPay+otNightPay+holPay+wePay;
  return `<div class="inner mdsheet">
    <div class="handle"></div>
    <div class="sheethdr"><button class="link press" data-action="sheetClose">${tr('Cancel')}</button>
      <h2 class="t" id="sheettitle">${dayNum(sd)} ${cap(monthName(sm-1,true))}</h2>
      <button class="link b press" data-action="metaSave">${tr('Save')}</button></div>
    <div class="xbox">
      <div class="row"><div class="col" style="gap:3px;flex:1;min-width:0">
        <span class="xlbl">${tr('Extra this day')}</span>
        <span class="xsub">${s?shiftLabel(s):tr('No shift')}${swe?' ·&nbsp;'+tr('weekend'):''}${ho?' ·&nbsp;'+tr('holiday'):''}</span></div>
        <span class="xamt"><span class="num" style="font-size:26px;font-weight:800;letter-spacing:-.5px">${(()=>{ const t='+'+fmtN(extra), n=dotNorm(t); return dotCovers(n)?`<span role="img" aria-label="${esc(t)}">${dotNumSVG(n,2.2,n)}</span>`:esc(t); })()}</span><span class="xcur">${cur()}</span></span></div>
    </div>
    ${otOn?`<h3 class="sec">${tr('Overtime hours')}</h3>
    <div class="grp" style="margin-bottom:22px">
      <div class="grow">${stepRowInline(tr('Day overtime'),'+'+S.overtime.pct+'%',state.draftOtDay+' h','otDayM','otDayP')}</div>
      <div class="grow">${stepRowInline(tr('Night overtime'),'+'+S.overtime.pct+'%'+(S.night.on?' +'+S.night.pct+'%':''),state.draftOtNight+' h','otNightM','otNightP')}</div>
    </div>`:''}
    ${holOn?`<h3 class="sec">${tr('Public holiday')}</h3>
    <div class="grp" style="margin-bottom:14px"><div class="grow"><div class="col" style="flex:1;gap:2px">
      <span style="font-size:15px;font-weight:500" aria-hidden="true">${tr('Public holiday · +{p}%',{p:S.holiday.pct})}</span>
      <span class="muted" style="font-size:12px">${autoHol?tr('Public holiday (auto)'):tr('Mark as a holiday')}</span></div>
      <button class="toggle ${ho?'on':''}" data-action="holToggle" role="switch" aria-checked="${ho}" aria-label="${esc(tr('Public holiday · +{p}%',{p:S.holiday.pct}))}" ${autoHol?'style="opacity:.55;pointer-events:none"':''}><i></i></button></div></div>`:''}
    ${(!S.overtime.on&&!holOn)?`<p class="muted3" style="font-size:12.5px;padding:0 4px;text-align:center">${tr('Overtime & holiday pay are turned off in Settings → Salary.')}</p>`:''}
  </div>`;
}
function colorPickerHTML(){
  const hueColor=hsvToHex(state.pk.h,1,1);
  const col=draftColor();
  return `<div class="cpick">
    <div class="sv" id="cpsv" style="background:linear-gradient(to top,#000,transparent),linear-gradient(to right,#fff,${hueColor})">
      <div class="sv-th" id="cpsvT" style="left:${state.pk.s*100}%;top:${(1-state.pk.v)*100}%"></div></div>
    <div class="hue" id="cphue"><div class="hue-th" id="cphueT" style="left:${state.pk.h/360*100}%"></div></div>
    <div class="cprow"><div class="cprev" id="cprev" style="background:${col}"></div>
      <input class="hexin" id="cphex" value="${col}" maxlength="7" spellcheck="false" aria-label="${tr('Hex colour')}"></div>
    <div class="presets">${PRESET_COLORS.map(c=>`<button class="pcol${col.toLowerCase()===c.toLowerCase()?' on':''}" style="background:${c}" data-action="preset:${c}" aria-label="${c}"></button>`).join('')}</div>
  </div>`;
}
const hmDots=m=>m%60?Math.floor(m/60)+'H'+String(m%60).padStart(2,'0'):hmLabel(m); // compact hours for the dot font: 7H55
function sheetShift(){
  const d=state.d, col=draftColor();
  const dur=duration(d);
  const paid=Math.max(0,dur-d.brk);
  const icons=SHIFT_ICONS.map(ic=>`<button class="icb${d.icon===ic?' on':''}" data-action="shIcon:${ic}" aria-label="${tr(ic)}" aria-pressed="${d.icon===ic}">${I[ic]}</button>`).join('');
  const t=state.isNew?tr('New shift'):tr('Edit shift'), maxW=hubW()-32-(tr('Cancel').length+tr('Save').length)*9-56, tsvg=maxW/(dotLayout(dotNorm(t)).cols+.16)>=1.2?dotGlyphSVG(t,1.5,2,13,120,maxW):''; // too narrow for legible dots: plain text
  const hmc=hmDots, sv=[hmc(dur),d.brk+'m',hmc(paid),'≈'+fmtN(shiftEst(d,paid))].map(dotNorm), pitch=Math.min(2.2,(hubW()-88)/4/(Math.max(37,...sv.map(t=>dotLayout(t).cols))+.2)), // four fixed columns: a value change never moves its neighbours; the dots shrink only past ≈250-wide values
    pvv=(v,show,n,a='')=>{ const t=dotNorm(show); return dotCovers(t)?`<span class="srbtn">${esc(v)}</span><span class="dn" data-count="${n}" data-pitch="${pitch}"${a}>${dotNumSVG(t,pitch,t)}</span>`:esc(v); }; // dots show a compact 7H55 (the full label stays for VoiceOver); data-count lets a change count to the new value
  return `<div class="inner shsheet">
    <div class="handle"></div>
    <div class="sheethdr"><button class="link press" data-action="sheetClose">${tr('Cancel')}</button>
      <h2 class="t" id="sheettitle">${tsvg?`<span class="srbtn">${t}</span><span aria-hidden="true" class="shst">${tsvg}</span>`:t}</h2>
      <button class="press shsave" data-action="shiftSave"><span class="glass">${tr('Save')}</span></button></div>
    <div class="preview" data-k="pv" style="--j:0;margin-bottom:18px">
      <div class="hd"><div class="ic" style="background:${col};color:${onColor(col)};box-shadow:var(--tsh)">${I[d.icon]}</div>
        <div class="col" style="gap:1px;min-width:0"><div id="shprevname">${esc(d.name)||tr('Untitled')}</div>
          <div class="num">${d.vac?hmLabel(paid)+' · '+tr('leave'):timeRange(d)}</div></div></div>
      <div class="stats"><div class="statcol"><div class="v">${pvv(hmLabel(dur),hmc(dur),dur,' data-fmt="hm"')}</div><div class="l">${tr('total')}</div></div>
        <div class="statcol"><div class="v">${pvv(d.brk+'m',d.brk+'m',d.brk,' data-suf="m"')}</div><div class="l">${tr('break')}</div></div>
        <div class="statcol"><div class="v">${pvv(hmLabel(paid),hmc(paid),paid,' data-fmt="hm"')}</div><div class="l">${tr('paid')}</div></div>
        <div class="statcol"><div class="v">${(e=>pvv('≈'+fmtN(e),'≈'+fmtN(e),e,' data-pre="≈"'))(shiftEst(d,paid))}</div><div class="l">${cur()}</div></div></div>
    </div>
    <label class="sec" for="shname" data-k="hName" style="display:block;--j:1">${tr('Name')}</label>
    <input class="tinput" id="shname" data-k="name" value="${esc(d.name)}" placeholder="${tr('Shift name')}" spellcheck="false" style="--j:1;margin-bottom:18px">
    ${(!state.shifts.some(s=>s.vac&&s.id!==state.editingId))?`<h3 class="sec" data-k="hType" style="--j:2">${tr('Type')}</h3>
    <div class="card" data-k="type" style="--j:2;padding:14px;margin-bottom:18px"><div class="row"><div class="col" style="flex:1;gap:1px;min-width:0"><span style="font-size:15px" aria-hidden="true">${tr('Paid leave (holiday)')}</span><span class="muted" style="font-size:11.5px">${tr('Counts toward the month, paid as a normal day, no premiums or break')}</span></div>
      <button class="toggle ${d.vac?'on':''}" data-action="shVac" role="switch" aria-checked="${d.vac}" aria-label="${esc(tr('Paid leave (holiday)'))}"><i></i></button></div></div>`:''}
    ${d.vac?`<h3 class="sec" data-k="hPaid" style="--j:3">${tr('Paid hours')}</h3>
    <div class="card" data-k="paid" style="--j:3;overflow:hidden;margin-bottom:18px">${stepRow(tr('Hours paid per leave day'),hmLabel(paid),'vacHM','vacHP')}</div>`:`<h3 class="sec" data-k="hSched" style="--j:3">${tr('Schedule')}</h3>
    <div class="card" data-k="sched" style="--j:3;overflow:hidden;margin-bottom:18px">
      ${timeRow('shStart',tr('Start'),d.start)}<hr class="divider">
      ${timeRow('shEnd',tr('End'),d.end)}<hr class="divider">${stepRow(tr('Break'),d.brk+' min','bM','bP')}
    </div>
    <h3 class="sec" data-k="hNight" style="--j:4">${tr('Night shift')}</h3>
    <div class="card" data-k="night" style="--j:4;overflow:hidden;margin-bottom:18px"><div class="row" style="padding:14px"><span style="font-size:15px;flex:1" aria-hidden="true">${tr('Night premium')} +${state.salary.night.pct}%</span>
      <button class="toggle ${d.night?'on':''}" data-action="shNight" role="switch" aria-checked="${d.night}" aria-label="${esc(tr('Night premium')+' +'+state.salary.night.pct+'%')}"><i></i></button></div>
      ${d.night?`<div data-k="nh"><hr class="divider">${stepRow(tr('Night hours paid'),hmLabel(nightHours(d)*60),'nhM','nhP')}</div>`:''}</div>`}
    <h3 class="sec" data-k="hIcon" style="--j:5">${tr('Icon')}</h3>
    <div class="card" data-k="icon" style="--j:5;margin-bottom:18px"><div class="iconrow">${icons}</div></div>
    <h3 class="sec" data-k="hCol" style="--j:6">${tr('Colour')}</h3>
    <div class="card" data-k="col" style="--j:6">${colorPickerHTML()}</div>
    ${state.editingId?`<button class="delbtn press" data-k="del" data-action="shiftDelete" style="--j:7">${tr('Delete shift')}</button>`:''}
  </div>`;
}
function sheetExport(){
  return `<div class="inner">
    <div class="handle"></div>
    <div class="sheethdr" style="justify-content:space-between"><h2 id="sheettitle" style="font-size:20px;font-weight:800;margin:0">${cap(monthName(state.viewM,true))} ${state.viewY}</h2>
      <button class="link press" data-action="sheetClose">${tr('Close')}</button></div>
    <button class="bigbtn" data-action="csvCopy"><span style="width:18px;height:18px;display:flex">${I.upload}</span>${tr('Copy CSV')}</button>
    <p class="muted3" style="font-size:11.5px;margin-top:10px;text-align:center">${tr("Copies this month's CSV to the clipboard.")}</p>
  </div>`;
}
function sheetYear(){ const y=state.yearY, t=yearTotals(y), [bar,rows]=payComp(t), n=t.activeMonths, max=Math.max(1,...t.months.map(x=>x.grand)),
    avg=n?fmtN(t.grand/n)+' '+cur():'—', curM=y===TODAY.getFullYear()?TODAY.getMonth():-1,
    nb=(d,lbl)=>`<button class="navbtn press" data-action="${d}" aria-label="${tr(lbl)}" style="width:44px;height:44px">${d==='yrPrev'?I.chevL:I.chevR}</button>`,
    stat=(l,v)=>`<div class="sumrow"><span class="sl">${l}</span><span class="srv num">${v}</span></div>`,
    bars=t.months.map(x=>`<div class="yrbar${x.m===curM?' on':''}" role="img" aria-label="${cap(monthName(x.m,true))} ${y}: ${fmtN(x.grand)} ${cur()}">
      <span class="hbtrack"><span class="hbfill" style="height:${Math.max(4,Math.round(x.grand/max*100))}%"></span></span>
      <span class="hblbl" aria-hidden="true">${new Intl.DateTimeFormat(state.lang,{month:'narrow'}).format(new Date(y,x.m,1))}</span></div>`).join('');
  return `<div class="inner">
    <div class="handle"></div>
    <div class="sheethdr" style="justify-content:space-between;gap:4px"><h2 id="sheettitle" style="font-size:20px;font-weight:800;margin:0;flex:1;min-width:0">${tr('Total {y}',{y})}</h2>
      ${nb('yrPrev','Previous year')}${nb('yrNext','Next year')}<button class="link press" data-action="sheetClose">${tr('Close')}</button></div>
    <div class="num" style="font-size:clamp(24px,9vw,34px);font-weight:800;overflow-wrap:anywhere;line-height:1.15;margin-bottom:14px">${fmtN(t.grand)}<span style="font-size:16px;font-weight:600;opacity:.7"> ${cur()}</span></div>
    <div class="card" style="overflow:hidden;margin-bottom:14px"><div style="padding:14px 15px 4px"><div class="compbar">${bar}</div></div>${rows}<hr class="divider">
      <div class="sumrow tot"><span class="sl">${tr('Total')}</span><span class="srv num">${fmtN(t.grand)} ${cur()}</span></div></div>
    <div class="card" style="overflow:hidden;margin-bottom:14px">${stat(tr(t.days===1?'{n} work day':'{n} work days',{n:t.days,de:deOf(t.days)}),'')}
      ${t.vacDays>0?stat(tr('{n} leave',{n:t.vacDays}),''):''}${stat(tr('Paid hours'),fmtN(t.paidH))}${stat(tr('Overtime hours'),fmtN(t.otDayH+t.otNightH))}${stat(tr('Monthly average'),avg)}</div>
    <div class="card" style="padding:14px 16px"><div class="histchart" style="gap:4px">${bars}</div></div>
  </div>`;
}
function sheetMonth(){ const y=state.monthY, ty=TODAY.getFullYear(), tm=TODAY.getMonth(),
    nb=(d,lbl)=>`<button class="navbtn press" data-action="${d}" aria-label="${tr(lbl)}" style="width:44px;height:44px">${d==='moYPrev'?I.chevL:I.chevR}</button>`,
    cells=Array.from({length:12},(_,m)=>{ const g=monthTotals(y,m).grand, v=y===state.viewY&&m===state.viewM;
      return `<button class="press mcell${v?' on':''}${y===ty&&m===tm&&!v?' now':''}" data-action="pickMonth:${y}-${m}"${v?' aria-current="true"':''}><span class="mn">${cap(monthName(m,false))}</span>${g>0?`<span class="ma num">${fmtN(g)}</span>`:''}</button>`; }).join('');
  return `<div class="inner">
    <div class="handle"></div>
    <div class="sheethdr" style="justify-content:space-between;gap:4px"><h2 id="sheettitle" style="font-size:20px;font-weight:800;margin:0;flex:1;min-width:0">${y}</h2>
      ${nb('moYPrev','Previous year')}${nb('moYNext','Next year')}<button class="link press" data-action="sheetClose">${tr('Close')}</button></div>
    <div class="mgrid">${cells}</div>
  </div>`;
}
function sheetBackup(){
  const json=exportBackup();
  const ns=state.shifts.length, nd=Object.keys(state.assignments).length, de=deOf;
  const counts=`${tr(ns===1?'{n} shift':'{n} shifts',{n:ns,de:de(ns)})} · ${tr(nd===1?'{n} assigned day':'{n} assigned days',{n:nd,de:de(nd)})}`;
  return `<div class="inner">
    <div class="handle"></div>
    <div class="sheethdr"><button class="link press" data-action="backSettings"><span style="display:inline-flex;vertical-align:-3px;width:17px;height:17px">${I.chevL}</span>${tr('Settings')}</button><h2 class="t" id="sheettitle">${tr('Backup')}</h2><button class="link b press" data-action="sheetClose">${tr('Done')}</button></div>
    <div style="background:var(--fill);border-radius:14px;padding:12px 14px;margin-bottom:14px">
      <div style="font-size:14px;font-weight:600${state.lastBackupAt?'':';color:var(--accent-ink)'}">${tr('Last backup')}: ${state.lastBackupAt?relBackup(state.lastBackupAt):tr('never')}</div>
      <div class="muted" style="font-size:12px;margin-top:3px">${tr('Your data is saved only on this phone')}</div>
    </div>
    <h3 class="sec">${tr('Export')}</h3>
    <details id="bkdata" class="bkdata"><summary>${tr('Show data')}<span class="chevd" style="width:14px;height:14px;display:flex;color:var(--text3)">${I.chevron}</span></summary><div class="csvbox" style="max-height:150px;font-size:11px">${esc(json)}</div></details>
    <div class="row" style="gap:10px;margin-top:12px">
      <button class="bigbtn" data-action="backupDownload" style="margin-top:0"><span style="width:18px;height:18px;display:flex">${I.upload}</span>${tr('Download')}</button>
      <button class="bigbtn" data-action="backupCopy" style="margin-top:0;background:var(--fill);color:var(--text)">${tr('Copy')}</button>
    </div>
    <p class="muted3" style="font-size:11.5px;margin-top:8px;padding:0 4px">${counts}</p>
    <h3 class="sec" style="margin-top:20px">${tr('Restore')}</h3>
    <div class="grp" style="margin-bottom:12px"><label class="grow press" style="cursor:pointer;position:relative">
      <span style="width:18px;height:18px;display:flex;color:var(--accent-ink)">${I.upload}</span>
      <span style="flex:1;font-size:15px">${tr('Choose a backup file')}</span>
      <input type="file" id="backupfile" class="srbtn"></label></div>
    <textarea id="backuptext" class="tinput" placeholder="${tr('…or paste backup JSON here')}" spellcheck="false" aria-label="${tr('…or paste backup JSON here')}" style="min-height:96px;resize:vertical;font-family:ui-monospace,Menlo,monospace;font-size:12px"></textarea>
    <button class="bigbtn" data-action="backupRestore" style="background:var(--red);color:var(--on-red)"><span style="width:18px;height:18px;display:flex;transform:rotate(180deg)">${I.upload}</span>${tr('Restore backup')}</button>
    <p class="muted3" style="font-size:11.5px;margin-top:10px;padding:0 4px;text-align:center">${tr('Restoring replaces all current data on this device.')}</p>
  </div>`;
}
