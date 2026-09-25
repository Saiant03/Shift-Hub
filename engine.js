"use strict";
/* ===== Salary engine (month-scoped) =====
   Base daily rate = net / working days of the month (Mon–Fri minus RO holidays).
   Fixed reference, so bonuses stay stable regardless of how many days are worked. */
function monthISOs(y,m){ const n=new Date(y,m+1,0).getDate(); const out=[]; for(let d=1;d<=n;d++) out.push({iso:isoOf(y,m,d),y,m,d}); return out; }
function workingDaysInMonth(y,m){ let c=0; const n=new Date(y,m+1,0).getDate();
  for(let d=1;d<=n;d++){ if(!isWeekend(y,m,d) && !isPublicHoliday(y,m,d)) c++; } return c; }
function baseHourly(y,m){ const wd=workingDaysInMonth(y,m); return wd>0 ? state.salary.net/(wd*state.region.stdHours) : 0; }
// Enabled fractions (0 when the bonus is turned off for this workplace)
function pctOf(k){ const b=state.salary[k]; return b&&b.on ? (b.pct||0)/100 : 0; }
// Extra earnings: what one component contributes to month (y,m). One switch → easy to extend.
function additionForMonth(a,y,m){ if(!a||a.on===false) return 0; const amt=+a.amount||0; if(!amt) return 0;
  switch(a.freq){
    case 'weekly': return amt*52/12;                 // stable monthly-equivalent
    case 'annual': return (m+1===(a.month||1))?amt:0; // paid once a year in the chosen month
    case 'once':   return (a.year===y && m+1===(a.month||1))?amt:0; // a single specific month
    default:       return amt;                        // 'monthly'
  } }
function additionsTotal(y,m){ return (state.salary.additions||[]).reduce((s,a)=>s+additionForMonth(a,y,m),0); }
function freqLabel(f){ return {monthly:tr('Monthly'),weekly:tr('Weekly'),annual:tr('Annually'),once:tr('One-time')}[f]||tr('Monthly'); }
// cap = the month's base factor (monthTotals(y,m).cap): the monthly base is capped at net, so a day's base share is
// scaled by it and per-day / per-week figures add up to the month. Premiums and overtime are never capped (same as monthTotals).
function dayBreakdown(x, bh, cap=1){
  const s=assignedShift(x.iso), m=metaOf(x.iso); if(!s&&!(m.otDay||m.otNight)) return null;
  const reg=s?paidHours(s):0, base=bh*reg;   // 8h shift -> net / workingDays
  // Paid leave (holiday): counts toward the month's norm like a normal day,
  // paid as base only — no night/weekend/holiday premiums and no overtime.
  if(s&&s.vac) return {s,base:base*cap,night:0,weekend:0,holiday:0,otDay:0,otNight:0,reg,
                    we:false,ho:false,otD:0,otN:0,vac:true,total:base*cap};
  const we=isWeekend(x.y,x.m,x.d), ho=isHolISO(x.iso);
  const fN=pctOf('night'), fW=pctOf('weekend'), fH=pctOf('holiday'), otOn=state.salary.overtime.on, fO=pctOf('overtime');
  const otDay = otOn ? bh*(1+fO+(we?fW:0)+(ho?fH:0))*m.otDay : 0;
  const otNight = otOn ? bh*(1+fO+fN+(we?fW:0)+(ho?fH:0))*m.otNight : 0;
  if(!s) return otDay||otNight ? {s:null,base:0,night:0,weekend:0,holiday:0,otDay,otNight,reg:0,we,ho,otD:m.otDay,otN:m.otNight,vac:false,otOnly:true,
                    total:otDay+otNight} : null; // called in on a day off: overtime pay only — not a work day, not part of the norm
  const night = s.night ? fN*bh*nightHours(s) : 0;
  const weekend = we ? fW*base : 0;
  const holiday = ho ? fH*base : 0;
  return {s,base:base*cap,night,weekend,holiday,otDay,otNight,reg,we,ho,otD:m.otDay,otN:m.otNight,vac:false,
          total:base*cap+night+weekend+holiday+otDay+otNight};
}
function shiftEst(d,paidMin){ const bh=baseHourly(TODAY.getFullYear(),TODAY.getMonth()), base=bh*(paidMin/60); // typical-weekday estimate: base pro-rata + the shift's own night premium, no weekend/holiday/OT
  return d.vac ? base : base + (d.night?pctOf('night')*bh*nightHours(d):0); }
let _mtCache={}; // monthTotals memo — cleared on any data change (saveState / clearHolidayCache)
function monthTotals(y,m){ const _k=y+'.'+m; if(_mtCache[_k]) return _mtCache[_k];
  const bh=baseHourly(y,m);
  const t={base:0,night:0,weekend:0,holiday:0,otDay:0,otNight:0,days:0,paidH:0,nightH:0,otDayH:0,otNightH:0,vacDays:0,vacH:0};
  for(const x of monthISOs(y,m)){ const b=dayBreakdown(x,bh); if(!b) continue;
    if(b.otOnly){ t.otDay+=b.otDay; t.otNight+=b.otNight; t.otDayH+=b.otD; t.otNightH+=b.otN; continue; } // overtime on a day off: pay only
    if(b.vac){ t.vacDays++; t.vacH+=b.reg; continue; }   // paid leave — counted separately
    t.night+=b.night;t.weekend+=b.weekend;t.holiday+=b.holiday;t.otDay+=b.otDay;t.otNight+=b.otNight;
    t.days++;t.paidH+=b.reg; if(b.s.night)t.nightH+=nightHours(b.s); t.otDayH+=b.otD;t.otNightH+=b.otN;
  }
  t.otTotal=t.otDay+t.otNight; t.bonusTotal=t.night+t.weekend+t.holiday+t.otTotal;
  // Base = the net set in Settings, pro-rated against the month's norm (workingDays × 8).
  // Both worked hours and paid-leave (holiday) hours count toward the norm, so a leave
  // day reduces the work days still required. Full norm -> full net regardless of the
  // month's working-day count (19–23); a partial month is reduced pro-rata; beyond the
  // norm it is capped at net (extra is entered as overtime).
  const norm=workingDaysInMonth(y,m)*state.region.stdHours;
  const fulfilled=t.paidH+t.vacH;
  t.base= norm>0 ? state.salary.net*Math.min(1, fulfilled/norm) : 0;
  t.cap= norm>0&&fulfilled>norm ? norm/fulfilled : 1; // per-day base factor for dayBreakdown, so days sum to t.base
  t.additions=additionsTotal(y,m); // extra, non-shift earnings for this month (separate layer — base/premiums untouched)
  t.grand=t.base+t.bonusTotal+t.additions;
  return _mtCache[_k]=t;
}
function csvExport(y,m){
  const bh=baseHourly(y,m), cap=monthTotals(y,m).cap;
  const lines=[`Day,Shift,Paid h,OT day,OT night,Weekend,Holiday,Pay (${cur()})`];
  for(const x of monthISOs(y,m)){ const s=assignedShift(x.iso),b=dayBreakdown(x,bh,cap);
    lines.push([x.d, s?'"'+(/^[=+\-@\t\r]/.test(s.name)?"'":'')+s.name.replace(/"/g,'""')+'"':'Off', s?paidHours(s).toFixed(1):0, b?b.otD:0, b?b.otN:0, // quoted: a comma can't shift the columns; a leading =+-@ can't run as a spreadsheet formula
      isWeekend(x.y,x.m,x.d)?'yes':'no', isHolISO(x.iso)?'yes':'no', b?Math.round(b.total):0].join(','));
  }
  return lines.join('\n');
}
let _nfLoc=null,_nf=null;
function fmtN(n){ n=Math.round(+n||0);
  const loc=(state.region&&state.region.locale)||'en-US';
  if(_nfLoc!==loc){ try{_nf=new Intl.NumberFormat(loc==='auto'?undefined:loc);}catch(e){_nf=null;} _nfLoc=loc; }
  try{ return _nf?_nf.format(n):String(n).replace(/\B(?=(\d{3})+(?!\d))/g,','); }
  catch(e){ return String(n).replace(/\B(?=(\d{3})+(?!\d))/g,','); } }
function cur(){ return (state.region&&state.region.currency)||''; }
