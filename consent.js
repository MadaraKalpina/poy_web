// Poy — cookie consent banner + Google Analytics 4.
// Czech law (and the EU ePrivacy rules) only allow analytics cookies after
// the visitor actively opts in, so GA's script isn't even downloaded until
// they click "Accept" — no cookies, no requests to Google before that.
// The choice is remembered in localStorage; the footer's "Cookie settings"
// button (data-cookie-settings) reopens the banner to change it.
//
// Loaded on every page *before* script.js / i18n.js, so the banner markup
// below is already in the DOM when i18n.js applies the CZ/EN strings.
// Other scripts can report events via window.poyTrack(name, params) — it's
// a no-op unless the visitor has accepted. Site-wide events (language
// switch, email/social clicks) are sent from here; the collar builder's
// events live in script.js. See the GA4 tracking plan for the full list.

(function () {
  var GA_MEASUREMENT_ID = 'G-61J2CK17V7';
  var STORAGE_KEY = 'poy-cookie-consent'; // 'granted' | 'denied'

  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = gtag;

  // Consent Mode defaults — everything off until the visitor says yes. Ads
  // storage stays denied for good: the site doesn't run ads.
  gtag('consent', 'default', {
    analytics_storage: 'denied',
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied'
  });

  // the choice made on this page wins over storage, so it still applies
  // when localStorage is blocked (some private windows)
  var pageChoice = null;
  function readChoice() {
    if (pageChoice) return pageChoice;
    try { return localStorage.getItem(STORAGE_KEY); } catch (e) { return null; }
  }
  function saveChoice(choice) {
    pageChoice = choice;
    try { localStorage.setItem(STORAGE_KEY, choice); } catch (e) { /* private mode — banner just shows again next visit */ }
  }

  // Internal-traffic flag — the owners visit ?poy_internal=1 once per
  // device/browser (?poy_internal=0 undoes it), and from then on their hits
  // carry traffic_type=internal, which GA4's "Internal Traffic" data filter
  // drops. Works on any network, unlike an IP-based rule.
  var INTERNAL_KEY = 'poy-internal';
  try {
    var internalParam = new URLSearchParams(location.search).get('poy_internal');
    if (internalParam === '1') localStorage.setItem(INTERNAL_KEY, '1');
    else if (internalParam === '0') localStorage.removeItem(INTERNAL_KEY);
  } catch (e) { /* no storage — just not flagged */ }
  function isInternal() {
    try { return localStorage.getItem(INTERNAL_KEY) === '1'; } catch (e) { return false; }
  }

  // site language as i18n.js stores it ('cz' default) — sent as the
  // site_language user property, separate from the browser's own language
  function currentLang() {
    try { return localStorage.getItem('poy-lang') === 'en' ? 'en' : 'cz'; } catch (e) { return 'cz'; }
  }

  var gaLoaded = false;
  function loadAnalytics() {
    gtag('consent', 'update', { analytics_storage: 'granted' });
    if (gaLoaded) return;
    gaLoaded = true;
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_MEASUREMENT_ID;
    document.head.appendChild(s);
    gtag('js', new Date());
    var config = { user_properties: { site_language: currentLang() } };
    if (isInternal()) config.traffic_type = 'internal';
    gtag('config', GA_MEASUREMENT_ID, config);
  }

  // withdrawing consent: tell GA to stop and remove the cookies it set
  // (_ga, _ga_<id>) on this domain and its parent domain
  function disableAnalytics() {
    gtag('consent', 'update', { analytics_storage: 'denied' });
    var host = location.hostname;
    var domains = ['', host, '.' + host, '.' + host.replace(/^www\./, '')];
    document.cookie.split(';').forEach(function (c) {
      var name = c.split('=')[0].trim();
      if (name === '_ga' || name.indexOf('_ga_') === 0 || name === '_gid') {
        domains.forEach(function (d) {
          document.cookie = name + '=; Max-Age=0; path=/' + (d ? '; domain=' + d : '');
        });
      }
    });
  }

  // Events from before the visitor has chosen (e.g. someone landing on the
  // builder from Instagram who starts typing before touching the banner)
  // wait here, in memory only — sent on Accept, thrown away on Reject, and
  // gone if they leave the page undecided. Nothing reaches Google first.
  var pendingEvents = [];
  var MAX_PENDING = 50;

  window.poyTrack = function (eventName, params) {
    var choice = readChoice();
    if (choice === 'granted') gtag('event', eventName, params || {});
    else if (choice !== 'denied' && pendingEvents.length < MAX_PENDING) {
      pendingEvents.push([eventName, params || {}]);
    }
  };

  function flushPendingEvents() {
    pendingEvents.forEach(function (ev) { gtag('event', ev[0], ev[1]); });
    pendingEvents = [];
  }

  // Language switches. i18n.js fires poy:langchange on every page load too
  // (applying the saved language), so only a real change counts.
  var lastLang = currentLang();
  document.addEventListener('poy:langchange', function (e) {
    var lang = e.detail && e.detail.lang;
    if (!lang || lang === lastLang) return;
    lastLang = lang;
    // undecided visitors: the config sent on Accept already reads the
    // current language, so only the event itself needs holding
    if (readChoice() === 'granted') gtag('set', 'user_properties', { site_language: lang });
    window.poyTrack('language_change', { language: lang });
  });

  // Email + social link clicks, for all pages from one listener. Where the
  // click happened comes from a data-track-location attribute on the link
  // (or an ancestor), else the footer, else the nearest section's id.
  var SOCIAL_PLATFORMS = { 'instagram.com': 'instagram', 'facebook.com': 'facebook', 'tiktok.com': 'tiktok' };

  function linkLocation(link) {
    var tagged = link.closest('[data-track-location]');
    if (tagged) return tagged.getAttribute('data-track-location');
    if (link.closest('footer')) return 'footer';
    var section = link.closest('section[id]');
    return section ? section.id : 'other';
  }

  document.addEventListener('click', function (e) {
    var link = e.target.closest && e.target.closest('a[href]');
    if (!link) return;
    var href = link.getAttribute('href');
    if (href.indexOf('mailto:') === 0) {
      window.poyTrack('email_click', { link_location: linkLocation(link) });
      return;
    }
    var host = link.hostname ? link.hostname.replace(/^www\./, '') : '';
    var platform = SOCIAL_PLATFORMS[host];
    if (platform) window.poyTrack('social_click', { platform: platform, link_location: linkLocation(link) });
  });

  // Banner markup — both buttons deliberately look the same (rejecting has
  // to be as easy as accepting). Czech defaults (the site's default language), swapped
  // for the active language by i18n.js via data-i18n like everything else.
  var banner = document.createElement('div');
  banner.className = 'cookie-banner';
  banner.id = 'cookie-banner';
  banner.setAttribute('role', 'dialog');
  banner.setAttribute('aria-live', 'polite');
  banner.setAttribute('aria-labelledby', 'cookie-banner-title');
  banner.hidden = true;
  banner.innerHTML =
    '<p class="cookie-banner-title" id="cookie-banner-title" data-i18n="cookies.title">Cookies 🍪</p>' +
    '<p class="cookie-banner-text">' +
      '<span data-i18n="cookies.text">Rádi bychom používali analytické cookies (Google Analytics), abychom věděli, jak web používáte, a mohli ho zlepšovat. Bez vašeho souhlasu je nespustíme.</span> ' +
      '<a href="privacy.html#cookies" data-i18n="cookies.moreLink">Více informací</a>' +
    '</p>' +
    '<div class="cookie-banner-actions">' +
      '<button type="button" class="btn btn-navy cookie-btn" data-cookie-choice="denied" data-i18n="cookies.reject">Odmítnout</button>' +
      '<button type="button" class="btn btn-navy cookie-btn" data-cookie-choice="granted" data-i18n="cookies.accept">Přijmout</button>' +
    '</div>';
  document.body.appendChild(banner);

  function showBanner() { banner.hidden = false; }
  function hideBanner() { banner.hidden = true; }

  banner.querySelectorAll('[data-cookie-choice]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var choice = btn.getAttribute('data-cookie-choice');
      saveChoice(choice);
      if (choice === 'granted') {
        loadAnalytics();
        flushPendingEvents();
      } else {
        pendingEvents = [];
        disableAnalytics();
      }
      hideBanner();
    });
  });

  document.addEventListener('click', function (e) {
    var trigger = e.target.closest && e.target.closest('[data-cookie-settings]');
    if (!trigger) return;
    e.preventDefault();
    showBanner();
    var focusTarget = banner.querySelector('[data-cookie-choice="granted"]');
    if (focusTarget) focusTarget.focus();
  });

  var choice = readChoice();
  if (choice === 'granted') loadAnalytics();
  else if (choice !== 'denied') showBanner();
})();
