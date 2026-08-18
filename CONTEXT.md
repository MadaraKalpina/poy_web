# Poy website — project context

Reference doc for picking this project back up. Written 2026-08-18.

## What this is

A one-page marketing/portfolio site for **Poy** (Atelier Poy), a solo maker in Prague who makes upcycled dog collars and does clothing alterations/repairs. Prototype stage, built for a non-technical solo owner — everything is optimized to stay simple to host and eventually easy to hand off for content edits.

Live repo: https://github.com/MadaraKalpina/poy_web (branch `main`)

## Tech stack

**No framework, no build step, no package manager.** Plain static HTML/CSS/vanilla JS, deployable as-is.

- **Markup**: single-page `index.html`, all sections on one scroll
- **Styling**: single `styles.css`, custom properties (CSS variables) for the whole design system, no preprocessor
- **Fonts**: Google Fonts, Nunito only (weights 400–900), loaded via `@import` at the top of `styles.css`
- **JS**: two small vanilla scripts, no bundler, no npm dependencies at all
  - `script.js` — mobile nav hamburger toggle
  - `i18n.js` — CZ/EN language switcher (see below)
- **Hosting target**: GitHub Pages (or any static host) — the site must work from a plain `https://` file listing with zero server-side logic
- **Local preview**: needs an actual HTTP server (not `file://`), because `i18n.js` uses `fetch()` to load JSON. Simplest: `python3 -m http.server` from the project root, then open `http://localhost:8000`.

## File structure

```
index.html            all page markup, single file, one <section> per page block
styles.css             all styles; :root custom properties define the whole palette + fonts
script.js               mobile nav hamburger toggle
i18n.js                  language switcher (fetch + localStorage, no framework)
locales/
  cz.json                Czech strings (also the fallback/default language)
  en.json                English strings — currently a straight copy of cz.json,
                          placeholder pending real translation (see "Known gaps" below)
branding/
  logo_horizontal.png     wide logo, used in the header
  LOGO - PROFILOVKA.png   square/stacked logo, used in the footer
  blue_flower_hires.png   decorative floral badge used in the About section (cropped
                          + cleaned from the square logo file — see git history)
  blue_flower.png, pink_flower.png   original small floral assets, unused by the
                          site currently, kept in case they're wanted later
public/
  Collar.jpg, Alterations.jpg, Fixes.jpg     hero highlight row photos
  about me.JPG                               About section photo
  services_collars.png, services_spravy.jpg,
  services_alterations.jpg, services_custom.jpeg   service card photos
  *.HEIC, *.heif          original phone photos before conversion — the sewing
                          machine/collar/alteration source files. Browsers can't
                          render HEIC/HEIF directly, so each has a converted .jpg
                          sibling that's what's actually referenced in the HTML.
                          The HEIC/HEIF originals are unused by the site but kept
                          as source files.
inspo/                   reference screenshots (Cal & Lily, Lars, Friday Afternoons
                          Co.) used during design — not part of the live site
```

## Page structure (top to bottom)

1. **Header** — two rows. Row 1: cream background, just the centered logo. Row 2: blue background, nav links (What I do → `#feed`, About, Services, Contact) spread edge-to-edge, plus the language switcher. Collapses to a hamburger + dropdown under 640px.
2. **Hero** — full-bleed row of 3 photos (each an `<a href="#">` placeholder link, meant to eventually open per-service portfolio pages that don't exist yet), then a centered headline/subtext/CTA below.
3. **About** — split layout: photo + decorative flower badge on one side, bio copy on the other. Background is the mustard/accent color block.
4. **Services** — 4 cards, each an arch-shaped photo with a colored caption block (title + description) in the primary rose color.
5. **Instagram feed** — embeds a LightWidget iframe. **Known issue**: LightWidget's free tier blocks HTTPS and shows an upsell screen instead of the feed on any HTTPS-hosted site (including GitHub Pages). This was flagged to the user and is unresolved — see "Open decisions" below.
6. **Contact** — mailto link + Instagram link, on the primary rose color block.
7. **Footer** — logo, Instagram link, email, "Made in Prague" line.

Two scalloped-wave dividers (SVG mask, not the section-heading-adjacent kind) mark the transitions into the About and Contact blocks — capped at 2 per page, only ever leading into a bold color block, by design decision.

## Design system

All defined as CSS custom properties in `styles.css` `:root`:

| Token | Hex | Used for |
|---|---|---|
| `--text` | `#4e350f` | body copy |
| `--primary` | `#ab5e71` | hero-adjacent rose, service card captions, contact block |
| `--primary-deep` / `--primary-pale` | derived | hover states / pale tints |
| `--secondary` | `#6071af` | header nav row (blue) |
| `--secondary-deep` | `#3c4b80` | headings, borders, footer |
| `--accent` | `#ecc84b` | About section (mustard) |
| `--accent-deep` | derived | — |
| `--cream` | `#fdf6ec` | base/neutral section background |

Font: Nunito throughout (`--font-display` and `--font-body` both point to it — kept as two separate variables in case that ever needs to diverge again).

Signature UI patterns: pill-shaped buttons (`.btn`), arch-topped service card photos, full-bleed edge-to-edge image rows (hero, no rounded corners "so the images do the talking"), scalloped wave dividers only at the top of bold color blocks.

## Internationalization (CZ/EN)

Built as a lightweight vanilla-JS system, **not** React — this was originally requested as if the project were a React app (components, Context, `src/locales/`), but the site has no framework, so the same requirements were adapted:

- `locales/cz.json` / `locales/en.json` — flat-ish JSON, grouped by page section (`nav`, `hero`, `about`, `services`, `feed`, `contact`, `footer`), array-friendly (e.g. `services.cards[2].title`)
- Elements are tagged `data-i18n="path.to.key"` (text content) or `data-i18n-attr="attr:path.to.key"` (for `alt`, `aria-label`, comma-separated if an element needs more than one)
- `i18n.js` fetches the matching JSON on load, walks the DOM applying strings, defaults to Czech, remembers the choice in `localStorage` (`poy-lang`)
- Language switcher UI: styled like a nav link (`CZ ⌄`), opens a small dropdown showing only the other language, click-outside/Escape to close

**To add real English copy**: edit `locales/en.json` key-by-key (same structure as `cz.json`), delete the `_note` key at the top when done. No code changes needed for that step.

## Known gaps / things flagged but not resolved

- **`hero.subtitle` is still English** in `cz.json` too — a leftover from an earlier edit, never actually translated to Czech. Worth fixing whenever the Czech copy gets a final pass.
- **Email/Instagram handle are duplicated** across `contact.emailButton`, `contact.instagramButton`, `footer.emailLink`, `footer.instagramLink` (both locale files) — changing either means updating up to 4 places, not one canonical source.
- **`<title>`/meta description are not translated** — static, English, not wired into the language switcher.
- **Language code is `"cz"`**, not the ISO 639-1 `"cs"` — kept to match the requested file naming (`cz.json`/`en.json`); the static `<html lang="cs">` attribute is correct though, and gets updated to `"en"`/`"cs"` by JS on switch.
- **LightWidget Instagram embed** shows a "widget add-on required" upsell instead of the feed, because the free tier blocks HTTPS. Three options were on the table when this got interrupted by other work: (a) pay for LightWidget, (b) swap to a different embed provider, (c) drop the live embed and replace the section with a plain "follow on Instagram" link/button. **Not yet decided.**
- **Raw `.HEIC`/`.heif` originals are committed** to `public/` alongside their converted `.jpg` versions — harmless but adds repo weight; fine to remove if the client wants a leaner repo.
- **`inspo/`** (competitor/reference screenshots) is committed to the repo too — worth reconsidering before this repo is ever made more widely visible, since those aren't Poy's own assets.

## Working conventions established during the build

- Photo/graphic instructions get literal, careful pixel-level verification (crop bounding boxes, color-channel checks, hole-detection before/after image edits) rather than eyeballing — this came up repeatedly with the logo-derived flower badge.
- New CSS rules avoid section-level `padding-bottom` immediately before a `.scallop` divider — that padding renders *after* the divider (since the divider is a normal child of the section), pushing it away from the next section's edge. Bottom spacing before a divider belongs on `.section .container`, not the section itself.
- When something "isn't clickable" or otherwise misbehaves, it's been worth actually spinning up a headless browser (Playwright, installed ad hoc via `pip3 install playwright && python3 -m playwright install chromium`) rather than reasoning about CSS in the abstract — this caught a real bug (`position: sticky` elements don't get scrolled to by anchor links, since browsers treat them as always "in view").
