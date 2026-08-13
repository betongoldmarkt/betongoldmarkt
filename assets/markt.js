/* ==== BG-ATTRIBUTION-P0-002 EMBEDDED BEGIN — generated from assets/attribution.js, do not edit here ==== */
/*!
 * BG-ATTRIBUTION-P0-002 — canonical 15-field attribution contract
 * Task: DUAL-BRAND-P0-PRODUCTION-STABILIZATION-002
 *
 * Deployed byte-identical to BetonGold Kapital and Beton Gold Markt.
 * Canonical source: assets/attribution.js
 *
 * CONTRACT (15 fields, identical names on both brands):
 *   source, cid, campaign, cluster, lang, landing_page, page_url, referrer,
 *   created_at, utm_source, utm_medium, utm_campaign, utm_content, utm_term,
 *   form_name
 *
 * GOVERNING RULE
 *   apply() NEVER overwrites a non-empty existing value. It only fills gaps.
 *   Every value a brand already emits today keeps its current meaning and its
 *   current downstream mapping. This module is purely additive.
 *
 * FIRST TOUCH
 *   Captured on the first page view of the session, before any third-party
 *   tracker can strip utm/pub parameters via history.replaceState, and never
 *   overwritten thereafter. The legacy key bgm_landing_url is written too, so
 *   the existing Markt readers keep working unchanged.
 */
(function (w, d) {
  'use strict';
  if (w.BGAttribution) { return; }

  var CANONICAL = [
    'source', 'cid', 'campaign', 'cluster', 'lang', 'landing_page', 'page_url',
    'referrer', 'created_at', 'utm_source', 'utm_medium', 'utm_campaign',
    'utm_content', 'utm_term', 'form_name'
  ];
  var UTM = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];
  var FT_KEY = 'bg_first_touch_v1';
  var LEGACY_LANDING_KEY = 'bgm_landing_url';

  function href() { try { return w.location.href || ''; } catch (e) { return ''; } }

  function queryParams(url) {
    var out = {};
    try {
      var q = String(url || '').split('#')[0].split('?')[1] || '';
      var parts = q.split('&');
      for (var i = 0; i < parts.length; i++) {
        var kv = parts[i];
        if (!kv) { continue; }
        var eq = kv.indexOf('=');
        var k = decodeURIComponent((eq < 0 ? kv : kv.slice(0, eq)).replace(/\+/g, ' ')).trim();
        var v = eq < 0 ? '' : decodeURIComponent(kv.slice(eq + 1).replace(/\+/g, ' ')).trim();
        if (k && !(k in out)) { out[k] = v; }
      }
    } catch (e) {}
    return out;
  }

  function ssGet(k) { try { return w.sessionStorage.getItem(k) || ''; } catch (e) { return ''; } }
  function ssSet(k, v) { try { w.sessionStorage.setItem(k, v); } catch (e) {} }

  function firstTouch() {
    var raw = ssGet(FT_KEY);
    if (!raw) { return null; }
    try { return JSON.parse(raw); } catch (e) { return null; }
  }

  function capture() {
    var existing = firstTouch();
    if (existing) { return existing; }
    var url = href();
    var p = queryParams(url);
    var ft = {
      landing_page: url,
      referrer: (d.referrer || ''),
      created_at: new Date().toISOString(),
      cid: p.cid || p.content_id || '',
      campaign: p.campaign || p.utm_campaign || '',
      cluster: p.cluster || p.cluster_id || ''
    };
    for (var i = 0; i < UTM.length; i++) { ft[UTM[i]] = p[UTM[i]] || ''; }
    ssSet(FT_KEY, JSON.stringify(ft));
    if (!ssGet(LEGACY_LANDING_KEY)) { ssSet(LEGACY_LANDING_KEY, url); }
    return ft;
  }

  function meta(names) {
    for (var i = 0; i < names.length; i++) {
      try {
        var el = d.querySelector('meta[name="' + names[i] + '"]');
        if (el && el.content) { return String(el.content).trim(); }
      } catch (e) {}
    }
    return '';
  }

  function docLang() {
    try {
      var l = (d.documentElement && d.documentElement.lang) || '';
      l = String(l).trim();
      if (l) { return l; }
    } catch (e) {}
    return 'de';
  }

  function formName(form, explicit) {
    if (explicit) { return String(explicit); }
    if (!form) { return ''; }
    try {
      return String(form.getAttribute('name') || form.getAttribute('data-form-name') || form.id || '');
    } catch (e) { return ''; }
  }

  /**
   * Fill the canonical contract on `payload` without overwriting anything.
   * @param {Object} payload  the payload the brand has already built
   * @param {Object} [opts]   { form, form_name, source }
   * @returns {Object} the same payload object
   */
  function apply(payload, opts) {
    payload = payload || {};
    opts = opts || {};
    var ft = capture() || {};
    var cur = queryParams(href());

    function fill(key, value) {
      if (value === undefined || value === null) { return; }
      var v = String(value);
      if (!v) { return; }
      var e = payload[key];
      if (e === undefined || e === null || String(e).trim() === '') { payload[key] = v; }
    }

    for (var i = 0; i < UTM.length; i++) { fill(UTM[i], ft[UTM[i]] || cur[UTM[i]]); }

    fill('landing_page', ft.landing_page || ssGet(LEGACY_LANDING_KEY) || href());
    fill('page_url', href());
    fill('referrer', ft.referrer || d.referrer);
    fill('created_at', new Date().toISOString());
    fill('cid', cur.cid || ft.cid || payload.content_id ||
         meta(['bg:cid', 'bgm:content-id', 'bgk:content-id']));
    fill('campaign', cur.campaign || ft.campaign || ft.utm_campaign || payload.utm_campaign);
    fill('cluster', payload.cluster_id || cur.cluster || ft.cluster ||
         meta(['bgm:cluster-id', 'bgk:cluster-id', 'bg:cluster']));
    fill('lang', docLang());
    fill('form_name', formName(opts.form || null, opts.form_name));
    fill('source', opts.source || '');

    // Every canonical key is present in the emitted payload, empty rather than
    // absent, so downstream mapping never has to distinguish the two cases.
    for (var j = 0; j < CANONICAL.length; j++) {
      var k = CANONICAL[j];
      if (payload[k] === undefined || payload[k] === null) { payload[k] = ''; }
    }
    return payload;
  }

  w.BGAttribution = {
    VERSION: 'P0-002',
    CANONICAL_FIELDS: CANONICAL.slice(),
    apply: apply,
    capture: capture,
    firstTouch: firstTouch
  };

  capture();
})(window, document);

/* ==== BG-ATTRIBUTION-P0-002 EMBEDDED END ==== */

// ── BGM Attribution helper (AIR-009) — shared, registry-driven ───────────────
// Single data source: /assets/content-map.json (exported from CONTENT_REGISTRY).
// Self-contained so it works whether or not lead-capture.js is also present.
window.BGM = window.BGM || (function(){
  var MAP_URL = '/assets/content-map.json?v=markt076';
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

// ── Objekt-Anfrage → Netlify Forms → trusted server transport (P0-T2) ─────
//
// RETIRED AT T2: this block used to POST the lead straight to the Make hook
// from the browser, before form.submit(). That made an unauthenticated client
// the first writer into the pipeline and produced a Make execution BEFORE the
// Netlify ingress existed, with no idempotency and no server-authored brand.
// The hook URL was shipped in this file and is therefore permanently public.
//
// Now: the form submits to Netlify only. netlify/functions/submission-created
// is the sole path to Make. Nothing here talks to Make, and no Make webhook
// URL is present in this file any more.
//
// buildPayload is KEPT — not to send anywhere, but because it is where the
// registry-driven attribution (first-touch cid/cluster, utm, landing) is
// computed. That attribution used to reach Make only inside the webhook body;
// it is now written into the already-registered hidden form fields instead, so
// it survives the cutover.
(function(){

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

    // P0-002: canonical 15-field attribution contract. Runs AFTER BGM so every
    // existing Markt value is preserved exactly; this only fills empty fields.
    try {
      window.BGAttribution.apply(payload, {
        form: form,
        form_name: payload['form_name'],
        source: payload['source']
      });
      payload['landing_page'] = payload['landing_page'] || bgmLanding || window.location.href;
    } catch (e) {}

    return payload;
  }

  // ── P0-T2 · registered-field attribution writer ─────────────────────────
  // The client no longer talks to Make, so everything Make needs must travel
  // inside the Netlify submission — which means it must land in a field that is
  // ALREADY REGISTERED in the Netlify schema (33 / 30 / 31).
  //
  // setField refuses to create an input. If the field is not in the markup it
  // writes nothing, so this code cannot open a second schema window.
  //
  // DEFERRED — bounded attribution debt, accepted by the founder at T2:
  // first_touch_content_id and first_touch_cluster_id have no registered field.
  // They are NOT written and NOT smuggled into another field.
  //   FIRST_TOUCH_CONTENT_CLUSTER_PARITY = DEFERRED
  function setField(form, name, value, force) {
    if (value === undefined || value === null) return false;
    var v = String(value).trim();
    if (!v) return false;                                       // never fabricate
    var el = form.elements ? form.elements[name] : null;
    if (!el) return false;                                      // not registered
    if (el.length !== undefined && el.tagName === undefined) el = el[0];
    if (!el || el.tagName === undefined) return false;
    if (!force && String(el.value || '').trim()) return false;  // don't clobber
    el.value = v;
    return true;
  }

  function writeRegisteredAttribution(form, p) {
    var wrote = [];
    // page_url / page carries the cid-injected landing URL — byte-identical to
    // what the retired browser payload put in page_url, so Make [57]'s
    // ifempty(1.cid; ifempty(1.content_id; parse(1.page_url))) chain still
    // resolves exactly as it does today. Only one of the two names exists per
    // form; the other is silently skipped.
    if (setField(form, 'page_url', p['page_url'], true)) wrote.push('page_url');
    if (setField(form, 'page',     p['page_url'], true)) wrote.push('page');

    var fill = {
      cid:          p['cid'] || p['content_id'],
      cluster:      p['cluster_id'] || p['cluster'],
      campaign:     p['campaign'],
      utm_source:   p['utm_source'],
      utm_medium:   p['utm_medium'],
      utm_campaign: p['utm_campaign'],
      utm_content:  p['utm_content'],
      utm_term:     p['utm_term'],
      landing:      p['first_touch_url'] || p['landing_page'],
      referrer:     p['referrer'],
      region:       p['region']
    };
    for (var k in fill) { if (setField(form, k, fill[k], false)) wrote.push(k); }
    return wrote;
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

    // P0-T2: no webhook. Move the computed attribution into the registered
    // hidden fields, then hand off to the native Netlify submit (which performs
    // the /danke/ redirect exactly as before). The old 2s webhook race is gone,
    // so the redirect is now immediate.
    try { writeRegisteredAttribution(form, payload); } catch (e) {}

    form.submit();

  }, true);
})();
