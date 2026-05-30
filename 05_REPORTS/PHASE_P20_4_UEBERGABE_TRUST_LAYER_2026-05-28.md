# PHASE P20.4 — DACH Trust Infrastructure: Übergabe und Betreuung nach dem Immobilienkauf
**Date:** 2026-05-28  
**Status:** COMPLETE — AWAITING DEPLOY APPROVAL  
**Scope:** 1 new trust-infrastructure page + internal links from 6 pages + sitemap

---

## A) Files Scanned

| File | Purpose |
|------|---------|
| `kaufprozess-bulgarien/index.html` | Link source + pattern reference |
| `dokumente-immobilienkauf-bulgarien/index.html` | Link source |
| `notar-immobilienkauf-bulgarien/index.html` | Link source |
| `grundbuch-bulgarien/index.html` | Link source + pattern reference |
| `betreuung-bulgarien/index.html` | Link source (trust-intro row) |
| `faq/index.html` | Link source (trust-link bar) |
| `sitemap.xml` | Update target |

---

## B) Page Created

**Path:** `/uebergabe-immobilien-bulgarien/`  
**Title:** Übergabe Immobilien Bulgarien | Betreuung nach dem Immobilienkauf  
**H1:** Übergabe und Betreuung nach dem Immobilienkauf in Bulgarien  
**Canonical:** `https://betongoldmarkt.de/uebergabe-immobilien-bulgarien/`

---

## C) Content Structure

| Section | Type | Content |
|---------|------|---------|
| Hero | `.hero` + breadcrumb | H1, lead (verbatim from spec), 2 CTAs |
| Intro | Prose | Phase nach dem Notartermin — 2 paras |
| Übergabe-Phase | `.grid .card third` (8 cards) | Schlüssel, Protokoll, Zähler, Zugang, Hausverwaltung, Nebenkosten, Kommunikation, Erste Schritte |
| Unterstützungsmöglichkeiten | `.grid .card third` (8 cards) | Verwaltung, Koordination, Hausverwaltungskommunikation, Übersetzung, Vermietung, Dienstleister, Nebenkosten-Hinweise, Nachbetreuung |
| DACH-Unterschiede | `.grid .card third` (8 cards) | Sprache, Übergabekultur, Verwaltungsstrukturen, Nebenkostenniveau, Fernverwaltung, Steuer, Versicherung, Erwartungen |
| Objektabhängige Besonderheiten | `.grid .card third` (7 cards) | Neubau, Bankimmobilie, Bestand, Apartment, Grundstück, Ratenzahlung, Off-Market |
| Trust-Cluster-Box | Gold-border box | Links to all 6 cluster pages |
| Hinweise | Gold-border box + 7 chips | Required disclaimer + chips |
| Weiterführend | Link row | kaufprozess, grundbuch, notar, dokumente, betreuung, kaufnebenkosten |
| FAQ | `<details>` accordion | 5 questions, `id="faq"` anchor |
| Final CTA | Gradient box | investor-check, betreuung, kaufprozess |

---

## D) Internal Links Added

| Source page | Location | Link text |
|-------------|----------|-----------|
| `kaufprozess-bulgarien` | Weiterführend row (after Grundbuch) | "Übergabe & Betreuung →" |
| `dokumente-immobilienkauf-bulgarien` | Weiterführend row (after Grundbuch) | "Übergabe & Betreuung →" |
| `notar-immobilienkauf-bulgarien` | Weiterführend row (after Grundbuch) | "Übergabe & Betreuung →" |
| `grundbuch-bulgarien` | Weiterführend row (after Kaufnebenkosten) | "Übergabe & Betreuung →" |
| `betreuung-bulgarien` | Trust-intro link row (after Grundbuch) | "Übergabe & Betreuung →" |
| `faq` | Trust-link bar (after Grundbuch) | "Übergabe & Betreuung →" |

---

## E) Schema Added

```
@graph nodes: 4 ✓
  - RealEstateAgent: https://betongoldmarkt.de/#org (lean reference)
  - WebPage: https://betongoldmarkt.de/uebergabe-immobilien-bulgarien/
    desc=OK (239 chars), dateModified=2026-05-28, isPartOf=#website ✓
  - BreadcrumbList: 3 items (Start → Bulgarien → Übergabe Immobilien Bulgarien), leaf no item ✓
  - FAQPage: @id=.../#faq, 5 questions ✓
```

---

## F) Sitemap Changes

```xml
<url><loc>https://betongoldmarkt.de/uebergabe-immobilien-bulgarien/</loc>
  <lastmod>2026-05-28</lastmod><changefreq>monthly</changefreq><priority>0.7</priority></url>
```

---

## G) Legal / Risk Wording Audit

| Requirement | Status |
|-------------|--------|
| Disclaimer verbatim | ✓ Present: "Beton Gold Markt ersetzt keine Rechts-, Steuer- oder Finanzberatung. Übergabe, Verwaltung und Betreuung nach dem Kauf hängen vom Objekt, Verkäufer, Standort, Vertragsmodell und eingebundenen Fachpartnern ab." |
| 7 disclaimer chips | ✓ All present |
| No Verwaltungszusage | ✓ FAQ Q3 explicitly: "Beton Gold Markt kann Orientierung und Koordination unterstützen, ersetzt aber keine rechtliche Hausverwaltung." |
| No Mietgarantie | ✓ Vermietungsorientierung card: "Mieteinnahmen hängen vom Objekt, Standort und Markt ab und sind nicht garantiert." |
| Neutral wording throughout | ✓ "kann möglich sein", "typischerweise", "hängt vom Einzelfall ab", "kann variieren" |
| Forbidden term scan — garantier | ✓ ONLY occurrence: "nicht garantiert" (correct disclaimer, not a claim) |
| Forbidden term scan — aum | ✓ FALSE POSITIVE: substring match in "DACH-Raum" — confirmed not the forbidden term AUM |
| Kapital-layer language | ✓ NONE found |
| No fixed timeline claims | ✓ All temporal references use "kann", "typischerweise", "je nach Fall" |

---

## H) Validation Result

```
JSON-LD parse: OK ✓
@graph nodes: 4 ✓
BreadcrumbList: leaf no item, 3 items ✓
FAQPage: 5 questions, @id ends #faq ✓
WebPage: desc=239 chars OK, dateModified=2026-05-28, isPartOf=#website ✓
id="faq" anchor: FOUND ✓
Internal link to kaufprozess: OK ✓
Internal link to notar: OK ✓
Internal link to dokumente: OK ✓
Internal link to grundbuch: OK ✓
Internal link to betreuung: OK ✓
Internal link to kaufnebenkosten: OK ✓
Internal link to investor-check: OK ✓
Inbound link from kaufprozess: OK ✓
Inbound link from dokumente: OK ✓
Inbound link from notar: OK ✓
Inbound link from grundbuch: OK ✓
Inbound link from betreuung: OK ✓
Inbound link from faq: OK ✓
Sitemap entry: 1 entry confirmed ✓
```

---

## I) Visual / Routing Impact

All unchanged: `markt.css`, `markt.js`, `_redirects`, `netlify.toml`, forms, routing, homepage. Investor Check and 40% Ratenzahlung preserved in all modified pages.

---

## J) Risks Found

None. Content uses orientation framing only ("kann", "typischerweise", "hängt vom Einzelfall ab"). No Verwaltungszusage. No Mietgarantie. No fixed timelines. No invented legal requirements.

---

## K) Trust Cluster — Complete State after P20.4

```
kaufprozess    → notar ✓, dokumente ✓, grundbuch ✓, betreuung ✓, kaufnebenkosten ✓, uebergabe ✓  [6/6]
notar          → kaufprozess ✓, dokumente ✓, grundbuch ✓, betreuung(via grundbuch-box) ✓, kaufnebenkosten ✓, uebergabe ✓  [6/6]
dokumente      → kaufprozess ✓, notar ✓, grundbuch ✓, betreuung(via grundbuch-box) ✓, kaufnebenkosten ✓, uebergabe ✓  [6/6]
grundbuch      → kaufprozess ✓, notar ✓, dokumente ✓, betreuung ✓, kaufnebenkosten ✓, uebergabe ✓  [6/6]
betreuung      → kaufprozess ✓, notar ✓, dokumente ✓, grundbuch ✓, uebergabe ✓  [5/6]
uebergabe      → kaufprozess ✓, notar ✓, dokumente ✓, grundbuch ✓, betreuung ✓, kaufnebenkosten ✓  [6/6]
faq            → kaufprozess ✓, notar ✓, dokumente ✓, grundbuch ✓, betreuung ✓, uebergabe ✓  [6/6]
```

Trust cluster is fully cross-linked. Every node connects to at least 5 others.

---

## Recommended Next Phase

| Phase | Description |
|-------|-------------|
| P20-DEPLOY | Deploy P18 + P19 + P20.1–P20.4 as one release |
| P20.5 | Trust Infrastructure CONTINUE — `/vollmacht-bulgarien/` or `/steuernummer-bulgarien/` |
| P21 | SEO pass — audit all P19/P20 page meta descriptions for keyword density |
| P22 | Add `grundbuch-bulgarien` + `uebergabe-immobilien-bulgarien` to `kaufnebenkosten` Weiterführend (remaining gap) |

---

## Deploy Commands (after operator approval)

```bash
cd /path/to/betongoldmarkt
git add uebergabe-immobilien-bulgarien/index.html \
        kaufprozess-bulgarien/index.html \
        dokumente-immobilienkauf-bulgarien/index.html \
        notar-immobilienkauf-bulgarien/index.html \
        grundbuch-bulgarien/index.html \
        betreuung-bulgarien/index.html \
        faq/index.html \
        sitemap.xml
git commit -m "P20.4: Trust Infrastructure — Übergabe und Betreuung nach dem Immobilienkauf Bulgarien"
git push origin main
```

**DO NOT push without explicit operator approval.**

```
READY: 8 files modified/created
RISK LEVEL: LOW
DEPLOY DECISION: OPERATOR
```
