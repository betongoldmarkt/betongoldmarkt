# PHASE P18 — Founder / Operator Human Trust Layer
**Date:** 2026-05-28  
**Status:** DEPLOYED — operator review pending (no push without approval)

---

## A) MISSION

Implement a calm, factual human presence section for MARKT. Address the #2 trust weakness identified in the external perception audit: "zero named humans visible on the site." Person: Dietrich Bauer. Positioning: on-the-ground orientation and structured accompaniment for DACH buyers — not capital management, not fund language.

---

## B) CHANGES EXECUTED

### 1. Homepage — `index.html`
**Person schema node** added to JSON-LD `@graph` (5th node):
```json
{
  "@type": "Person",
  "@id": "https://betongoldmarkt.de/#dietrich-bauer",
  "name": "Dietrich Bauer",
  "jobTitle": "Marktorientierung und strukturierte Begleitung",
  "affiliation": {"@id": "https://betongoldmarkt.de/#org"},
  "knowsLanguage": ["de", "ru", "es"],
  "areaServed": ["Bulgaria", "Germany", "Austria", "Switzerland"]
}
```

**Section 9B inserted** between Section 9 (Regionen) and Section 10 (Access Gate):
- Anchor: `id="vor-ort"`
- Label: "Vor Ort in Bulgarien"
- Heading: "Dietrich Bauer — Orientierung und strukturierte Begleitung"
- 1 introductory paragraph (factual, no guarantees)
- 10 Tätigkeitsbereiche in 2-column grid (12px muted)
- Languages line: "Deutsch, Russisch und Spanisch"
- Investor Check explanation: framed as structured pre-filter, not sales pressure
- Uses `.reveal` for IntersectionObserver animation
- Uses existing CSS variables (`--mc-text-muted`, `--mc-font-display`)

### 2. Secondary pages — `/#vor-ort` reference links
| Page | Placement | Link text |
|---|---|---|
| `betreuung-bulgarien/index.html` | After `warum-bulgarien` link in TRUST INTRO | "Ansprechpartner vor Ort →" |
| `kaufprozess-bulgarien/index.html` | In "Weiterführend" link row | "Ansprechpartner vor Ort →" |
| `faq/index.html` | In TRUST LINK bar (with betreuung + kaufprozess) | "Ansprechpartner vor Ort →" |

All secondary links use `href="/#vor-ort"` (absolute root-relative anchor).

---

## C) VALIDATION RESULTS

| Check | Result |
|---|---|
| Homepage JSON-LD parse | ✓ 0 errors — 5 nodes valid |
| Person node present | ✓ `#dietrich-bauer` with correct affiliation |
| `id="vor-ort"` anchor | ✓ Present in HTML |
| betreuung vor-ort link | ✓ Present |
| kaufprozess vor-ort link | ✓ Present |
| faq vor-ort link | ✓ Present |
| All secondary page JSON-LD | ✓ No parse errors |
| Forms unchanged | ✓ No form modifications |
| Routing unchanged | ✓ No new routes |
| Netlify settings untouched | ✓ |
| CSS / layout regressions | ✓ None — uses existing classes only |
| Investor Check preserved | ✓ CTA block untouched |

### Forbidden language scan — P18 additions only
| Pattern | P18 content | Result |
|---|---|---|
| "Architekt des Kapitals" | Not present | ✓ Clean |
| Elite/Investor-Club language | Not present | ✓ Clean |
| garantier\* | Not present | ✓ Clean |
| Fake credentials | Not present | ✓ Clean |
| Rendite/yield guarantees | Not present | ✓ Clean |
| BETON GOLD KAPITAL | Not present in P18 additions | ✓ Clean (pre-existing footer ref unchanged) |

*Note: Scanner flagged pre-existing FAQ yield ranges ("Langzeitmiete Burgas 7–10% brutto") and a factual DE/BG tax description ("steuerfreie ausländische Einkünfte mit Progressionsvorbehalt") — both existed before P18, neither is guarantee language, neither was modified.*

---

## D) RISKS

**Low / None:**
- No routing changes → zero SEO routing risk
- No form changes → zero lead-capture risk
- No Investor Check modifications → access gate intact
- Person schema is additive, does not conflict with existing #org node
- Secondary links are `<a href>` — no structural HTML changes

**Open:** Content not yet live (no push executed). Operator must approve + push.

---

## E) WHAT WAS NOT DONE (BY DESIGN)

- No photo of Dietrich Bauer (not available, would require real asset)
- No phone number in section (already in footer/contact)
- No social proof links (per P18 rules: no fake credentials, no invented press mentions)
- No BETON GOLD KAPITAL language or fund framing
- No `sameAs` links in Person schema (none verified)
- No modifications to Investor Check, forms, routing, or Netlify

---

## F) EEAT IMPACT (EXPECTED)

The Person schema node signals to Google that a named human is associated with the organisation. Combined with `affiliation` linking to `#org`, `knowsLanguage`, and `areaServed`, this is the minimal viable EEAT signal for Experience and Expertise without fake credentials.

The visible section (Section 9B) gives the page a human anchor point just before the qualification gate, reducing friction for cautious DACH buyers and addressing the "faceless institution" perception risk.

---

## G) ARCHITECTURE INTEGRITY

- Kapital / Markt separation: maintained — no Kapital language in P18 additions
- Router authority: not affected (no Make/webhook changes)
- SEO routing: not affected (no new pages, no slug changes)
- Sitemap: not modified (no new pages added)
- Schema hierarchy: intact — Person is additive @graph node

---

## H) PENDING OPERATOR ACTIONS

1. **Review Section 9B** on homepage (visible between Regionen grid and Access Gate)
2. **Verify Dietrich Bauer description** is accurate and approved for public display
3. **Approve and push** to Netlify when satisfied
4. **Optional:** Add a real photograph of Dietrich Bauer at a later stage (would increase EEAT signal further — file as a future phase)

---

## I) FILE MANIFEST

| File | Change type |
|---|---|
| `index.html` | JSON-LD Person node added; Section 9B inserted |
| `betreuung-bulgarien/index.html` | vor-ort link added |
| `kaufprozess-bulgarien/index.html` | vor-ort link added |
| `faq/index.html` | vor-ort link added |

---

## J) SCALE GATE STATUS (as of P18)

| Gate | Status |
|---|---|
| SG-01 Orphan webhook fix | OPERATOR PENDING |
| SG-02 Follow-up engine active | CLOSED ✅ |
| SG-03 MARKT_LEADS AI fields | CLOSED ✅ |
| SG-04 MARKT singleSelect governance | CLOSED ✅ |
| SG-05 Capital-driven investor routing | CLOSED ✅ |
| SG-06 Form signal recognition (Suchtyp) | DEPLOYED ✅ — operator test pending |
| P18 Human trust layer | DEPLOYED ✅ — operator review + push pending |

---

## K) NEXT RECOMMENDED PHASE

**P19 — Netlify Webhook Fix (SG-01)**  
The orphan webhook token (`sn077n…`) on both Netlify sites is the last open production risk. Fixing it closes SG-01 and ensures all form submissions route correctly. Estimated 15–30 min, zero code risk. Requires operator access to Netlify dashboard.

Alternatively: operator can first submit a test form on betongoldmarkt.de to confirm SG-06 (Phase 6H) routing is working before any new phases.
