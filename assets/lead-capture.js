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
    payload['page_url'] = bgmLanding || window.location.href;

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
