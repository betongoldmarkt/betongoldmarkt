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
