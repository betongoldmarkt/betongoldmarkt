// ── Smooth scroll for data-scroll anchors ─────────────────────────
document.addEventListener('click', (e)=>{
  const a = e.target.closest('a[data-scroll]');
  if(!a) return;
  const id = a.getAttribute('href');
  if(id && id.startsWith('#')){
    const el = document.querySelector(id);
    if(el){ e.preventDefault(); el.scrollIntoView({behavior:'smooth', block:'start'}); }
  }
});