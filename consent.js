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
// a no-op unless the visitor has accepted.

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

  function readChoice() {
    try { return localStorage.getItem(STORAGE_KEY); } catch (e) { return null; }
  }
  function saveChoice(choice) {
    try { localStorage.setItem(STORAGE_KEY, choice); } catch (e) { /* private mode — banner just shows again next visit */ }
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
    gtag('config', GA_MEASUREMENT_ID);
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

  window.poyTrack = function (eventName, params) {
    if (readChoice() === 'granted') gtag('event', eventName, params || {});
  };

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
      if (choice === 'granted') loadAnalytics(); else disableAnalytics();
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
