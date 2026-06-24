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

    // AIR-007D — resolve a Markt content CID from the LANDING path (first-touch
    // content attribution) and ensure it rides inside page_url so Make scenario
    // 5743159's existing {{57.cid}} parser resolves it with NO Make change.
    var cid = resolveMarktCidFromUrl(landingUrl);
    payload['page_url'] = withCid(landingUrl, cid);
    if (cid) {
      // Additive, non-breaking discrete keys for future Make use (currently inert).
      if (!payload['cid'])        payload['cid'] = cid;
      if (!payload['content_id']) payload['content_id'] = cid;
    }

    return payload;
  }

  // AIR-007D — registry-verified path → Content ID (CONTENT_REGISTRY / PUBLICATION_REGISTRY).
  function resolveMarktCidFromUrl(url){
    try {
      var u = new URL(url, window.location.origin);
      var path = u.pathname.replace(/\/+$/, '/');
      if (path.charAt(path.length - 1) !== '/') path += '/';
      var pathToCid = {
        '/': 'CT-MKT-001',
        '/projekte/robinson-beach/': 'CT-MKT-002',
        '/projekte/gardenia-hills/': 'CT-MKT-003',
        '/angebote/': 'CT-MKT-004',
        '/ratenzahlung-bulgarien/': 'CT-MKT-010',
        '/ratenzahlung-bankimmobilien/': 'CT-MKT-011',
        '/neubau-bulgarien/': 'CT-MKT-012',
        '/wohnung-bulgarien-meer/': 'CT-MKT-013',
        '/immobilien-sonnenstrand/': 'CT-MKT-014',
        '/immobilien-bulgarien-guide-2026/': 'CT-MKT-015',
        '/betreuung-bulgarien/': 'CT-MKT-016'
      };
      if (pathToCid[path]) return pathToCid[path];
      // Object/detail pages inherit the parent project CID until their own
      // registry IDs are minted (registry decision, not website).
      if (path.indexOf('gardenia-hills') !== -1) return 'CT-MKT-003';
      if (path.indexOf('robinson-beach') !== -1) return 'CT-MKT-002';
      return '';
    } catch (e) { return ''; }
  }

  // AIR-007D — append cid to a URL without duplicating an existing cid.
  function withCid(url, cid){
    if (!cid) return url;
    try {
      var u = new URL(url, window.location.origin);
      if (u.searchParams.get('cid')) return url; // preserve existing cid, no duplicate
      u.searchParams.set('cid', cid);
      return u.toString();
    } catch (e) {
      if (/[?&]cid=/.test(url)) return url;
      return url + (url.indexOf('?') === -1 ? '?' : '&') + 'cid=' + encodeURIComponent(cid);
    }
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
