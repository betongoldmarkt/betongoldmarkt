// S6 mobile navigation — vanilla, no framework. A11y: aria-expanded, Escape, scroll lock.
(function(){
  var t=document.querySelector('[data-nav-toggle]'),n=document.querySelector('[data-nav]');
  if(!t||!n)return;
  function close(){n.removeAttribute('data-open');t.setAttribute('aria-expanded','false');document.body.style.overflow='';t.focus();}
  t.addEventListener('click',function(){
    var open=n.getAttribute('data-open')==='true';
    if(open){close();}else{n.setAttribute('data-open','true');t.setAttribute('aria-expanded','true');document.body.style.overflow='hidden';
      var f=n.querySelector('a');if(f)f.focus();}
  });
  document.addEventListener('keydown',function(e){if(e.key==='Escape'&&n.getAttribute('data-open')==='true')close();});
})();
