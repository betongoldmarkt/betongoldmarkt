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