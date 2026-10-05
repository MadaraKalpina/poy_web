# Poy website — project context
 
Reference doc for picking this project back up. Written 2026-08-18, updated 2026-08-24, updated 2026-10-02 (price-list/legal pages, cookie consent + GA4 tracking, Cloudflare hosting, Jotform/Elfsight embeds).
 
## What this is
 
A small static site for **Poy** (Atelier Poy), a solo maker in Prague (Praha 6) who makes upcycled dog collars and leashes, does clothing repairs and alterations, and takes custom sewing commissions. It has six pages:
 
- the marketing home page
- a full order form for a custom collar (the "collar builder")
- two price-list pages
- terms
- a privacy policy
Built for a non-technical solo owner, so everything is optimized to stay simple to host and free to run, with data files a non-technical editor can update directly.
 
- **Who's who**: Madara builds and maintains the site and plans to stay on as its builder. The brand owner owns the accounts: the Google account `atelierpoy@gmail.com`, the order Sheet, and the GA4 property, where Madara has admin access.
- **Repo**: https://github.com/MadaraKalpina/poy_web (branch `main`). It is kept private.
## Tech stack
 
**No framework, no build step, no package manager.** Plain static HTML/CSS/vanilla JS, deployable as-is. The site does reach a few external services, listed under "Third-party services" below.
 
- **Markup**: six standalone HTML pages. The header, nav and footer markup is **duplicated in every page**, because there's no include mechanism in a pure static site. A nav or footer change has to be made six times.
- **Styling**: a single `styles.css` for all pages, with custom properties (CSS variables) for the whole design system and no preprocessor. Two deliberate constraints:
  - no colors outside the `:root` custom properties
  - no font size below `0.9375rem`/`0.95rem`
- **Fonts**: Google Fonts, Nunito only (weights 400–900), loaded via `@import` at the top of `styles.css`.
- **JS**: three vanilla scripts. There's no bundler and no npm dependencies.
  - `consent.js`: the cookie banner, the GA4 loader, the `window.poyTrack()` helper, and site-wide tracking (language switches, email and social clicks, the internal-traffic flag). It's loaded on every page **before** the other scripts.
  - `script.js`: sticky header shrink, mobile nav, and everything the collar builder needs: catalogue rendering, step navigation, live pricing, validation, order submission, and builder tracking.
  - `i18n.js`: the CZ/EN language switcher (see below).
- **Local preview** needs an actual HTTP server, not `file://`, because `i18n.js` and the builder's catalogues load JSON with `fetch()`. Use `python3 -m http.server`, or a throwaway Node `http.createServer` script on Windows / Git Bash, where Python wasn't reliably available.
## Hosting & deployment
 
- **Moving to Cloudflare.** `wrangler.jsonc` deploys the repo root as **Cloudflare Workers static assets**. The project name is `poy-web`, with `"assets": { "directory": "." }`.
- **What gets published.** `.assetsignore` keeps everything that shouldn't be served out of the deployment: `.git`, `wrangler.jsonc`, `inspo/`, `apps-script/`, all `*.HEIC`/`*.heif` originals, and **all `*.md` files**. So this file and the READMEs are never public.
- **GitHub Pages** still serves the site from `main` in the meantime. It was used for the first GA4 test run on 2026-10-02.
- **Custom domain.** It's in review as of 2026-10-02. The domain was registered at Český hosting, which previously pointed at a placeholder WordPress site. The contact email is `hello@atelierpoy.cz`.
- **Not relevant here:** the domain's own email setup.
## File structure
 
```
index.html                  home: hero, about, services, reviews, Instagram feed, contact
collars.html                collar builder: 4-step order form + live price sidebar
mending-pricelist.html      mending/repairs price list (tables) + email CTA
alterations-pricelist.html  alterations price list (tables) + email CTA
terms.html                  Terms & Conditions (Obchodní podmínky)
privacy.html                privacy policy; section VIII (#cookies) covers cookies,
                            GA4 and Cloudflare Web Analytics
styles.css                  all styles for every page
consent.js                  cookie banner + GA4 + site-wide tracking (see Analytics)
script.js                   header, nav, collar builder (incl. builder tracking)
i18n.js                     language switcher
wrangler.jsonc              Cloudflare Workers static-assets config
.assetsignore               files excluded from the Cloudflare deployment
locales/
  cz.json                   Czech strings (default/fallback language)
  en.json                   English strings (fully translated, kept in key parity)
apps-script/
  Code.gs                   Google Apps Script Web App receiving builder orders
  README.md                 non-technical setup/maintenance guide for it
public/
  hardware/catalogue.json   builder hardware options (silver/gold/black/brass) + photos, README
  patterns/catalogue.json   builder fabric swatches (~48 across 4 category tabs) + photos, README
  25mm/40mm example.png     width reference photos
  nametag_example.png       nametag close-up
  font-*.jpg, cursive/serif/sans serif.png   embroidery style samples
  Collar.jpg, Alterations.jpg, Fixes.jpg     hero photos
  about me.JPG, about me transparent.png     About photo
  services pic 2/3/4.png, services picture 1.png   service card photos
  *.HEIC / *.heif           phone originals (unused by the site, not deployed)
branding/                   logos, flower badge, wave-divider tiles
inspo/                      design reference screenshots (not Poy's assets, not deployed)
```
 
## Page structure
 
### `index.html`
1. **Header**:
   - Row 1 is cream, with the centered logo.
   - Row 2 is blue, with nav links spread edge to edge: Home, What I do (`#feed`), About, Services, Dog collars (`collars.html`), Contact. The language switcher sits in the same row.
   - The header is sticky and shrinks on scroll. `script.js` toggles an `is-scrolled` class with hysteresis, so it doesn't flicker. It also writes the live header height into `--header-height`.
   - Under 640px it becomes a hamburger menu.
2. **Hero**:
   - A full-bleed row of 3 photos. They still link to `href="#"` placeholders, meant for future per-service portfolio pages.
   - Then the headline and a CTA.
3. **About**: photo, flower badge and bio, on the mustard color block.
4. **Services**: 4 cards, each with its own CTA:
   - Collars & leashes → `collars.html`
   - Repairs → `mending-pricelist.html`
   - Alterations → `alterations-pricelist.html`
   - Custom sewing → `#contact`
5. **Reviews**: a **Jotform website widget**. Its content and styling are managed in Jotform, not in this repo. It replaced the old hand-coded carousel.
6. **Instagram feed**: an **Elfsight** Instagram Feed widget. It replaced LightWidget, whose free tier didn't work over HTTPS.
7. **Contact**: a `mailto:` button and an Instagram link, on the rose color block.
8. **Footer**:
   - logo
   - links: Dog collars, both price lists, Terms, Privacy, and a **"Cookie settings"** button (`data-cookie-settings`) that reopens the consent banner
   - email
   - Instagram, Facebook and TikTok icons
   - the "Made in Prague" line
Two scalloped-wave dividers mark the transitions into the About and Contact blocks. They're capped at 2 per page and only ever lead into a bold color block.
 
### Price-list pages
`mending-pricelist.html` and `alterations-pricelist.html` share the content styling (`.mending-section`, `.mending-content`, `.price-table*`). Each has a title, intro text, several price tables marked "approximate", and an email CTA tagged `data-track-location` for analytics.
 
### Legal pages
`terms.html` and `privacy.html` are fully translated through the locale files (`terms.*`, `privacyPolicy.*`). The privacy policy's section VIII (`#cookies`) is what the banner's "More info" link points to. It describes:
- the essential local storage (language and the cookie choice)
- GA4, which runs only with consent, keeps data for 14 months, and is covered by the DPF note
- Cloudflare Web Analytics, which is cookieless and needs no consent
### `collars.html`: the collar builder
A single `<form>` split into 4 steps. All the steps are in the DOM at once, and only `hidden` toggles between them, so nothing is lost going back and forth. A step-progress widget sits above the steps, and a live price panel sits beside them.
 
- **Step 1, the dog**: neck circumference and breed, both optional, plus a **pull-strength slider** (none / some / strong). "Strong" adds a +50 Kč reinforcement surcharge.
- **Step 2, the collar**:
  - Width: 25 or 40 mm.
  - Hardware and fabric: both rendered at runtime from `public/hardware/catalogue.json` and `public/patterns/catalogue.json`. Fabric has 4 category tabs and a lightbox.
  - 40 mm auto-locks the hardware to silver (`applyWidthLock()`).
- **Step 3, the nametag**:
  - With or without. "With" adds +200 Kč.
  - Text (max 50 characters).
  - Background: white or custom.
  - Embroidery color: black or custom.
  - Style: cursive, serif or sans serif, each with a sample photo.
- **Step 4, delivery and contact**:
  - Delivery: pickup (0 Kč), Zásilkovna point (89 Kč), Balíkovna home (109 Kč), or Balíkovna box (79 Kč). Each reveals only its own fields.
  - Name, email and phone (required), and Instagram (optional).
  - **"Where did you hear about Poy?"** (`hear-about-source`): Instagram, TikTok, Facebook, family/friends, or other.
  - Notes, then submit.
- **Pricing** is computed in `updatePrice()` in `script.js`. Base price: 600 Kč for 25 mm, 700 Kč for 40 mm. The extras are added on top. The constants are at the top of the builder code.
- **Validation** is client-side, with one validator per step. Errors re-check live once a step has been attempted.
- **Submission**: the form POSTs JSON as `text/plain` (so the browser skips the CORS preflight) to the Apps Script Web App.
  - On success, the form is replaced with `#order-success`.
  - On failure, an inline retry message appears.
  - `APPS_SCRIPT_URL` **is now wired in** with the deployed script's URL.
## Order submission backend (Google Apps Script)
 
`apps-script/Code.gs` is deployed as a Web App in the order Google Sheet ("Execute as Me", "Anyone" access). Its `doPost(e)`:
1. checks the shared `APPS_SCRIPT_TOKEN`, a light anti-spam check rather than real security
2. appends a row to the Sheet
3. emails the order to the owner at `atelierpoy@gmail.com`
4. emails the customer a readable summary in their site language
`apps-script/README.md` is the non-technical setup and maintenance guide.
 
## Analytics & cookie consent
 
Full plan, GA4 admin checklist and exploration recipes: **`claude/ga4-tracking-plan.md` in the claude.ai Poy project.**
 
### Consent (`consent.js`)
- **Opt-in banner.** Czech law and the EU ePrivacy rules require opt-in, so GA4's script isn't even downloaded until the visitor clicks **Accept**. Consent Mode v2 defaults are all `denied`, and the ad signals stay denied permanently.
- The choice is stored in localStorage (`poy-cookie-consent` = `granted` / `denied`). The footer's "Cookie settings" button reopens the banner.
- **Rejecting** after an earlier accept deletes the `_ga*` cookies.
- **Events before a decision are held in memory** (up to `MAX_PENDING`):
  - **Accept** sends them, after `loadAnalytics()`.
  - **Reject** discards them.
  - Nothing reaches Google before consent. This keeps the builder's step 1 view and `builder_start` for people who interact before answering the banner, such as visitors arriving straight on `collars.html` from Instagram.
- **`window.poyTrack(name, params)`** is the only way any script should send a GA4 event. It handles all of the consent logic.
### GA4
- **Property** `G-61J2CK17V7`, owned by the Poy account, with Madara as admin.
- **Already set in GA4:** data retention of 14 months, and Google signals off. Google signals stays off for privacy, and because thresholding hides rows at low traffic.
- **Expected traffic:** a few hundred visits a month at most, so read monthly or quarterly totals.
- **Built-in data used as-is:** source, country, city, device, browser language, time, pages, and engagement time per page. The service comparison is done by page path (`/collars.html` vs. the two price lists).
- **Custom events:**
| Event | Sent from | Parameters |
|---|---|---|
| `builder_step_view` | script.js (step 1 on load, then each `showStep`) | `step_number`, `step_name` (dog/collar/nametag/delivery) |
| `builder_start` | script.js (first input/change, once per load) | — |
| `builder_step_error` | script.js (Next/Send blocked by validation) | `step_number`, `field_name` |
| `builder_step_back` | script.js | `step_number` |
| `builder_submit_error` | script.js (fetch failed or rejected) | — |
| `collar_order_sent` | script.js (on success) | `collar_width`, `nametag`, `delivery`, `fabric`, `hardware` (catalogue codes), `hear_about_source`, `value` (Kč), `currency: CZK` |
| `email_click` | consent.js (any `mailto:`) | `link_location` |
| `social_click` | consent.js (Instagram, Facebook or TikTok links) | `platform`, `link_location` |
| `language_change` | consent.js | still sends `language`, which is unused because that dimension was dropped; it can be removed |
 
- **User property `site_language`** (`cz`/`en`): it's set on load and updated on every switch.
- **`link_location`** comes from a `data-track-location` attribute, or failing that `footer`, or failing that the nearest `section[id]`. The tagged CTAs are `contact_section`, `mending_pricelist` and `alterations_pricelist`.
- **Custom dimensions registered** (12): `step_number`, `step_name`, `field_name`, `link_location`, `platform`, `collar_width`, `nametag`, `delivery`, `fabric`, `hardware`, `hear_about_source` (all Event scope), plus `site_language` (User scope). **Any new parameter needs a dimension registered before it shows in reports.**
- **Internal traffic**: visiting any page with `?poy_internal=1` sets the `poy-internal` flag in localStorage, and `?poy_internal=0` clears it. While the flag is set, GA4 config sends `traffic_type: 'internal'`, so no IP addresses are needed.
- **Not trackable**: clicks inside the Jotform reviews or Elfsight feed (third-party embeds), and the hero photos while they still link to `#`.
### Cloudflare Web Analytics
Free and cookieless, so it runs regardless of the banner and counts the visitors that GA4 can't see. The privacy text is already in place. It still has to be enabled in the Cloudflare dashboard once the domain is live (see "Open items").
 
## Third-party services the site depends on
 
| Service | Used for | Managed where |
|---|---|---|
| Google Apps Script + Sheets | builder order intake and emails | owner's Google account |
| Google Analytics 4 | analytics (consent-gated) | owner's Google account |
| Cloudflare | hosting (Workers static assets), domain, Web Analytics | Cloudflare dashboard |
| Jotform | reviews widget | Jotform |
| Elfsight | Instagram feed widget | Elfsight |
| Google Fonts | Nunito | — |
 
When adding a new third-party service, also update `privacy.html` (section V "Recipients" and/or VIII "Cookies") in both locale files.
 
## Internationalization (CZ/EN)
 
- **Locale files.** `locales/cz.json` and `locales/en.json` are grouped by page or section: `nav`, `hero`, `about`, `services`, `reviews`, `feed`, `contact`, `footer`, `collarPage`, `mendingPricelist`, `alterationsPricelist`, `terms`, `privacyPolicy` and `cookies`.
- **Keep the two files in exact key parity.** If a key is missing in one language, the site shows the raw key path instead of text.
- **Tagging elements.** Use `data-i18n="path.to.key"` for text, or `data-i18n-attr="attr:path.to.key"` for attributes like `alt` and `aria-label`, comma-separated if there's more than one.
- **How `i18n.js` works.** It defaults to Czech (code `"cz"`, not the ISO `"cs"`, to match the file names) and stores the choice in `poy-lang`. It sets `<html lang>` to `cs` or `en`, and fires a `poy:langchange` event on every load and every switch. The builder's price currency and catalogue names react to that event, and so does `consent.js`, which only counts a *real* change.
## Open items
 
- **Once the domain is live:**
  - Enable **Cloudflare Web Analytics**: dashboard → Web Analytics → Add a site → pick the hostname. The automatic setup applies because the domain is proxied through Cloudflare, so no snippet is needed.
  - Update the GA4 data stream URL.
  - Set up the GA4 **internal traffic** rule (`traffic_type = internal`) and data filter. Keep the filter in Testing first, then make it Active.
  - Madara and the owner visit `?poy_internal=1` on every device and browser they use.
- **GA4, after the test-run data has processed:**
  - Star `collar_order_sent` and `email_click` as key events in Admin → Events, then unstar the default `close_convert_lead` and `qualify_lead`.
  - Finish the explorations: the builder funnel (step 1 is saved; steps 2–6 are pending), service pages, and order sources.
- **`language_change` still sends a `language` parameter.** It's harmless but unused. Simplify it to `poyTrack('language_change')`.
- **Hero photos** link to `#` placeholders until portfolio pages exist.
- **`hello@atelierpoy.cz` is duplicated** across the locale files and the hard-coded `mailto:` links on several pages. The social URLs are likewise hard-coded in every footer.
- **`<title>`/meta descriptions** aren't translated.
- **Repo weight:** the HEIC/HEIF originals and `inspo/` are still committed. They aren't deployed, thanks to `.assetsignore`, but they're worth trimming if the repo is ever shared.
## Working conventions established during the build
 
- **Image edits get checked at the pixel level.** Photo and graphic work gets literal verification (crop boxes, color channels, hole detection), not eyeballing.
- **Divider spacing.** Don't put section-level `padding-bottom` directly before a `.scallop` divider, because it renders after the divider. Put that spacing on `.section .container` instead.
- **Use a headless browser for misbehaving UI.** When something "isn't clickable" or behaves oddly, run Playwright rather than reasoning about the CSS. This caught `position: sticky` elements not being reachable by anchor links.
- **Keep content that must stay attached to a sticky box inside that box**, not as a sibling next to it. That's why the price panel's delivery note sits inside `.price-details`.
- **Sticky offsets track live heights.** For example, `--header-height` is set from `header.offsetHeight`, including a `transitionend` re-check, rather than a hard-coded px value.
- **Verify every edit** to HTML, `script.js`, `consent.js` or the locale files:
  - JSON validity, plus an exact cz/en key-parity diff
  - `node --check` on the JS
  - an HTML tag-balance check
  - every `data-i18n` key resolving
  - every `getElementById()` target existing
- **Analytics edits:**
  - Send events only through `poyTrack()`.
  - Use catalogue **codes** rather than translated labels as parameter values.
  - Register any new parameter as a GA4 custom dimension.
  - Test in GA4 **Realtime** or **DebugView**, with ad blockers off and cookies accepted.