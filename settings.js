"use strict";
/* ===== Settings ===== */
const trN=(n,one,other,p)=>tr(n===1?one:other,{...p,n,de:new Intl.PluralRules(state.lang).select(n)==='other'?'de ':''}); // one/other key; {de}: Romanian "20 de …" (as in Backup)
function activeBonusCount(){return ['overtime','night','weekend','holiday'].filter(k=>state.salary[k].on).length;}
function sheetSettings(){
  const modeLabel={light:tr('Light'),dark:tr('Dark'),auto:tr('Automatic')}[state.appearance];
  const modes=[['light','Light'],['dark','Dark'],['auto','Automatic']];
  const themeRows=state.themeOpen?modes.map(mo=>`<button class="grow press" data-action="appear:${mo[0]}" style="padding-left:44px">
      <span style="flex:1;font-size:15px">${tr(mo[1])}</span>${state.appearance===mo[0]?`<span class="check" style="width:16px;height:16px">${I.check}</span>`:''}</button>`).join(''):'';
  // consistent leading icon tile for every row → scannable, grouped hierarchy
  const tile=(ic,col)=>`<span style="width:34px;height:34px;border-radius:9px;background:${col||'var(--accent-soft)'};display:flex;align-items:center;justify-content:center;color:${col?'#fff':'var(--accent)'};flex:0 0 auto"><span style="width:17px;height:17px;display:flex">${ic}</span></span>`;
  const nav=(ic,label,sub,action)=>`<button class="grow press" data-action="${action}">${tile(ic)}
      <div class="col" style="flex:1;gap:1px;min-width:0"><span style="font-size:15px;font-weight:500">${label}</span>${sub?`<span class="muted" style="font-size:12px">${sub}</span>`:''}</div>
      <span class="muted" style="width:13px;height:13px;display:flex">${I.chevron}</span></button>`;
  return `<div class="inner">
    <div class="handle"></div>
    <div class="sheethdr"><span style="width:56px"></span><span class="t">${tr('Settings')}</span><button class="link b press" data-action="sheetClose">${tr('Done')}</button></div>
    <p class="sec">${tr('Profile & pay')}</p>
    <div class="grp" style="margin-bottom:18px">
      ${nav(I.wallet,tr('Salary & premiums'),trN(activeBonusCount(),'{amt}/mo · {n} premium on','{amt}/mo · {n} premiums on',{amt:fmtN(state.salary.net)+' '+cur()}),'openSalary')}
      ${nav(I.gift,tr('Additional bonuses'),trN((state.salary.additions||[]).filter(a=>a.on!==false).length,'{n} bonus active','{n} bonuses active'),'openBonuses')}
    </div>
    <p class="sec">${tr('Region & calendar')}</p>
    <div class="grp" style="margin-bottom:18px">
      ${nav(I.calendar,tr('Region & format'),`${(COUNTRIES[state.region.country]||{}).n||'Custom'} · ${cur()}`,'openRegion')}
      ${window.SH_NATIVE&&SH_NATIVE.notif?`<div class="grow">${tile(I.clock)}<span style="flex:1;font-size:15px">${tr('Reminder before a shift')}</span>
        <button class="toggle ${remindersOn()?'on':''}" data-action="notif" aria-pressed="${remindersOn()}"><i></i></button></div>`:''}
    </div>
    <p class="sec">${tr('Appearance')}</p>
    <div class="grp" style="margin-bottom:18px">
      <button class="grow press" data-action="themeToggle">${tile(state.appearance==='dark'?I.moon:state.appearance==='light'?I.sun:I.moonstars)}
        <span style="flex:1;font-size:15px">${tr('Theme')}</span>
        <span class="muted" style="font-size:14px">${modeLabel}</span>
        <span class="chevd${state.themeOpen?' open':''}" style="width:13px;height:13px;display:flex;color:var(--text3);margin-left:8px">${I.chevron}</span></button>
      ${themeRows}
    </div>
    <p class="sec">${tr('Data')}</p>
    <div class="grp">
      ${nav(I.upload,tr('Export month (CSV)'),'','export')}
      ${nav(I.upload,tr('Backup & restore'),'','openBackup')}
      ${nav(I.rotate,tr('Run setup again'),'','runOnboard')}
      <button class="grow press" data-action="wipeData">${tile(I.trash,'var(--red)')}
      <span style="flex:1;font-size:15px;color:var(--red)">${tr('Delete all data')}</span></button>
    </div>
    <p style="text-align:center;font-size:11.5px;color:var(--text2);margin-top:22px;letter-spacing:.02em">Shift Hub ${APP_VERSION}</p>
  </div>`;
}
function sheetSalary(){
  const S=state.salary;
  const bonus=(k,label,sub)=>{const b=S[k];return `<div class="grow"><div class="col" style="flex:1;gap:1px;min-width:0"><span style="font-size:15px;font-weight:500">${label}</span><span class="muted" style="font-size:12px">${sub}</span></div>
    <button class="toggle ${b.on?'on':''}" data-action="bon:${k}" aria-pressed="${b.on}"><i></i></button></div>${b.on?`<div class="grow"><span style="flex:1;font-size:14px" class="muted">${tr('Paid extra')}</span><div class="stepper"><button data-action="bpm:${k}" aria-label="${tr('Decrease')}">${I.minus}</button><span class="sv"><b>+${b.pct}%</b></span><button data-action="bpp:${k}" aria-label="${tr('Increase')}">${I.plus}</button></div></div>`:''}`;};
  return `<div class="inner">
    <div class="handle"></div>
    <div class="sheethdr"><button class="link press" data-action="backSettings"><span style="display:inline-flex;vertical-align:-3px;width:17px;height:17px">${I.chevL}</span>${tr('Settings')}</button><span class="t">${tr('Salary')}</span><button class="link b press" data-action="sheetClose">${tr('Done')}</button></div>
    <p class="sec">${tr('Net monthly salary')}</p>
    <div class="grp" style="margin-bottom:20px"><div class="grow"><span style="flex:1;font-size:15px">${tr('Net salary')}</span>
      <input id="netinput" type="number" inputmode="numeric" value="${S.net}" style="width:118px;text-align:right;background:var(--fill);border:1px solid var(--card-border);border-radius:9px;color:var(--text);font-size:15px;font-weight:700;padding:8px 10px;outline:none;font-family:inherit"><span class="muted" style="font-size:13px;margin-left:8px">${cur()}</span></div></div>
    <p class="sec">${tr('Premiums at your workplace')}</p>
    <div class="grp">
      ${bonus('overtime',tr('Overtime'),tr('Extra hours beyond the shift'))}
      ${bonus('night',tr('Night shift'),tr('Paid for the whole night shift'))}
      ${bonus('weekend',tr('Weekend'),weekendLabel())}
      ${bonus('holiday',tr('Public holiday'),tr('public holidays'))}
    </div>
    <p class="muted3" style="font-size:11.5px;padding:0 4px;margin-top:10px;margin-bottom:20px">${tr('Turn a premium off to hide it from the HUB. Night overtime = overtime% + night%.')}</p>
    <p class="sec">${tr('Extra earnings')}</p>
    <div class="grp"><button class="grow press" data-action="openBonuses">
      <span style="width:34px;height:34px;border-radius:9px;background:var(--accent-soft);display:flex;align-items:center;justify-content:center;color:var(--accent)"><span style="width:17px;height:17px;display:flex">${I.gift}</span></span>
      <div class="col" style="flex:1;gap:1px;min-width:0"><span style="font-size:15px;font-weight:500">${tr('Additional bonuses')}</span><span class="muted" style="font-size:12px">${trN((S.additions||[]).filter(a=>a.on!==false).length,'{n} bonus active','{n} bonuses active')}</span></div>
      <span class="muted" style="width:13px;height:13px;display:flex">${I.chevron}</span></button></div>
    <p class="muted3" style="font-size:11.5px;padding:0 4px;margin-top:10px">${tr('Attendance bonus, 13th salary and other extras that are not tied to a shift.')}</p>
  </div>`;
}
function sheetBonuses(){
  const list=state.salary.additions||[], D=state.bonusDraft, editing=!!state.bonusEditId, showMonth=(D.freq==='annual'||D.freq==='once'), showYear=(D.freq==='once');
  const rows=list.length?list.map(a=>{
    const sub=(a.freq==='annual'||a.freq==='once')?freqLabel(a.freq)+' · '+cap(monthName((a.month||1)-1,a.freq==='once'?false:true))+(a.freq==='once'?' '+(a.year||''):''):freqLabel(a.freq);
    return `<div class="grow"><button class="col press" data-action="bonusEdit:${a.id}" style="flex:1;gap:1px;min-width:0;align-items:flex-start;text-align:left;background:none">
      <span style="font-size:15px;font-weight:500${a.on===false?';opacity:.5':''}">${esc(a.name||tr('Bonus'))}</span>
      <span class="muted" style="font-size:12px">${sub} · ${fmtN(a.amount)} ${cur()}</span></button>
      <button class="toggle ${a.on!==false?'on':''}" data-action="bonusTog:${a.id}" aria-pressed="${a.on!==false}"><i></i></button>
      <button class="press" data-action="bonusDel:${a.id}" aria-label="${tr('Delete')}" style="width:28px;height:28px;display:flex;align-items:center;justify-content:center;color:var(--red);margin-left:6px"><span style="width:15px;height:15px;display:flex">${I.trash}</span></button></div>`;
  }).join(''):`<div class="grow"><span class="muted" style="font-size:13px">${tr('No extra earnings yet')}</span></div>`;
  const freqs=[['monthly','Monthly'],['weekly','Weekly'],['annual','Annually'],['once','One-time']];
  const freqBtns=freqs.map(f=>`<button class="brush press${D.freq===f[0]?' on':''}" data-action="bfreq:${f[0]}" style="flex:1;justify-content:center;padding:9px 0;font-size:13px">${tr(f[1])}</button>`).join('');
  return `<div class="inner">
    <div class="handle"></div>
    <div class="sheethdr"><button class="link press" data-action="${state.bonusFrom==='salary'?'backSalary':'backSettings'}"><span style="display:inline-flex;vertical-align:-3px;width:17px;height:17px">${I.chevL}</span>${state.bonusFrom==='salary'?tr('Salary'):tr('Settings')}</button><span class="t">${tr('Extra earnings')}</span><button class="link b press" data-action="sheetClose">${tr('Done')}</button></div>
    <p class="sec">${tr('Your extra earnings')}</p>
    <div class="grp" style="margin-bottom:20px">${rows}</div>
    <p class="sec">${editing?tr('Edit bonus'):tr('Add a bonus')}</p>
    <div class="grp" style="margin-bottom:12px">
      <div class="grow"><span style="flex:1;font-size:15px">${tr('Name')}</span>
        <input class="tinput" id="bonusname" value="${esc(D.name)}" placeholder="${tr('e.g. 13th salary')}" spellcheck="false" style="width:150px"></div>
      <div class="grow"><span style="flex:1;font-size:15px">${tr('Amount')}</span>
        <input class="tinput" id="bonusamt" type="number" inputmode="numeric" value="${D.amount}" placeholder="0" style="width:110px;text-align:right"><span class="muted" style="font-size:13px;margin-left:8px">${cur()}</span></div>
    </div>
    <p class="sec">${tr('Frequency')}</p>
    <div class="brushbar" style="gap:6px;margin-bottom:${showMonth?'12px':'14px'}">${freqBtns}</div>
    ${showMonth?`<div class="grp" style="margin-bottom:14px"><div class="grow"><span style="flex:1;font-size:15px">${tr('Payment month')}</span>
      <div class="stepper"><button data-action="bMm" aria-label="${tr('Previous month')}">${I.minus}</button><span class="sv" style="min-width:64px"><b>${cap(monthName((D.month||1)-1,true))}</b></span><button data-action="bMp" aria-label="${tr('Next month')}">${I.plus}</button></div></div>
      ${showYear?`<div class="grow"><span style="flex:1;font-size:15px">${tr('Year')}</span>
      <div class="stepper"><button data-action="bYm" aria-label="${tr('Previous year')}">${I.minus}</button><span class="sv"><b>${D.year}</b></span><button data-action="bYp" aria-label="${tr('Next year')}">${I.plus}</button></div></div>`:''}</div>`:''}
    <button class="bigbtn press" data-action="bonusSave">${editing?tr('Save bonus'):tr('Add bonus')}</button>
    ${editing?`<button class="delbtn press" data-action="bonusCancelEdit">${tr('Cancel')}</button>`:''}
    <p class="muted3" style="font-size:11.5px;padding:0 4px;margin-top:12px">${tr('Weekly amounts are averaged into each month. Annual and one-time pay only in the chosen month.')}</p>
  </div>`;
}
function syncBonusDraft(){ const n=document.getElementById('bonusname'), a=document.getElementById('bonusamt'); if(n)state.bonusDraft.name=n.value; if(a)state.bonusDraft.amount=a.value; } // keep typed values across re-renders
function weekendLabel(){ const a=state.region.weekendDays.slice().sort((x,y)=>x-y).map(d=>dowShort(d)); return a.length?a.join(' / '):'none'; }
function sheetRegion(){
  const R=state.region, sh=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'], MON=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const langList=LANGS.map(l=>`<button class="optrow${(state.lang||'en')===l[0]?' on':''}" data-action="lang:${l[0]}"><span style="flex:1;font-size:15px">${l[1]}</span>${(state.lang||'en')===l[0]?`<span class="check" style="width:16px;height:16px">${I.check}</span>`:''}</button>`).join('');
  const coList=COUNTRY_ORDER.map(c=>`<button class="optrow${R.country===c?' on':''}" data-action="country:${c}"><span class="ob-flag" style="font-size:18px;width:22px;margin-right:8px">${flag(c)}</span><span style="flex:1;font-size:15px">${COUNTRIES[c].n}</span><span class="muted" style="font-size:12px;margin-right:8px">${COUNTRIES[c].cur}</span>${R.country===c?`<span class="check" style="width:16px;height:16px">${I.check}</span>`:''}</button>`).join('');
  const chList=(R.customHolidays||[]).length?(R.customHolidays.map((h,i)=>`<div class="grow"><span style="flex:1;font-size:14px">${esc(h.name||'—')}</span><span class="muted" style="font-size:13px;margin-right:10px">${h.d} ${monthName((h.m||1)-1,false)}</span><button class="press" data-action="chDel:${i}" aria-label="${tr('Remove')}" style="width:26px;height:26px;display:flex;align-items:center;justify-content:center;color:var(--red)"><span style="width:15px;height:15px;display:flex">${I.xmark}</span></button></div>`).join('')):`<div class="grow"><span class="muted" style="font-size:13px">${tr('No custom holidays yet')}</span></div>`;
  const cd=state.chDraft||{m:1,d:1,name:''};
  const curList=CURRENCIES.map(c=>`<button class="optrow${R.currency===c[0]?' on':''}" data-action="curr:${c[0]}"><span style="width:46px;font-weight:700;font-size:14px">${c[0]}</span><span style="flex:1;font-size:14px" class="muted">${c[1]}</span>${R.currency===c[0]?`<span class="check" style="width:16px;height:16px">${I.check}</span>`:''}</button>`).join('');
  const nfList=NUMFMTS.map(f=>`<button class="optrow${(R.locale||'auto')===f[0]?' on':''}" data-action="nfmt:${f[0]}"><span style="flex:1;font-size:15px">${f[0]==='auto'?tr('Device default'):f[1]}</span>${(R.locale||'auto')===f[0]?`<span class="check" style="width:16px;height:16px">${I.check}</span>`:''}</button>`).join('');
  const wsList=WEEKSTARTS.map(w=>`<button class="optrow${R.weekStart===w[0]?' on':''}" data-action="wstart:${w[0]}"><span style="flex:1;font-size:15px">${tr(w[1])}</span>${R.weekStart===w[0]?`<span class="check" style="width:16px;height:16px">${I.check}</span>`:''}</button>`).join('');
  const order=[1,2,3,4,5,6,0];
  const wDays=order.map(d=>`<button class="brush press${R.weekendDays.includes(d)?' on':''}" data-action="wday:${d}" style="flex:1;justify-content:center;padding:9px 0">${dowShort(d)}</button>`).join('');
  return `<div class="inner">
    <div class="handle"></div>
    <div class="sheethdr"><button class="link press" data-action="backSettings"><span style="display:inline-flex;vertical-align:-3px;width:17px;height:17px">${I.chevL}</span>${tr('Settings')}</button><span class="t">${tr('Region')}</span><button class="link b press" data-action="sheetClose">${tr('Done')}</button></div>
    <p class="sec">${tr('Language')}</p>
    <div class="grp" style="margin-bottom:18px">${langList}</div>
    <p class="sec">${tr('Country')}</p>
    <div class="grp" style="max-height:190px;overflow-y:auto;margin-bottom:8px">${coList}</div>
    <p class="muted3" style="font-size:11px;padding:0 4px;margin:0 0 16px">${tr('Picking a country sets its currency, week start, weekend, norm and public holidays — you can still fine-tune each below.')}</p>
    <p class="sec">${tr('Currency')}</p>
    <div class="grp" style="max-height:210px;overflow-y:auto;margin-bottom:18px">${curList}</div>
    <p class="sec">${tr('Number format')}</p>
    <div class="grp" style="margin-bottom:18px">${nfList}</div>
    <p class="sec">${tr('Week starts on')}</p>
    <div class="grp" style="margin-bottom:18px">${wsList}</div>
    <p class="sec">${tr('Weekend days')}</p>
    <div class="brushbar" style="gap:6px;margin-bottom:18px">${wDays}</div>
    <p class="sec">${tr('Standard hours / day')}</p>
    <div class="grp"><div class="grow"><div class="col" style="flex:1;gap:1px;min-width:0"><span style="font-size:15px">${tr('Full-day norm')}</span><span class="muted" style="font-size:11.5px">${tr('Sets the monthly norm and the hourly rate')}</span></div>
      <div class="stepper"><button data-action="stdM" aria-label="${tr('Decrease')}">${I.minus}</button><span class="sv"><b>${R.stdHours} h</b></span><button data-action="stdP" aria-label="${tr('Increase')}">${I.plus}</button></div></div></div>
    <p class="sec" style="margin-top:18px">${tr('Custom holidays (repeat yearly)')}</p>
    <div class="grp" style="margin-bottom:10px">${chList}</div>
    <div class="grp"><div class="grow" style="gap:8px;flex-wrap:wrap">
      <input class="tinput" id="chname" value="${esc(cd.name)}" placeholder="${tr('Holiday name')}" spellcheck="false" style="flex:1;min-width:110px">
      <div class="stepper"><button data-action="chMm" aria-label="${tr('Previous month')}">${I.minus}</button><span class="sv" style="min-width:44px"><b>${monthName((cd.m||1)-1,false)}</b></span><button data-action="chMp" aria-label="${tr('Next month')}">${I.plus}</button></div>
      <div class="stepper"><button data-action="chDm" aria-label="${tr('Previous day')}">${I.minus}</button><span class="sv"><b>${cd.d}</b></span><button data-action="chDp" aria-label="${tr('Next day')}">${I.plus}</button></div>
      <button class="bigbtn press" data-action="chAdd" style="margin-top:0;width:auto;padding:11px 16px">${tr('Add')}</button>
    </div></div>
    <p class="muted3" style="font-size:11.5px;padding:0 4px;margin-top:10px">${tr('Country holidays are approximate for planning; adjust any day in the calendar, and add your own recurring days here.')}</p>
  </div>`;
}
