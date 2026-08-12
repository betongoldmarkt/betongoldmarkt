/*
 * submission-created.js — BETON GOLD MARKT · P0-C2 TRUSTED SERVER CAPTURE
 *
 * Netlify Forms `submission-created` event handler. Fires server-side on every
 * stored submission; the browser cannot skip it.
 *
 * ─── SHADOW MODE — READ THIS FIRST ───────────────────────────────────────
 * This Function DOES NOT FORWARD ANYTHING TO MAKE.
 *
 * The live Markt transport is still the browser path:
 *   objekt-anfrage              markt.js      → browser → Make hook
 *   investor-check/markt-anfrage lead-capture.js → markt-classify → Make
 * Both run BEFORE form.submit(), so one user action already produces one Make
 * execution AND one Netlify Forms submission. Adding a second send here would
 * duplicate every Markt lead. There is therefore NO webhook call anywhere in
 * this file — shadow mode is enforced by absence of send code, not by a flag.
 * FORWARD_TO_MAKE below is documentation of that state, not a switch.
 *
 * Activating forwarding is P0-T2 (transport cutover) and requires retiring the
 * browser path in the same change.
 *
 * This Function also writes NOTHING to Airtable and sends NO Telegram.
 * Its only output is a structured log line (PII-free) proving it ran.
 */

"use strict";

const crypto = require("crypto");

// ─── TRUST BOUNDARY ───────────────────────────────────────────────────────
// Server-authored brand identity. The ONLY source of `brand`. Never read from
// the submission, never defaulted from client input, assigned unconditionally
// after normalisation. C1 deliberately left `brand` out of every form schema.
const BRAND = "MARKT";

// Shadow-mode marker. There is no send implementation in this file; flipping
// this constant alone cannot cause a forward.
const FORWARD_TO_MAKE = false;

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

const s = (v) => (v === undefined || v === null ? "" : String(v));
const trim = (v) => s(v).trim();

/**
 * correlation_id — generated at the earliest TRUSTED layer (this Function),
 * never accepted from the client.
 *
 * Derived deterministically from the Netlify submission id, so a Netlify event
 * retry for the SAME submission yields the SAME correlation_id. That is what
 * makes reconciliation possible across retries. If the platform ever omits the
 * id, we fall back to a random v4 and say so in `correlation_source`, because a
 * silently non-deterministic id would be worse than a declared one.
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

exports.handler = async (event) => {
  try {
    const body = JSON.parse(event.body || "{}");
    const p = body.payload || {};
    const f = p.data || {};
    const formName = trim(p.form_name) || trim(f["form-name"]) || trim(f.form_name);

    // Unknown / legacy / unapproved form: ignore safely. No send, no write, no throw.
    if (!Object.prototype.hasOwnProperty.call(GOVERNED_FORMS, formName)) {
      console.log(JSON.stringify({
        fn: "markt-submission-created", result: "ignored_ungoverned_form",
        form_name: formName || "(none)", ingress_id: trim(p.id) || "(none)",
        shadow_forward: false,
      }));
      return { statusCode: 200, body: "ignored" };
    }

    const ingressId = trim(p.id);
    const { correlation_id, correlation_source } = correlationFor(ingressId);
    const t = classifyTest(f, formName);
    const { attribution, provenance } = normaliseAttribution(f, formName);
    const ident = GOVERNED_FORMS[formName];

    // ─── CANONICAL SERVER PAYLOAD ─────────────────────────────────────────
    // Built and validated. NOT SENT ANYWHERE in C2.
    const canonical = Object.assign({}, attribution, {
      form_name:     formName,
      form_version:  ident.form_version,
      scoring_model: ident.scoring_model,
      ingress_id:    ingressId,
      correlation_id,
      correlation_source,
      is_test:       t.is_test,
      capture_path:  "netlify_forms_shadow",
      created_at:    trim(p.created_at) || new Date().toISOString(),
    });
    // Trusted identity assigned LAST and unconditionally: a hard overwrite, not
    // a default. No form field or client value can author it.
    canonical.brand = BRAND;

    // Observability. Operational metadata only — no email, phone or message.
    console.log(JSON.stringify({
      fn: "markt-submission-created",
      result: "shadow_captured",
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
      shadow_forward: FORWARD_TO_MAKE,   // always false: no send code exists
      make_sends: 0,
      airtable_writes: 0,
      telegram_sends: 0,
    }));

    return {
      statusCode: 200,
      body: JSON.stringify({
        ok: true, mode: "shadow", brand: canonical.brand,
        correlation_id: canonical.correlation_id, is_test: canonical.is_test,
        forwarded: false,
      }),
    };
  } catch (err) {
    // Never throw uncontrolled: a failure here must not affect form processing.
    console.error(JSON.stringify({
      fn: "markt-submission-created", result: "error_handled",
      error: String((err && err.message) || err), shadow_forward: false,
    }));
    return { statusCode: 200, body: "error_handled" };
  }
};
