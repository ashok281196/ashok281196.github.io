/* Folio book chrome: contents drawer, reading progress, active chapter label. */
(() => {
  const sb = document.getElementById('sidebar'), scrim = document.getElementById('scrim'), btn = document.getElementById('menuBtn');
  if (sb && scrim && btn) {
    const setOpen = open => { sb.classList.toggle('open', open); scrim.classList.toggle('show', open); btn.setAttribute('aria-expanded', open); };
    btn.addEventListener('click', () => setOpen(!sb.classList.contains('open')));
    scrim.addEventListener('click', () => setOpen(false));
    sb.addEventListener('click', e => { if (e.target.closest('a')) setOpen(false); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') setOpen(false); });
  }
  const bar = document.getElementById('progress');
  if (bar) {
    const onScroll = () => { const h = document.documentElement.scrollHeight - innerHeight; bar.style.transform = `scaleX(${h > 0 ? scrollY / h : 0})`; };
    addEventListener('scroll', onScroll, { passive: true }); onScroll();
  }
  const label = document.getElementById('chapterLabel'), links = [...document.querySelectorAll('.toc a')];
  const io = new IntersectionObserver(es => es.forEach(en => {
    if (!en.isIntersecting) return;
    links.forEach(a => a.classList.toggle('active', a.hash === '#' + en.target.id));
    if (label) label.textContent = en.target.dataset.label;
  }), { rootMargin: '-40% 0px -55% 0px' });
  document.querySelectorAll('[data-label]').forEach(s => io.observe(s));
})();
