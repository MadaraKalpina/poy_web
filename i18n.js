// Poy — lightweight CZ/EN language switcher.
// Plain fetch + localStorage, no build step, no framework — mirrors the
// intent of a React Context provider but adapted to this site's static
// HTML/CSS/vanilla-JS setup (there are no components to wire a Provider
// into). Requires the page to be served over http(s) — fetch() of local
// JSON files is blocked by browsers when index.html is opened directly
// via file://, so use a local server (e.g. `python3 -m http.server`) to
// preview; GitHub Pages serves over https and works fine.

(function () {
  var STORAGE_KEY = 'poy-lang';
  var DEFAULT_LANG = 'cz';
  var cache = {};

  function resolvePath(obj, path) {
    return path.split('.').reduce(function (acc, key) {
      return acc && acc[key] !== undefined ? acc[key] : undefined;
    }, obj);
  }

  function loadLang(lang) {
    if (cache[lang]) return Promise.resolve(cache[lang]);
    return fetch('locales/' + lang + '.json')
      .then(function (res) {
        if (!res.ok) throw new Error('Failed to load locales/' + lang + '.json');
        return res.json();
      })
      .then(function (data) {
        cache[lang] = data;
        return data;
      });
  }

  function applyStrings(strings) {
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      var value = resolvePath(strings, el.getAttribute('data-i18n'));
      if (value !== undefined) el.textContent = value;
    });

    document.querySelectorAll('[data-i18n-attr]').forEach(function (el) {
      el.getAttribute('data-i18n-attr').split(',').forEach(function (pair) {
        var parts = pair.split(':');
        var attr = parts[0].trim();
        var key = parts[1].trim();
        var value = resolvePath(strings, key);
        if (value !== undefined) el.setAttribute(attr, value);
      });
    });
  }

  function closeAllMenus() {
    document.querySelectorAll('.lang-switch.open').forEach(function (el) {
      el.classList.remove('open');
      el.querySelector('.lang-switch-trigger').setAttribute('aria-expanded', 'false');
    });
  }

  function updateToggleUI(lang) {
    document.querySelectorAll('.lang-switch').forEach(function (switcher) {
      switcher.querySelector('.lang-switch-current').textContent = lang.toUpperCase();
      switcher.querySelectorAll('.lang-switch-option').forEach(function (opt) {
        opt.classList.toggle('is-current', opt.getAttribute('data-lang') === lang);
      });
    });
    document.documentElement.setAttribute('lang', lang === 'cz' ? 'cs' : 'en');
  }

  function setLang(lang) {
    loadLang(lang)
      .then(function (strings) {
        applyStrings(strings);
        updateToggleUI(lang);
        localStorage.setItem(STORAGE_KEY, lang);
      })
      .catch(function (err) {
        console.error('[i18n] could not switch language:', err);
      });
  }

  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('.lang-switch').forEach(function (switcher) {
      var trigger = switcher.querySelector('.lang-switch-trigger');
      trigger.addEventListener('click', function (e) {
        e.stopPropagation();
        var willOpen = !switcher.classList.contains('open');
        closeAllMenus();
        if (willOpen) {
          switcher.classList.add('open');
          trigger.setAttribute('aria-expanded', 'true');
        }
      });
      switcher.querySelectorAll('.lang-switch-option').forEach(function (opt) {
        opt.addEventListener('click', function () {
          setLang(opt.getAttribute('data-lang'));
          closeAllMenus();
        });
      });
    });

    document.addEventListener('click', closeAllMenus);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') closeAllMenus();
    });

    var saved = localStorage.getItem(STORAGE_KEY);
    var initialLang = saved === 'cz' || saved === 'en' ? saved : DEFAULT_LANG;
    setLang(initialLang);
  });
})();
