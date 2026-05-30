# PHASE P19 — Authority Content Layer START
**Date:** 2026-05-28  
**Status:** COMPLETE — AWAITING DEPLOY APPROVAL  
**Scope:** 3 new DACH authority pages + internal link network + sitemap update

---

## A) FINDINGS (pre-implementation audit)

- Site had no dedicated living-costs, transaction-costs, or city-comparison pages
- DACH users searching "Lebenshaltungskosten Bulgarien", "Kaufnebenkosten Bulgarien", "Burgas oder Varna" had no dedicated destination
- All 3 query clusters match real DACH buyer decision-stage questions
- Existing pages (warum-bulgarien, immobilien-bulgarien, schwarzmeerkueste, kaufprozess) had room to receive outbound links to new pages
- No existing page covered the 3–4.5% Nebenkosten figure in a dedicated format — it existed only as a FAQ answer

---

## B) CHANGES

### New pages created

| Page | Path | Schema nodes | FAQs |
|------|------|-------------|------|
| Lebenshaltungskosten Bulgarien | `/lebenshaltungskosten-bulgarien/` | 4 (@graph: lean RealEstateAgent ref, WebPage, BreadcrumbList, FAQPage) | 5 |
| Kaufnebenkosten Bulgarien | `/kaufnebenkosten-bulgarien/` | 4 | 5 |
| Burgas vs Varna | `/burgas-vs-varna/` | 4 | 5 |

### Schema pattern (all 3 pages)
- `@graph` with 4 nodes: lean `{"@type":"RealEstateAgent","@id":"#org"}` reference, `WebPage`, `BreadcrumbList`, `FAQPage`
- BreadcrumbList: `Start → Bulgarien → [Leaf]` — leaf item omits `"item"` URL (correct pattern)
- FAQPage `@id` = canonical URL + `#faq`; visible `id="faq"` anchor in HTML
- WebPage: `description`, `dateModified: "2026-05-28"`, `isPartOf: {"@id": ".../#website"}`
- No `@id` on BreadcrumbList node (matches established repo pattern)

### Internal links added to existing pages

| Source page | Link added |
|-------------|-----------|
| `kaufprozess-bulgarien` | `/kaufnebenkosten-bulgarien/` in Weiterführend row *(done in P19 T5 session 1)* |
| `schwarzmeerkueste-bulgarien` | `/burgas-vs-varna/` between Burgas and Steuervorteile in nav row |
| `immobilien-bulgarien` | `/kaufnebenkosten-bulgarien/`, `/lebenshaltungskosten-bulgarien/`, `/burgas-vs-varna/` after warum-bulgarien btn |
| `warum-bulgarien` | `/lebenshaltungskosten-bulgarien/`, `/kaufnebenkosten-bulgarien/` before investor-check CTA |

### Sitemap update
- 3 entries added under new `<!-- P19: Authority Content Layer -->` comment block
- `lastmod: 2026-05-28`, `changefreq: monthly`, `priority: 0.7`

---

## C) RISKS

| Risk | Level | Notes |
|------|-------|-------|
| Guarantee/returns language | LOW | All `garantier*` hits are explicit disclaimers (`kein garantierter Wert`, `ohne garantierte Aussagen`, `keine garantierten Einnahmen`) |
| JSON-LD parse errors | NONE | All 3 pages parse clean with Python `json.loads()` |
| BreadcrumbList violations | NONE | Leaf item correctly omits `"item"` URL on all 3 |
| CSS/layout impact | NONE | Uses only existing `.btn`, `.container`, `.card`, `.kpis`, `.kpi`, `.section-label`, `.reveal` classes |
| Routing impact | NONE | New pages only; no existing routes changed |
| Form impact | NONE | No forms touched |
| Investor Check impact | NONE | Not touched |
| Kapital-layer language | NONE | No AUM, Investor Club, elite access, Architekt language |
| 40% Ratenzahlung USP | INTACT | Not modified |
| Fake statistics | NONE | Lebenshaltungskosten uses relative comparisons only; Kaufnebenkosten uses the 3–4.5% range already present in existing FAQ; Burgas vs Varna uses ✔/○/✗ structural comparison with explicit "kein Ranking" disclaimer |

---

## D) VALIDATION RESULTS

### JSON-LD (all 3 new pages)
```
lebenshaltungskosten-bulgarien:
  @graph nodes: 4 ✓
  BreadcrumbList: OK (leaf no item, 3 items) ✓
  FAQPage: 5 questions, @id ends #faq ✓
  WebPage: desc=OK, dateModified=2026-05-28, isPartOf=https://betongoldmarkt.de/#website ✓
  Forbidden terms: NONE ✓

kaufnebenkosten-bulgarien:
  @graph nodes: 4 ✓
  BreadcrumbList: OK (leaf no item, 3 items) ✓
  FAQPage: 5 questions, @id ends #faq ✓
  WebPage: desc=OK, dateModified=2026-05-28, isPartOf=https://betongoldmarkt.de/#website ✓
  garantier* hits: all negative disclaimers ✓

burgas-vs-varna:
  @graph nodes: 4 ✓
  BreadcrumbList: OK (leaf no item, 3 items) ✓
  FAQPage: 5 questions, @id ends #faq ✓
  WebPage: desc=OK, dateModified=2026-05-28, isPartOf=https://betongoldmarkt.de/#website ✓
  garantier* hits: all negative disclaimers ✓
```

### Internal link verification
```
schwarzmeerkueste: burgas-vs-varna btn at line 178 ✓
immobilien-bulgarien: kaufnebenkosten (105), lebenshaltungskosten (106), burgas-vs-varna (107) ✓
warum-bulgarien: lebenshaltungskosten (295), kaufnebenkosten (296) before investor-check (297) ✓
```

### Sitemap verification
```
Line 94: lebenshaltungskosten-bulgarien ✓
Line 95: kaufnebenkosten-bulgarien ✓
Line 96: burgas-vs-varna ✓
```

---

## E) CONTENT SUMMARY

### /lebenshaltungskosten-bulgarien/
- Framing: Orientierungsrahmen für DACH-Käufer — comparative living costs, no numbers as guarantees
- Sections: Hero, KPI row (relative comparisons), 4 content sections (Mietkosten, Lebensmittel, Transport, Nebenkosten)
- 5 FAQ questions covering real DACH buyer questions
- Links to: `/warum-bulgarien/`, `/kaufnebenkosten-bulgarien/`, `/immobilien-bulgarien/`, `/investor-check/`

### /kaufnebenkosten-bulgarien/
- Framing: ca. 3–4.5% Nebenkosten — sourced from existing FAQ data, no invented figures
- Breakdown: Grunderwerbsteuer 2–3%, Notarkosten ~0.5%, Grundbucheintrag ~0.1%, Rechtsanwalt optional
- Explicit disclaimer: "Dies ist kein garantierter Wert"
- 5 FAQ questions covering Notarkosten, Steuern, Makler, Ratenzahlung
- Links to: `/kaufprozess-bulgarien/`, `/warum-bulgarien/`, `/investor-check/`, `/faq/`

### /burgas-vs-varna/
- Framing: Sachlicher Standortvergleich — kein Ranking, kein Sieger
- Comparison matrix: 10 criteria, ✔/○/✗ system, both cities evaluated equally
- Explicit disclaimers: "Kein Ranking, keine Garantien", "Mietmärkte sind keine garantierten Einnahmen"
- 5 FAQ questions about airport connections, prices, off-market, winter/summer activity
- Links to: `/immobilien-burgas/`, `/immobilien-varna/`, `/schwarzmeerkueste-bulgarien/`, `/investor-check/`

---

## F) FILES CHANGED

| File | Type | Change |
|------|------|--------|
| `lebenshaltungskosten-bulgarien/index.html` | NEW | Authority page |
| `kaufnebenkosten-bulgarien/index.html` | NEW | Authority page |
| `burgas-vs-varna/index.html` | NEW | Authority page |
| `kaufprozess-bulgarien/index.html` | MODIFIED | + kaufnebenkosten link in Weiterführend |
| `schwarzmeerkueste-bulgarien/index.html` | MODIFIED | + burgas-vs-varna btn |
| `immobilien-bulgarien/index.html` | MODIFIED | + 3 new authority page btns |
| `warum-bulgarien/index.html` | MODIFIED | + lebenshaltungskosten + kaufnebenkosten btns |
| `sitemap.xml` | MODIFIED | + 3 new URL entries |

---

## G) WHAT WAS NOT CHANGED

- `index.html` (homepage) — not touched
- `investor-check/` — not touched
- `betreuung-bulgarien/` — not touched
- All `/angebote/` object pages — not touched
- All `/projekte/` pages — not touched
- `assets/markt.css` — not touched
- `assets/markt.js` — not touched
- `_redirects` / `netlify.toml` — not touched
- P18 `#vor-ort` section — not touched

---

## H) PENDING (operator actions)

**Portrait file (P18 blocker — unchanged from P18 report):**
- File `assets/proof/dietrich-bauer-vor-ort-bulgarien.jpg` still missing from repository
- Homepage `#vor-ort` section references this file but will render with broken image until placed
- Action: Save portrait from conversation → rename → place at `betongoldmarkt/assets/proof/dietrich-bauer-vor-ort-bulgarien.jpg`

**Deploy (requires explicit approval):**
```bash
cd /path/to/betongoldmarkt
git add lebenshaltungskosten-bulgarien/index.html \
        kaufnebenkosten-bulgarien/index.html \
        burgas-vs-varna/index.html \
        kaufprozess-bulgarien/index.html \
        schwarzmeerkueste-bulgarien/index.html \
        immobilien-bulgarien/index.html \
        warum-bulgarien/index.html \
        sitemap.xml
git commit -m "P19: Authority Content Layer — 3 new pages (Lebenshaltungskosten, Kaufnebenkosten, Burgas vs Varna)"
git push origin main
```
**DO NOT push without explicit operator approval.**

---

## I) NEXT PHASE OPTIONS

| Phase | Description |
|-------|-------------|
| P20 | Deploy P18 + P19 together (portrait blocker must be resolved first or committed separately) |
| P20-B | Authority Content Layer CONTINUE — additional pages: `/mietrendite-bulgarien/`, `/eigentumsvorbehalt/`, `/notarkosten-bulgarien/` |
| P21 | Internal link density audit — map pages with <3 outbound contextual links |
| P22 | WebPage `description` quality pass — audit all pages for keyword-rich, non-duplicate descriptions |

---

## K) COMMIT READINESS

```
READY: 8 files modified/created
BLOCKED: Portrait file missing (P18 visual only — schema intact)
RISK LEVEL: LOW
DEPLOY DECISION: OPERATOR
```
