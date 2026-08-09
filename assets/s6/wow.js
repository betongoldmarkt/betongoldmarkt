// MARKT WOW — task 013. Vanilla: IntersectionObserver + map panel. No framework.
(function () {
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Motion 5+6: one-time in-view transitions (no global reveal — only elements
  // explicitly marked .wow-io, and the process band steps)
  if ("IntersectionObserver" in window && !reduced) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add("is-in");
        if (e.target.classList.contains("wow-process")) {
          var steps = e.target.querySelectorAll(".wow-step");
          steps.forEach(function (s, i) { setTimeout(function () { s.classList.add("is-active"); }, i * 220); });
        }
        io.unobserve(e.target);
      });
    }, { threshold: 0.35 });
    document.querySelectorAll(".wow-io, .wow-process").forEach(function (el) { io.observe(el); });
  } else {
    document.querySelectorAll(".wow-io").forEach(function (el) { el.classList.add("is-in"); });
    document.querySelectorAll(".wow-step").forEach(function (s) { s.classList.add("is-active"); });
  }

  // Motion 4: map region selection → info panel (desktop) / tiles (mobile)
  var panel = document.getElementById("region-panel");
  function select(el) {
    document.querySelectorAll("[data-region]").forEach(function (r) { r.setAttribute("aria-pressed", "false"); });
    el.setAttribute("aria-pressed", "true");
    if (panel) {
      panel.querySelector("h3").textContent = el.getAttribute("data-region");
      panel.querySelector("p").textContent = el.getAttribute("data-region-note") || "Regionsprofil in Vorbereitung";
    }
  }
  document.querySelectorAll("[data-region]").forEach(function (el) {
    el.addEventListener("click", function () { select(el); });
    el.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); select(el); } });
  });

  // Nav disclosure: close on Escape / outside click
  var det = document.querySelector(".mc-nav details");
  if (det) {
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") det.removeAttribute("open"); });
    document.addEventListener("click", function (e) { if (!det.contains(e.target)) det.removeAttribute("open"); });
  }
})();
