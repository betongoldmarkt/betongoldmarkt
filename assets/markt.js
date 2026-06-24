// ── BGM Attribution helper (AIR-009) — shared, registry-driven ───────────────
// Single data source: /assets/content-map.json (exported from CONTENT_REGISTRY).
// Self-contained so it works whether or not lead-capture.js is also present.
window.BGM = window.BGM || (function(){
  var MAP_URL = '/assets/content-map.json';
  var MAP_CACHE_KEY = 'bgm_content_map';
  var FIRST_TOUCH_KEY = 'bgm_first_touch';

  function norm(path){
    if (!path) return '/';
    path = String(path).replace(/\/+$/, '/');
    if (path.charAt(path.length - 1) !== '/') path += '/';
    return path;
  }
  function getMap(){
    if (window.__BGM_MAP) return window.__BGM_MAP;
    try {
      var c = window.sessionStorage.getItem(MAP_CACHE_KEY);
      if (c) { window.__BGM_MAP = JSON.parse(c); return window.__BGM_MAP; }
    } catch (e) {}
    return null;
  }
  function loadMap(cb){
    var m = getMap();
    if (m) { if (cb) cb(m); return; }
    try {
      fetch(MAP_URL, { cache: 'force-cache' })
        .then(function(r){ return r.json(); })
        .then(function(j){
          window.__BGM_MAP = j;
          try { window.sessionStorage.setItem(MAP_CACHE_KEY, JSON.stringify(j)); } catch (e) {}
          if (cb) cb(j);
        })
        .catch(function(){ if (cb) cb(null); });
    } catch (e) { if (cb) cb(null); }
  }
  function fromMeta(){
    try {
      var el = document.querySelector('meta[name="bgm:content-id"]');
      if (el && el.content) {
        var cl = document.querySelector('meta[name="bgm:cluster-id"]');
        return { content_id: el.content.trim(), cluster_id: (cl && cl.content) ? cl.content.trim() : '' };
      }
    } catch (e) {}
    return null;
  }
  function resolveFromMap(map, url){
    if (!map || !url) return null;
    var path;
    try { path = norm(new URL(url, window.location.origin).pathname); } catch (e) { return null; }
    var ex = map.exclude || [];
    for (var i = 0; i < ex.length; i++){ if (norm(ex[i]) === path) return null; }
    if (map.exact && map.exact[path]) return map.exact[path];
    var pre = map.prefix || [];
    for (var j = 0; j < pre.length; j++){ if (path.indexOf(norm(pre[j].match)) === 0) return { content_id: pre[j].content_id, cluster_id: pre[j].cluster_id || '' }; }
    var con = map.contains || [];
    var low = path.toLowerCase();
    for (var k = 0; k < con.length; k++){ if (low.indexOf(String(con[k].match).toLowerCase()) !== -1) return { content_id: con[k].content_id, cluster_id: con[k].cluster_id || '' }; }
    return null;
  }
  // Resolve signal for a URL: page meta (current page only) → content-map.
  function resolveSignal(url, allowMeta){
    if (allowMeta){ var m = fromMeta(); if (m && m.content_id) return m; }
    return resolveFromMap(getMap(), url);
  }
  function captureFirstTouch(){
    loadMap(function(){
      try {
        if (window.sessionStorage.getItem(FIRST_TOUCH_KEY)) return; // never overwrite
        var sig = resolveSignal(window.location.href, true);
        if (!sig || !sig.content_id) return; // excluded/unknown → no first-touch
        var ft = {
          first_touch_url: window.location.href,
          first_touch_path: norm(window.location.pathname),
          first_touch_content_id: sig.content_id,
          first_touch_cluster_id: sig.cluster_id || '',
          first_touch_referrer: document.referrer || '',
          first_touch_ts: new Date().toISOString()
        };
        window.sessionStorage.setItem(FIRST_TOUCH_KEY, JSON.stringify(ft));
        if (!window.sessionStorage.getItem('bgm_landing_url')) {
          window.sessionStorage.setItem('bgm_landing_url', window.location.href);
        }
      } catch (e) {}
    });
  }
  function getFirstTouch(){
    try { var s = window.sessionStorage.getItem(FIRST_TOUCH_KEY); return s ? JSON.parse(s) : null; } catch (e) { return null; }
  }
  // Build the attribution fields for a lead payload (first-touch preferred).
  function attribution(payload, landingUrl){
    var ft = getFirstTouch();
    var cur = resolveSignal(landingUrl || window.location.href, true) || resolveSignal(document.referrer || '', false);
    var content_id = (ft && ft.first_touch_content_id) || (cur && cur.content_id) || '';
    var cluster_id = (ft && ft.first_touch_cluster_id) || (cur && cur.cluster_id) || '';
    if (!content_id) {
      var lbl = '';
      try { lbl = new URLSearchParams(window.location.search).get('objekt') || ''; } catch (e) {}
      if (!lbl && payload) lbl = payload['objekt'] || payload['page'] || '';
      var l = String(lbl).toLowerCase();
      if (l.indexOf('gardenia') !== -1) { content_id = 'CT-MKT-003'; cluster_id = cluster_id || 'CL-MKT-PROJ'; }
      else if (l.indexOf('robinson') !== -1) { content_id = 'CT-MKT-002'; cluster_id = cluster_id || 'CL-MKT-PROJ'; }
    }
    return {
      content_id: content_id,
      cluster_id: cluster_id,
      first_touch_url: ft ? ft.first_touch_url : '',
      first_touch_content_id: ft ? ft.first_touch_content_id : '',
      first_touch_cluster_id: ft ? ft.first_touch_cluster_id : ''
    };
  }
  function withCid(url, cid){
    if (!cid) return url;
    try {
      var u = new URL(url, window.location.origin);
      if (u.searchParams.get('cid')) return url;
      u.searchParams.set('cid', cid);
      return u.toString();
    } catch (e) {
      if (/[?&]cid=/.test(url)) return url;
      return url + (url.indexOf('?') === -1 ? '?' : '&') + 'cid=' + encodeURIComponent(cid);
    }
  }
  function applyToPayload(payload, landingUrl){
    var a = attribution(payload, landingUrl);
    payload['page_url'] = withCid(landingUrl || payload['page_url'] || window.location.href, a.content_id);
    if (!payload['referrer']) payload['referrer'] = document.referrer || '';
    if (a.content_id) { payload['cid'] = a.content_id; payload['content_id'] = a.content_id; }
    if (a.cluster_id) payload['cluster_id'] = a.cluster_id;
    if (a.first_touch_url) payload['first_touch_url'] = a.first_touch_url;
    if (a.first_touch_content_id) payload['first_touch_content_id'] = a.first_touch_content_id;
    if (a.first_touch_cluster_id) payload['first_touch_cluster_id'] = a.first_touch_cluster_id;
    return payload;
  }
  return {
    norm: norm, loadMap: loadMap, resolveSignal: resolveSignal,
    captureFirstTouch: captureFirstTouch, getFirstTouch: getFirstTouch,
    attribution: attribution, withCid: withCid, applyToPayload: applyToPayload
  };
})();

// AIR-009 — capture first-touch on every page that loads this script.
try { window.BGM.captureFirstTouch(); } catch (e) {}

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

// ── Objekt-Anfrage → DIETRICH_OS Webhook (direct) ─────────────────
(function(){
  var DIETRICH_WEBHOOK = 'https://hook.eu1.make.com/yrlkosxvvxr6x1aea0curpychul1pr5e';

  function buildPayload(form) {
    var fd = new FormData(form);
    var payload = {};
    fd.forEach(function(v, k){ payload[k] = String(v).trim(); });
    // Enforce required Markt metadata
    payload['source']    = payload['source']    || 'Markt';
    payload['layer']     = 'Markt';
    payload['form_name'] = payload['form_name'] || 'objekt-anfrage';
    payload['lead_type'] = 'object_request';
    // Prefer the landing URL captured at first page load (before trackers can
    // strip utm/pub via history.replaceState); fall back to the current URL.
    // The static hidden page_url field holds only the canonical URL w/o query.
    var bgmLanding = '';
    try { bgmLanding = window.sessionStorage.getItem('bgm_landing_url') || ''; } catch (e) {}
    payload['page_url']  = bgmLanding || window.location.href;
    // Normalize phone
    var phone = payload['telefon'] || payload['phone'] || '';
    payload['telefon'] = phone;
    payload['phone']   = phone;
    // Timestamp
    payload['created_at'] = new Date().toISOString();
    // AIR-009 — registry-driven attribution (first-touch preferred); injects
    // cid into page_url and adds cid/content_id/cluster_id/referrer/first_touch_*.
    try { if (window.BGM) window.BGM.applyToPayload(payload, payload['page_url']); } catch (e) {}
    return payload;
  }

  document.addEventListener('submit', function(e){
    var form = e.target.closest('form.objekt-anfrage-form');
    if (!form) return;

    e.preventDefault();
    e.stopPropagation();

    var payload = buildPayload(form);

    // MARKT-THANKYOU-002: stash the entered name for /danke/ personalization.
    // Display-only side effect — does not alter payload, attribution, or redirect.
    try {
      var nm = (payload['name'] || '').trim();
      if (nm) { window.sessionStorage.setItem('bgm_lead_name', nm.slice(0, 60)); }
    } catch (e) {}

    // Fire directly to DIETRICH_OS Make webhook, then Netlify submit
    var sent = fetch(DIETRICH_WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      keepalive: true
    }).catch(function(err){ console.error('[DIETRICH_OS] webhook error', err); });

    var timeout = new Promise(function(resolve){ setTimeout(resolve, 2000); });

    Promise.race([sent, timeout])
      .then(function(){ form.submit(); })
      .catch(function(){ form.submit(); });

  }, true);
})();
