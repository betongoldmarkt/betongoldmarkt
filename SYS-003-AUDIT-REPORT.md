# SYS-003 — DIETRICH OS Audit Report
**Scope:** `feature/SYS-003-claude-governance` (branch not yet created — audit performed on `main`)  
**Date:** 2026-05-18  
**Auditor:** DIETRICH OS / Claude  
**Status:** READ-ONLY — NO FILES MODIFIED, NO COMMITS, NO PUSH  

---

## EXECUTIVE SUMMARY

| Vector | Severity | Count |
|---|---|---|
| SEO Risks | HIGH | 5 |
| Duplicate Structures | MEDIUM | 4 |
| Broken Internal Links | CLEAR | 0 |
| Mobile Overflow Risks | MEDIUM | 3 |
| Routing Inconsistencies | HIGH | 2 |
| Netlify Deployment Risks | HIGH | 4 |
| Schema Inconsistencies | HIGH | 6 |
| Investor Check Vulnerabilities | CRITICAL | 4 |

---

## A) FINDINGS

---

### 1. SEO RISKS

#### SEO-001 · CRITICAL — `og:image` Target Missing
**File:** All pages  
**Detail:** Every page references `<meta property="og:image" content="/assets/img/og-default.jpg"/>` but this file **does not exist** in the repository. Social shares (WhatsApp, LinkedIn, XING) will show a blank image across the entire site.  
**Affected pages:** 60+ pages using `/assets/img/og-default.jpg`

#### SEO-002 · HIGH — 16 Pages Missing `meta name="description"`
Pages that lack a description tag (direct SEO ranking signal):
- `steuervorteil-bulgarien-10-prozent/` (redirect source — noindex ✓)
- `immobilien-deutschland/` (redirect source — noindex ✓)
- `immobilien-bulgarien-eu-vorteile/` (redirect source — noindex ✓)
- `wohnung-bulgarien-meerblick-kaufen/` (redirect source — noindex ✓)
- `immobilien-bulgarien-2026/` (redirect source — noindex ✓)
- `rendite-immobilien-bulgarien/` (redirect source — noindex ✓)
- `marktlogik/` (redirect source — noindex ✓)
- `ratenzahlung/` (redirect source — noindex ✓)
- `zugang/` (redirect source — noindex ✓)
- **`danke/`** — no noindex, no description, **NOT a redirect source**
- **`markt-anfrage/`** — no noindex, no description, NOT in sitemap
- `angebote/gardenia-hills-studios/`, `gardenia-hills-2-zimmer/`, `gardenia-hills-3-zimmer/`, `gardenia-hills-sonnenstrand/`, `haus-89000-einbeck/` — all have noindex + canonical  

**Actionable:** The redirect-source pages are safe. `danke/` and `markt-anfrage/` need attention.

#### SEO-003 · HIGH — Robinson Beach Listings Missing from Sitemap
`angebote/robinson-beach-b4-8/` and `angebote/robinson-beach-c2-3/` exist in the filesystem, are linked from the angebote index, but are **absent from `sitemap.xml`**. Google will not index these listings proactively.

#### SEO-004 · MEDIUM — `projekte/robinson-beach/` Missing from Sitemap
The project page at `projekte/robinson-beach/index.html` exists and is linked internally but is **not in the sitemap**. This is a canonical project page and should be indexed.

#### SEO-005 · MEDIUM — `markt-anfrage/` Orphan Page
`markt-anfrage/` has no canonical, no noindex, no schema, and is absent from the sitemap. It will be crawled but not ranked. Risk of diluting crawl budget.

---

### 2. DUPLICATE STRUCTURES

#### DUP-001 · MANAGED — `angebote/gardenia-hills-*` vs `projekte/gardenia-hills/*`
Four `angebote/gardenia-hills-*` directories exist as duplicates of their `projekte/gardenia-hills/*` canonical equivalents. Currently protected by a three-layer approach:
1. `noindex` in each page's HTML ✓
2. Canonical pointing to `projekte/` ✓
3. `301!` redirect in `_redirects` ✓

**Risk:** The three-layer approach is functionally redundant but not harmful. The `_redirects` 301 fires before Netlify serves the HTML, making the noindex/canonical in those pages effectively unreachable. Low risk if consistent.

#### DUP-002 · RISK — `angebote/haus-89000-einbeck/` Exists with No Protection
A live page at `angebote/haus-89000-einbeck/index.html` exists. It has:
- No meta description
- No LD+JSON schema
- No `noindex` tag
- A redirect in `_redirects`: `/angebote/haus-89000-einbeck/ → /angebote/haus-75000-einbeck/ 301!`

The redirect fires at the Netlify edge, so the HTML content is never served — BUT the page exists in the repo and could cause confusion if the redirect is ever removed.

#### DUP-003 · LOW — Duplicate Image Directories for Gardenia B-401
`assets/img/gardenia-b401/` and `assets/img/gardenia-b401-real/` both exist. Additionally, `angebote/studio-gardenia-hills-a-202-53m2/` uses `og:image` pointing to `gardenia-b401/01.jpg` (the B-401 unit), not the A-202 unit's own images — **wrong OG image on a listing page**.

#### DUP-004 · LOW — `ANGEBOTE-PATCH.html` in Repo Root
`ANGEBOTE-PATCH.html` is a developer instruction file committed to the root. It will be publicly served by Netlify at `https://betongoldmarkt.de/ANGEBOTE-PATCH.html`. It contains internal architecture notes and patch instructions.

---

### 3. BROKEN INTERNAL LINKS

**Result: CLEAR.** All `href="/"` internal links resolve to existing directories. No 404-inducing internal links detected across all 86 HTML files.

---

### 4. MOBILE OVERFLOW RISKS

#### MOB-001 · MEDIUM — Inline Grid Without Mobile Breakpoint (`index.html:1026`)
```html
<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;max-width:820px;margin:0 auto;">
```
This hardcoded `1fr 1fr` grid has no responsive override. At viewport widths below ~400px, this will render two cramped columns. No media query covers this inline style.

#### MOB-002 · LOW — `.hero-cta` Two-Column Grid at Narrow Widths
`index.html:181` — `.hero-cta{display:grid;grid-template-columns:1fr 1fr}` applies at all widths with no explicit mobile breakpoint in `markt.css`. Only the `@media(max-width:600px)` block in the inline `<style>` resolves this for that specific breakpoint.

#### MOB-003 · LOW — Duplicate `data-make-webhook` Attribute on `<body>`
Nearly every page has `data-make-webhook="..." data-make-webhook="..."` — the attribute is declared twice on the `<body>` element. Browsers silently ignore duplicates (use first occurrence), but this is an HTML validity error and points to a templating defect. No functional impact but a hygiene issue visible in source.

---

### 5. ROUTING INCONSISTENCIES

#### RTE-001 · HIGH — Self-Redirect Loop in `_redirects`
```
/wohnung-bulgarien-meer/  /wohnung-bulgarien-meer/  200
```
This rule creates a self-pointing rewrite. While a `200` code in Netlify is a proxy rewrite (not a browser redirect), this rule is semantically incorrect and should be removed — the directory `wohnung-bulgarien-meer/` already has a static `index.html` that Netlify will serve naturally. The rule creates ambiguity in routing logic and was likely added in error.

Combined with the rule above it:
```
/wohnung-bulgarien-meerblick-kaufen/  /wohnung-bulgarien-meer/  301!
```
This creates a chain: `wohnung-bulgarien-meerblick-kaufen/` → `wohnung-bulgarien-meer/` → `wohnung-bulgarien-meer/` (self-rewrite). Netlify handles this gracefully, but it is non-standard and should be cleaned.

#### RTE-002 · MEDIUM — Branch `feature/SYS-003-claude-governance` Does Not Exist
The governance branch specified for this audit does not exist locally or remotely. Only `main` exists (`remotes/origin/HEAD → origin/main`). Any PRs or deployments scoped to this branch will fail. The branch must be created before SYS-003 work can be properly scoped.

---

### 6. NETLIFY DEPLOYMENT RISKS

#### NET-001 · HIGH — No Security Headers in `netlify.toml`
`netlify.toml` contains only:
```toml
[build]
  functions = "netlify/functions"
[functions]
  node_bundler = "esbuild"
```
**Missing entirely:**
- `X-Frame-Options` (clickjacking protection)
- `X-Content-Type-Options: nosniff`
- `Content-Security-Policy`
- `Referrer-Policy`
- `Permissions-Policy`
- Cache-Control headers for assets

These are standard Netlify headers that should be declared in a `[[headers]]` block.

#### NET-002 · HIGH — Two Different Make.com Webhook URLs in Production
| Location | Webhook URL |
|---|---|
| All HTML pages (`data-make-webhook`) | `hook.eu1.make.com/sn077n6xwde65kymi2d4g9xymjtx19n7` |
| `netlify/functions/markt-classify.js` | `hook.eu1.make.com/yrlkosxvvxr6x1aea0curpychul1pr5e` |

Two different endpoints. The `lead-capture.js` intercepts all `form.lead-capture-form` submits and routes through `/.netlify/functions/markt-classify` — which then calls the **function's** webhook. The `data-make-webhook` attribute in the HTML body is **not used by `lead-capture.js`** and appears to be a legacy attribute from a prior direct-webhook architecture. This means:
- The HTML attribute webhook may be stale/dead
- If any form bypasses `lead-capture.js`, it would hit the wrong endpoint
- Two webhook scenarios coexist silently

#### NET-003 · MEDIUM — `ANGEBOTE-PATCH.html` Publicly Served
As noted in DUP-004, this developer patch file is publicly accessible. It contains internal structural notes. Should be added to `.gitignore` or moved outside the web root.

#### NET-004 · MEDIUM — No `publish` Directory in `netlify.toml`
No `publish` directory is declared. Netlify defaults to the repo root, which is the intended behavior here. However, this means the entire repo is the web root — including `.github/`, `admin/config.yml`, and `ANGEBOTE-PATCH.html`. Explicit `publish = "."` should be set for clarity.

---

### 7. SCHEMA INCONSISTENCIES

#### SCH-001 · HIGH — 16 Pages Missing `application/ld+json` Schema
Canonical, indexed pages with no structured data:
- `markt-anfrage/` — active page, no schema
- `danke/` — confirmation page, minimal need but should have WebPage
- `angebote/robinson-beach-b4-8/` — **listing page with NO schema** (sitemap absent too)
- `angebote/robinson-beach-c2-3/` — **listing page with NO schema**
- `angebote/haus-75000-einbeck/` — **listing page with EMPTY schema block** (the LD+JSON is present but contains no `@type`)
- Redirect-source pages (9): acceptable since noindex

#### SCH-002 · HIGH — Inconsistent RealEstateListing Patterns
Three different schema structures used across listing pages with no standard:

**Pattern A** (older/minimal — 6 pages): `RealEstateAgent + WebPage + BreadcrumbList` — no listing-specific data  
**Pattern B** (intermediate — 5 Gardenia pages): `WebPage + WebSite + BreadcrumbList + RealEstateListing + Offer + Organization` — no property type  
**Pattern C** (full — 9 pages): `WebPage + WebSite + RealEstateAgent + RealEstateListing + [Apartment|House] + Offer + FAQPage` — richest

Pattern A pages miss all listing-specific rich result eligibility.

#### SCH-003 · MEDIUM — Wrong `og:image` on `studio-gardenia-hills-a-202-53m2`
```html
<meta property="og:image" content="https://betongoldmarkt.de/assets/img/gardenia-b401/01.jpg"/>
```
This is the A-202 unit's listing, but the OG image references the B-401 image directory. Wrong social share image on a live listing.

#### SCH-004 · MEDIUM — Dual `@type` `WebPage` + `ItemPage` on Some Pages
`angebote/studio-burgas-35000/` and `angebote/haus-burgas-120000/` declare both `WebPage` and `ItemPage` in the same graph. `ItemPage` is a subtype of `WebPage` — this is not an error but is redundant and inconsistent with other listing pages.

#### SCH-005 · LOW — `WebSite` Schema Missing on ~34 Pages
Only pages using Pattern C include a `WebSite` entity. Hub and category pages (e.g., `/immobilien-bulgarien/`, `/neubau-bulgarien/*`) use the org-centric schema from Pattern A and omit `WebSite`. This means Google's Sitelinks Searchbox and `WebSite` entity signals are limited.

#### SCH-006 · LOW — `Organization` vs `RealEstateAgent` Used Inconsistently
Some pages reference the org entity as `@type: Organization`, others as `@type: RealEstateAgent`. `RealEstateAgent` is the correct specific type. The mixed usage weakens entity consolidation.

---

### 8. INVESTOR CHECK VULNERABILITIES

#### IC-001 · CRITICAL — Make.com Webhook URL Exposed in Public HTML Source (All Pages)
```html
<body data-make-webhook="https://hook.eu1.make.com/sn077n6xwde65kymi2d4g9xymjtx19n7">
```
This webhook URL appears in the HTML source of **every page** in the repository (60+ files). Anyone who inspects the page source can:
1. Send unlimited arbitrary POST requests to this webhook
2. Flood the Make.com scenario with junk leads
3. Exhaust Make.com operation quotas
4. Inject malicious data into Airtable via the scenario

**Context:** `lead-capture.js` does NOT use this attribute — it routes through `/.netlify/functions/markt-classify`. The HTML `data-make-webhook` attribute appears to be vestigial from a prior architecture and **is not needed**. Its continued presence is a security liability with no functional upside.

#### IC-002 · HIGH — No Spam Protection on Investor Check Form
The `icSubmit()` function performs only two checks:
```javascript
if(!n||!e){alert('Bitte Name und E-Mail angeben.');return;}
```
**Missing protections:**
- No email format validation (regex) — any string with `@` passes
- No honeypot field to catch bots
- No rate limiting (client-side or server-side)
- No CSRF token
- No reCAPTCHA or equivalent

A bot can submit the form at any frequency with any data, generating fake leads in Airtable and consuming OpenAI API quota in `markt-classify`.

#### IC-003 · MEDIUM — `markt-classify` Function Has No Input Validation / Payload Size Limit
`netlify/functions/markt-classify.js` accepts any JSON body and passes it directly to the OpenAI prompt:
```javascript
payload = JSON.parse(event.body || '{}');
// ...
const prompt = buildPrompt(data);  // data.kapital_raw, data.ziel, etc.
```
An attacker can:
- Send extremely large strings that inflate the OpenAI request
- Inject text into the prompt via the `kapital_raw` or `ziel` fields (prompt injection)
- Send malformed data that causes the sanitizers to fall back to defaults (producing clean-looking junk in Airtable)

No field length limits, no string sanitization, no max payload size check.

#### IC-004 · MEDIUM — Dual-Submission Risk (Make.com + Netlify)
The Investor Check form submits via two parallel paths:
1. `lead-capture.js` intercepts submit → POSTs to `/.netlify/functions/markt-classify` → forwards to Make.com webhook B (`yrlkosxvvxr6x1aea0curpychul1pr5e`)
2. After 2-second timeout, `form.submit()` is called → Netlify Forms processes the submission → triggers any Make.com scenario attached to the `investor-check` Netlify form

This means **every Investor Check submission potentially triggers two separate Make.com scenarios** unless the Netlify Forms webhook is not connected. The confirmation redirect goes to `/danke/` via the hidden form's `action="/danke/"` attribute. If both fire, Airtable may receive duplicate records.

---

## B) CHANGES REQUIRED

> None applied in this audit (read-only). Recommended changes for SYS-003 PR:

| Priority | ID | Action |
|---|---|---|
| P0 | IC-001 | Remove `data-make-webhook` attribute from all HTML pages |
| P0 | SEO-001 | Create or designate a real `og-default.jpg` image and commit to `assets/img/` |
| P0 | NET-002 | Audit which Make.com webhook is live/active; retire the stale one |
| P1 | IC-002 | Add honeypot field + basic email regex to `icSubmit()` |
| P1 | IC-003 | Add payload size cap + field length limits to `markt-classify.js` |
| P1 | NET-001 | Add `[[headers]]` block to `netlify.toml` with security headers |
| P1 | RTE-001 | Remove self-rewrite `200` rule from `_redirects` |
| P1 | SCH-001 | Add schema to `robinson-beach-b4-8`, `robinson-beach-c2-3`, `markt-anfrage` |
| P1 | SEO-003 | Add Robinson Beach pages to `sitemap.xml` |
| P2 | SEO-004 | Add `projekte/robinson-beach/` to `sitemap.xml` |
| P2 | SCH-003 | Fix `og:image` on `studio-gardenia-hills-a-202-53m2` |
| P2 | NET-003 | Add `ANGEBOTE-PATCH.html` to `.gitignore` or relocate |
| P2 | IC-004 | Clarify dual-submission flow; disable Netlify Forms webhook if duplicate |
| P3 | SCH-002 | Standardize all listing pages to Pattern C schema |
| P3 | MOB-001 | Add `@media` breakpoint for inline `grid-template-columns:1fr 1fr` at `index.html:1026` |
| P3 | DUP-003 | Audit `gardenia-b401` vs `gardenia-b401-real` — remove stale folder |

---

## C) RISKS

| Risk | Level | Notes |
|---|---|---|
| Webhook flood via exposed `data-make-webhook` | CRITICAL | Anyone can spam Make.com directly. Immediate removal recommended. |
| Missing `og-default.jpg` | HIGH | All social shares broken. Brand-damaging. |
| Two active webhook URLs | HIGH | Data may split across two Make.com scenarios unintentionally |
| No security headers | HIGH | Site vulnerable to clickjacking, MIME sniffing |
| Prompt injection via `markt-classify` | MEDIUM | No field sanitization before OpenAI prompt |
| Robinson Beach listings not indexed | MEDIUM | Sitemap gap — no Google crawl signal |
| Schema inconsistency across listings | MEDIUM | Reduces rich result eligibility for older listing pages |
| Self-rewrite routing rule | LOW | Functionally benign but architecturally incorrect |

---

## D) NEXT STEP

1. **Create branch** `feature/SYS-003-claude-governance` from `main` — branch does not yet exist
2. **P0 fixes first:** Remove all `data-make-webhook` attributes, add `og-default.jpg`, resolve dual webhook ambiguity
3. **P1 security:** Add `netlify.toml` headers, honeypot to Investor Check, payload validation to function
4. **P1 routing:** Remove self-rewrite rule from `_redirects`
5. **Sitemap + schema pass:** Robinson Beach pages, projekte/robinson-beach
6. **PR review** → explicit approval → deploy to Netlify preview URL → verify → merge

---

*Report generated: 2026-05-18 | Read-only audit | No files modified | No commits | No push*
