/**
 * DIETRICH OS — Markt Intelligence Layer
 * Netlify Function: markt-classify
 *
 * Flow: lead-capture.js → /.netlify/functions/markt-classify → OpenAI classify → Make.com webhook
 *
 * Adds fields to payload:
 *   level     : A | B | C | D
 *   priority  : High | Medium | Low
 *   segment   : Eigennutzer | Investor | Ratenzahlung | Offen
 *   next_step : Call sofort | Qualify | Observe | Ignore
 *
 * Airtable field mapping (Make.com Airtable module):
 *   level     → "Level"
 *   priority  → "Priority"
 *   segment   → "Segment"
 *   next_step → "Next Step"
 *
 * Telegram format (Make.com Telegram module message body):
 * ─────────────────────────────────────────────────────
 * 🏠 MARKT LEAD
 * 👤 Name: {{name}}   🎯 Ziel: {{ziel}}   💰 Budget: {{kapital_raw}}
 * 🏆 Level: {{level}}   ⚡ Priority: {{priority}}   📂 Segment: {{segment}}   ⚙️ Next Step: {{next_step}}
 * 📞 Telefon: {{telefon}}   ✉️ Email: {{email}}
 * ─────────────────────────────────────────────────────
 *
 * Env vars:
 *   MAKE_WEBHOOK_URL  — active Make.com scenario webhook (set in Netlify UI)
 *   OPENAI_API_KEY    — GPT-4o-mini classification (falls back to rule-based if absent)
 */

/* ==== BG-FETCH-TIMEOUT-P0-004 ====================================================
 * Shared server-side outbound-call policy for every DIETRICH OS Netlify Function.
 * Canonical source: PATCH/fetch-with-timeout.js — embedded byte-identically into
 * each Function so there is no bundler resolution risk at deploy time.
 *
 * POLICY (one policy, documented once, applied to all six outbound calls)
 *   - Every outbound fetch is bounded by an AbortController deadline.
 *   - Netlify synchronous Functions have a ~10 s wall clock. The budgets below
 *     are chosen so the worst-case sequential path stays inside it:
 *       markt-classify:  OpenAI 4 s  ->  Make 5 s   = 9 s worst case
 *       investor-lead:   Telegram 4 s || webhook 5 s (parallel) = 5 s worst case
 *       submission-created: same as investor-lead
 *   - NO automatic retry. A retry could deliver the same lead twice, and a
 *     duplicate lead is worse than a late one.
 *   - A timeout is a controlled classification, never a thrown raw error.
 *   - Nothing returned by this helper contains a URL, a token, a header, or an
 *     upstream response body.
 * ============================================================================= */

var BG_TIMEOUT_MS = {
  telegram: 4000,
  lead_webhook: 5000,
  make_webhook: 5000,
  openai: 4000
};

/**
 * Perform one bounded outbound request. Never throws, never retries.
 * @returns {Promise<{ok:boolean, status:number|null, timedOut:boolean,
 *                     errorCategory:string|null, durationMs:number, res:Response|null}>}
 *          errorCategory is one of: null | "timeout" | "network" | "http_error"
 *          It is a CATEGORY, never an upstream message, URL or body.
 */
async function bgFetch(url, options, budgetMs) {
  var controller = new AbortController();
  var started = Date.now();
  var timer = setTimeout(function () { controller.abort(); }, budgetMs);
  try {
    var res = await fetch(url, Object.assign({}, options || {}, { signal: controller.signal }));
    clearTimeout(timer);
    return {
      ok: res.ok === true,
      status: res.status,
      timedOut: false,
      errorCategory: res.ok === true ? null : "http_error",
      durationMs: Date.now() - started,
      res: res
    };
  } catch (err) {
    clearTimeout(timer);
    var aborted = !!(err && (err.name === "AbortError" || controller.signal.aborted));
    return {
      ok: false,
      status: null,
      timedOut: aborted,
      errorCategory: aborted ? "timeout" : "network",
      durationMs: Date.now() - started,
      res: null
    };
  }
}

/** HTTP status class ("2xx", "4xx", "none") for safe operational logging. */
function bgStatusClass(status) {
  if (status === null || status === undefined) return "none";
  return String(Math.floor(status / 100)) + "xx";
}

/** Non-guessable correlation id for log lines. Contains no request data. */
function bgCorrelationId() {
  try {
    return require("crypto").randomBytes(8).toString("hex");
  } catch (e) {
    return "nocid";
  }
}
/* ==== BG-FETCH-TIMEOUT-P0-004 END ============================================ */



// Webhook URL pulled from env so it never lives in source.
// Set MAKE_WEBHOOK_URL in Netlify → Site settings → Environment variables.
const MAKE_WEBHOOK = process.env.MAKE_WEBHOOK_URL || '';

// ── Input sanitization constants ──────────────────────────────────────────
const MAX_PAYLOAD_BYTES = 8192; // 8 KB — reject oversized bodies before parse

// Allowlists for fields inserted directly into the OpenAI prompt.
// Values outside these lists are replaced with 'unbekannt' to prevent injection.
const KAPITAL_ALLOWLIST = new Set([
  '25.000–50.000 €', '50.000–100.000 €', '100.000–250.000 €', '250.000+ €',
]);
const ZIEL_ALLOWLIST = new Set([
  'Investment', 'Eigennutzung', 'Noch unsicher',
]);

// Max character lengths per field (anything longer is truncated).
// Fields listed here are sanitized (control chars stripped) and length-limited.
// Fields NOT listed here are still passed through from the raw payload (see sanitizePayload).
const FIELD_LIMITS = {
  name:         120,
  email:        120,
  telefon:      30,
  whatsapp:     30,
  phone:        30,
  kapital_raw:  50,
  budget:       50,
  ziel:         60,
  source:       40,
  layer:        20,
  page:         200,
  'form-name':  40,
  form_name:    40,
  lead_type:    40,
  object_id:    60,
  object_name:  120,
  project_name: 120,
  price:        40,
  region:       80,
  asset_type:   60,
  page_url:     300,
  nachricht:    500,
  created_at:   30,
  // ── P0-002: canonical 15-field attribution contract ──────────────────────
  // Additive. Existing Markt-only fields (content_id, cluster_id,
  // first_touch_*) still pass through sanitizePayload untouched.
  cid:          120,
  content_id:   120,
  campaign:     120,
  cluster:      120,
  cluster_id:   120,
  lang:          16,
  landing_page: 300,
  referrer:     300,
  utm_source:   120,
  utm_medium:   120,
  utm_campaign: 120,
  utm_content:  120,
  utm_term:     120,
  first_touch_url:        300,
  first_touch_content_id: 120,
  first_touch_cluster_id: 120,
};

/**
 * Strip ASCII control chars (0x00-0x1F, DEL 0x7F) and truncate.
 * FIX T5: Previous regex /[ -]/g stripped hyphens, corrupting "investor-check" etc.
 * Returns '' if value is not a string.
 */
function sanitizeField(value, maxLen) {
  if (typeof value !== 'string') return '';
  return value.replace(/[\x00-\x1f\x7f]/g, '').slice(0, maxLen);
}

/**
 * Sanitize raw payload:
 * - Passes ALL raw fields through (nothing silently dropped)
 * - Applies control-char stripping + length limits to FIELD_LIMITS fields
 * - Validates prompt-injected fields against allowlists
 * - Adds _kapital_safe and _ziel_safe for use in buildPrompt()
 *
 * FIX T5: Previous version only copied fields in FIELD_LIMITS, silently
 * dropping lead_type, object_id, object_name, project_name, price, region,
 * asset_type, page_url, nachricht, created_at before forwarding to Make.com.
 */
function sanitizePayload(raw) {
  if (!raw || typeof raw !== 'object') return {};

  // Pass ALL raw fields through first (preserves lead_type, object fields, etc.)
  const safe = {};
  for (const key of Object.keys(raw)) {
    const v = raw[key];
    safe[key] = typeof v === 'string' ? v : (v != null ? String(v) : '');
  }

  // Then apply sanitization (control chars + length cap) to the known fields
  for (const [key, maxLen] of Object.entries(FIELD_LIMITS)) {
    const v = raw[key];
    safe[key] = sanitizeField(v != null ? String(v) : '', maxLen);
  }

  // Allowlist-gate the two fields inserted into the OpenAI prompt
  const kapitalRaw = safe.kapital_raw || safe.budget || '';
  safe._kapital_safe = KAPITAL_ALLOWLIST.has(kapitalRaw) ? kapitalRaw : 'unbekannt';

  const zielRaw = safe.ziel || '';
  safe._ziel_safe = ZIEL_ALLOWLIST.has(zielRaw) ? zielRaw : 'unbekannt';

  // source falls back to 'Markt' if empty after sanitize
  if (!safe.source) safe.source = 'Markt';

  return safe;
}

// ── P0-002: server-side required-field validation ──────────────────────────
// Runs on the server, cannot be bypassed from the client, and is not
// conditional on any client-supplied flag.
function missingRequired(safe) {
  const missing = [];
  if (!String(safe.name || '').trim()) missing.push('name');
  const email = String(safe.email || '').trim();
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) missing.push('email');
  return missing;
}

exports.handler = async function (event) {
  // CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return cors(200, '');
  }

  if (event.httpMethod !== 'POST') {
    return cors(405, JSON.stringify({ error: 'Method Not Allowed' }));
  }

  // Reject oversized payloads before parse (IC-003)
  if ((event.body || '').length > MAX_PAYLOAD_BYTES) {
    console.log(JSON.stringify({ fn: 'markt-classify', error_category: 'payload_too_large', bytes: (event.body || '').length }));
    return cors(413, JSON.stringify({ error: 'Payload too large' }));
  }

  let raw;
  try {
    raw = JSON.parse(event.body || '{}');
  } catch (e) {
    return cors(400, JSON.stringify({ error: 'Invalid JSON' }));
  }

  // Sanitize all fields — prevents prompt injection and oversized strings
  const cid = bgCorrelationId();
  const payload = sanitizePayload(raw);

  // ── P0-002: server-side required-field validation, before any spend ──
  const missing = missingRequired(payload);
  if (missing.length) {
    return cors(422, JSON.stringify({
      ok: false, delivered: false, error: 'missing_required_fields', fields: missing,
    }));
  }

  // ── Classify ──────────────────────────────────────────────────────
  const classification = await classify(payload);

  // ── Enrich payload (additive — no existing fields removed) ────────
  const enriched = {
    ...payload,
    level:     classification.level,
    priority:  classification.priority,
    segment:   classification.segment,
    next_step: classification.next_step,
  };

  // ── Forward to Make.com ───────────────────────────────────────────
  // P0-002: the response must state what actually happened. `delivered` is
  // true only when Make confirmed receipt.
  let delivered  = false;
  let configured = Boolean(MAKE_WEBHOOK);

  if (!MAKE_WEBHOOK) {
    console.log(JSON.stringify({ fn: 'markt-classify', cid, sink: 'make_webhook', delivered: false, error_category: 'not_configured' }));
  } else {
    // P0-004 GATE-FN-02: bounded outbound call, exactly one attempt, no retry.
    const out = await bgFetch(MAKE_WEBHOOK, {
      method:    'POST',
      headers:   { 'Content-Type': 'application/json' },
      body:      JSON.stringify(enriched),
      keepalive: true,
    }, BG_TIMEOUT_MS.make_webhook);
    delivered = out.ok;
    // P0-004 GATE-FN-03: status CLASS and duration only. The upstream response
    // body is never read into a log, and the webhook URL is never printed.
    console.log(JSON.stringify({
      fn: 'markt-classify', cid, sink: 'make_webhook', delivered,
      status_class: bgStatusClass(out.status),
      error_category: out.errorCategory, duration_ms: out.durationMs,
    }));
  }

  if (!delivered && !configured) {
    return cors(503, JSON.stringify({ ok: false, delivered: false, error: 'not_configured', level: classification.level }));
  }
  if (!delivered) {
    return cors(502, JSON.stringify({ ok: false, delivered: false, error: 'upstream_unavailable', level: classification.level }));
  }

  return cors(200, JSON.stringify({ ok: true, delivered: true, level: classification.level }));
};

// ── OpenAI classification (GPT-4o-mini) ──────────────────────────────
async function classify(data) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.log(JSON.stringify({ fn: 'markt-classify', sink: 'openai', classified_by: 'rule_fallback', error_category: 'not_configured' }));
    return ruleBasedClassify(data);
  }

  const prompt = buildPrompt(data);

  try {
    // P0-004 GATE-FN-02: bounded outbound call. On timeout the rule-based
    // fallback runs, so classification degrades but delivery is unaffected.
    const out = await bgFetch('https://api.openai.com/v1/chat/completions', {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model:       'gpt-4o-mini',
        temperature: 0.1,
        max_tokens:  180,
        messages: [
          {
            role:    'system',
            content: 'You are a real estate lead classifier for a Bulgarian property platform. Return ONLY valid JSON. No markdown, no explanation outside the JSON.',
          },
          { role: 'user', content: prompt },
        ],
      }),
    }, BG_TIMEOUT_MS.openai);

    if (!out.res || !out.ok) {
      // Timeout, network error or non-2xx — degrade to the rule-based path.
      console.log(JSON.stringify({
        fn: 'markt-classify', sink: 'openai', classified_by: 'rule_fallback',
        status_class: bgStatusClass(out.status), error_category: out.errorCategory,
        duration_ms: out.durationMs,
      }));
      return ruleBasedClassify(data);
    }

    const json    = await out.res.json();
    const content = json.choices?.[0]?.message?.content?.trim() || '';
    const parsed  = JSON.parse(content);

    // Validate expected keys exist
    if (!parsed.level || !parsed.priority || !parsed.segment || !parsed.next_step) {
      throw new Error('Incomplete classification response');
    }

    return {
      level:     sanitizeLevel(parsed.level),
      priority:  sanitizePriority(parsed.priority),
      segment:   sanitizeSegment(parsed.segment),
      next_step: sanitizeNextStep(parsed.next_step),
    };
  } catch (e) {
    // P0-004 GATE-FN-03: error CATEGORY only — never the message, which can
    // echo prompt content or endpoint detail.
    console.log(JSON.stringify({
      fn: 'markt-classify', sink: 'openai', classified_by: 'rule_fallback',
      error_category: 'parse_or_shape_error',
    }));
    return ruleBasedClassify(data);
  }
}

// ── OpenAI prompt ────────────────────────────────────────────────────
function buildPrompt(data) {
  // Use allowlisted safe values only — raw fields must never enter the prompt
  const kapital  = data._kapital_safe || 'unbekannt';
  const ziel     = data._ziel_safe    || 'unbekannt';
  const hasPhone = !!(data.telefon || data.whatsapp || data.phone || '').replace(/\s/g, '');
  const source   = data.source || 'Markt';

  return `Classify this real estate lead for a Bulgarian property platform targeting DACH investors.

Lead data:
- Budget/Capital: ${kapital}
- Goal (Ziel): ${ziel}
- Phone provided: ${hasPhone ? 'yes' : 'no'}
- Source: ${source}

Classification rules:
Level:
  A = Investor intent OR capital 100.000€+ → high capital, investment goal
  B = Clear buyer intent, medium budget (50k–100k), or Eigennutzung with budget
  C = General inquiry, unclear goal, low budget <50k
  D = No budget, no goal, no actionable data

Priority:
  High   = Level A with phone
  Medium = Level A without phone, OR Level B with phone
  Low    = Level B without phone, Level C, or Level D

Segment:
  Investor     = ziel contains "Investment" or capital 100k+
  Eigennutzer  = ziel contains "Eigennutzung"
  Ratenzahlung = budget "bis 50.000" or no budget mentioned
  Offen        = unclear or "Noch unsicher"

Next Step:
  Call sofort = Level A + High priority
  Qualify     = Level A (no phone) or Level B
  Observe     = Level C
  Ignore      = Level D

Return JSON only:
{"level":"A","priority":"High","segment":"Investor","next_step":"Call sofort"}`;
}

// ── Rule-based fallback (no API key / OpenAI down) ───────────────────
function ruleBasedClassify(data) {
  // Use allowlisted safe fields — fallback uses the same sanitized values as the prompt path
  const kapital  = (data._kapital_safe || '').toLowerCase();
  const ziel     = (data._ziel_safe    || '').toLowerCase();
  const hasPhone = !!(data.telefon || data.whatsapp || data.phone || '').replace(/\s/g, '');

  // Segment
  let segment;
  if (ziel.includes('investment')) {
    segment = 'Investor';
  } else if (ziel.includes('eigennutzung') || ziel.includes('eigennutz')) {
    segment = 'Eigennutzer';
  } else if (kapital.includes('bis 50') || kapital === '') {
    segment = 'Ratenzahlung';
  } else {
    segment = 'Offen';
  }

  // Level
  let level;
  const highCapital = kapital.includes('100.000') || kapital.includes('250.000') || kapital.includes('100k') || kapital.includes('+');
  if (highCapital || segment === 'Investor') {
    level = 'A';
  } else if (segment === 'Eigennutzer' || kapital.includes('50.000')) {
    level = 'B';
  } else if (kapital.includes('bis 50') || segment === 'Ratenzahlung') {
    level = 'C';
  } else {
    level = 'D';
  }

  // Priority
  let priority;
  if (level === 'A' && hasPhone) {
    priority = 'High';
  } else if (level === 'A' || (level === 'B' && hasPhone)) {
    priority = 'Medium';
  } else {
    priority = 'Low';
  }

  // Next Step
  let next_step;
  if (level === 'A' && priority === 'High') {
    next_step = 'Call sofort';
  } else if (level === 'A' || level === 'B') {
    next_step = 'Qualify';
  } else if (level === 'C') {
    next_step = 'Observe';
  } else {
    next_step = 'Ignore';
  }

  return { level, priority, segment, next_step };
}

// ── Sanitizers — enforce allowed enum values ─────────────────────────
function sanitizeLevel(v)    { return ['A','B','C','D'].includes(v) ? v : 'D'; }
function sanitizePriority(v) { return ['High','Medium','Low'].includes(v) ? v : 'Low'; }
function sanitizeSegment(v)  { return ['Eigennutzer','Investor','Ratenzahlung','Offen'].includes(v) ? v : 'Offen'; }
function sanitizeNextStep(v) { return ['Call sofort','Qualify','Observe','Ignore'].includes(v) ? v : 'Observe'; }

// ── CORS helper ──────────────────────────────────────────────────────
function cors(statusCode, body) {
  return {
    statusCode,
    headers: {
      'Content-Type':                'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers':'Content-Type',
    },
    body,
  };
}
