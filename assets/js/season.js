"use strict";

/* ============================================================
   SEASON PAGE RENDERER — builds the fixture book from
   data/tours.js (SEASON, TOURS). Hero stats are computed from
   the data so they can never drift from the fixtures below.
   ============================================================ */

const filters = {};
TOURS.forEach(t => filters[t.id] = 'ALL');

function ballFor(f){return f==='TEST' ? '<span class="ball red"></span>' : '<span class="ball white"></span>';}
function statusCls(s){return s==='Completed'?'done':(s==='Starting Soon'?'soon':'up');}

function seasonStats(){
  return {
    tours: TOURS.length,
    matches: TOURS.reduce((n,t)=>n+t.matches.length,0),
    tests: TOURS.reduce((n,t)=>n+t.matches.filter(m=>m.format==='TEST').length,0),
    grounds: new Set(TOURS.flatMap(t=>t.matches.map(m=>m.stadium))).size
  };
}

function heroHTML(){
  const s = seasonStats();
  return `
  <div class="th-body">
    <div class="eyebrow">${esc(SEASON.eyebrow)}</div>
    <h1>${SEASON.titleHTML}</h1>
    <p class="hero-sub">${esc(SEASON.sub)}</p>
  </div>
  <div class="th-stats mono">
    <div class="hstat"><b>${s.tours}</b><span>Tours</span></div>
    <div class="hstat sfr"><b>${s.matches}</b><span>Matches</span></div>
    <div class="hstat red"><b>${s.tests}</b><span>Tests</span></div>
    <div class="hstat"><b>${s.grounds}</b><span>Grounds</span></div>
  </div>
  <div class="th-stub" aria-hidden="true">
    <span class="th-vert">${esc(SEASON.stubLabel)}</span>
    <span class="th-barcode"></span>
    <span class="th-no">${esc(SEASON.ticketNo)}</span>
  </div>`;
}

function ticketHTML(t,m){
  const dateBlock = m.rng
    ? `<span class="dow">${esc(m.dow)}</span><span class="rng">${esc(m.rng)}</span><span class="mm">${esc(m.mm)}</span>`
    : `<span class="dow">${esc(m.dow)}</span><span class="dd">${esc(m.dd)}</span><span class="mm">${esc(m.mm)}</span>`;
  return `
  <article class="ticket ${m.done?'done':''}">
    <div class="stub" aria-hidden="true">${dateBlock}</div>
    <div class="tk-body">
      <div class="tk-top">
        <span class="tk-num f-${m.format}">${ballFor(m.format)}${esc(m.num)}</span>
        <span class="tk-time">${esc(m.time)}</span>
      </div>
      <div class="tk-city">${esc(m.city)}</div>
      <div class="tk-venue">${esc(m.stadium)} · ${esc(m.country)}</div>
      ${m.note ? `<div class="tk-note">${esc(m.note)}</div>` : ''}
    </div>
  </article>`;
}

function foldHTML(t){
  const f = filters[t.id];
  const tickets = t.matches.filter(m => f==='ALL' || m.format===f).map(m => ticketHTML(t,m)).join('');
  const tabs = ['ALL',...t.fmtList].map(x =>
    `<button class="${x===f?'on':''}" data-tour="${t.id}" data-fmt="${x}">${x}</button>`).join('');
  const showTabs = t.fmtList.length > 1;
  return `
  <div class="fold-inner">
    ${showTabs ? `<div class="filters"><div class="tabs">${tabs}</div><span class="tz">${t.home?'All times IST':'Times shown in IST'}</span></div>`
               : `<div class="filters"><span class="tz">${t.home?'All times IST':'Times shown in IST'}</span></div>`}
    <div class="tickets">${tickets}</div>
    <div class="insight">${t.insight}</div>
  </div>`;
}

function tourHTML(t){
  return `
  <section class="tour ${t.open?'open':''}" id="${t.id}">
    <div class="tour-head">
      <div class="tour-head-l">
        <div class="tour-kicker">
          <span class="side ${t.home?'home':'away'}">${t.home?'Home':'Away'}</span>
          <span class="loc">${esc(t.country)}</span>
          <span class="sep">·</span><span>${esc(t.dates)}</span>
          <span class="sep fmt-sep">·</span><span class="fmts">${esc(t.fmtCounts)}</span>
        </div>
        <h2 class="tour-title"><span class="fl">${t.oppFlag}</span>${esc(t.title)}
          <span class="status ${statusCls(t.status)}">${esc(t.status)}</span></h2>
      </div>
      <div class="tour-head-r">
        <span class="tour-dates mono">${t.matches.length} matches</span>
        <button class="btn-fold" data-tour="${t.id}" aria-expanded="${t.open}" aria-label="Toggle ${esc(t.title)}">
          <svg viewBox="0 0 24 24"><path d="M6 9l6 6 6-6"/></svg>
        </button>
      </div>
    </div>
    <div class="tour-meta">
      ${[...new Set(t.matches.map(m=>m.city))].map(c=>`<span class="chip">${esc(c)}</span>`).join('')}
    </div>
    <div class="fold" id="fold-${t.id}">${foldHTML(t)}</div>
  </section>`;
}

function railHTML(){
  return TOURS.map(t=>{
    const cls = t.status==='Completed' ? 'past' : (t.status==='Starting Soon' ? 'live' : '');
    return `<a href="#${t.id}" class="${cls}">
      <span class="fl">${t.oppFlag}</span>
      <span class="mo">${t.month}</span>
      <span class="op">${esc(t.opponent)}</span>
    </a>`;
  }).join('');
}

function syncFold(id, open, animate){
  const el = document.getElementById('fold-'+id);
  const sec = document.getElementById(id);
  if(!el) return;
  if(!animate) el.style.transition='none';
  el.style.maxHeight = open ? el.scrollHeight+'px' : '0px';
  sec.classList.toggle('open', open);
  const btn = sec.querySelector('.btn-fold');
  if(btn) btn.setAttribute('aria-expanded', open);
  if(!animate){ void el.offsetHeight; el.style.transition=''; }
}

function initOpen(){
  // only the nearest upcoming tour opens by default
  const target = TOURS.find(t => t.status === 'Starting Soon')
              || TOURS.find(t => t.status === 'Upcoming');
  TOURS.forEach(t => { t.open = (t === target); });
}

function render(){
  renderTopbar(location.pathname.split('/').pop() || 'index.html');
  document.getElementById('heroTicket').innerHTML = heroHTML();
  document.getElementById('rail').innerHTML = railHTML();
  document.getElementById('tours').innerHTML = TOURS.map(tourHTML).join('');
  renderFooter(SEASON.footerHTML);
  TOURS.forEach(t => syncFold(t.id, t.open, false));
}

document.addEventListener('click', e => {
  const head = e.target.closest('.tour-head');
  if(head){
    const t = TOURS.find(x => x.id === head.closest('.tour').id);
    const willOpen = !t.open;
    TOURS.forEach(x => { if(x.open && x !== t){ x.open = false; syncFold(x.id, false, true); } });
    t.open = willOpen;
    syncFold(t.id, t.open, true);
    return;
  }
  const tab = e.target.closest('.tabs button');
  if(tab){
    const id = tab.dataset.tour;
    filters[id] = tab.dataset.fmt;
    const t = TOURS.find(x => x.id === id);
    const el = document.getElementById('fold-'+id);
    el.innerHTML = foldHTML(t);
    if(t.open){
      el.style.transition='none';
      el.style.maxHeight = el.scrollHeight+'px';
      void el.offsetHeight;
      el.style.transition='';
    }
  }
});

let rz=null;
window.addEventListener('resize', () => {
  clearTimeout(rz);
  rz=setTimeout(()=>TOURS.forEach(t=>t.open&&syncFold(t.id,true,false)),150);
});

// tapping a rail pill expands that tour (closing others) and scrolls to it
const SMOOTH = matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
document.addEventListener('click', e => {
  const link = e.target.closest('.rail a');
  if(link){
    e.preventDefault();
    const id = link.getAttribute('href').slice(1);
    const t = TOURS.find(x => x.id === id);
    if(!t) return;
    // sync folds instantly so heights are final before we measure scroll target
    TOURS.forEach(x => { if(x.open && x !== t){ x.open = false; syncFold(x.id, false, false); } });
    if(!t.open){ t.open = true; syncFold(id, true, false); }
    const sec = document.getElementById(id);
    const railH = document.querySelector('.rail-outer').offsetHeight;
    const top = sec.getBoundingClientRect().top + window.scrollY - railH - 24;
    window.scrollTo({top, behavior: SMOOTH});
    history.replaceState(null, '', '#' + id);
  }
});

// rail overflow: edge buttons + vertical-wheel-to-horizontal scroll
const railEl = document.getElementById('rail');
const railPrev = document.getElementById('railPrev');
const railNext = document.getElementById('railNext');
function updateRailBtns(){
  const overflow = railEl.scrollWidth > railEl.clientWidth + 4;
  railPrev.classList.toggle('show', overflow && railEl.scrollLeft > 4);
  railNext.classList.toggle('show', overflow && railEl.scrollLeft + railEl.clientWidth < railEl.scrollWidth - 4);
}
railPrev.addEventListener('click', () => railEl.scrollBy({left: -railEl.clientWidth * 0.7, behavior: SMOOTH}));
railNext.addEventListener('click', () => railEl.scrollBy({left: railEl.clientWidth * 0.7, behavior: SMOOTH}));
railEl.addEventListener('scroll', updateRailBtns, {passive: true});
railEl.addEventListener('wheel', e => {
  if(Math.abs(e.deltaY) > Math.abs(e.deltaX)){
    e.preventDefault();
    railEl.scrollLeft += e.deltaY;
  }
}, {passive: false});
window.addEventListener('resize', updateRailBtns);

initOpen();
render();
updateRailBtns();
