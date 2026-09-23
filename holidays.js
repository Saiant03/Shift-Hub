"use strict";
/* ===== Public holidays — country presets + custom (any year) ===== */
const holidayCache={};
function clearHolidayCache(){ _mtCache={}; for(const k in holidayCache) delete holidayCache[k]; }
function isoUTC(dt){return dt.getUTCFullYear()+'-'+pad(dt.getUTCMonth()+1)+'-'+pad(dt.getUTCDate());}
function orthodoxEaster(year){
  const a=year%4,b=year%7,c=year%19,d=(19*c+15)%30,e=(2*a+4*b-d+34)%7;
  const month=Math.floor((d+e+114)/31),day=((d+e+114)%31)+1;
  const jd=new Date(Date.UTC(year,month-1,day)); jd.setUTCDate(jd.getUTCDate()+13); return jd;
}
function gregorianEaster(year){ const a=year%19,b=Math.floor(year/100),c=year%100,d=Math.floor(b/4),e=b%4,f=Math.floor((b+8)/25),g=Math.floor((b-f+1)/3),h=(19*a+b-d-g+15)%30,i=Math.floor(c/4),k=c%4,l=(32+2*e+2*i-h-k)%7,mo=Math.floor((a+11*h+22*l)/451),month=Math.floor((h+l-7*mo+114)/31),day=((h+l-7*mo+114)%31)+1; return new Date(Date.UTC(year,month-1,day)); }
function addUTC(dt,n){const x=new Date(dt);x.setUTCDate(x.getUTCDate()+n);return x;}
function nthWeekdayUTC(y,m,dow,n){ const first=new Date(Date.UTC(y,m-1,1)); const day=1+((dow-first.getUTCDay()+7)%7)+(n-1)*7; return new Date(Date.UTC(y,m-1,day)); }
function lastWeekdayUTC(y,m,dow){ const last=new Date(Date.UTC(y,m,0)); const day=last.getUTCDate()-((last.getUTCDay()-dow+7)%7); return new Date(Date.UTC(y,m-1,day)); }
function obsShift(dt,mode){ const wd=dt.getUTCDay(); // first candidate for the observed day off; countryHolidaySet moves it past days already off
  if(mode==='mon'){ if(wd===0) return addUTC(dt,1); if(wd===6) return addUTC(dt,2); }
  else if(mode==='sun'||mode==='jp'){ if(wd===0) return addUTC(dt,1); } // ZA, JP: only a Sunday holiday moves (JP never substitutes a Saturday)
  else if(mode==='us'){ if(wd===6) return addUTC(dt,-1); if(wd===0) return addUTC(dt,1); }
  return null; }
function countryHolidaySet(code,year){ const C=COUNTRIES[code]||COUNTRIES.RO; const s=new Set(), fixed=[];
  for(const y of [year,year+1]){ const we=gregorianEaster(y), oe=orthodoxEaster(y); // year+1 too: US New Year on a Saturday is observed on 31 Dec of this year
    for(const r of C.d){ let dt;
      if(r[0]==='E') dt=addUTC(we,r[1]);
      else if(r[0]==='O') dt=addUTC(oe,r[1]);
      else if(r[0]==='N') dt=nthWeekdayUTC(y,r[1],r[2],r[3]);
      else if(r[0]==='L') dt=lastWeekdayUTC(y,r[1],r[2]);
      else { dt=new Date(Date.UTC(y,r[0]-1,r[1])); fixed.push(dt); }
      if(y===year) s.add(isoUTC(dt)); } }
  if(C.sub) for(const dt of fixed){ let o=obsShift(dt,C.sub); if(!o) continue; // observed days only after all real ones are known
    if(C.sub!=='us') while(s.has(isoUTC(o))||C.we.includes(o.getUTCDay())) o=addUTC(o,1); // GB: Christmas Sat → Mon 27, Boxing Day Sun → Tue 28 (not Mon twice)
    if(o.getUTCFullYear()===year) s.add(isoUTC(o)); }
  return s; }
function holidaysFor(year){ if(holidayCache[year]) return holidayCache[year];
  const s=countryHolidaySet(state.region.country||'RO', year);
  (state.region.customHolidays||[]).forEach(h=>{ if(h&&h.m&&h.d) s.add(isoOf(year,h.m-1,h.d)); });
  holidayCache[year]=s; return s; }
function isPublicHoliday(y,m,d){ return holidaysFor(y).has(isoOf(y,m,d)); }
function daysInMon(m){ return [31,29,31,30,31,30,31,31,30,31,30,31][m-1]; }
function isHolISO(iso){ const [y]=iso.split('-').map(Number); const meta=state.dayMeta[iso]; return (meta&&meta.holiday) || holidaysFor(y).has(iso); }
