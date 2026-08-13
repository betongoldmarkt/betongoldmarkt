/*
 * submission-created.mjs — BETON GOLD MARKT
 *   P0-C2    · TRUSTED SERVER CAPTURE      (unchanged contract, preserved verbatim)
 *   P0-C2.1  · ATOMIC SERVER IDEMPOTENCY   (added here)
 *
 * Netlify Forms `submission-created` event handler. Fires server-side on every
 * stored submission; the browser cannot skip it.
 *
 * ─── T2 — THIS IS NOW THE OPERATIONAL TRANSPORT ──────────────────────────
 * Until T2 this file was shadow: it captured and logged, and nothing else.
 * The live path was the browser:
 *   objekt-anfrage               markt.js        → browser → Make hook
 *   investor-check/markt-anfrage lead-capture.js → markt-classify → Make
 * Both fired BEFORE form.submit(), so Make saw the lead before Netlify did,
 * from an untrusted client, with no idempotency.
 *
 * As of T2 that is retired. Both client transports now populate the already
 * registered hidden attribution fields and hand off to the native Netlify
 * submit; nothing in shipped client JS posts to Make any more. This Function
 * is the ONLY path from a Markt lead to Make:
 *
 *   one user action → one Netlify ingress → one trusted server decision
 *                   → at most one Make send
 *
 * It still writes NOTHING to Airtable and sends NO Telegram — Make owns both,
 * exactly as before. Its outputs are: one structured log line (PII-free), one
 * idempotency claim in Netlify Blobs (a one-way hash, a correlation id and a
 * timestamp — no submission content), and at most one POST to Make.
 *
 * ─── SEND POLICY — FAIL OPEN (founder decision, T2) ──────────────────────
 *   PRIMARY             → send exactly once
 *   RETRY               → NO send   (same trusted ingress already processed)
 *   DUPLICATE           → NO send   (same content inside the window)
 *   ungoverned form     → NO send   (and no claim, no log beyond the ignore)
 *   STORE_UNAVAILABLE   → SEND, marked dedup_unverified = true
 *   INDETERMINATE       → SEND, marked dedup_unverified = true
 *
 * Lead preservation outranks duplicate suppression: an idempotency-store
 * outage must never silently drop a lead. Such a lead is NEVER relabelled
 * PRIMARY — it travels with its real state and an explicit dedup_unverified
 * flag, and Make [61] MARKT_DEDUP_SEARCH remains a secondary, non-authoritative
 * fallback behind it.
 *
 * ─── WHY THIS FILE IS .mjs AND USES THE REQUEST/RESPONSE FORM ────────────
 * C2 shipped as `exports.handler` (Lambda-compatibility form). That form does
 * NOT receive Netlify's automatic Blobs environment injection: `getStore()`
 * fails with "The environment has not been configured to use Netlify Blobs",
 * which is exactly what the C2.1 probe observed before it was corrected.
 * `connectLambda(event)` is not a way out either: it populates `edgeURL` but
 * never `uncachedEdgeURL`, and @netlify/blobs 10.7.9 throws
 * `BlobsConsistencyError` for ANY request when `consistency: "strong"` is asked
 * for without `uncachedEdgeURL` (main.cjs L256). Strong consistency is not
 * negotiable here, so the modern form is required.
 *
 * Netlify's event-trigger *filename convention* is fully supported with this
 * form — the payload arrives as the request body. `.mjs` is used rather than
 * `.js` so the module format is unambiguous WITHOUT adding `"type": "module"`
 * to the repository root, which would break the sibling CommonJS function
 * `markt-classify.js`.
 *
 * ─── IDEMPOTENCY: TWO IDENTITIES, NEITHER REPLACES THE OTHER ─────────────
 *   correlation_id     one trusted Netlify ingress. Derivation UNCHANGED.
 *   dedup fingerprint  one canonical business content, for the case C2 cannot
 *                      see: two DIFFERENT ingress ids representing one user
 *                      action.
 *
 *   RETRY      same ingress id processed again          → same correlation_id
 *   DUPLICATE  different ingress, same fingerprint, inside the window
 *   PRIMARY    first sighting, or same fingerprint outside the window
 *
 * The ONLY authority is a conditional write (create-if-absent, or
 * compare-and-set on the ETag). There is deliberately NO read-then-write path,
 * NO in-memory dedup, NO Airtable search-then-create and NO Make [61] gate —
 * every one of those has already failed this exact race. If the store is
 * unreachable the Function reports STORE_UNAVAILABLE loudly and changes
 * nothing else; it never degrades to a weaker primitive and never guesses
 * PRIMARY.
 */

import crypto from "node:crypto";
import { getStore } from "@netlify/blobs";

// ─── TRUST BOUNDARY ───────────────────────────────────────────────────────
// Server-authored brand identity. The ONLY source of `brand`. Never read from
// the submission, never defaulted from client input, assigned unconditionally
// after normalisation. C1 deliberately left `brand` out of every form schema.
const BRAND = "MARKT";

// ─── T2 TRANSPORT ─────────────────────────────────────────────────────────
// The shared Make hook, read from the Netlify environment variable that
// markt-classify has used since 2026-05-18. NOT hardcoded here, and never
// logged: the hook is an unauthenticated ingress and must not be reprinted.
const MAKE_WEBHOOK = process.env.MAKE_WEBHOOK_URL || "";
const MAKE_TIMEOUT_MS = 8000;   // Netlify's function ceiling is 10s
const MAKE_ATTEMPTS = 2;        // one immediate retry for a transient failure

// States that forward. STORE_UNAVAILABLE / INDETERMINATE are here by explicit
// founder decision (fail open) and always carry dedup_unverified = true.
const SEND_STATES = new Set(["PRIMARY", "STORE_UNAVAILABLE", "INDETERMINATE"]);
const UNVERIFIED_STATES = new Set(["STORE_UNAVAILABLE", "INDETERMINATE"]);

// Never forwarded: the honeypot, Netlify's own request metadata, and the
// duplicated form identifier. Everything else the user actually filled in is
// passed through unchanged so Make's existing mappings keep working.
const OUTBOUND_EXCLUDE = new Set(["website", "bot-field", "ip", "user_agent", "form-name"]);

// Only these three governed Markt form definitions are processed.
const GOVERNED_FORMS = {
  "investor-check": { form_version: "markt-legacy-1", scoring_model: "MARKT_AI_LEGACY" },
  "markt-anfrage":  { form_version: "markt-legacy-1", scoring_model: "MARKT_AI_LEGACY" },
  "objekt-anfrage": { form_version: "markt-legacy-1", scoring_model: "MARKT_AI_LEGACY" },
};

// Governed QA tokens. Kept identical to the tokens Make [57] already matches so
// server and Make never disagree about what a test is.
const QA_TOKENS = ["TEST_MARKT_QA", "__ORCHESTRATION_TEST__"];

// Namespace for deterministic correlation ids. Changing it re-keys every id.
const CORRELATION_NS = "betongoldmarkt.p0c2.v1";

// ─── C2.1 IDEMPOTENCY CONSTANTS ───────────────────────────────────────────
// Namespace for content fingerprints. Changing it re-keys every fingerprint
// and therefore resets duplicate detection; it is versioned for that reason.
const DEDUP_NS = "betongoldmarkt.p0c21.v1";
const DEDUP_STORE = "markt-idempotency";
const DEDUP_KEY_VERSION = "c21/v1";

// Founder parameter (artifact 34 §4), not an engineering constant. Immediate
// technical duplicate suppression only — NOT long-term lead suppression.
// Observed live duplicates were ~937 ms apart.
const DEDUP_WINDOW_MS = 60 * 1000;

// Bounded retry for the claim loop. Each iteration is a conditional write, so
// looping cannot weaken the guarantee; it only bounds livelock.
const MAX_CLAIM_ATTEMPTS = 3;

/**
 * Fields that constitute "the same enquiry", per artifact 34 §3, verified
 * against the live C1 markup (33 / 30 / 31 field schemas).
 *
 * EXCLUDED BY CONSTRUCTION — everything volatile or system-authored:
 * ingress_id, correlation_id, timestamps, referrer, landing, campaign, utm_*,
 * cid, cluster, source, entry_point, is_test, client_nonce, layer, page,
 * page_url, region, form_version, scoring_model, lead_type, website (honeypot).
 */
const FINGERPRINT_FIELDS = {
  "investor-check": ["kapital_raw", "ziel", "level_raw", "asset_type", "suchtyp", "access_type", "region_wunsch", "nachricht"],
  "markt-anfrage":  ["kapital_raw", "ziel", "asset_type", "access_type", "region_wunsch", "nachricht"],
  "objekt-anfrage": ["object_id", "kapital_raw", "ziel", "nachricht"],
};

// Separators chosen because they cannot occur in form input: ASCII US / RS / GS.
const SEP_KV = "\u001F";   // ASCII US  — cannot occur in form input
const SEP_FIELD = "\u001E"; // ASCII RS  — cannot occur in form input
const SEP_NS = "\u001D";    // ASCII GS  — cannot occur in form input

const s = (v) => (v === undefined || v === null ? "" : String(v));
const trim = (v) => s(v).trim();
/** trim + collapse every internal whitespace run to a single space. */
const collapse = (v) => trim(v).replace(/\s+/g, " ");
/** digits only — strips +, spaces, parentheses, dashes, dots. */
const digitsOnly = (v) => s(v).replace(/\D+/g, "");

/**
 * correlation_id — generated at the earliest TRUSTED layer (this Function),
 * never accepted from the client.
 *
 * Derived deterministically from the Netlify submission id, so a Netlify event
 * retry for the SAME submission yields the SAME correlation_id. That is what
 * makes reconciliation possible across retries. If the platform ever omits the
 * id, we fall back to a random v4 and say so in `correlation_source`, because a
 * silently non-deterministic id would be worse than a declared one.
 *
 * UNCHANGED BY C2.1.
 */
function correlationFor(ingressId) {
  if (ingressId) {
    const h = crypto.createHash("sha256").update(CORRELATION_NS + "|" + ingressId).digest("hex");
    return {
      correlation_id:
        h.slice(0, 8) + "-" + h.slice(8, 12) + "-" + h.slice(12, 16) + "-" +
        h.slice(16, 20) + "-" + h.slice(20, 32),
      correlation_source: "derived:netlify_submission_id",
    };
  }
  return { correlation_id: crypto.randomUUID(), correlation_source: "random:no_ingress_id" };
}

/**
 * Trusted TEST classification.
 * A client-supplied is_test field is NEVER sufficient authority — it is read
 * only to be reported as client_is_test_raw for observability.
 *
 * UNCHANGED BY C2.1.
 */
function classifyTest(f, formName) {
  const hay = [f.name, f.email, f.source, f.page_url, f.page, formName]
    .map((x) => trim(x).toUpperCase()).join(" | ");
  for (const t of QA_TOKENS) if (hay.indexOf(t) !== -1) return { is_test: true, rule: "qa_token:" + t };
  if (trim(f.email).toLowerCase().endsWith("@test.invalid")) return { is_test: true, rule: "qa_email_domain" };
  return { is_test: false, rule: "no_governed_qa_marker" };
}

/** Pull a query parameter out of a URL without inventing one. */
function param(url, key) {
  const u = s(url); const q = u.split("#")[0].split("?")[1];
  if (!q) return "";
  for (const kv of q.split("&")) {
    const i = kv.indexOf("=");
    const k = decodeURIComponent((i < 0 ? kv : kv.slice(0, i)).replace(/\+/g, " ")).trim();
    if (k === key) return i < 0 ? "" : decodeURIComponent(kv.slice(i + 1).replace(/\+/g, " ")).trim();
  }
  return "";
}

/**
 * Attribution normalisation.
 * Rule: never fabricate. A field with no evidence stays "" and is reported
 * UNAVAILABLE. C1 registered these statically but nothing populates them
 * client-side yet (D-16), so most resolve from the URL or stay blank.
 *
 * UNCHANGED BY C2.1.
 */
function normaliseAttribution(f, formName) {
  const pageUrl = trim(f.page_url) || trim(f.page);
  const landing = trim(f.landing);
  const src = (k) => trim(f[k]) || param(pageUrl, k) || param(landing, k);

  const out = {
    source:      trim(f.source) || "Markt",                       // CLIENT_RAW, validated
    entry_point: trim(f.entry_point) || "markt:" + formName,      // CLIENT_RAW (C1), fallback SERVER_DERIVED
    cid:         trim(f.cid) || param(pageUrl, "cid") || param(pageUrl, "content_id") ||
                 param(landing, "cid"),                            // SERVER_DERIVED or UNAVAILABLE
    campaign:    src("campaign") || src("utm_campaign"),
    utm_source:  src("utm_source"),
    utm_medium:  src("utm_medium"),
    utm_campaign: src("utm_campaign"),
    utm_content: src("utm_content"),
    utm_term:    src("utm_term"),
    landing:     landing,
    referrer:    trim(f.referrer),
    region:      trim(f.region),                                  // CLIENT_RAW on objekt-anfrage
    cluster:     trim(f.cluster) || param(pageUrl, "cluster"),
    client_nonce: trim(f.client_nonce),                            // untrusted, echoed only
    page_url:    pageUrl,
  };

  const provenance = {};
  for (const k of Object.keys(out)) {
    if (k === "page_url") continue;
    if (!out[k]) provenance[k] = "UNAVAILABLE";
    else if (trim(f[k])) provenance[k] = "CLIENT_RAW";
    else provenance[k] = "SERVER_DERIVED";
  }
  if (out.source === "Markt" && !trim(f.source)) provenance.source = "SERVER_NORMALIZED";
  if (out.entry_point && !trim(f.entry_point)) provenance.entry_point = "SERVER_DERIVED";
  return { attribution: out, provenance };
}

// ─── C2.1 · CONTENT FINGERPRINT ───────────────────────────────────────────

/**
 * Deterministic canonical pairs for one submission.
 * Fixed order, defined per-field normalisation, one stable representation for
 * blank/null (the empty string). No AI, no heuristics, no locale dependence.
 */
function canonicalPairs(formName, f) {
  const pairs = [
    ["form_name", collapse(formName)],
    ["email",     collapse(f.email).toLowerCase()],
    ["name",      collapse(f.name)],
    ["telefon",   digitsOnly(f.telefon)],
  ];
  for (const key of (FINGERPRINT_FIELDS[formName] || [])) {
    pairs.push([key, collapse(f[key])]);
  }
  return pairs;
}

/**
 * SHA-256 over the canonical representation.
 *
 * PRIVACY: the canonical string is built, hashed and discarded inside this
 * function. It is never stored, never logged and never returned. Only the hash
 * leaves — and the hash is treated as pseudonymous personal data (correlatable,
 * internal only, never exposed on a public read surface).
 */
function fingerprintFor(formName, f) {
  const canonical = canonicalPairs(formName, f)
    .map(([k, v]) => k + SEP_KV + v)
    .join(SEP_FIELD);
  return crypto.createHash("sha256").update(DEDUP_NS + SEP_NS + canonical).digest("hex");
}

// ─── C2.1 · ATOMIC CLAIM ──────────────────────────────────────────────────

/*
 * TEST SEAM. Production never calls this: `__storeFactory` stays null and the
 * real `getStore` is used. It exists so the acceptance matrix can drive the
 * exact same code path against a store double that models Netlify Blobs'
 * conditional-write semantics. It is module-scoped and unreachable over HTTP.
 */
let __storeFactory = null;
export const __setStoreFactoryForTests = (fn) => { __storeFactory = fn; };

function acquireStore() {
  if (__storeFactory) return __storeFactory();
  // `consistency: "strong"` is mandatory: the read that follows a failed claim
  // must observe the winning writer's value, not a cached one.
  return getStore({ name: DEDUP_STORE, consistency: "strong" });
}

const ingressKey = (correlationId) => `${DEDUP_KEY_VERSION}/ingress/${correlationId}`;
const contentKey = (formName, fingerprint) => `${DEDUP_KEY_VERSION}/content/${formName}/${fingerprint}`;

/**
 * Same-ingress detection. Create-if-absent on the correlation id.
 * modified === true  → this trusted ingress has not been processed before.
 * modified === false → Netlify replayed the same submission → RETRY.
 */
async function claimIngress(store, correlationId, record) {
  const res = await store.set(ingressKey(correlationId), JSON.stringify(record), { onlyIfNew: true });
  return res && res.modified === true;
}

/**
 * Same-content detection inside the window.
 *
 * Every decision is made by a CONDITIONAL WRITE:
 *   create-if-absent (onlyIfNew)   → wins the first claim
 *   compare-and-set  (onlyIfMatch) → takes over an entry whose window expired
 * The read between them only fetches the incumbent's value so the duplicate can
 * cite it; it is never the exclusion mechanism, so the Make [61] race cannot
 * reappear here.
 */
async function claimContent(store, key, nowMs, record) {
  for (let attempt = 1; attempt <= MAX_CLAIM_ATTEMPTS; attempt++) {
    const created = await store.set(key, JSON.stringify(record), { onlyIfNew: true });
    if (created && created.modified === true) {
      return { dedup_status: "PRIMARY", dedup_claim: "create", dedup_attempts: attempt };
    }

    const existing = await store.getWithMetadata(key, { type: "json" });
    if (!existing || !existing.data) {
      // Incumbent vanished between the failed create and this read. Loop and
      // try to create again — never assume PRIMARY.
      continue;
    }

    const prev = existing.data;
    const prevAt = Date.parse(prev.claimed_at);
    const ageMs = Number.isFinite(prevAt) ? nowMs - prevAt : null;

    if (ageMs !== null && ageMs >= 0 && ageMs <= DEDUP_WINDOW_MS) {
      return {
        dedup_status: "DUPLICATE",
        dedup_claim: "blocked_in_window",
        dedup_attempts: attempt,
        dedup_age_ms: ageMs,
        duplicate_of_correlation_id: s(prev.correlation_id),
      };
    }

    // Outside the window (or an unparseable incumbent timestamp — recorded, not
    // silently tolerated). A legitimate later enquiry. Take the claim over
    // atomically; if another writer wins the race, loop and re-evaluate.
    if (!existing.etag) {
      continue;
    }
    const taken = await store.set(key, JSON.stringify(record), { onlyIfMatch: existing.etag });
    if (taken && taken.modified === true) {
      const out = {
        dedup_status: "PRIMARY",
        dedup_claim: "cas_takeover",
        dedup_attempts: attempt,
        dedup_previous_age_ms: ageMs,
      };
      if (ageMs === null) out.dedup_anomaly = "unparseable_incumbent_claimed_at";
      return out;
    }
  }

  // Bounded livelock. Deliberately NOT PRIMARY and NOT DUPLICATE: an
  // unresolved claim must be visible, not guessed.
  return { dedup_status: "INDETERMINATE", dedup_claim: "attempts_exhausted", dedup_attempts: MAX_CLAIM_ATTEMPTS };
}

/**
 * Full idempotency decision. Any store failure yields STORE_UNAVAILABLE and
 * nothing else changes — the user journey and the live browser transport are
 * untouched either way, because this Function affects neither.
 */
async function resolveIdempotency({ correlationId, formName, fields, ingressId, isTest, nowMs }) {
  const fingerprint = fingerprintFor(formName, fields);
  const base = { dedup_fingerprint: fingerprint, dedup_window_ms: DEDUP_WINDOW_MS };

  let store;
  try {
    store = acquireStore();
  } catch (e) {
    return { ...base, dedup_status: "STORE_UNAVAILABLE", dedup_claim: "getStore_failed", dedup_error: String((e && e.message) || e) };
  }

  // Stored record holds NO submission content: a correlation id, the form, the
  // trusted ingress id, a timestamp and the test flag. The canonical string is
  // never persisted; the fingerprint is the key, not the value.
  const record = {
    v: 1,
    correlation_id: correlationId,
    ingress_id: ingressId,
    form_name: formName,
    is_test: isTest,
    claimed_at: new Date(nowMs).toISOString(),
  };

  try {
    const firstSighting = await claimIngress(store, correlationId, record);
    if (!firstSighting) {
      return { ...base, dedup_status: "RETRY", dedup_claim: "ingress_already_seen", dedup_attempts: 1 };
    }
    const content = await claimContent(store, contentKey(formName, fingerprint), nowMs, record);
    return { ...base, ...content };
  } catch (e) {
    return { ...base, dedup_status: "STORE_UNAVAILABLE", dedup_claim: "claim_failed", dedup_error: String((e && e.message) || e) };
  }
}

// ─── T2 · SERVER → MAKE TRANSPORT ─────────────────────────────────────────

/**
 * The payload Make receives.
 *
 * Shape parity is deliberate: Make scenario 5743159 is NOT changed by T2, so
 * every mapping it already uses must resolve exactly as it did when the browser
 * posted. Raw form values pass through untouched; the server-authored fields
 * are then applied ON TOP so no client value can overwrite an identity.
 *
 * Router [23] still keys on `source` — `brand` rides along but nothing in Make
 * reads it yet. Switching routing authority to `brand` is C3, not T2.
 */
function buildOutbound(fields, canonical, dedup) {
  const outbound = {};
  for (const k of Object.keys(fields)) {
    if (OUTBOUND_EXCLUDE.has(k)) continue;
    outbound[k] = s(fields[k]);
  }

  // Server-authored values win, unconditionally.
  Object.assign(outbound, canonical);

  // Aliases the browser payload also carried. Make [24] reads {{1.telefon}};
  // the mirrors exist so any mapping on {{1.phone}} / {{1.whatsapp}} that was
  // satisfied before T2 stays satisfied. Not fabrication — same value, same
  // meaning, under the names the previous payload already used.
  const phone = trim(outbound.telefon);
  if (phone) { outbound.phone = phone; outbound.whatsapp = phone; }

  // Make [57] resolves CID as ifempty(1.cid; ifempty(1.content_id; <parse
  // ?cid= out of 1.page_url>)). The clients now populate the registered `cid`
  // field, so the first branch hits; the alias keeps the second branch intact.
  if (trim(outbound.cid)) outbound.content_id = trim(outbound.cid);

  // Idempotency verdict travels with the lead so it is auditable downstream.
  outbound.dedup_status = dedup.dedup_status;
  outbound.dedup_unverified = UNVERIFIED_STATES.has(dedup.dedup_status);
  if (dedup.duplicate_of_correlation_id) {
    outbound.duplicate_of_correlation_id = dedup.duplicate_of_correlation_id;
  }
  return outbound;
}

/**
 * One POST to Make, bounded and non-throwing.
 *
 * Returns { make_sends, make_send_status, make_send_ms, make_http_status }.
 * `make_sends` counts POSTs actually issued, so a delivered lead reads 1 and a
 * suppressed one reads 0 — the number is about the wire, not about intent.
 */
async function forwardToMake(outbound) {
  if (!MAKE_WEBHOOK) {
    // Cannot fail open with nowhere to send. Loud, not silent.
    return { make_sends: 0, make_send_status: "not_configured", make_send_ms: 0 };
  }

  const started = Date.now();
  let last = "";
  for (let attempt = 1; attempt <= MAKE_ATTEMPTS; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), MAKE_TIMEOUT_MS);
    try {
      const res = await fetch(MAKE_WEBHOOK, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(outbound),
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (res && res.ok) {
        return {
          make_sends: attempt, make_send_status: "delivered",
          make_http_status: res.status, make_send_ms: Date.now() - started,
        };
      }
      last = "http_" + (res ? res.status : "no_response");
    } catch (e) {
      clearTimeout(timer);
      last = "error:" + String((e && e.message) || e);
    }
  }
  // Exhausted. The ingress claim is already taken, so a replay would classify
  // as RETRY and would not resend — this line is the alert condition.
  return { make_sends: MAKE_ATTEMPTS, make_send_status: "failed:" + last, make_send_ms: Date.now() - started };
}

// ─── HANDLER ──────────────────────────────────────────────────────────────

const json = (status, obj) =>
  new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });

export default async (req) => {
  try {
    let body = {};
    try { body = await req.json(); } catch { body = {}; }
    const p = (body && body.payload) || {};
    const f = p.data || {};
    const formName = trim(p.form_name) || trim(f["form-name"]) || trim(f.form_name);

    // Unknown / legacy / unapproved form: ignore safely. No send, no write, no
    // claim, no throw.
    if (!Object.prototype.hasOwnProperty.call(GOVERNED_FORMS, formName)) {
      console.log(JSON.stringify({
        fn: "markt-submission-created", result: "ignored_ungoverned_form",
        form_name: formName || "(none)", ingress_id: trim(p.id) || "(none)",
        transport: "server_to_make", make_sends: 0,
        make_send_status: "suppressed:ungoverned_form",
        airtable_writes: 0, telegram_sends: 0,
      }));
      return new Response("ignored", { status: 200 });
    }

    const ingressId = trim(p.id);
    const { correlation_id, correlation_source } = correlationFor(ingressId);
    const t = classifyTest(f, formName);
    const { attribution, provenance } = normaliseAttribution(f, formName);
    const ident = GOVERNED_FORMS[formName];

    // ─── CANONICAL SERVER PAYLOAD ─────────────────────────────────────────
    // Built and validated. NOT SENT ANYWHERE in C2 / C2.1.
    const canonical = Object.assign({}, attribution, {
      form_name:     formName,
      form_version:  ident.form_version,
      scoring_model: ident.scoring_model,
      ingress_id:    ingressId,
      correlation_id,
      correlation_source,
      is_test:       t.is_test,
      capture_path:  "netlify_forms_server",
      created_at:    trim(p.created_at) || new Date().toISOString(),
    });
    // Trusted identity assigned LAST and unconditionally: a hard overwrite, not
    // a default. No form field or client value can author it.
    canonical.brand = BRAND;

    // ─── C2.1 IDEMPOTENCY ─────────────────────────────────────────────────
    const dedup = await resolveIdempotency({
      correlationId: canonical.correlation_id,
      formName,
      fields: f,
      ingressId,
      isTest: canonical.is_test,
      nowMs: Date.now(),
    });

    // ─── T2 FORWARD DECISION ──────────────────────────────────────────────
    // The decision is a pure lookup on the idempotency verdict. There is no
    // branch anywhere in this file that can turn a RETRY or a DUPLICATE into a
    // send, and none that relabels an unverified lead as PRIMARY.
    const dedupUnverified = UNVERIFIED_STATES.has(dedup.dedup_status);
    const shouldSend = SEND_STATES.has(dedup.dedup_status);
    const send = shouldSend
      ? await forwardToMake(buildOutbound(f, canonical, dedup))
      : { make_sends: 0, make_send_status: "suppressed:" + dedup.dedup_status, make_send_ms: 0 };

    // Observability. Operational metadata only — no email, phone or message.
    console.log(JSON.stringify({
      fn: "markt-submission-created",
      result: send.make_sends > 0
        ? (send.make_send_status === "delivered" ? "forwarded" : "forward_failed")
        : (shouldSend ? "forward_unconfigured" : "suppressed"),
      transport: "server_to_make",
      form_name: canonical.form_name,
      form_version: canonical.form_version,
      scoring_model: canonical.scoring_model,
      ingress_id: canonical.ingress_id || "(none)",
      correlation_id: canonical.correlation_id,
      correlation_source: canonical.correlation_source,
      brand: canonical.brand,
      is_test: canonical.is_test,
      is_test_rule: t.rule,
      client_is_test_raw: trim(f.is_test) || "(blank)",
      source: canonical.source,
      entry_point: canonical.entry_point,
      cid_present: Boolean(canonical.cid),
      region: canonical.region || "(blank)",
      cluster: canonical.cluster || "(blank)",
      attribution_provenance: provenance,
      // C2.1 additions
      dedup_status: dedup.dedup_status,
      dedup_claim: dedup.dedup_claim,
      dedup_attempts: dedup.dedup_attempts,
      dedup_fingerprint: dedup.dedup_fingerprint,
      dedup_window_ms: dedup.dedup_window_ms,
      dedup_age_ms: dedup.dedup_age_ms,
      dedup_previous_age_ms: dedup.dedup_previous_age_ms,
      dedup_anomaly: dedup.dedup_anomaly,
      dedup_error: dedup.dedup_error,
      dedup_unverified: dedupUnverified,
      duplicate_of_correlation_id: dedup.duplicate_of_correlation_id,
      idempotency_primitive: "netlify_blobs:set:onlyIfNew|onlyIfMatch",
      idempotency_consistency: "strong",
      // T2 transport outcome
      make_sends: send.make_sends,
      make_send_status: send.make_send_status,
      make_send_ms: send.make_send_ms,
      make_http_status: send.make_http_status,
      // This Function still touches neither directly — Make owns both.
      airtable_writes: 0,
      telegram_sends: 0,
    }));

    return json(200, {
      ok: true, mode: "server_transport", brand: canonical.brand,
      correlation_id: canonical.correlation_id, is_test: canonical.is_test,
      dedup_status: dedup.dedup_status,
      dedup_unverified: dedupUnverified,
      duplicate_of_correlation_id: dedup.duplicate_of_correlation_id,
      forwarded: send.make_sends > 0 && send.make_send_status === "delivered",
      make_sends: send.make_sends,
    });
  } catch (err) {
    // Never throw uncontrolled: a failure here must not affect form processing.
    console.error(JSON.stringify({
      fn: "markt-submission-created", result: "error_handled",
      error: String((err && err.message) || err),
      transport: "server_to_make", make_sends: 0, make_send_status: "not_reached",
      airtable_writes: 0, telegram_sends: 0,
    }));
    return new Response("error_handled", { status: 200 });
  }
};

// Pure helpers exported for the acceptance matrix. No side effects, no state.
export { fingerprintFor, canonicalPairs, DEDUP_WINDOW_MS, FINGERPRINT_FIELDS, contentKey, ingressKey };
