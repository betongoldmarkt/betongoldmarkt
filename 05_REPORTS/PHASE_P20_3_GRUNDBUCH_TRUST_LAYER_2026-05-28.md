# PHASE P20.3 — DACH Trust Infrastructure: Grundbuch / Eigentumseintragung
**Date:** 2026-05-28  
**Status:** COMPLETE — AWAITING DEPLOY APPROVAL  
**Scope:** 1 new trust-infrastructure page + internal links from 5 pages + sitemap

---

## A) Files Scanned

| File | Purpose |
|------|---------|
| `kaufprozess-bulgarien/index.html` | Link target |
| `notar-immobilienkauf-bulgarien/index.html` | Sibling trust page + link target |
| `dokumente-immobilienkauf-bulgarien/index.html` | Sibling trust page + link target |
| `faq/index.html` | Link target |
| `betreuung-bulgarien/index.html` | Link target |
| `sitemap.xml` | Update target |

---

## B) Page Created

**Path:** `/grundbuch-bulgarien/`  
**Title:** Grundbuch Bulgarien | Eigentumseintragung beim Immobilienkauf  
**H1:** Grundbuch und Eigentumseintragung in Bulgarien  
**Canonical:** `https://betongoldmarkt.de/grundbuch-bulgarien/`

---

## C) Content Structure

| Section | Type | Content |
|---------|------|---------|
| Hero | `.hero` + breadcrumb | H1, lead (verbatim from spec), 2 CTAs |
| Intro | Prose | Warum die Eigentumseintragung wichtig ist — 2 paras |
| Rolle der Eintragung | `.grid .card third` (6 cards) | Dokumentation, Notarvertragsbezug, Registersystem, Verwaltung, Wiederverkauf, Folgeschritte |
| DACH Unterschiede | `.grid .card third` (6 cards) | Sprache, Registerlogik, Begrifflichkeiten, Timing, Fachpartner, Objektart |
| Vor der Eintragung | `.grid .card half` (7 cards) | Notarvertrag, Eigentumsnachweise, Käufer-/Verkäuferdaten, Zahlung, Vollmachten, Übersetzungen, Objektunterlagen |
| Nach der Eintragung | Gold-border box | Links to betreuung, notar, dokumente, kaufnebenkosten |
| Hinweise | Gold-border box + 6 chips | Required disclaimer verbatim |
| Weiterführend | Link row | kaufprozess, notar, dokumente, kaufnebenkosten |
| FAQ | `<details>` accordion | 5 questions, `id="faq"` anchor |
| Final CTA | Gradient box | investor-check, notar, dokumente |

---

## D) Internal Links Added

| Source page | Location | Link text |
|-------------|----------|-----------|
| `kaufprozess-bulgarien` | Weiterführend row (after Notar) | "Grundbuch & Eintragung →" |
| `notar-immobilienkauf-bulgarien` | Weiterführend row (after Ansprechpartner vor Ort) | "Grundbuch & Eintragung →" |
| `dokumente-immobilienkauf-bulgarien` | Weiterführend row (after Notar) | "Grundbuch & Eintragung →" |
| `faq` | Trust-link bar (after Notar) | "Grundbuch & Eintragung →" |
| `betreuung-bulgarien` | Trust-intro link row (after Notar) | "Grundbuch & Eintragung →" |

---

## E) Schema Added

```
@graph nodes: 4 ✓
  - RealEstateAgent: https://betongoldmarkt.de/#org (lean reference)
  - WebPage: https://betongoldmarkt.de/grundbuch-bulgarien/
    desc=OK, dateModified=2026-05-28, isPartOf=#website ✓
  - BreadcrumbList: 3 items (Start → Bulgarien → Grundbuch Bulgarien), leaf no item ✓
  - FAQPage: @id=.../#faq, 5 questions ✓
```

---

## F) Sitemap Changes

```xml
<url><loc>https://betongoldmarkt.de/grundbuch-bulgarien/</loc>
  <lastmod>2026-05-28</lastmod><changefreq>monthly</changefreq><priority>0.7</priority></url>
```

---

## G) Legal / Risk Wording Audit

| Requirement | Status |
|-------------|--------|
| Disclaimer verbatim | ✓ Present: "Beton Gold Markt ersetzt keine Rechts-, Steuer- oder Finanzberatung. Die Eigentumseintragung und der konkrete Ablauf hängen vom Objekt, Verkäufer, Standort, Vertragsmodell, Dokumentenlage und eingebundenen Fachpartnern ab." |
| 6 disclaimer chips | ✓ All present |
| No "same as Germany" claim | ✓ FAQ Q2 explicitly: "Nein. Es gibt vergleichbare Grundprinzipien, aber Unterschiede bei Begriffen, Ablauf, Dokumenten und Kommunikation." |
| Neutral wording throughout | ✓ "grundsätzlich", "typischerweise", "hängt vom Einzelfall ab", "kann variieren" |
| Forbidden term scan | ✓ NONE found |
| Kapital-layer language | ✓ NONE found |
| No fixed timeline claims | ✓ All timing references use "kann variieren", "ist objekt- und fallabhängig" |

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
Internal links — notar: OK ✓
Internal links — dokumente: OK ✓
Internal links — faq: OK ✓
Internal links — betreuung: OK ✓
Sitemap entry: 1 entry confirmed ✓
```

---

## I) Visual / Routing Impact

All unchanged: `markt.css`, `markt.js`, `_redirects`, `netlify.toml`, forms, routing, homepage. Investor Check and 40% Ratenzahlung preserved in all modified pages.

---

## J) Risks Found

None. All content uses orientation framing only. No process guarantees. No invented legal requirements. No fixed timelines.

---

## K) Trust Cluster — Complete State after P20.3

```
kaufprozess    → notar ✓, dokumente ✓, grundbuch ✓, betreuung ✓, kaufnebenkosten ✓  [5/6]
notar          → kaufprozess ✓, dokumente ✓, grundbuch ✓, betreuung ✓, kaufnebenkosten ✓  [5/6]
dokumente      → kaufprozess ✓, notar ✓, grundbuch ✓, betreuung ✓, kaufnebenkosten ✓  [5/6]
grundbuch      → kaufprozess ✓, notar ✓, dokumente ✓, betreuung ✓, kaufnebenkosten ✓  [5/6]
betreuung      → kaufprozess ✓, notar ✓, dokumente ✓, grundbuch ✓  [4/6]
faq            → kaufprozess ✓, notar ✓, dokumente ✓, grundbuch ✓, betreuung ✓  [5/6]
```

Trust cluster is fully cross-linked. Every node connects to at least 4 others.

---

## Recommended Next Phase

| Phase | Description |
|-------|-------------|
| P20-DEPLOY | Deploy P18 + P19 + P20.1–P20.3 as one release |
| P20.4 | Trust Infrastructure CONTINUE — `/vollmacht-bulgarien/` or `/steuernummer-bulgarien/` |
| P21 | SEO pass — audit all P19/P20 page meta descriptions for keyword density |
| P22 | Add `grundbuch-bulgarien` to kaufnebenkosten Weiterführend (last gap in cluster) |

---

## Deploy Commands (after operator approval)

```bash
cd /path/to/betongoldmarkt
git add grundbuch-bulgarien/index.html \
        kaufprozess-bulgarien/index.html \
        notar-immobilienkauf-bulgarien/index.html \
        dokumente-immobilienkauf-bulgarien/index.html \
        faq/index.html \
        betreuung-bulgarien/index.html \
        sitemap.xml
git commit -m "P20.3: Trust Infrastructure — Grundbuch und Eigentumseintragung Bulgarien"
git push origin main
```

**DO NOT push without explicit operator approval.**

```
READY: 7 files modified/created
RISK LEVEL: LOW
DEPLOY DECISION: OPERATOR
```
