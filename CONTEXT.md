# Poy website — project context

Reference doc for picking this project back up. Written 2026-08-18, updated 2026-08-24.

## What this is

A two-page site for **Poy** (Atelier Poy), a solo maker in Prague who makes upcycled dog collars and does clothing alterations/repairs, plus a full order form ("collar builder") for commissioning a custom collar. Built for a non-technical solo owner — everything is optimized to stay simple to host and cheap/free to run, with data files a non-technical editor can update directly on GitHub.

Live repo: https://github.com/MadaraKalpina/poy_web (branch `main`)

## Tech stack

**No framework, no build step, no package manager.** Plain static HTML/CSS/vanilla JS, deployable as-is — the one exception is a small **Google Apps Script** (a separate, Google-hosted script, not part of the deployed site) that receives the collar order form's submissions; see "Order submission backend" below.

- **Markup**: two pages — `index.html` (marketing/portfolio, one-page scroll) and `collars.html` (the 4-step collar order form + live price sidebar). Header/nav/footer markup is duplicated between the two files rather than shared via any include mechanism (no server-side includes available) — a change to one (e.g. a nav link, the footer socials) needs the same edit made in both.
- **Styling**: single `styles.css` for both pages, custom properties (CSS variables) for the whole design system, no preprocessor. No colors outside the `:root` custom properties are used anywhere; no font-size below `0.9375rem`/`0.95rem` is used anywhere (both are deliberate constraints established during the build).
- **Fonts**: Google Fonts, Nunito only (weights 400–900), loaded via `@import` at the top of `styles.css`
- **JS**: two small vanilla scripts, no bundler, no npm dependencies at all
  - `script.js` — sticky header shrink, mobile nav toggle, reviews carousel, and everything the collar builder needs (catalogue rendering, step navigation, live pricing, validation, order submission)
  - `i18n.js` — CZ/EN language switcher (see below)
- **Hosting target**: currently GitHub Pages, expected to move to a different static host at launch ("changing a bit when we go live") — nothing here depends on which one, since the order-submission integration is a plain client-side `fetch()` to an external URL, not anything server-side on the host itself.
- **Local preview**: needs an actual HTTP server (not `file://`), because `i18n.js` and the collar builder's catalogue rendering both use `fetch()` to load JSON. `python3 -m http.server` works if Python's available; in this project's actual dev environment (Windows + Git Bash) that wasn't reliably present, so a throwaway Node script (`http.createServer` serving static files, run in the background) was used instead — either works, the only requirement is "serve the folder over http, don't open the file directly."

## File structure

```
index.html              marketing/portfolio page, one <section> per page block
collars.html             collar order builder — 4-step form + live price sidebar
styles.css               all styles for both pages; :root custom properties
                          define the whole palette + fonts; section comments
                          mark Header / Hero / Services / Collar order page /
                          Reviews / Instagram feed / About / Contact / Footer /
                          Responsive
script.js                all interactive behavior for both pages (see below)
i18n.js                  language switcher (fetch + localStorage, no framework)
locales/
  cz.json                 Czech strings (fallback/default language)
  en.json                 English strings, fully translated (no longer a
                           placeholder copy of cz.json)
apps-script/
  Code.gs                 Google Apps Script Web App — receives collar order
                           submissions, appends a row to the order Google
                           Sheet, emails the owner + a summary to the customer
  README.md                non-technical setup/maintenance guide for the
                           above (create the Sheet, paste + deploy the script)
public/
  hardware/
    catalogue.json          data file driving the collar builder's hardware
                             options (silver/gold/black/brass) — see its
                             own README.md for the non-technical edit workflow
    *.png                   one photo per hardware finish
    README.md
  patterns/
    catalogue.json          data file driving the fabric swatch grid (~48
                             patterns across 4 category tabs) — same
                             non-technical edit workflow, own README.md
    *.png                   one photo per fabric pattern
  25mm example.png, 40mm example.png   width-option reference photos, also
                           referenced in the nametag step's font/style copy
  nametag_example.png     nametag close-up photo shown in the nametag step
                           (converted from nametag_example.HEIC — browsers
                           can't render HEIC directly)
  Collar.jpg, Alterations.jpg, Fixes.jpg     hero highlight row photos
  about me.JPG, about me transparent.png     About section photo
  services_collars.png, services_spravy.jpg,
  services_alterations.jpg, services_custom.jpeg   service card photos
  *.HEIC, *.heif           original phone photos before conversion — browsers
                           can't render HEIC/HEIF directly, so each has a
                           converted .jpg/.png sibling that's what the site
                           actually references. The HEIC/HEIF originals are
                           unused by the site but kept as source files.
branding/
  logo_horizontal.png      wide logo, used in the header
  LOGO - PROFILOVKA.png    square/stacked logo, used in the footer
  blue_flower_hires.png    decorative floral badge used in the About section
  blue_flower.png, pink_flower.png     unused originals, kept in case wanted later
  wave_primary_tile.png, wave_yelow.png, wave_yelow_tile.png   wave-divider assets
inspo/                   reference screenshots used during design — not part
                          of the live site, not Poy's own assets (see "Known
                          gaps")
```

## Page structure

### `index.html` (top to bottom)

1. **Header** — two rows. Row 1: cream background, centered logo. Row 2: blue background, nav links (Home, What I do → `#feed`, About, Services, Contact) spread edge-to-edge, plus the language switcher. Sticky (`position: sticky; top: 0`), shrinks on scroll (smaller logo/padding via an `is-scrolled` class toggled in `script.js`, which also records the header's live rendered height into a `--header-height` CSS variable — the collar builder's price sidebar reads that variable so its own sticky offset always sits flush under the header instead of a hardcoded guess). Collapses to a hamburger + dropdown under 640px.
2. **Hero** — full-bleed row of 3 photos, then a centered headline/subtext/CTA below.
3. **About** — split layout: photo + decorative flower badge, bio copy, on the mustard/accent color block.
4. **Services** — 4 cards (arch-shaped photo + colored caption block), plus a "Build your collar" CTA card linking to `collars.html`.
5. **Reviews** — a small carousel (prev/next arrows + dots) of customer quotes pulled from Instagram, one wider slide for the longest review.
6. **Instagram feed** — embeds an Elfsight Instagram Feed widget.
7. **Contact** — mailto link + Instagram link, on the primary rose color block.
8. **Footer** — logo, Instagram/TikTok/email links, "Made in Prague" line.

Two scalloped-wave dividers (SVG mask) mark the transitions into the About and Contact blocks — capped at 2 per page, only ever leading into a bold color block, by design decision.

### `collars.html` — the collar builder

A single `<form>` split into 4 steps, all live in the DOM at once (only `hidden` toggles between them, so nothing is lost going back and forth), plus a persistent price sidebar next to it.

- **Step-progress widget** (`<ol class="step-progress">`) — sits above all 4 steps, always visible, shows which step is current/complete via checkmarks.
- **Step 1 — dog**: neck circumference, breed (both optional).
- **Step 2 — collar**: width (25mm/40mm, each with a reference photo), hardware, fabric. Hardware and fabric are **data-driven**: both grids are rendered at runtime from `public/hardware/catalogue.json` / `public/patterns/catalogue.json` (see `renderHardwareCatalogue()` / `renderFabricCatalogue()` in `script.js`), so the non-technical owner can add/rename/retire an item or a whole pattern by editing one JSON file (each folder's own README.md walks through this). Fabric is further split into 4 category tabs with a click-to-enlarge lightbox. Picking 40mm auto-locks hardware to silver (`applyWidthLock()` in `script.js`), since that's the only finish currently stocked for that width, leaving the other options visible-but-disabled rather than hidden.
- **Step 3 — nametag**: whether to add one; if so, the embroidered text (a 2-row textarea, shown in a row next to a nametag reference photo), background color (white by default or custom + free text), embroidery color (black / matching the fabric / custom + free text), and embroidery style (handwritten/cursive by default or custom + free text) — each "custom" option reveals its own text field via the same small `setupCustomToggle()` helper.
- **Step 4 — delivery & contact**: 4 delivery methods in this order — pickup, Zásilkovna (own pick-up-point address field + link to zasilkovna.cz/pobocky), Balíkovna home delivery (full street address), Balíkovna pick-up point (own address field + link to balikovna.cz's point finder) — each revealing only its own relevant field; then name/email/phone (all required)/Instagram (optional), notes, and the submit button.
- **Live price panel** — a sticky sidebar on desktop (fixed bottom bar, collapsible, on mobile), visible from Step 1 onward, recalculating on every relevant change (`updatePrice()` in `script.js`): base price by width, +100 Kč if a nametag is added, delivery surcharge by method. A short delivery-timeframe note lives inside the panel's breakdown, so it scrolls as one glued unit with the box instead of as a separate sibling (an earlier version had it as a sibling paragraph, which visibly overlapped the sticky box mid-scroll — see "Working conventions" below).
- **Validation** is entirely client-side, one function per step (`validateStep1`–`validateStep4`) so "Next" only checks fields the customer can currently see; errors are inline next to each field, and once a step's been attempted once, its errors re-check live on every subsequent `input`/`change` rather than requiring another click.
- **Submission**: on a valid Step 4 submit, `script.js` collects every field into one payload object and POSTs it to a Google Apps Script Web App (see "Order submission backend" below); success replaces the form with a `#order-success` confirmation message, failure shows an inline retry message and re-enables the submit button.

## Order submission backend (Google Apps Script)

The site itself has no backend, so the collar order form posts straight to a small script hosted on Google's infrastructure instead of a custom server:

- `apps-script/Code.gs` is the script to paste into the order Google Sheet's **Extensions → Apps Script** editor and deploy as a Web App ("Execute as Me," "Anyone" access — required since the form has no login). Its `doPost(e)`:
  1. Checks a shared token against `APPS_SCRIPT_TOKEN` in `script.js` (a lightweight anti-spam check, not real security — the endpoint is public by necessity).
  2. Appends a row to the Sheet with every field.
  3. Emails the order details to the owner (`atelierpoy@gmail.com` — the Google account that owns the Sheet/script, distinct from the public-facing `hello@atelierpoy.cz` contact address used in the site's own contact/footer links).
  4. Emails the customer a confirmation **including a human-readable summary of what they selected** (friendly labels, not raw field codes, and only the sub-fields relevant to their choices), in whichever language they had the site set to.
- `apps-script/README.md` is the non-technical, step-by-step setup guide (create the Sheet, paste the script, deploy, paste the resulting URL into `script.js`'s `APPS_SCRIPT_URL` constant) and a maintenance section for adding fields or editing email wording later.
- **This still needs the one-time deploy step done** — `script.js`'s `APPS_SCRIPT_URL` is currently a placeholder (`'PASTE_YOUR_APPS_SCRIPT_WEB_APP_URL_HERE'`) until that's completed following the README.

## Design system

All defined as CSS custom properties in `styles.css` `:root`:

| Token | Hex | Used for |
|---|---|---|
| `--text` | `#4e350f` | body copy |
| `--primary` | `#ab5e71` | hero-adjacent rose, service card captions, contact block |
| `--primary-deep` / `--primary-pale` | derived | hover states / pale tints / the de-facto "error" color (no dedicated red in the palette) |
| `--secondary` | `#6071af` | header nav row (blue) |
| `--secondary-deep` | `#3c4b80` | headings, borders, footer |
| `--accent` | `#ecc84b` | About section (mustard) |
| `--accent-deep` | derived | — |
| `--cream` | `#fdf6ec` | base/neutral section background |
| `--white` | `#ffffff` | cards/panels needing to sit above `--cream` (price panel, option cards, catalogue chips) |

Font: Nunito throughout (`--font-display` and `--font-body` both point to it — kept as two separate variables in case that ever needs to diverge again).

Signature UI patterns: pill-shaped buttons (`.btn`), arch-topped service card photos, full-bleed edge-to-edge image rows on the marketing page, scalloped wave dividers only at the top of bold color blocks; on the collar builder, a consistent "option card" pattern (`.option-card`, radio/checkbox styled as a clickable bordered card, filled when checked via `:has(input:checked)`) reused for width/hardware/delivery/nametag sub-choices, and a matching "chip" pattern for the data-driven hardware/fabric grids.

## Internationalization (CZ/EN)

Built as a lightweight vanilla-JS system, **not** React — this was originally requested as if the project were a React app (components, Context, `src/locales/`), but the site has no framework, so the same requirements were adapted:

- `locales/cz.json` / `locales/en.json` — flat-ish JSON, grouped by page/section (`nav`, `collarPage`, `hero`, `about`, `services`, `reviews`, `feed`, `contact`, `footer`), array-friendly (e.g. `services.cards[2].title`). Both files are kept in exact key parity — every edit to one needs the same key added/removed in the other, or the site silently falls back to showing the raw key path for whichever language is missing it.
- Elements are tagged `data-i18n="path.to.key"` (text content) or `data-i18n-attr="attr:path.to.key"` (for `alt`, `aria-label`, comma-separated if an element needs more than one)
- `i18n.js` fetches the matching JSON on load, walks the DOM applying strings, defaults to Czech (language code `"cz"`, not the ISO `"cs"` — kept to match the file naming; the `<html lang>` attribute itself is correctly set to `"cs"`/`"en"` by JS), remembers the choice in `localStorage` (`poy-lang`). It also fires a `poy:langchange` event on every language switch so other scripts can react without a page reload — the collar builder's price panel currency suffix and its hardware/fabric catalogue names both re-render on this event.
- Language switcher UI: styled like a nav link (`CZ ⌄`), opens a small dropdown showing only the other language, click-outside/Escape to close
- `collarPage.*` holds all of the collar builder's strings — by far the largest single section in both files, covering every step heading, option label, field help text, and validation error message.

**To add real English copy for a new key**: add it to both `locales/en.json` and `locales/cz.json` at the same path, keeping them in parity.

## Known gaps / things flagged but not resolved

- **The Apps Script Web App URL isn't wired in yet** — `script.js`'s `APPS_SCRIPT_URL` is a placeholder until the one-time setup in `apps-script/README.md` is completed. Until then, the order form's submit button will fail (shows the inline retry message) since the fetch has nowhere to go.
- **`hello@atelierpoy.cz` is duplicated** across `contact.emailButton` / `footer.emailLink` in both locale files, and hardcoded again as the literal `mailto:` href in both `index.html` and `collars.html` — changing the address means updating up to 6 places, not one canonical source. The Instagram/TikTok URLs are similarly hardcoded (not in the locale files) in both files' footers.
- **Header/nav/footer markup is duplicated** between `index.html` and `collars.html` rather than shared — there's no include mechanism available in a pure static site, so a nav/footer change needs to be made twice.
- **`<title>`/meta description are not translated** on either page — static, English/mixed, not wired into the language switcher.
- **Raw `.HEIC`/`.heif` originals are committed** to `public/` alongside their converted `.jpg`/`.png` versions — harmless but adds repo weight; fine to remove if the client wants a leaner repo.
- **`inspo/`** (competitor/reference screenshots) is committed to the repo — worth reconsidering before this repo is ever made more widely visible, since those aren't Poy's own assets.

## Working conventions established during the build

- Photo/graphic instructions get literal, careful pixel-level verification (crop bounding boxes, color-channel checks, hole-detection before/after image edits) rather than eyeballing — this came up repeatedly with the logo-derived flower badge.
- New CSS rules avoid section-level `padding-bottom` immediately before a `.scallop` divider — that padding renders *after* the divider, pushing it away from the next section's edge. Bottom spacing before a divider belongs on `.section .container`, not the section itself.
- When something "isn't clickable" or otherwise misbehaves, it's worth spinning up a headless browser (Playwright) rather than reasoning about CSS in the abstract — this caught a real bug (`position: sticky` elements don't get scrolled to by anchor links, since browsers treat them as always "in view").
- A `position: sticky` element and a normal sibling inside the *same* parent can visually overlap mid-scroll if the sibling isn't much taller than the sticky element's own box — the sibling scrolls normally while the sticky one stays pinned, so the sibling slides up behind it. Fix: put content that must always render "attached" to a sticky box *inside* that box, not as a flow sibling next to it (this is why the price panel's delivery note lives inside `.price-details`, not beside the `<aside>`).
- Similarly, a sticky element's offset (`top: Npx`) should track the actual height of whatever it needs to clear (e.g. the site's own shrinking header) rather than a hardcoded guess, since the two will silently drift out of sync the next time either one changes — `--header-height` (set live from `header.offsetHeight` in `script.js`, including a `transitionend` re-check for the header's own shrink animation) is the pattern used here.
- Every edit to `collars.html`, `script.js`, or the locale files gets a verification pass before considering the task done: JSON validity + exact cz/en key-parity diff, `node --check script.js`, an HTML tag-balance check (open vs. close tag counts), every `data-i18n`/`data-i18n-attr` key resolving against the locale JSON, and every `getElementById()` target existing (allowing for IDs created dynamically at runtime, e.g. the catalogue-rendered hardware/fabric inputs).
- No new CSS colors outside the existing `:root` custom properties, and no font-size below `0.9375rem`/`0.95rem` anywhere — both enforced as hard constraints throughout the collar-builder work.
