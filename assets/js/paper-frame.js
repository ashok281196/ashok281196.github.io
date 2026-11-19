"use strict";

/* ============================================================
   LINKED-PAPER READER — loads an arXiv paper into an iframe.
   Papers come from data/papers.js entries that carry `arxiv`
   (see findLinkedPaper). Three views of the same paper:
     html  arxiv.org/html/<id>   (ar5iv for pre-2024 papers,
                                  which have no native HTML)
     pdf   arxiv.org/pdf/<id>
     abs   arxiv.org/abs/<id>
   Phones default to html — mobile browsers rarely render a PDF
   inside a frame. The choice is remembered per browser.
   ============================================================ */

(function(){
  const $ = id => document.getElementById(id);
  const VIEW_KEY = 'paperFrameView';

  /* arXiv ids are YYMM.NNNNN; native HTML exists from 2312 onward */
  function hasNativeHtml(id){ return parseInt(id.slice(0, 4), 10) >= 2312; }

  function viewUrl(id, view){
    if(view === 'pdf') return `https://arxiv.org/pdf/${id}`;
    if(view === 'abs') return `https://arxiv.org/abs/${id}`;
    return hasNativeHtml(id) ? `https://arxiv.org/html/${id}`
                             : `https://ar5iv.labs.arxiv.org/html/${id}`;
  }

  function savedView(){
    try{ return localStorage.getItem(VIEW_KEY); }catch(e){ return null; }
  }
  function saveView(v){
    try{ localStorage.setItem(VIEW_KEY, v); }catch(e){ /* private mode */ }
  }

  const q = new URLSearchParams(location.search);
  const slug = q.get('c') || '';
  const hit = findLinkedPaper(slug, q.get('id') || '');
  if(!hit){
    $('rt-title').textContent = 'Unknown paper';
    $('fhint').innerHTML = 'unknown paper — <a href="./">back to the reading room</a>';
    $('fhint').classList.add('err');
    $('frame').remove();
    return;
  }
  const { cat, paper, index } = hit;
  const id = paper.arxiv;

  document.title = `${paper.title} · Papers`;
  $('rt-title').textContent = paper.title;
  const stampB = document.createElement('b');
  stampB.textContent = paperStamp(paper);
  $('rt-stamp').replaceChildren(stampB,
    document.createTextNode(paper.authors ? `  ·  ${paper.authors}` : `  ·  ${cat.title}`));

  /* shelf navigation keeps the shelf's relevance order */
  const linked = cat.papers.filter(p => p.arxiv);
  const at = linked.indexOf(paper);
  $('pos').textContent = `${at + 1} / ${linked.length}`;
  function wireStep(el, p){
    if(!p){ el.setAttribute('aria-disabled', 'true'); el.removeAttribute('href'); return; }
    el.href = `read.html?c=${encodeURIComponent(slug)}&id=${encodeURIComponent(p.arxiv)}`;
    el.title = p.title;
  }
  wireStep($('b-prev'), linked[at - 1]);
  wireStep($('b-next'), linked[at + 1]);

  const narrow = window.matchMedia('(max-width: 760px)').matches;
  const buttons = [...document.querySelectorAll('.rtools button[data-view]')];

  function show(view){
    const url = viewUrl(id, view);
    $('frame').src = url;
    $('b-open').href = url;
    $('hint-open').href = url;
    for(const b of buttons) b.setAttribute('aria-pressed', String(b.dataset.view === view));
  }
  for(const b of buttons){
    b.addEventListener('click', () => { saveView(b.dataset.view); show(b.dataset.view); });
  }

  const start = savedView();
  show(['html', 'pdf', 'abs'].includes(start) ? start : (narrow ? 'html' : 'pdf'));

  document.addEventListener('keydown', e => {
    if(e.ctrlKey || e.metaKey || e.altKey) return;
    if(e.key === 'ArrowLeft' && linked[at - 1]) location.href = $('b-prev').href;
    if(e.key === 'ArrowRight' && linked[at + 1]) location.href = $('b-next').href;
  });
})();
