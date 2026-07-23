"use strict";

/* ============================================================
   BOOK UI — shared navigation components for the field book.
   Requires book.js (BOOK). Fills, when present on the page:
     #booktop  — topbar (chapters: back to contents + CH n/N;
                 contents page: back to the site index)
     #toc      — chapter list on the contents page
     #booknav  — prev/next navigation at the end of a chapter
   ============================================================ */

(function(){
  function esc(s){
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  const file = location.pathname.split('/').pop() || 'index.html';
  const chapters = BOOK.chapters;
  const i = chapters.findIndex(c => c.file === file);
  const lastNum = chapters[chapters.length - 1].num;

  const top = document.getElementById('booktop');
  if(top){
    top.innerHTML = i >= 0
      ? `<a href="index.html">← ${esc(BOOK.title)}</a><span>CH ${esc(chapters[i].num)} / ${esc(lastNum)}</span>`
      : `<a href="${esc(BOOK.siteHref)}">← ${esc(BOOK.siteLabel)}</a><span>${esc(BOOK.badge)}</span>`;
  }

  const toc = document.getElementById('toc');
  if(toc){
    toc.innerHTML = chapters.map(c => `
    <a href="${esc(c.file)}">
      <span class="t-num">${esc(c.num)}</span>
      <span><span class="t-title">${esc(c.title)}</span><span class="t-sub">${esc(c.sub)}</span></span>
      <span class="t-tag">${esc(c.tag)}</span>
    </a>`).join('');
  }

  const nav = document.getElementById('booknav');
  if(nav && i >= 0){
    const prev = i > 0
      ? `<a href="${esc(chapters[i-1].file)}"><span class="dir">← Prev</span>${esc(chapters[i-1].navTitle)}</a>`
      : `<a href="index.html"><span class="dir">← Back</span>Cover &amp; contents</a>`;
    const next = i < chapters.length - 1
      ? `<a href="${esc(chapters[i+1].file)}"><span class="dir">Next →</span>${esc(chapters[i+1].navTitle)}</a>`
      : `<a href="index.html"><span class="dir">Home</span>Cover &amp; contents</a>`;
    nav.innerHTML = prev + next;
  }
})();
