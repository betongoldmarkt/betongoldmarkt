// ── BGM Attribution helper (AIR-009) — shared, registry-driven ───────────────
// Single data source: /assets/content-map.json (exported from CONTENT_REGISTRY).
// Duplicated here so the Investor Check page works without markt.js loaded.
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
  function resolveSignal(url, allowMeta){
    if (allowMeta){ var m = fromMeta(); if (m && m.content_id) return m; }
    return resolveFromMap(getMap(), url);
  }
  function captureFirstTouch(){
    loadMap(function(){
      try {
        if (window.sessionStorage.getItem(FIRST_TOUCH_KEY)) return;
        var sig = resolveSignal(window.location.href, true);
        if (!sig || !sig.content_id) return;
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

// AIR-009 — capture first-touch if the Investor Check page is the entry page.
try { window.BGM.captureFirstTouch(); } catch (e) {}

(function(){
  // Routed via Netlify Function for AI classification (Level/Priority/Segment/Next Step)
  // Function enriches payload → forwards to Make.com webhook
  var WEBHOOK = '/.netlify/functions/markt-classify';

  function toPayload(form){
    var fd = new FormData(form);
    var payload = {};
    fd.forEach(function(v,k){ payload[k] = String(v).trim(); });

    // Normalize phone field — Make expects "telefon" or "whatsapp"
    // Send both so Airtable mapping works regardless
    var phone = payload['telefon'] || payload['whatsapp'] || payload['phone'] || '';
    payload['telefon'] = phone;
    payload['whatsapp'] = phone;
    payload['phone'] = phone;

    // Normalize budget → kapital_raw
    if (payload['budget'] && !payload['kapital_raw']) {
      payload['kapital_raw'] = payload['budget'];
    }

    // Ensure source is always set
    if (!payload['source']) {
      payload['source'] = 'Markt';
    }

    // Add layer
    payload['layer'] = 'Markt';

    // Lead type — always general for lead-capture-form
    payload['lead_type'] = 'general_investor_check';

    // Add timestamp
    payload['created_at'] = new Date().toISOString();

    // Page URL attribution — prefer the landing URL captured at first page load
    // (before trackers can strip utm/pub via history.replaceState); fall back to
    // the current URL. Make maps {{1.page_url}} → MARKT_LEADS.Page URL.
    var bgmLanding = '';
    try { bgmLanding = window.sessionStorage.getItem('bgm_landing_url') || ''; } catch (e) {}
    var landingUrl = bgmLanding || window.location.href;

    // AIR-009 — registry-driven attribution (first-touch preferred). Injects cid
    // into page_url so Make 5743159's existing {{57.cid}} parser resolves it with
    // NO Make change, and adds cid/content_id/cluster_id/referrer/first_touch_*.
    if (window.BGM) {
      window.BGM.applyToPayload(payload, landingUrl);
    } else {
      // Defensive fallback if the helper failed to load: keep prior behavior.
      payload['page_url'] = landingUrl;
    }

    return payload;
  }

  async function sendWebhook(payload){
    try {
      var res = await fetch(WEBHOOK, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(payload),
        keepalive: true
      });
      return res.ok;
    } catch (e) {
      console.error('[BGM webhook error]', e);
      return false;
    }
  }

  document.addEventListener('submit', function(e){
    var form = e.target.closest('form.lead-capture-form');
    if (!form) return;

    e.preventDefault();
    e.stopPropagation();

    var payload = toPayload(form);

    // MARKT-THANKYOU-002: stash the entered name for /danke/ personalization.
    // Display-only side effect — does not alter payload, attribution, or redirect.
    try {
      var nm = (payload['name'] || '').trim();
      if (nm) { window.sessionStorage.setItem('bgm_lead_name', nm.slice(0, 60)); }
    } catch (e) {}

    // Fire webhook FIRST (max 2s), then submit to Netlify
    var webhookDone = sendWebhook(payload);
    var timeout = new Promise(function(resolve){ setTimeout(resolve, 2000); });

    Promise.race([webhookDone, timeout]).then(function(){
      form.submit();
    }).catch(function(){
      form.submit();
    });

  }, true);
})();
