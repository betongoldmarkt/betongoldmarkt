// FINAL 018 — nav toggle/disclosure + IO patterns (2,6) + region hover only. No framework.
(function(){
  var red=window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var t=document.querySelector("[data-nav-toggle]"),n=document.querySelector("[data-nav]");
  if(t&&n){
    function close(){n.removeAttribute("data-open");t.setAttribute("aria-expanded","false");document.body.style.overflow="";t.focus();}
    t.addEventListener("click",function(){ if(n.getAttribute("data-open")==="true"){close();} else {n.setAttribute("data-open","true");t.setAttribute("aria-expanded","true");document.body.style.overflow="hidden";var f=n.querySelector("a");if(f)f.focus();}});
    document.addEventListener("keydown",function(e){if(e.key==="Escape"){close();var d=document.querySelector(".f18-nav details[open]");if(d)d.removeAttribute("open");}});
  }
  var det=document.querySelector(".f18-nav details");
  if(det){document.addEventListener("click",function(e){if(!det.contains(e.target))det.removeAttribute("open");});}
  if("IntersectionObserver" in window && !red){
    var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add("is-in");io.unobserve(e.target);}});},{threshold:0.25});
    document.querySelectorAll(".f18-io").forEach(function(el){io.observe(el);});
  } else { document.querySelectorAll(".f18-io").forEach(function(el){el.classList.add("is-in");}); }
})();
