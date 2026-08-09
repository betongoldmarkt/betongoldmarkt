/* Beton Gold Markt · consent control.
   Default state is denied. Analytics load only after an affirmative choice.
   Technical behaviour mirrors the verified Kapital gate; no Kapital text,
   branding, identifiers, links or contact details are used here. */
(function () {
  var KEY = 'bgm_analytics_consent';           // Markt-specific storage key
  var el  = document.getElementById('mc-consent');
  var GA4 = el ? el.getAttribute('data-ga4') : null;
  var MET = el ? el.getAttribute('data-metricool') : null;

  function read() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function write(v) { try { localStorage.setItem(KEY, v); } catch (e) {} }
  function clear() { try { localStorage.removeItem(KEY); } catch (e) {} }
  function granted() { return read() === 'granted'; }
  function decided() { var v = read(); return v === 'granted' || v === 'denied'; }

  function loadGA4() {
    if (!GA4 || window.__bgm_ga4) return;
    window.__bgm_ga4 = true;
    window.dataLayer = window.dataLayer || [];
    function gtag() { window.dataLayer.push(arguments); }
    window.gtag = window.gtag || gtag;
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(GA4);
    s.onerror = function () { window.__bgm_ga4 = false; };   // asset unavailable: stay off
    document.head.appendChild(s);
    gtag('js', new Date());
    gtag('config', GA4);
  }

  function loadMetricool() {
    if (!MET || window.__bgm_met) return;
    window.__bgm_met = true;
    var s = document.createElement('script');
    s.type = 'text/javascript';
    s.src = 'https://tracker.metricool.com/resources/be.js';
    s.onerror = function () { window.__bgm_met = false; };   // asset unavailable: stay off
    s.onload = function () {
      try { if (window.beTracker) window.beTracker.t({ hash: MET }); } catch (e) {}
    };
    document.head.appendChild(s);
  }

  function loadAnalytics() { loadGA4(); loadMetricool(); }

  function show() { if (el) { el.hidden = false; el.setAttribute('aria-hidden', 'false'); } }
  function hide() { if (el) { el.hidden = true;  el.setAttribute('aria-hidden', 'true'); } }

  function bindWithdraw() {
    var btn = document.getElementById('mc-consent-revoke');
    var out = document.getElementById('mc-consent-status');
    if (!btn) return;
    btn.addEventListener('click', function () {
      clear();
      show();
      if (out) out.textContent = 'Ihre Auswahl wurde zurückgesetzt. Bitte entscheiden Sie erneut. Bis dahin werden keine Analyse-Dienste geladen.';
    });
  }

  function init() {
    bindWithdraw();
    if (granted()) { loadAnalytics(); hide(); return; }
    if (decided())  { hide(); return; }          // denied: nothing loads
    show();
    var ok = document.getElementById('mc-consent-accept');
    var no = document.getElementById('mc-consent-deny');
    if (ok) ok.addEventListener('click', function () { write('granted'); hide(); loadAnalytics(); });
    if (no) no.addEventListener('click', function () { write('denied');  hide(); });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
