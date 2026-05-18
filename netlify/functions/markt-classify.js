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

// Webhook URL pulled from env so it never lives in source.
// Set MAKE_WEBHOOK_URL in Netlify → Site settings → Environment variables.
const MAKE_WEBHOOK = process.env.MAKE_WEBHOOK_URL || '';

exports.handler = async function (event) {
  // CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return cors(200, '');
  }

  if (event.httpMethod !== 'POST') {
    return cors(405, JSON.stringify({ error: 'Method Not Allowed' }));
  }

  let payload;
  try {
    payload = JSON.parse(event.body || '{}');
  } catch (e) {
    return cors(400, JSON.stringify({ error: 'Invalid JSON' }));
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
  if (!MAKE_WEBHOOK) {
    console.error('[markt-classify] MAKE_WEBHOOK_URL env var not set — lead NOT forwarded');
  } else {
    try {
      await fetch(MAKE_WEBHOOK, {
        method:    'POST',
        headers:   { 'Content-Type': 'application/json' },
        body:      JSON.stringify(enriched),
        keepalive: true,
      });
    } catch (e) {
      console.error('[markt-classify] Make.com forward error:', e.message);
      // Non-fatal: classification still succeeded
    }
  }

  return cors(200, JSON.stringify({ ok: true, level: classification.level }));
};

// ── OpenAI classification (GPT-4o-mini) ──────────────────────────────
async function classify(data) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.warn('[markt-classify] No OPENAI_API_KEY — using rule-based fallback');
    return ruleBasedClassify(data);
  }

  const prompt = buildPrompt(data);

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
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
    });

    if (!res.ok) {
      throw new Error(`OpenAI HTTP ${res.status}`);
    }

    const json    = await res.json();
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
    console.error('[markt-classify] OpenAI error:', e.message, '— falling back to rules');
    return ruleBasedClassify(data);
  }
}

// ── OpenAI prompt ────────────────────────────────────────────────────
function buildPrompt(data) {
  const kapital  = data.kapital_raw || data.budget || 'unbekannt';
  const ziel     = data.ziel || 'unbekannt';
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
  const kapital  = (data.kapital_raw || data.budget || '').toLowerCase();
  const ziel     = (data.ziel || '').toLowerCase();
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
