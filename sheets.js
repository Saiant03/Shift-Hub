"use strict";
/* ===== Sheets ===== */
function stepRow(lbl,val,minus,plus){return `<div class="row" style="padding:12px 15px;min-height:46px"><span style="font-size:15px;flex:1">${lbl}</span>
  <div class="stepper"><button data-action="${minus}" aria-label="decrease">${I.minus}</button><span class="sv"><b>${val}</b></span><button data-action="${plus}" aria-label="increase">${I.plus}</button></div></div>`;}
function stepRowInline(lbl,sub,val,minus,plus){return `<div class="col" style="flex:1;gap:1px;min-width:0"><span style="font-size:15px;font-weight:500">${lbl}</span><span class="muted" style="font-size:11.5px">${sub}</span></div>
  <div class="stepper"><button data-action="${minus}" aria-label="decrease">${I.minus}</button><span class="sv"><b>${val}</b></span><button data-action="${plus}" aria-label="increase">${I.plus}</button></div>`;}

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
  return `<div class="inner">
    <div class="handle"></div>
    <div class="sheethdr"><button class="link press" data-action="sheetClose">${tr('Cancel')}</button>
      <span class="t">${sd} ${cap(monthName(sm-1,true))}</span>
      <button class="link b press" data-action="metaSave">${tr('Save')}</button></div>
    <div class="card" style="padding:16px;margin-bottom:20px">
      <div class="row"><div class="col" style="gap:3px;flex:1;min-width:0">
        <span class="muted" style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.5px">${tr('Extra this day')}</span>
        <span class="muted3" style="font-size:13px">${s?shiftLabel(s):tr('No shift')}${swe?' · '+tr('weekend'):''}${ho?' · '+tr('holiday'):''}</span></div>
        <span class="num" style="font-size:26px;font-weight:800;color:var(--accent);letter-spacing:-.5px">+${fmtN(extra)}</span></div>
    </div>
    ${otOn?`<p class="sec">${tr('Overtime hours')}</p>
    <div class="grp" style="margin-bottom:22px">
      <div class="grow">${stepRowInline(tr('Day overtime'),'+'+S.overtime.pct+'%',state.draftOtDay+' h','otDayM','otDayP')}</div>
      <div class="grow">${stepRowInline(tr('Night overtime'),'+'+S.overtime.pct+'%'+(S.night.on?' +'+S.night.pct+'%':''),state.draftOtNight+' h','otNightM','otNightP')}</div>
    </div>`:''}
    ${holOn?`<p class="sec">${tr('Public holiday')}</p>
    <div class="grp" style="margin-bottom:14px"><div class="grow"><div class="col" style="flex:1;gap:2px">
      <span style="font-size:15px;font-weight:500">${tr('Public holiday · +{p}%',{p:S.holiday.pct})}</span>
      <span class="muted" style="font-size:12px">${autoHol?tr('Public holiday (auto)'):tr('Mark as a holiday')}</span></div>
      <button class="toggle ${ho?'on':''}" data-action="holToggle" aria-pressed="${ho}" ${autoHol?'style="opacity:.55;pointer-events:none"':''}><i></i></button></div></div>`:''}
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
      <input class="hexin" id="cphex" value="${col}" maxlength="7" spellcheck="false" aria-label="Hex colour"></div>
    <div class="presets">${PRESET_COLORS.map(c=>`<button class="pcol${col.toLowerCase()===c.toLowerCase()?' on':''}" style="background:${c}" data-action="preset:${c}" aria-label="${c}"></button>`).join('')}</div>
  </div>`;
}
function sheetShift(){
  const d=state.d, col=draftColor();
  const dur=(()=>{const x=d.end-d.start;return x<=0?x+1440:x;})();
  const paid=Math.max(0,dur-d.brk);
  const icons=SHIFT_ICONS.map(ic=>`<button class="icb${d.icon===ic?' on':''}" data-action="shIcon:${ic}" aria-label="${ic}">${I[ic]}</button>`).join('');
  const isCustom=state.editingId && !['m','a','n'].includes(state.editingId) && !lastLeave(shiftById(state.editingId));
  return `<div class="inner">
    <div class="handle"></div>
    <div class="sheethdr"><button class="link press" data-action="sheetClose">${tr('Cancel')}</button>
      <span class="t">${state.isNew?tr('New shift'):tr('Edit shift')}</span>
      <button class="link b press" data-action="shiftSave">${tr('Save')}</button></div>
    <div class="preview" style="background:${col};margin-bottom:18px">
      <div class="hd"><div class="ic">${I[d.icon]}</div>
        <div class="col" style="gap:1px"><div id="shprevname" style="font-size:16px;font-weight:800">${esc(d.name)||tr('Untitled')}</div>
          <div class="num" style="font-size:13px;color:rgba(255,255,255,.85)">${d.vac?hmLabel(paid)+' · '+tr('leave'):timeStr(d.start)+'–'+timeStr(d.end)}</div></div></div>
      <div class="stats"><div class="statcol"><div class="v">${hmLabel(dur)}</div><div class="l">${tr('total')}</div></div>
        <div class="statcol"><div class="v">${d.brk}m</div><div class="l">${tr('break')}</div></div>
        <div class="statcol"><div class="v">${hmLabel(paid)}</div><div class="l">${tr('paid')}</div></div>
        <div class="statcol"><div class="v">≈${fmtN(shiftEst(d,paid))}</div><div class="l">${cur()}</div></div></div>
    </div>
    <p class="sec">${tr('Name')}</p>
    <input class="tinput" id="shname" value="${esc(d.name)}" placeholder="${tr('Shift name')}" spellcheck="false" style="margin-bottom:18px">
    ${(!state.shifts.some(s=>s.vac&&s.id!==state.editingId))?`<p class="sec">${tr('Type')}</p>
    <div class="card" style="padding:14px;margin-bottom:18px"><div class="row"><div class="col" style="flex:1;gap:1px;min-width:0"><span style="font-size:15px">${tr('Paid leave (holiday)')}</span><span class="muted" style="font-size:11.5px">${tr('Counts toward the month, paid as a normal day, no premiums or break')}</span></div>
      <button class="toggle ${d.vac?'on':''}" data-action="shVac" aria-pressed="${d.vac}"><i></i></button></div></div>`:''}
    ${d.vac?`<p class="sec">${tr('Paid hours')}</p>
    <div class="card" style="overflow:hidden;margin-bottom:18px">${stepRow(tr('Hours paid per leave day'),hmLabel(paid),'vacHM','vacHP')}</div>`:`<p class="sec">${tr('Schedule')}</p>
    <div class="card" style="overflow:hidden;margin-bottom:18px">
      ${stepRow(tr('Start'),timeStr(d.start),'sM','sP')}<hr class="divider">
      ${stepRow(tr('End'),timeStr(d.end),'eM','eP')}<hr class="divider">${stepRow(tr('Break'),d.brk+' min','bM','bP')}
    </div>
    <p class="sec">${tr('Night shift')}</p>
    <div class="card" style="padding:14px;margin-bottom:18px"><div class="row"><span style="font-size:15px;flex:1">${tr('Paid +25% for the whole shift')}</span>
      <button class="toggle ${d.night?'on':''}" data-action="shNight" aria-pressed="${d.night}"><i></i></button></div></div>`}
    <p class="sec">${tr('Icon')}</p>
    <div class="card" style="margin-bottom:18px"><div class="iconrow">${icons}</div></div>
    <p class="sec">${tr('Colour')}</p>
    <div class="card">${colorPickerHTML()}</div>
    ${isCustom?`<button class="delbtn press" data-action="shiftDelete">${tr('Delete shift')}</button>`:''}
  </div>`;
}
function sheetExport(){
  return `<div class="inner">
    <div class="handle"></div>
    <div class="sheethdr" style="justify-content:space-between"><span style="font-size:20px;font-weight:800">${cap(monthName(state.viewM,true))} ${state.viewY}</span>
      <button class="link press" data-action="sheetClose">${tr('Close')}</button></div>
    <div class="csvbox">${esc(csvExport(state.viewY,state.viewM))}</div>
    <button class="bigbtn" data-action="csvCopy"><span style="width:18px;height:18px;display:flex">${I.upload}</span>${tr('Copy CSV')}</button>
    <p class="muted3" style="font-size:11.5px;margin-top:10px;text-align:center">${tr('Downloads are blocked in preview; this copies to the clipboard.')}</p>
  </div>`;
}
function sheetBackup(){
  const json=exportBackup();
  const counts=`${state.shifts.length} shifts · ${Object.keys(state.assignments).length} assigned days`;
  return `<div class="inner">
    <div class="handle"></div>
    <div class="sheethdr"><button class="link press" data-action="backSettings"><span style="display:inline-flex;vertical-align:-3px;width:17px;height:17px">${I.chevL}</span>${tr('Settings')}</button><span class="t">${tr('Backup')}</span><button class="link b press" data-action="sheetClose">${tr('Done')}</button></div>
    <div style="background:var(--fill);border-radius:14px;padding:12px 14px;margin-bottom:14px">
      <div style="font-size:14px;font-weight:600${state.lastBackupAt?'':';color:var(--accent)'}">${tr('Last backup')}: ${state.lastBackupAt?relBackup(state.lastBackupAt):tr('never')}</div>
      <div class="muted" style="font-size:12px;margin-top:3px">${tr('Your data is saved only on this phone')}</div>
    </div>
    <p class="sec">${tr('Export')}</p>
    <div class="csvbox" style="max-height:150px;font-size:11px">${esc(json)}</div>
    <div class="row" style="gap:10px;margin-top:12px">
      <button class="bigbtn" data-action="backupDownload" style="margin-top:0"><span style="width:18px;height:18px;display:flex">${I.upload}</span>${tr('Download')}</button>
      <button class="bigbtn" data-action="backupCopy" style="margin-top:0;background:var(--fill);color:var(--text)">${tr('Copy')}</button>
    </div>
    <p class="muted3" style="font-size:11.5px;margin-top:8px;padding:0 4px">${counts}</p>
    <p class="sec" style="margin-top:20px">${tr('Restore')}</p>
    <div class="grp" style="margin-bottom:12px"><label class="grow press" style="cursor:pointer">
      <span style="width:18px;height:18px;display:flex;color:var(--accent)">${I.upload}</span>
      <span style="flex:1;font-size:15px">${tr('Choose a backup file')}</span>
      <input type="file" id="backupfile" style="display:none"></label></div>
    <textarea id="backuptext" class="tinput" placeholder="${tr('…or paste backup JSON here')}" spellcheck="false" style="min-height:96px;resize:vertical;font-family:ui-monospace,Menlo,monospace;font-size:12px"></textarea>
    <button class="bigbtn" data-action="backupRestore" style="background:var(--red)"><span style="width:18px;height:18px;display:flex;transform:rotate(180deg)">${I.upload}</span>${tr('Restore backup')}</button>
    <p class="muted3" style="font-size:11.5px;margin-top:10px;padding:0 4px;text-align:center">${tr('Restoring replaces all current data on this device.')}</p>
  </div>`;
}
