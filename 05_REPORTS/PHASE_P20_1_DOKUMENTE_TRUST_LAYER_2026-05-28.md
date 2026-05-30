# PHASE P20.1 — DACH Trust Infrastructure: Dokumente beim Immobilienkauf
**Date:** 2026-05-28  
**Status:** COMPLETE — AWAITING DEPLOY APPROVAL  
**Scope:** 1 new trust-infrastructure page + internal links from 4 pages + sitemap

---

## A) Files Scanned

| File | Purpose |
|------|---------|
| `kaufprozess-bulgarien/index.html` | Template reference + link target |
| `betreuung-bulgarien/index.html` | Template reference + link target |
| `faq/index.html` | Link target |
| `kaufnebenkosten-bulgarien/index.html` | Link target |
| `sitemap.xml` | Update target |

---

## B) Page Created

**Path:** `/dokumente-immobilienkauf-bulgarien/`  
**Title:** Dokumente Immobilienkauf Bulgarien | Orientierung für DACH-Käufer  
**H1:** Dokumente beim Immobilienkauf in Bulgarien  
**Canonical:** `https://betongoldmarkt.de/dokumente-immobilienkauf-bulgarien/`

---

## C) Content Structure

| Section | Type | Content |
|---------|------|---------|
| Hero | `.hero` + breadcrumb | H1, lead, 2 CTAs (investor-check, kaufprozess) |
| Intro | Prose | Warum Dokumente Vertrauen schaffen — 2 paras |
| Dokumentenkategorien | `.grid .card third` (10 cards) | All 10 required categories per spec |
| DACH Differences | `.grid .card third` (6 cards) | Sprache, Notarpraxis, Timing, Terminologie, Fachpartner, Objektart |
| Objektart-Unterschiede | `.grid .card half` (6 cards) | Neubau, Bankimmobilie, Bestand, Grundstück, Hotel/Gewerbe, Ratenzahlung |
| Hinweise | Gold-border box + 6 chips | Required disclaimer verbatim + 6 chips incl. "Keine vollständige Dokumentengarantie" |
| Connection to Process | Gold-border box | Links to kaufprozess, betreuung, kaufnebenkosten |
| Weiterführend | Inline link row | kaufprozess, kaufnebenkosten, faq, vor-ort |
| FAQ | `<details>` accordion | 5 questions, `id="faq"` anchor, matches FAQPage schema |
| Final CTA | Gradient box | investor-check, kaufprozess, betreuung |

---

## D) Internal Links Added

| Source page | Location | Link text |
|-------------|----------|-----------|
| `kaufprozess-bulgarien` | Weiterführend row (after Kaufnebenkosten) | "Dokumente im Kaufprozess →" |
| `faq` | Trust-link bar (after Ansprechpartner vor Ort) | "Dokumente im Kaufprozess →" |
| `kaufnebenkosten-bulgarien` | Weiterführend row (after FAQ) | "Dokumente im Kaufprozess →" |
| `betreuung-bulgarien` | Trust-intro link row (after Ansprechpartner vor Ort) | "Dokumente im Kaufprozess →" |

---

## E) Schema Added

```
@graph nodes: 4
  - RealEstateAgent: https://betongoldmarkt.de/#org (lean reference)
  - WebPage: https://betongoldmarkt.de/dokumente-immobilienkauf-bulgarien/
    desc=OK, dateModified=2026-05-28, isPartOf=#website
  - BreadcrumbList: 3 items (Start → Bulgarien → Dokumente Immobilienkauf), leaf no item ✓
  - FAQPage: @id=.../#faq, 5 questions ✓
```

No HowTo or ItemList added — content structure is cards + prose, not a sequential list of steps.  
No Review/AggregateRating, no fake Person node, no Organization duplicate.

---

## F) Sitemap Changes

```xml
<!-- P20.1: Trust Infrastructure Layer -->
<url><loc>https://betongoldmarkt.de/dokumente-immobilienkauf-bulgarien/</loc>
  <lastmod>2026-05-28</lastmod><changefreq>monthly</changefreq><priority>0.7</priority></url>
```

---

## G) Legal / Risk Wording Audit

| Requirement | Status |
|-------------|--------|
| Required disclaimer verbatim | ✓ Present: "Beton Gold Markt ersetzt keine Rechts-, Steuer- oder Finanzberatung. Die konkrete Dokumentenlage hängt vom Objekt, Verkäufer, Standort, Vertragsmodell und beteiligten Fachpartnern ab. Käufer sollten Unterlagen vor einer verbindlichen Entscheidung durch qualifizierte Fachpartner prüfen lassen." |
| "Keine Rechtsberatung" chip | ✓ |
| "Keine Steuerberatung" chip | ✓ |
| "Keine vollständige Dokumentengarantie" chip | ✓ |
| "Keine Finanzierungszusage" chip | ✓ |
| "Objektbezogene Prüfung erforderlich" chip | ✓ |
| "Fachpartner einbinden" chip | ✓ |
| "kann erforderlich sein" / "je nach Fall" wording | ✓ Throughout all 10 document category cards |
| No "immer erforderlich" claims | ✓ |
| No legal document checklists | ✓ Categories only, not prescriptive steps |
| No Kapital-layer language | ✓ |
| Forbidden term scan (garantier, award, testsieger) | ✓ NONE found |

---

## H) Validation Result

```
JSON-LD parse: OK (no errors)
@graph nodes: 4 ✓
BreadcrumbList: leaf no item ✓
FAQPage: 5 questions, @id ends #faq ✓
WebPage: desc=OK, dateModified=2026-05-28, isPartOf=#website ✓
id="faq" anchor: FOUND ✓
Internal links (all 4 pages): OK ✓
Sitemap entry: 1 entry confirmed ✓
```

---

## I) Visual / Routing Impact

| Check | Result |
|-------|--------|
| `assets/markt.css` | NOT TOUCHED |
| `assets/markt.js` | NOT TOUCHED |
| `_redirects` / `netlify.toml` | NOT TOUCHED |
| Existing page content | NOT CHANGED (additive links only) |
| Investor Check `/investor-check/` | PRESERVED in all 4 modified pages ✓ |
| 40% Ratenzahlung USP | PRESERVED in all 4 modified pages ✓ |
| Homepage `index.html` | NOT TOUCHED |
| Forms | NOT TOUCHED |
| Routing | NOT TOUCHED |
| Navigation | NOT TOUCHED |

---

## J) Risks Found

| Risk | Level | Notes |
|------|-------|-------|
| Legal proximity | LOW | Content explicitly disclaims legal advice; uses "typischerweise", "kann erforderlich sein", "je nach Fall" throughout |
| Document completeness claims | NONE | No "vollständige Liste" claim; page explicitly states completeness not guaranteed |
| Fake data | NONE | No invented requirements, no fake percentages, no made-up authority citations |
| CSS impact | NONE | Uses only existing classes: `.hero`, `.grid`, `.card half`, `.card third`, `.ctaRow`, `.btn`, `.reveal`, `.container` |
| Internal link overload | NONE | Max 1 link per source page, all in existing link-row contexts |

---

## K) Recommended Next Phase

| Phase | Description |
|-------|-------------|
| P20.2 | Deploy P18 + P19 + P20.1 together (resolve portrait blocker first or deploy separately) |
| P20.3 | Trust Infrastructure CONTINUE — `/eigentumsvorbehalt-bulgarien/`, `/notar-bulgarien/`, `/vollmacht-bulgarien/` |
| P21 | Internal link density audit — map pages with <3 outbound links to trust/process cluster |
| P22 | WebPage `description` quality pass — keyword audit on all authority pages |

---

## Deploy Commands (after operator approval)

```bash
cd /path/to/betongoldmarkt
git add dokumente-immobilienkauf-bulgarien/index.html \
        kaufprozess-bulgarien/index.html \
        faq/index.html \
        kaufnebenkosten-bulgarien/index.html \
        betreuung-bulgarien/index.html \
        sitemap.xml
git commit -m "P20.1: Trust Infrastructure — Dokumente beim Immobilienkauf Bulgarien"
git push origin main
```

**DO NOT push without explicit operator approval.**

```
READY: 6 files modified/created
RISK LEVEL: LOW
DEPLOY DECISION: OPERATOR
```
