"use strict";

/* ============================================================
   PAPER READER — streams a PDF from /papers/<category>/<file>
   into a continuous-scroll reading view with page navigation,
   zoom, fit modes, thumbnails and keyboard shortcuts.
   Rendering: pdf.js 4.8.69, vendored in assets/vendor/pdfjs
   (the worker must be same-origin, so no CDN).
   Paper metadata: data/papers.js (PAPERS / findPaper).
   ============================================================ */

const PDFJS_BASE = new URL('../vendor/pdfjs', import.meta.url).href;

const $ = id => document.getElementById(id);
const reader   = $('reader');
const pagesEl  = $('pages');
const thumbsEl = $('thumbs');
const progress = $('rprogress');
const pgInput  = $('pg-input');
const pgTotal  = $('pg-total');

const state = {
  doc: null,
  pages: [],          // {num, w0, h0, el, scale, renderedScale, rendering, task}
  visible: new Set(), // page numbers near the viewport
  cur: 1,
  zoom: 1,            // multiplier on top of the fit scale
  fitMode: 'width',   // 'width' | 'page'
};

function status(html, isErr){
  pagesEl.innerHTML = `<div class="rstatus mono${isErr ? ' err' : ''}">${html}</div>`;
}

function pdfHref(cat, paper){
  return `${encodeURIComponent(cat.slug)}/${encodeURIComponent(paper.file)}`;
}

/* ---------------- layout & rendering ---------------- */

function fitScale(p){
  const availW = Math.min(pagesEl.clientWidth - 28, 1000);
  const availH = pagesEl.clientHeight - 44;
  const wScale = availW / p.w0;
  return state.fitMode === 'page' ? Math.min(wScale, availH / p.h0) : wScale;
}

function layout(){
  for(const p of state.pages){
    p.scale = Math.max(fitScale(p) * state.zoom, 0.1);
    p.el.style.width  = `${Math.floor(p.w0 * p.scale)}px`;
    p.el.style.height = `${Math.floor(p.h0 * p.scale)}px`;
  }
  $('b-zpct').textContent = `${Math.round(state.zoom * 100)}%`;
}

async function renderPage(p){
  if(p.rendering || p.renderedScale === p.scale) return;
  p.rendering = true;
  const scale = p.scale;
  try{
    const page = await state.doc.getPage(p.num);
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    const vp = page.getViewport({ scale: scale * ratio });
    const canvas = document.createElement('canvas');
    canvas.width  = Math.floor(vp.width);
    canvas.height = Math.floor(vp.height);
    p.task = page.render({ canvasContext: canvas.getContext('2d'), viewport: vp });
    await p.task.promise;
    p.el.replaceChildren(canvas);
    p.renderedScale = scale;
  }catch(e){
    if(e && e.name !== 'RenderingCancelledException') console.error('render p.' + p.num, e);
  }finally{
    p.task = null;
    p.rendering = false;
    /* zoom changed while we were rendering — go again */
    if(state.visible.has(p.num) && p.renderedScale !== p.scale) renderPage(p);
  }
}

function freePage(p){
  if(p.task) p.task.cancel();
  p.el.replaceChildren();
  p.renderedScale = 0;
}

function renderVisible(){
  for(const n of state.visible) renderPage(state.pages[n - 1]);
}

/* ---------------- navigation ---------------- */

function clampPage(n){ return Math.min(Math.max(n, 1), state.pages.length); }

function goto(n, smooth){
  n = clampPage(n);
  const p = state.pages[n - 1];
  pagesEl.scrollTo({ top: p.el.offsetTop - 14, behavior: smooth ? 'smooth' : 'auto' });
}

function trackScroll(){
  const mid = pagesEl.scrollTop + pagesEl.clientHeight / 2;
  let cur = 1;
  for(const p of state.pages){
    if(p.el.offsetTop <= mid) cur = p.num; else break;
  }
  if(cur !== state.cur){
    state.cur = cur;
    if(document.activeElement !== pgInput) pgInput.value = cur;
    const t = thumbsEl.children[cur - 1];
    thumbsEl.querySelector('.thumb.cur')?.classList.remove('cur');
    if(t){ t.classList.add('cur'); t.scrollIntoView({ block: 'nearest' }); }
    history.replaceState(null, '', `#page=${cur}`);
  }
  const range = pagesEl.scrollHeight - pagesEl.clientHeight;
  progress.style.width = range > 0 ? `${(pagesEl.scrollTop / range) * 100}%` : '100%';
}

/* ---------------- thumbnails ---------------- */

function buildThumbs(){
  const frag = document.createDocumentFragment();
  for(const p of state.pages){
    const b = document.createElement('button');
    b.className = 'thumb' + (p.num === 1 ? ' cur' : '');
    b.setAttribute('aria-label', `Go to page ${p.num}`);
    b.innerHTML = `<span class="tframe"></span><span class="tno">${p.num}</span>`;
    b.querySelector('.tframe').style.aspectRatio = `${p.w0} / ${p.h0}`;
    b.addEventListener('click', () => goto(p.num, false));
    frag.appendChild(b);
  }
  thumbsEl.appendChild(frag);

  const seen = new Set();
  const io = new IntersectionObserver(async entries => {
    for(const en of entries){
      if(!en.isIntersecting) continue;
      const idx = [...thumbsEl.children].indexOf(en.target);
      if(idx < 0 || seen.has(idx)) continue;
      seen.add(idx);
      io.unobserve(en.target);
      const p = state.pages[idx];
      try{
        const page = await state.doc.getPage(p.num);
        const vp = page.getViewport({ scale: 110 / p.w0 });
        const canvas = document.createElement('canvas');
        canvas.width = Math.floor(vp.width);
        canvas.height = Math.floor(vp.height);
        await page.render({ canvasContext: canvas.getContext('2d'), viewport: vp }).promise;
        en.target.querySelector('.tframe').replaceChildren(canvas);
      }catch(e){ console.error('thumb p.' + p.num, e); }
    }
  }, { root: thumbsEl, rootMargin: '400px 0px' });
  for(const t of thumbsEl.children) io.observe(t);
}

/* ---------------- controls ---------------- */

function setZoom(z){
  state.zoom = Math.min(Math.max(z, 0.4), 4);
  layout(); renderVisible(); trackScroll();
}

function toggleFit(){
  state.fitMode = state.fitMode === 'width' ? 'page' : 'width';
  const b = $('b-fit');
  b.innerHTML = state.fitMode === 'width' ? 'fit&nbsp;W' : 'fit&nbsp;P';
  b.setAttribute('aria-pressed', state.fitMode === 'page');
  layout(); renderVisible(); goto(state.cur, false);
}

function wireControls(){
  $('b-prev').addEventListener('click', () => goto(state.cur - 1, true));
  $('b-next').addEventListener('click', () => goto(state.cur + 1, true));
  $('b-zout').addEventListener('click', () => setZoom(state.zoom / 1.15));
  $('b-zin').addEventListener('click', () => setZoom(state.zoom * 1.15));
  $('b-zpct').addEventListener('click', () => setZoom(1));
  $('b-fit').addEventListener('click', toggleFit);
  $('b-thumbs').addEventListener('click', () => reader.classList.toggle('no-thumbs'));

  pgInput.addEventListener('change', () => { goto(parseInt(pgInput.value, 10) || 1, false); pgInput.blur(); });
  pgInput.addEventListener('keydown', e => { if(e.key === 'Enter') pgInput.dispatchEvent(new Event('change')); });

  document.addEventListener('keydown', e => {
    if(e.target === pgInput || e.ctrlKey || e.metaKey || e.altKey) return;
    switch(e.key){
      case 'ArrowLeft':  e.preventDefault(); goto(state.cur - 1, true); break;
      case 'ArrowRight': e.preventDefault(); goto(state.cur + 1, true); break;
      case '+': case '=': setZoom(state.zoom * 1.15); break;
      case '-': setZoom(state.zoom / 1.15); break;
      case '0': setZoom(1); break;
      case 'w': toggleFit(); break;
      case 't': reader.classList.toggle('no-thumbs'); break;
    }
  });

  /* ctrl/cmd + wheel zooms the paper, not the browser */
  pagesEl.addEventListener('wheel', e => {
    if(!e.ctrlKey && !e.metaKey) return;
    e.preventDefault();
    setZoom(e.deltaY < 0 ? state.zoom * 1.1 : state.zoom / 1.1);
  }, { passive: false });

  pagesEl.addEventListener('scroll', () => requestAnimationFrame(trackScroll), { passive: true });

  let rt = null;
  window.addEventListener('resize', () => {
    clearTimeout(rt);
    rt = setTimeout(() => { layout(); renderVisible(); }, 150);
  });
}

/* ---------------- boot ---------------- */

async function main(){
  const q = new URLSearchParams(location.search);
  const hit = findPaper(q.get('c') || '', q.get('p') || '');
  if(!hit){
    status('unknown paper — <a href="./">back to the reading room</a>', true);
    return;
  }
  const { cat, paper } = hit;
  const url = pdfHref(cat, paper);

  document.title = `${paper.title} · Papers`;
  $('rt-title').textContent = paper.title;
  $('rt-stamp').textContent = `${paper.stamp} · ${paper.authors}`;
  $('b-raw').href = url;

  if(window.matchMedia('(max-width: 760px)').matches) reader.classList.add('no-thumbs');

  let pdfjs;
  try{
    pdfjs = await import(`${PDFJS_BASE}/pdf.min.mjs`);
    pdfjs.GlobalWorkerOptions.workerSrc = `${PDFJS_BASE}/pdf.worker.min.mjs`;
  }catch(e){
    console.error(e);
    status(`couldn&rsquo;t load the reader — <a href="${url}">open the PDF directly</a>`, true);
    return;
  }

  let doc;
  try{
    const task = pdfjs.getDocument(url);
    task.onProgress = d => {
      if(d.total) status(`loading paper &hellip; ${Math.round((d.loaded / d.total) * 100)}%`);
    };
    doc = await task.promise;
  }catch(e){
    console.error(e);
    status(`couldn&rsquo;t load the PDF — <a href="${url}">open it directly</a>`, true);
    return;
  }

  state.doc = doc;
  pgTotal.textContent = `/ ${doc.numPages}`;
  pgInput.max = doc.numPages;

  /* measure every page once (scale 1) to lay out placeholders */
  const dims = [];
  for(let n = 1; n <= doc.numPages; n++){
    const vp = (await doc.getPage(n)).getViewport({ scale: 1 });
    dims.push({ w0: vp.width, h0: vp.height });
  }

  pagesEl.innerHTML = '';
  for(let n = 1; n <= doc.numPages; n++){
    const el = document.createElement('div');
    el.className = 'pg';
    el.dataset.page = n;
    pagesEl.appendChild(el);
    state.pages.push({ num: n, ...dims[n - 1], el, scale: 1, renderedScale: 0, rendering: false, task: null });
  }

  layout();
  buildThumbs();
  wireControls();

  const io = new IntersectionObserver(entries => {
    for(const en of entries){
      const p = state.pages[Number(en.target.dataset.page) - 1];
      if(en.isIntersecting){ state.visible.add(p.num); renderPage(p); }
      else { state.visible.delete(p.num); freePage(p); }
    }
  }, { root: pagesEl, rootMargin: '1200px 0px' });
  for(const p of state.pages) io.observe(p.el);

  const m = location.hash.match(/page=(\d+)/);
  if(m) goto(parseInt(m[1], 10), false);
  trackScroll();
  pagesEl.focus({ preventScroll: true });
}

main();
