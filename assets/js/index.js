"use strict";

/* ============================================================
   INDEX PAGE RENDERER — builds the landing page from
   data/site.js (SITE) and data/profile.js (PROFILE).
   ============================================================ */

function linkHTML(l){
  return `<a${l.primary ? ' class="primary"' : ''} href="${esc(l.href)}"${l.me ? ' rel="me"' : ''}><span class="glyph">${esc(l.glyph)}</span>${esc(l.label)}</a>`;
}

function skillRowHTML(s){
  return `
  <div class="skill-row">
    <dt>${esc(s.label)}</dt>
    <dd>${s.items.map(i => `<span>${esc(i)}</span>`).join('')}</dd>
  </div>`;
}

function heroHTML(){
  return `
  <div class="eyebrow">${esc(PROFILE.eyebrow)}</div>
  <h1>${PROFILE.nameLines.map(esc).join('<br>')}<span class="caret" aria-hidden="true"></span></h1>
  <p class="role">${esc(PROFILE.role.prefix)}<em>${esc(PROFILE.role.company)}</em></p>
  <p class="bio">${PROFILE.bioHTML}</p>
  <nav class="links" aria-label="Profiles and contact">${PROFILE.links.map(linkHTML).join('')}</nav>
  <dl class="skills">${PROFILE.skills.map(skillRowHTML).join('')}</dl>`;
}

function entryHTML(p){
  const meta = p.meta.map(m => `<span${m.hot ? ' class="hot"' : ''}>${esc(m.label)}</span>`).join('');
  return `
  <a class="entry" href="${esc(p.file)}">
    <span class="file">${esc(p.file)}</span>
    <span class="title">${esc(p.title)} <span class="arrow">&nearr;</span></span>
    <span class="desc">${esc(p.desc)}</span>
    <span class="meta">${meta}</span>
  </a>`;
}

function pagesHTML(){
  const n = SITE.pages.length;
  return `
  <div class="index-head">
    <h2>Index</h2>
    <span class="path">ls ~/pages · ${n} ${n === 1 ? 'entry' : 'entries'}</span>
  </div>
  <div class="entries">
    ${SITE.pages.map(entryHTML).join('')}
    <div class="slot">${esc(SITE.indexSlot)}</div>
  </div>`;
}

renderTopbar(null);
document.getElementById('hero').innerHTML = heroHTML();
document.getElementById('pages').innerHTML = pagesHTML();
renderFooter(
  `<span>&copy; ${SITE.copyrightYear} ${esc(SITE.owner)}</span>` +
  `<span>${esc(SITE.tagline)} · <a href="${esc(SITE.sourceUrl)}">source</a></span>`
);
