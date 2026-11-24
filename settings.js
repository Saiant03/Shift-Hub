"use strict";
/* ===== Settings ===== */
const trN=(n,one,other,p)=>tr(n===1?one:other,{...p,n,de:deOf(n)}); // one/other key; {de}: Romanian "20 de …"
function activeBonusCount(){return ['overtime','night','weekend','holiday'].filter(k=>state.salary[k].on).length;}
/* shared pieces of the Settings sheets (all use the shift editor's .inner.shsheet look) */
const stDone=()=>`<button class="press shsave" data-action="sheetClose"><span class="glass">${tr('Done')}</span></button>`;
function stTitle(t,reserve,base){ const svg=dotGlyphSVG(t,2.6,2,13,base||80,hubW()-32-reserve); return svg?`<span class="srbtn">${t}</span><span aria-hidden="true" class="shst">${svg}</span>`:t; } // too narrow for legible dots: plain text
const stSub=(back,backLbl,title)=>`<div class="stbar"><div class="handle"></div><div class="sheethdr sthd"><button class="link press" data-action="${back}"><span style="display:inline-flex;vertical-align:-3px;width:17px;height:17px">${I.chevL}</span>${backLbl}</button>${stDone()}</div></div>
    <h2 class="t sttitle" id="sheettitle">${stTitle(title,0,220)}</h2>`; // page header: back + Done, then the dot-font title (it assembles once the push has landed)
const stSec=(k,j,title,body)=>`<section class="sg" data-k="${k}" style="--j:${j}"><h3 class="sec">${title}</h3>${body}</section>`;
/* Settings pages: every row with a chevron opens its own page (sheet id → the row's label); the sheet keeps ONE height across the list and all pages */
const ST_PAGES={stNet:'Net salary',stPrem:'Premiums',bonuses:'Extra earnings',stCountry:'Country',stCurNf:'Currency & format',stWeek:'Week',stHol:'Custom holidays',stLang:'Language',backup:'Backup'};
const ST_SAL=['stNet','stPrem'], ST_REG=['stCountry','stCurNf','stWeek','stHol','stLang'];
const inSettings=s=>s==='settings'||ST_PAGES[s]!==undefined;
const stPage=(page,body)=>`<div class="inner shsheet stsheet">
    ${stSub('backSettings',tr('Settings'),tr(ST_PAGES[page]))}
    <section class="sg">${body}</section>
  </div>`;
const stile=ic=>`<span class="stile">${ic}</span>`;
const schev=()=>`<span class="schev">${I.chevron}</span>`;
const stStep=(lbl,sub,val,minus,plus)=>`<div class="grow"><span class="slbl">${lbl}${sub?`<small class="ssub">${sub}</small>`:''}</span>
  <div class="stepper"><button data-action="${minus}" aria-label="${esc(tr('Decrease {x}',{x:lbl}))}">${I.minus}</button><span class="sv"><b>${val}</b></span><button data-action="${plus}" aria-label="${esc(tr('Increase {x}',{x:lbl}))}">${I.plus}</button></div></div>`;
const stStd=()=>`<div class="grp" style="margin-top:16px">${stStep(tr('Full-day norm'),tr('Sets the monthly norm and the hourly rate'),state.region.stdHours+' h','stdM','stdP')}</div>`;
const stAcc=(id,open,body)=>`<div class="acc${open?' open':''}" id="${id}"${open?'':' inert'}><div class="acc-i"><div class="acc-c">${body}</div></div></div>`; // grid-rows accordion: closed = inert + hidden from assistive tech
const stOpt=(act,on,body)=>`<button class="optrow${on?' on':''}" role="radio" aria-checked="${on}" data-action="${act}">${body}${on?`<span class="check">${I.check}</span>`:''}</button>`;
function setFilter(){ // Settings search: hide in place (no re-render, so the keyboard stays up); the rows that stay glide to their new place
  const sh=document.getElementById('sheet'), q=coFold((state.setQ||'').trim()), box=document.getElementById('setnone'); if(!box)return;
  const els=[...sh.querySelectorAll('.sg,.sit')].filter(e=>e.getClientRects().length), t0=new Map(els.map(e=>[e,kTop(e)])), h0=sh.offsetHeight; let n=0;
  sh.querySelectorAll('.sit').forEach(it=>{ const h=!coFold(it.querySelector('.slbl').textContent).includes(q); it.hidden=h; if(!h)n++; });
  sh.querySelectorAll('.sg').forEach(g=>{ g.hidden=!g.querySelector('.sit:not([hidden])'); });
  box.hidden=!!n; document.getElementById('setstat').textContent=q?(n?trN(n,'{n} result','{n} results'):tr('No results')):'';
  if(reduce)return; const A={duration:280,easing:MO.ios}, dy=e=>t0.has(e)?t0.get(e)-kTop(e):0;
  els.forEach(e=>{ if(e.hidden)return; const d=dy(e)-(e.classList.contains('sit')?dy(e.closest('.sg')):0); if(Math.abs(d)>1) e.animate([{transform:`translateY(${d}px)`},{transform:'none'}],A); }); // a row inside a gliding group only moves by its own share
  const h1=sh.offsetHeight; if(Math.abs(h1-h0)>1) sh.animate([{height:h0+'px'},{height:h1+'px'}],A); }
function sheetSettings(){
  const R=state.region, q=state.setQ||'', fq=coFold(q.trim()), hit=l=>coFold(l).includes(fq), S=state.salary;
  const modeLabel={light:tr('Light'),dark:tr('Dark'),auto:tr('Automatic')}[state.appearance];
  const modes=[['light','Light'],['dark','Dark'],['auto','Automatic']];
  const nav=(ic,label,val,pg)=>[label,h=>`<button class="sit srow press" data-action="${pg==='bonuses'?'openBonuses':pg==='backup'?'openBackup':'go:'+pg}" data-pg="${pg}"${h}>${stile(ic)}<span class="slbl">${label}</span>${val?`<span class="sval">${val}</span>`:''}${schev()}</button>`];
  const theme=[tr('Theme'),h=>`<div class="sit"${h}><button class="srow press" data-action="themeToggle" aria-expanded="${state.themeOpen}" aria-controls="themeacc">${stile(state.appearance==='dark'?I.moon:state.appearance==='light'?I.sun:I.moonstars)}
      <span class="slbl">${tr('Theme')}</span><span class="sval">${modeLabel}</span><span class="schev chevd${state.themeOpen?' open':''}">${I.chevron}</span></button>
    ${stAcc('themeacc',state.themeOpen,`<div role="radiogroup" aria-label="${esc(tr('Theme'))}">${modes.map(mo=>stOpt('appear:'+mo[0],state.appearance===mo[0],`<span class="slbl">${tr(mo[1])}</span>`)).join('')}</div>`)}</div>`];
  const reminder=window.SH_NATIVE&&SH_NATIVE.notif?[[tr('Reminder before a shift'),h=>`<div class="sit srow"${h}>${stile(I.clock)}<span class="slbl" aria-hidden="true">${tr('Reminder before a shift')}</span>
        <button class="toggle ${remindersOn()?'on':''}" data-action="notif" role="switch" aria-checked="${remindersOn()}" aria-label="${esc(tr('Reminder before a shift'))}"><i></i></button></div>`]]:[];
  const nfSample=R.locale&&R.locale!=='auto'?(NUMFMTS.find(f=>f[0]===R.locale)||[0,R.locale])[1]:tr('Device default');
  const groups=[
    [tr('Salary'),[nav(I.wallet,tr('Net salary'),fmtN(S.net)+' '+cur(),'stNet'),nav(I.bolt,tr('Premiums'),tr('{n} on',{n:activeBonusCount()}),'stPrem'),
      nav(I.clock,tr('Standard hours / day'),R.stdHours+' h','stNet'),nav(I.gift,tr('Additional bonuses'),String((S.additions||[]).filter(a=>a.on!==false).length),'bonuses')]],
    [tr('Region'),[nav(I.globe,tr('Country'),COUNTRIES[R.country]?countryName(R.country):tr('Custom'),'stCountry'),nav(I.wallet,tr('Currency'),cur(),'stCurNf'),nav(I.list,tr('Number format'),nfSample,'stCurNf'),
      nav(I.calendar,tr('Week starts on'),tr((WEEKSTARTS.find(w=>w[0]===R.weekStart)||WEEKSTARTS[0])[1]),'stWeek'),nav(I.sun,tr('Weekend days'),weekendLabel(),'stWeek'),nav(I.star,tr('Custom holidays'),String((R.customHolidays||[]).length),'stHol')]],
    [tr('App'),[theme,nav(I.globe,tr('Language'),(LANGS.find(l=>l[0]===(state.lang||'en'))||LANGS[0])[1],'stLang'),...reminder]],
    [tr('Data'),[nav(I.upload,tr('Backup & restore'),'','backup'),[tr('Delete all data'),h=>`<button class="sit srow press" data-action="wipeData"${h}>${stile(I.trash)}<span class="slbl" style="color:var(--red)">${tr('Delete all data')}</span></button>`]],
      `<p class="sfoot">${tr('Last backup')}: ${state.lastBackupAt?relBackup(state.lastBackupAt):tr('never')} · ${tr('Your data is saved only on this phone')}</p>`]];
  const n=groups.reduce((a,g)=>a+g[1].filter(u=>hit(u[0])).length,0), t=tr('Settings');
  return `<div class="inner shsheet stsheet">
    <div class="stbar"><div class="handle"></div><div class="sheethdr sthd"><h2 class="t" id="sheettitle">${stTitle(t,tr('Done').length*9+50)}</h2>${stDone()}</div></div>
    <div class="ssearch" data-k="q" style="--j:0"><span class="sico">${I.search}</span><input type="search" id="setq" value="${esc(q)}" placeholder="${esc(tr('Search settings'))}" aria-label="${esc(tr('Search settings'))}" autocomplete="off" autocorrect="off" autocapitalize="none" spellcheck="false" enterkeyhint="search"></div>
    <div class="srbtn" id="setstat" role="status" aria-live="polite">${fq?(n?trN(n,'{n} result','{n} results'):tr('No results')):''}</div>
    <p class="snone" id="setnone" aria-hidden="true"${n?' hidden':''}>${tr('No results')}</p>
    ${groups.map((g,i)=>`<section class="sg" data-k="g${i}" style="--j:${i+1}"${g[1].some(u=>hit(u[0]))?'':' hidden'}><h3 class="sec">${g[0]}</h3><div class="grp">${g[1].map(u=>u[1](hit(u[0])?'':' hidden')).join('')}</div>${g[2]||''}</section>`).join('')}
    <p class="sver" data-k="v" style="--j:5">Shift Hub ${APP_VERSION}</p>
  </div>`;
}
function sheetSalary(page){
  const S=state.salary;
  if(page==='stNet'){ const ft=dotNorm(fmtN(S.net)), cov=dotCovers(ft), pitch=Math.min(3.4,(hubW()-32-80)/(dotLayout(ft).cols+.2));
    return stPage(page,`<div class="samt" aria-hidden="true">${cov?`<span class="dn" id="netdots" data-count="${S.net}" data-pitch="${pitch}">${dotNumSVG(ft,pitch,ft)}</span>`:`<span class="num" id="netdots">${fmtN(S.net)}</span>`}<span class="scur">${cur()}</span></div>
      <div class="grp"><div class="grow"><label for="netinput" class="slbl">${tr('Net salary')}</label>
      <input id="netinput" class="tinput" type="number" inputmode="numeric" value="${S.net}" style="width:130px;min-width:0;text-align:right;font-weight:700"><span class="muted">${cur()}</span></div></div>${stStd()}`); }
  const bonus=(k,label,sub)=>{const b=S[k];return `<div class="pu"><div class="grow"><span class="slbl" aria-hidden="true">${label}<small class="ssub">${sub}</small></span>
    <button class="toggle ${b.on?'on':''}" data-action="bon:${k}" role="switch" aria-checked="${b.on}" aria-label="${esc(label)}"><i></i></button></div>
    ${stAcc('pa-'+k,b.on,`<div class="grow"><span class="slbl sm">${tr('Paid extra')}</span><div class="stepper"><button data-action="bpm:${k}" aria-label="${esc(tr('Decrease {x}',{x:label}))}">${I.minus}</button><span class="sv"><b>+${b.pct}%</b></span><button data-action="bpp:${k}" aria-label="${esc(tr('Increase {x}',{x:label}))}">${I.plus}</button></div></div>`)}</div>`;};
  return stPage(page,`<div class="grp">
      ${bonus('overtime',tr('Overtime'),tr('Extra hours beyond the shift'))}
      ${bonus('night',tr('Night shift'),tr('Paid for the whole night shift'))}
      ${bonus('weekend',tr('Weekend'),weekendLabel())}
      ${bonus('holiday',tr('Public holiday'),tr('public holidays'))}
    </div><p class="sfoot">${tr('Turn a premium off to hide it from the HUB. Night overtime = overtime% + night%.')}</p>`);
}
function sheetBonuses(){
  const list=state.salary.additions||[], D=state.bonusDraft, editing=!!state.bonusEditId, showMonth=(D.freq==='annual'||D.freq==='once'), showYear=(D.freq==='once');
  const rows=list.length?list.map(a=>{
    const sub=(a.freq==='annual'||a.freq==='once')?freqLabel(a.freq)+' · '+cap(monthName((a.month||1)-1,a.freq==='once'?false:true))+(a.freq==='once'?' '+(a.year||''):''):freqLabel(a.freq);
    return `<div class="grow"><button class="col press" data-action="bonusEdit:${a.id}" style="flex:1;gap:1px;min-width:0;align-items:flex-start;text-align:left;background:none">
      <span style="font-size:17px;font-weight:500;overflow-wrap:anywhere${a.on===false?';opacity:.5':''}">${esc(a.name||tr('Bonus'))}</span>
      <span class="muted" style="font-size:13px;overflow-wrap:anywhere">${sub} · ${fmtN(a.amount)} ${cur()}</span></button>
      <button class="toggle ${a.on!==false?'on':''}" data-action="bonusTog:${a.id}" role="switch" aria-checked="${a.on!==false}" aria-label="${esc(a.name||tr('Bonus'))}"><i></i></button>
      <button class="press" data-action="bonusDel:${a.id}" aria-label="${tr('Delete')}" style="width:28px;height:28px;display:flex;align-items:center;justify-content:center;color:var(--red);margin-left:6px"><span style="width:15px;height:15px;display:flex">${I.trash}</span></button></div>`;
  }).join(''):`<div class="grow"><span class="muted">${tr('No extra earnings yet')}</span></div>`;
  const freqs=[['monthly','Monthly'],['weekly','Weekly'],['annual','Annually'],['once','One-time']];
  const freqBtns=freqs.map(f=>`<button class="gp press" role="radio" aria-checked="${D.freq===f[0]}" data-action="bfreq:${f[0]}"><span class="glass${D.freq===f[0]?' on':''}">${tr(f[1])}</span></button>`).join('');
  return `<div class="inner shsheet stsheet">
    ${stSub('backSettings',tr('Settings'),tr('Extra earnings'))}
    ${stSec('l',0,tr('Your extra earnings'),`<div class="grp">${rows}</div>`)}
    ${stSec('a',1,editing?tr('Edit bonus'):tr('Add a bonus'),`<div class="grp">
      <div class="grow"><label for="bonusname" class="slbl">${tr('Name')}</label>
        <input class="tinput" id="bonusname" autocomplete="off" value="${esc(D.name)}" placeholder="${tr('e.g. 13th salary')}" spellcheck="false" style="width:160px;min-width:0"></div>
      <div class="grow"><label for="bonusamt" class="slbl">${tr('Amount')}</label>
        <input class="tinput" id="bonusamt" type="number" inputmode="numeric" value="${D.amount}" placeholder="0" style="width:120px;min-width:0;text-align:right"><span class="muted">${cur()}</span></div></div>`)}
    ${stSec('f',2,tr('Frequency'),`<div class="gpgrid" role="radiogroup" aria-label="${esc(tr('Frequency'))}">${freqBtns}</div>
      ${stAcc('accm',showMonth,`<div class="grp" style="margin-top:12px"><div class="grow"><span class="slbl">${tr('Payment month')}</span>
      <div class="stepper"><button data-action="bMm" aria-label="${tr('Previous month')}">${I.minus}</button><span class="sv" style="min-width:64px"><b>${cap(monthName((D.month||1)-1,true))}</b></span><button data-action="bMp" aria-label="${tr('Next month')}">${I.plus}</button></div></div>
      ${stAcc('accy',showYear,`<div class="grow"><span class="slbl">${tr('Year')}</span>
      <div class="stepper"><button data-action="bYm" aria-label="${tr('Previous year')}">${I.minus}</button><span class="sv"><b>${D.year}</b></span><button data-action="bYp" aria-label="${tr('Next year')}">${I.plus}</button></div></div>`)}</div>`)}`)}
    <button class="bigbtn press" data-k="sv" style="--j:3" data-action="bonusSave">${editing?tr('Save bonus'):tr('Add bonus')}</button>
    ${editing?`<button class="delbtn press" data-k="cn" style="--j:4" data-action="bonusCancelEdit">${tr('Cancel')}</button>`:''}
    <p class="sfoot" data-k="ft" style="--j:5">${tr('Weekly amounts are averaged into each month. Annual and one-time pay only in the chosen month.')}</p>
  </div>`;
}
function syncBonusDraft(){ const n=document.getElementById('bonusname'), a=document.getElementById('bonusamt'); if(n)state.bonusDraft.name=n.value; if(a)state.bonusDraft.amount=a.value; } // keep typed values across re-renders
function weekendLabel(days){ const a=(days||state.region.weekendDays).slice().sort((x,y)=>x-y).map(d=>dowShort(d)); return a.length?a.join(' / '):tr('none'); }
function sheetRegion(page){
  const R=state.region, cd=state.chDraft||{m:1,d:1,name:''}, lg=state.lang||'en', ws=Math.max(0,WEEKSTARTS.findIndex(w=>w[0]===R.weekStart));
  const langList=LANGS.map(l=>stOpt('lang:'+l[0],lg===l[0],`<span class="slbl">${l[1]}</span>`)).join('');
  const coList=countryOrder().map(c=>`<button class="optrow${R.country===c?' on':''}" role="radio" aria-checked="${R.country===c}" data-action="country:${c}"${coHit(c,state.coQ)?'':' hidden'}><span class="cc">${c}</span><span class="slbl">${countryName(c)}</span><span class="muted" style="font-size:13px">${COUNTRIES[c].cur}</span>${R.country===c?`<span class="check">${I.check}</span>`:''}</button>`).join('');
  const chList=(R.customHolidays||[]).length?(R.customHolidays.map((h,i)=>`<div class="grow"><span class="slbl">${esc(h.name||'—')}</span><span class="muted" style="margin-right:6px">${dayNum(h.d)} ${monthName((h.m||1)-1,false)}</span><button class="press" data-action="chDel:${i}" aria-label="${tr('Remove')}" style="width:26px;height:26px;display:flex;align-items:center;justify-content:center;color:var(--red)"><span style="width:15px;height:15px;display:flex">${I.xmark}</span></button></div>`).join('')):`<div class="grow"><span class="muted">${tr('No custom holidays yet')}</span></div>`;
  const curList=CURRENCIES.map(c=>stOpt('curr:'+c[0],R.currency===c[0],`<span style="width:46px;font-weight:700;font-size:15px">${c[0]}</span><span class="slbl sm muted">${c[1]}</span>`)).join('');
  const nfList=NUMFMTS.map(f=>stOpt('nfmt:'+f[0],(R.locale||'auto')===f[0],`<span class="slbl">${f[0]==='auto'?tr('Device default'):f[1]}</span>`)).join('');
  const wsSeg=`<div class="seg" role="radiogroup" aria-label="${esc(tr('Week starts on'))}"><span class="glass seg-th" aria-hidden="true" style="transform:translateX(${ws*100}%)"></span>${WEEKSTARTS.map(w=>`<button class="press${R.weekStart===w[0]?' on':''}" role="radio" aria-checked="${R.weekStart===w[0]}" data-action="wstart:${w[0]}">${tr(w[1])}</button>`).join('')}</div>`;
  const wDays=[1,2,3,4,5,6,0].map(d=>`<button class="gp press" data-action="wday:${d}" aria-pressed="${R.weekendDays.includes(d)}"><span class="glass${R.weekendDays.includes(d)?' on':''}">${dowShort(d)}</span></button>`).join('');
  const body={
    stLang:`<div class="grp" role="radiogroup" aria-label="${esc(tr('Language'))}">${langList}</div>`,
    stCountry:`<input type="search" id="coq" class="tinput" value="${esc(state.coQ||'')}" placeholder="${tr('Search country')}…" aria-label="${tr('Search country')}" autocomplete="off" autocorrect="off" autocapitalize="none" spellcheck="false" enterkeyhint="search"><div class="grp" role="radiogroup" aria-label="${esc(tr('Country'))}" style="margin-top:8px">${coList}<p id="conone" class="muted3" aria-live="polite">${Object.keys(COUNTRIES).some(c=>coHit(c,state.coQ))?'':tr('No countries found')}</p></div>
      <p class="sfoot">${tr('Picking a country sets its currency, week start, weekend, norm and public holidays — you can still fine-tune each below.')}</p>`,
    stCurNf:`<h3 class="sec">${tr('Currency')}</h3><div class="grp" role="radiogroup" aria-label="${esc(tr('Currency'))}">${curList}</div>
      <h3 class="sec" style="margin-top:22px">${tr('Number format')}</h3><div class="grp" role="radiogroup" aria-label="${esc(tr('Number format'))}">${nfList}</div>`,
    stWeek:`<h3 class="sec">${tr('Week starts on')}</h3>${wsSeg}<h3 class="sec" style="margin-top:22px">${tr('Weekend days')}</h3><div class="gprow">${wDays}</div>`,
    stHol:`<div class="grp" style="margin-bottom:10px">${chList}</div>
      <div class="grp"><div class="grow" style="gap:8px;flex-wrap:wrap">
      <input class="tinput" id="chname" autocomplete="off" value="${esc(cd.name)}" placeholder="${tr('Holiday name')}" spellcheck="false" aria-label="${tr('Holiday name')}" style="flex:1 1 100%">
      <div class="stepper"><button data-action="chMm" aria-label="${tr('Previous month')}">${I.minus}</button><span class="sv" style="min-width:44px"><b>${monthName((cd.m||1)-1,false)}</b></span><button data-action="chMp" aria-label="${tr('Next month')}">${I.plus}</button></div>
      <div class="stepper"><button data-action="chDm" aria-label="${tr('Previous day')}">${I.minus}</button><span class="sv"><b>${cd.d}</b></span><button data-action="chDp" aria-label="${tr('Next day')}">${I.plus}</button></div>
      <button class="bigbtn press" data-action="chAdd" style="margin:0 0 0 auto;width:auto;padding:0 22px">${tr('Add')}</button>
    </div></div>
    <p class="sfoot">${tr('Country holidays are approximate for planning; adjust any day in the calendar, and add your own recurring days here.')}</p>`}[page];
  return stPage(page,body);
}
