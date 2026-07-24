"use strict";

/* ============================================================
   BOOK UI - shared navigation components for the field book.
   Requires book.js (BOOK). Fills, when present on the page:
     #booktop  - topbar (chapters: back to contents + CH n/N;
                 contents page: back to the site index)
     #toc      - chapter list on the contents page
     #booknav  - prev/next navigation at the end of a chapter
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

/* ============================================================
   SYNTAX COLOUR — a tiny highlighter for the book's pre blocks.
   No dependencies. Language comes from a `language-*` class on
   the inner <code> when present, otherwise a content heuristic.
   Tokens: comments, strings, numbers, keywords, yaml keys.
   ============================================================ */

(function(){
  function escHtml(s){
    return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  const KEYWORDS = {
    python: 'def|return|import|from|for|while|if|elif|else|in|is|not|and|or|class|with|as|try|except|raise|lambda|pass|break|continue|None|True|False|print|assert|yield|global|nonlocal',
    bash: 'sudo|apt|install|pip|pip3|git|clone|cd|mkdir|wget|curl|unzip|echo|export|source|cmake|make|mv|cp|rm|set|python3|python|conda|activate|tar|kill|wait|sleep|chmod',
    cpp: 'auto|int|float|double|void|bool|char|const|constexpr|class|struct|public|private|protected|return|if|else|for|while|new|delete|template|typename|namespace|using|include|true|false|nullptr|static|virtual|override',
    yaml: 'true|false|null'
  };

  function detectLang(codeEl, text){
    const m = codeEl && /language-([\w+]+)/.exec(codeEl.className || '');
    if(m) return m[1] === 'text' ? null : m[1];
    if(/^\s*(import |from [\w.]+ import |def |import\b)/m.test(text) || /\bnp\.|plt\.|self\./.test(text)) return 'python';
    if(/^\s*(\$ |sudo |pip3? |git |cmake |wget |unzip |mkdir |cd |source |conda |apt )/m.test(text)) return 'bash';
    if(/^[ \t]*[\w./-]+:(\s|$)/m.test(text) && !/=/.test(text)) return 'yaml';
    return null;
  }

  function highlight(src, lang){
    const comment = lang === 'cpp' ? '\\/\\/[^\\n]*' : '#[^\\n]*';
    const kw = KEYWORDS[lang] || '';
    let pattern = `(${comment})` +
      `|('(?:[^'\\\\\\n]|\\\\.)*'|"(?:[^"\\\\\\n]|\\\\.)*")` +
      `|(\\b\\d+(?:\\.\\d+)?(?:e[+-]?\\d+)?\\b)`;
    if(lang === 'yaml') pattern += `|(^[ \\t]*[\\w./-]+)(?=\\s*:)`;
    if(kw) pattern += `|\\b(${kw})\\b`;
    const re = new RegExp(pattern, 'gm');
    let out = '', last = 0, m;
    while((m = re.exec(src)) !== null){
      out += escHtml(src.slice(last, m.index));
      const cls = m[1] ? 'tok-com' : m[2] ? 'tok-str' : m[3] ? 'tok-num'
                : (lang === 'yaml' && m[4]) ? 'tok-key' : 'tok-kw';
      out += '<span class="' + cls + '">' + escHtml(m[0]) + '</span>';
      last = m.index + m[0].length;
    }
    return out + escHtml(src.slice(last));
  }

  document.querySelectorAll('pre').forEach(pre => {
    const codeEl = pre.querySelector('code');
    const target = codeEl || pre;
    const text = target.textContent;
    const lang = detectLang(codeEl, text);
    if(!lang || !KEYWORDS.hasOwnProperty(lang)) return;
    target.innerHTML = highlight(text, lang);
  });
})();
