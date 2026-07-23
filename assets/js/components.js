"use strict";

/* ============================================================
   SHARED COMPONENTS — helpers and chrome used by every page.
   Requires data/site.js (SITE) to be loaded first.
   ============================================================ */

function esc(s){
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

/* Topbar. On the home page the host is a plain label; on inner
   pages it becomes a "← host" link back to the index, with the
   current file shown as a breadcrumb. */
function renderTopbar(currentFile){
  const el = document.getElementById('topbar');
  if(!el) return;
  const left = currentFile
    ? `<span><a class="host" href="./" aria-label="Back to index">&larr; ${esc(SITE.host)}</a><span class="crumb">/${esc(currentFile)}</span></span>`
    : `<span class="host">${esc(SITE.host)}</span>`;
  el.innerHTML = `${left}<span class="loc"><span class="dot"></span>${esc(SITE.location)}</span>`;
}

function renderFooter(html){
  const el = document.getElementById('footer');
  if(el) el.innerHTML = html;
}
