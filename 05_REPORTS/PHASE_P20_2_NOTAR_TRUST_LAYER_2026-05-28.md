# PHASE P20.2 — DACH Trust Infrastructure: Notar beim Immobilienkauf
**Date:** 2026-05-28  
**Status:** COMPLETE — AWAITING DEPLOY APPROVAL  
**Scope:** 1 new trust-infrastructure page + internal links from 4 pages + sitemap

---

## A) Files Scanned

| File | Purpose |
|------|---------|
| `kaufprozess-bulgarien/index.html` | Template reference + link target |
| `dokumente-immobilienkauf-bulgarien/index.html` | Link target (sibling trust page) |
| `faq/index.html` | Link target |
| `betreuung-bulgarien/index.html` | Link target |
| `sitemap.xml` | Update target |

---

## B) Page Created

**Path:** `/notar-immobilienkauf-bulgarien/`  
**Title:** Notar Immobilienkauf Bulgarien | Ablauf für DACH-Käufer  
**H1:** Notar beim Immobilienkauf in Bulgarien  
**Canonical:** `https://betongoldmarkt.de/notar-immobilienkauf-bulgarien/`

---

## C) Content Structure

| Section | Type | Content |
|---------|------|---------|
| Hero | `.hero` + breadcrumb | H1, lead (verbatim from spec), 2 CTAs |
| Intro | Prose | Warum der Notartermin Vertrauen schafft — 2 paras |
| Rolle des Notars | `.grid .card third` (6 cards) | Beurkundung, Formales, Identifikation, Unterzeichnung, Eintragungsgrundlage, Koordination |
| DACH Unterschiede | `.grid .card third` (6 cards) | Sprache, Vertragsstruktur, Zahlungsfluss, Dokumentenlogik, Timing, Fachpartner |
| Vor dem Notartermin | `.grid .card half` (8 cards) | Objektunterlagen, Verkäuferdaten, Eigentumsnachweise, Reservierung, Kaufvertragsentwurf, Zahlungsbedingungen, Vollmachten, Übersetzungen |
| Beim Notartermin | `.grid .card third` (6 cards) | Identitätsprüfung, Dokumentendurchsicht, Unterzeichnung, Zahlung, Beurkundung, Folgeschritte |
| Nach dem Notartermin | Gold-border box | Links to betreuung, dokumente, kaufnebenkosten |
| Hinweise | Gold-border box + 6 chips | Required disclaimer verbatim |
| Weiterführend | Link row | kaufprozess, dokumente, kaufnebenkosten, vor-ort |
| FAQ | `<details>` accordion | 5 questions, `id="faq"` anchor |
| Final CTA | Gradient box | investor-check, dokumente, kaufprozess |

---

## D) Internal Links Added

| Source page | Location | Link text |
|-------------|----------|-----------|
| `kaufprozess-bulgarien` | Weiterführend row (after Dokumente) | "Notar beim Immobilienkauf →" |
| `dokumente-immobilienkauf-bulgarien` | Weiterführend row (after Ansprechpartner vor Ort) | "Notar beim Immobilienkauf →" |
| `faq` | Trust-link bar (after Dokumente im Kaufprozess) | "Notar beim Immobilienkauf →" |
| `betreuung-bulgarien` | Trust-intro link row (after Dokumente im Kaufprozess) | "Notar beim Immobilienkauf →" |

---

## E) Schema Added

```
@graph nodes: 4 ✓
  - RealEstateAgent: https://betongoldmarkt.de/#org (lean reference)
  - WebPage: https://betongoldmarkt.de/notar-immobilienkauf-bulgarien/
    desc=OK, dateModified=2026-05-28, isPartOf=#website ✓
  - BreadcrumbList: 3 items (Start → Bulgarien → Notar Immobilienkauf)
    leaf no item ✓, matches repo pattern (no @id) ✓
  - FAQPage: @id=.../#faq, 5 questions ✓
```

No HowTo or ItemList added — content is cards + prose, not sequential steps in a single list.  
No Review/AggregateRating, no fake Person node, no Organization duplicate.

---

## F) Sitemap Changes

```xml
<!-- P20.1–P20.2: Trust Infrastructure Layer -->
<url><loc>https://betongoldmarkt.de/notar-immobilienkauf-bulgarien/</loc>
  <lastmod>2026-05-28</lastmod><changefreq>monthly</changefreq><priority>0.7</priority></url>
```

---

## G) Legal / Risk Wording Audit

| Requirement | Status |
|-------------|--------|
| Disclaimer verbatim | ✓ "Beton Gold Markt ersetzt keine Rechts-, Steuer- oder Finanzberatung. Der konkrete Ablauf eines Notartermins hängt vom Objekt, Verkäufer, Standort, Vertragsmodell, Dokumentenlage und eingebundenen Fachpartnern ab." |
| 6 disclaimer chips | ✓ All present |
| No "Notar = same as Germany" claim | ✓ FAQ Q3 explicitly states: "Nein. Es gibt Ähnlichkeiten, aber auch Unterschiede" |
| No "Notar replaces buyer legal advice" claim | ✓ Card 6 intro: "Der Notar vertritt nicht die Interessen des Käufers" |
| Neutral wording throughout | ✓ "typischerweise", "kann variieren", "hängt vom Einzelfall ab", "abhängig vom Objekt" |
| Forbidden term scan (garantier, award, testsieger) | ✓ NONE found |
| Kapital-layer language | ✓ NONE found |
| No legal advice claim | ✓ |
| No guarantee of process outcome | ✓ |

---

## H) Validation Result

```
JSON-LD parse: OK ✓
@graph nodes: 4 ✓
BreadcrumbList: leaf no item, 3 items ✓
FAQPage: 5 questions, @id ends #faq ✓
WebPage: desc=OK, dateModified=2026-05-28, isPartOf=#website ✓
id="faq" anchor: FOUND ✓
Internal links — kaufprozess: OK ✓
Internal links — dokumente: OK ✓
Internal links — faq: OK ✓
Internal links — betreuung: OK ✓
Sitemap entry: 1 entry confirmed ✓
```

---

## I) Visual / Routing Impact

| Check | Result |
|-------|--------|
| `assets/markt.css` | NOT TOUCHED |
| `assets/markt.js` | NOT TOUCHED |
| `_redirects` / `netlify.toml` | NOT TOUCHED |
| Existing content | NOT CHANGED (additive links only) |
| Investor Check | PRESERVED in all modified pages ✓ |
| 40% Ratenzahlung USP | PRESERVED in all modified pages ✓ |
| Homepage | NOT TOUCHED |
| Forms | NOT TOUCHED |
| Routing | NOT TOUCHED |

---

## J) Risks Found

| Risk | Level | Notes |
|------|-------|-------|
| Legal proximity | LOW | "Der Notar vertritt nicht die Interessen des Käufers" explicitly stated. Disclaimer verbatim present. All content framed as orientation only. |
| Process accuracy claims | NONE | All steps framed with "typischerweise", "hängt vom ... ab", "kann variieren" |
| Fake legal requirements | NONE | No invented mandatory documents or process steps |
| CSS/routing impact | NONE | Only existing classes used |
| Link overload | NONE | 1 link per source, all in established link-row contexts |

---

## K) Recommended Next Phase

| Phase | Description |
|-------|-------------|
| P20.3 | Deploy P18 + P19 + P20.1 + P20.2 together |
| P20.4 | Trust Infrastructure CONTINUE — `/vollmacht-immobilienkauf-bulgarien/` |
| P21 | Internal link density audit — map pages with <4 outbound links to the growing trust cluster |
| P22 | Cross-link the trust cluster bidirectionally (notar ↔ dokumente ↔ kaufprozess ↔ betreuung) |

---

## Trust Infrastructure Cluster — Current State

```
kaufprozess-bulgarien ─── links to ──▶ notar ✓, dokumente ✓, kaufnebenkosten ✓
dokumente ─────────────── links to ──▶ notar ✓, kaufprozess ✓, kaufnebenkosten ✓
faq ────────────────────── links to ──▶ notar ✓, dokumente ✓, kaufprozess ✓
betreuung ─────────────── links to ──▶ notar ✓, dokumente ✓, kaufprozess ✓
notar ──────────────────── links to ──▶ dokumente ✓, kaufprozess ✓, betreuung ✓, kaufnebenkosten ✓
```

---

## Deploy Commands (after operator approval)

```bash
cd /path/to/betongoldmarkt
git add notar-immobilienkauf-bulgarien/index.html \
        kaufprozess-bulgarien/index.html \
        dokumente-immobilienkauf-bulgarien/index.html \
        faq/index.html \
        betreuung-bulgarien/index.html \
        sitemap.xml
git commit -m "P20.2: Trust Infrastructure — Notar beim Immobilienkauf Bulgarien"
git push origin main
```

**DO NOT push without explicit operator approval.**

```
READY: 6 files modified/created
RISK LEVEL: LOW
DEPLOY DECISION: OPERATOR
```
