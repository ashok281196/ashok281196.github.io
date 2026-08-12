"use strict";

/* ============================================================
   PAPERS LISTING RENDERER — builds the reading-room page from
   data/papers.js (PAPERS). Shared chrome helpers: components.js.
   ============================================================ */

function papersTopbarHTML(){
  return `<span><a class="host" href="../" aria-label="Back to index">&larr; ${esc(SITE.host)}</a>` +
         `<span class="crumb">/${esc(PAPERS.root)}/</span></span>` +
         `<span class="loc"><span class="dot"></span>${esc(SITE.location)}</span>`;
}

function papersHeroHTML(){
  const shelves = PAPERS.categories.length;
  const n = papersCount();
  return `
  <div class="eyebrow">${esc(PAPERS.eyebrow)}</div>
  <h1>${esc(PAPERS.title)}</h1>
  <p class="intro">${esc(PAPERS.intro)}</p>
  <p class="tally">${shelves} ${shelves === 1 ? 'shelf' : 'shelves'} &middot; ${n} ${n === 1 ? 'paper' : 'papers'}</p>`;
}

function paperCardHTML(cat, p){
  const href = `view.html?c=${encodeURIComponent(cat.slug)}&p=${encodeURIComponent(p.file)}`;
  const tags = (p.tags || []).map(t => `<span>${esc(t)}</span>`).join('');
  return `
  <a class="paper" href="${esc(href)}">
    <span class="spine" aria-hidden="true">${esc(p.stamp)}</span>
    <span class="paper-body">
      <span class="p-title">${esc(p.title)} <span class="arrow">&nearr;</span></span>
      <span class="p-authors">${esc(p.authors)}</span>
      <span class="p-desc">${esc(p.desc)}</span>
      <span class="p-meta">
        <span class="hot">${esc(String(p.year))}</span>
        <span>${esc(String(p.pages))} pp</span>
        ${tags}
      </span>
    </span>
  </a>`;
}

function shelfHTML(cat){
  const n = cat.papers.length;
  return `
  <section class="shelf">
    <div class="shelf-head">
      <h2>${esc(cat.title)}</h2>
      <span class="path">ls ~/${esc(PAPERS.root)}/${esc(cat.slug)} &middot; ${n} ${n === 1 ? 'paper' : 'papers'}</span>
    </div>
    <p class="shelf-blurb">${esc(cat.blurb)}</p>
    <div class="paper-list">
      ${cat.papers.map(p => paperCardHTML(cat, p)).join('')}
    </div>
  </section>`;
}

document.getElementById('topbar').innerHTML = papersTopbarHTML();
document.getElementById('hero').innerHTML = papersHeroHTML();
document.getElementById('shelves').innerHTML =
  PAPERS.categories.map(shelfHTML).join('') +
  `<div class="slot">${esc(PAPERS.slot)}</div>`;
renderFooter(
  `<span>&copy; ${SITE.copyrightYear} ${esc(SITE.owner)}</span>` +
  `<span>${esc(SITE.tagline)} &middot; <a href="${esc(SITE.sourceUrl)}">source</a></span>`
);
