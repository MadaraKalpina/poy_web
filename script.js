// Poy — sticky header shrink + mobile nav toggle + reviews carousel.
// No framework, no build step.
document.addEventListener('DOMContentLoaded', function () {
  var header = document.querySelector('.site-header');
  if (header) {
    // the price panel's sticky offset (collars.html) reads this custom
    // property so it always sits flush under the header instead of a
    // hardcoded px guess that drifts out of sync whenever the header's
    // own height changes (e.g. the logo-shrink below)
    var updateHeaderHeight = function () {
      document.documentElement.style.setProperty('--header-height', header.offsetHeight + 'px');
    };

    // hysteresis: enter the "scrolled" (shrunk) state only past
    // SCROLL_ENTER, leave it only once scrollY drops back below
    // SCROLL_EXIT. A single hard threshold (the old `scrollY > 10`) let
    // scrollY hovering right at the boundary — trackpad momentum,
    // rubber-band overscroll, slow/sub-pixel scroll deltas — flip
    // is-scrolled on/off repeatedly within one scroll gesture, and each
    // flip restarted the CSS shrink/grow transition on the logo from
    // wherever it currently was, which is what read as the header
    // "blinking" partway through its shrink.
    var SCROLL_ENTER = 40;
    var SCROLL_EXIT = 6;
    var isScrolled = false;
    var scrollTicking = false;

    // only touch the DOM (class + the offsetHeight read below, which
    // forces a synchronous layout) when the state actually flips — not on
    // every rAF tick while scrolling. Reading window.scrollY itself is
    // free (no layout flush), but re-reading offsetHeight on every single
    // scroll frame — even the ~59 out of every 60 frames where nothing
    // about the header changed — was still forcing a reflow each time,
    // which is exactly what a slow scroll gives you enough frames to
    // actually perceive as stutter (a fast flick blows through the same
    // frames too quickly to notice).
    var applyScrollState = function () {
      var y = window.scrollY;
      if (!isScrolled && y > SCROLL_ENTER) {
        isScrolled = true;
        header.classList.add('is-scrolled');
        updateHeaderHeight();
      } else if (isScrolled && y < SCROLL_EXIT) {
        isScrolled = false;
        header.classList.remove('is-scrolled');
        updateHeaderHeight();
      }
      scrollTicking = false;
    };

    // coalesce to at most one state check per animation frame, instead of
    // once per raw scroll event — scroll fires far more often than the
    // display can paint
    var onScroll = function () {
      if (!scrollTicking) {
        scrollTicking = true;
        window.requestAnimationFrame(applyScrollState);
      }
    };

    updateHeaderHeight();
    // the logo-shrink on scroll animates via CSS transition, so the height
    // read right at toggle-time is still the pre-transition value — catch
    // the settled height once that transition finishes
    header.addEventListener('transitionend', updateHeaderHeight);
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', updateHeaderHeight);
  }

  var toggle = document.getElementById('nav-toggle');
  var nav = document.getElementById('main-nav');

  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var isOpen = nav.classList.toggle('open');
      toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });

    nav.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        nav.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  var track = document.getElementById('review-track');
  var prevBtn = document.getElementById('review-prev');
  var nextBtn = document.getElementById('review-next');
  var dotsWrap = document.getElementById('review-dots');

  if (track && prevBtn && nextBtn && dotsWrap) {
    var slides = Array.prototype.slice.call(track.querySelectorAll('.review-slide'));
    var dots = Array.prototype.slice.call(dotsWrap.querySelectorAll('.review-dot'));
    var current = 0;

    function goTo(index) {
      current = (index + slides.length) % slides.length;
      slides.forEach(function (slide, i) {
        slide.classList.toggle('is-active', i === current);
      });
      dots.forEach(function (dot, i) {
        dot.classList.toggle('is-active', i === current);
      });
      // the first review is the longest — widen just its own text block so
      // it wraps into fewer lines; the arrows sit outside this and don't move
      track.classList.toggle('is-wide', current === 0);
    }

    prevBtn.addEventListener('click', function () { goTo(current - 1); });
    nextBtn.addEventListener('click', function () { goTo(current + 1); });
    dots.forEach(function (dot, i) {
      dot.addEventListener('click', function () { goTo(i); });
    });
  }

  // Collar order page — 40mm width auto-locks hardware to silver, with
  // the other options left visible-but-disabled (not hidden). Hardware
  // inputs are looked up fresh on every call (not captured once) since
  // they're now rendered asynchronously from hardware/catalogue.json —
  // see applyWidthLock() call at the end of renderHardwareCatalogue()
  // below, which re-applies the lock once those inputs actually exist.
  var widthInputs = document.querySelectorAll('input[name="width"]');
  var applyWidthLock = null;

  if (widthInputs.length) {
    applyWidthLock = function () {
      var checked = document.querySelector('input[name="width"]:checked');
      var is40 = !!checked && checked.value === '40';
      var silverInput = document.getElementById('hardware-silver');
      document.querySelectorAll('input[name="hardware"]').forEach(function (input) {
        var card = input.closest('.hardware-chip');
        if (input === silverInput) {
          if (is40) input.checked = true;
          return;
        }
        // don't re-enable an input the catalogue itself marked out of
        // stock — only ever override the width-lock's own disabling
        if (is40) {
          input.disabled = true;
          if (card) card.classList.add('is-disabled');
        } else if (card && !card.classList.contains('is-out-of-stock')) {
          input.disabled = false;
          card.classList.remove('is-disabled');
        }
      });
    };

    widthInputs.forEach(function (input) {
      input.addEventListener('change', applyWidthLock);
    });
    applyWidthLock();
  }

  // Collar order page — hardware catalogue, fetched from
  // hardware/catalogue.json (same idea as the fabric catalogue below) so
  // the maker can add a new finish or mark one out of stock by editing
  // that one file. Only 4 items and no categories, so this is a single
  // grid with no tabs.
  var hardwareGrid = document.getElementById('hardware-grid');

  if (hardwareGrid) {
    var hardwareI18nText = function (id, fallback) {
      var el = document.getElementById(id);
      return el && el.textContent ? el.textContent : fallback;
    };

    var buildHardwareChip = function (item, lang) {
      var name = (lang === 'en' ? item.name_en : item.name_cz) || item.name_cz || item.name_en || item.code;
      var note = lang === 'en' ? item.note_en : item.note_cz;
      var isOutOfStock = item.status === 'out_of_stock';

      var chip = document.createElement('div');
      chip.className = 'hardware-chip' + (isOutOfStock ? ' is-out-of-stock' : '');

      var label = document.createElement('label');
      label.className = 'hardware-chip-select';
      label.setAttribute('for', 'hardware-' + item.code);

      var img = document.createElement('img');
      img.className = 'hardware-swatch';
      img.src = 'public/hardware/' + encodeURIComponent(item.image);
      img.alt = '';
      img.loading = 'lazy';
      label.appendChild(img);

      var nameRow = document.createElement('div');
      nameRow.className = 'hardware-name-row';

      var input = document.createElement('input');
      input.type = 'radio';
      input.name = 'hardware';
      input.id = 'hardware-' + item.code;
      input.value = item.code;
      if (isOutOfStock) input.disabled = true;
      nameRow.appendChild(input);

      var nameSpan = document.createElement('span');
      nameSpan.className = 'hardware-name';
      nameSpan.textContent = name;
      nameRow.appendChild(nameSpan);

      if (note) {
        var noteSpan = document.createElement('span');
        noteSpan.className = 'hardware-note';
        noteSpan.textContent = note;
        nameRow.appendChild(noteSpan);
      }

      if (isOutOfStock) {
        var badge = document.createElement('span');
        badge.className = 'hardware-note hardware-out-of-stock-badge';
        badge.textContent = hardwareI18nText('hardware-i18n-out-of-stock', 'Vyprodáno');
        nameRow.appendChild(badge);
      }

      label.appendChild(nameRow);
      chip.appendChild(label);
      return chip;
    };

    var hardwareCatalogueData = null;

    var renderHardwareCatalogue = function () {
      if (!hardwareCatalogueData) return;
      var lang = localStorage.getItem('poy-lang') === 'en' ? 'en' : 'cz';
      var previouslyChecked = document.querySelector('input[name="hardware"]:checked');
      var previousCode = previouslyChecked ? previouslyChecked.value : null;

      hardwareGrid.innerHTML = '';
      hardwareCatalogueData
        .filter(function (item) { return item.status !== 'hidden'; })
        .forEach(function (item) { hardwareGrid.appendChild(buildHardwareChip(item, lang)); });

      if (previousCode) {
        var restored = document.getElementById('hardware-' + previousCode);
        if (restored && !restored.disabled) restored.checked = true;
      }
      if (!document.querySelector('input[name="hardware"]:checked')) {
        // silver is the sensible default (same as the old static markup);
        // fall back to whatever's first and available if silver is missing
        // or out of stock, so a maker marking silver out of stock doesn't
        // leave hardware silently unselected
        var silverOption = document.getElementById('hardware-silver');
        var defaultInput = (silverOption && !silverOption.disabled) ? silverOption : hardwareGrid.querySelector('input[name="hardware"]:not(:disabled)');
        if (defaultInput) defaultInput.checked = true;
      }

      // re-apply the 40mm-silver lock now that hardware inputs exist —
      // matters on first render, harmless no-op on later re-renders
      if (applyWidthLock) applyWidthLock();
    };

    fetch('public/hardware/catalogue.json')
      .then(function (res) {
        if (!res.ok) throw new Error('Failed to load catalogue.json');
        return res.json();
      })
      .then(function (data) {
        hardwareCatalogueData = data;
        renderHardwareCatalogue();
      })
      .catch(function (err) {
        console.error('[hardware catalogue]', err);
        hardwareGrid.textContent = hardwareI18nText('hardware-i18n-load-error', "Couldn't load the hardware options.");
      });

    document.addEventListener('poy:langchange', renderHardwareCatalogue);
  }

  // Collar order page — fabric category tabs: one .fabric-panel visible
  // at a time, switched by clicking a .fabric-tab (replaces the old
  // per-category accordion). Selections in hidden panels aren't lost —
  // switching tabs only toggles `hidden`, same as the step navigation.
  var fabricTabs = document.querySelectorAll('.fabric-tab');
  var fabricPanels = document.querySelectorAll('.fabric-panel');

  if (fabricTabs.length && fabricPanels.length) {
    fabricTabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        var key = tab.getAttribute('data-fabric-tab');
        fabricTabs.forEach(function (t) {
          var isActive = t === tab;
          t.classList.toggle('is-active', isActive);
          t.setAttribute('aria-selected', isActive ? 'true' : 'false');
        });
        fabricPanels.forEach(function (panel) {
          panel.hidden = panel.getAttribute('data-fabric-panel') !== key;
        });
      });
    });
  }

  // Collar order page — fabric catalogue, fetched from
  // patterns/catalogue.json so the maker can add/remove/rename/mark a
  // pattern out of stock by editing that one file (see
  // public/patterns/README.md) instead of touching this page's markup.
  // Only the .fabric-grid contents are built here — the tabs and panel
  // shells above are static, so the tab-switching code above needs no
  // changes, and the lightbox (further below) just needs to use event
  // delegation instead of binding to buttons that don't exist yet.
  var fabricGrids = document.querySelectorAll('.fabric-grid[data-fabric-grid]');

  if (fabricGrids.length) {
    var fabricEnlargeIcon = '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M9 3H5a2 2 0 0 0-2 2v4M15 3h4a2 2 0 0 1 2 2v4M9 21H5a2 2 0 0 1-2-2v-4M15 21h4a2 2 0 0 0 2-2v-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    var fabricCatalogueData = null;

    var fabricI18nText = function (id, fallback) {
      var el = document.getElementById(id);
      return el && el.textContent ? el.textContent : fallback;
    };

    var buildFabricChip = function (item, lang) {
      var name = (lang === 'en' ? item.name_en : item.name_cz) || item.name_cz || item.name_en || item.code;
      var note = lang === 'en' ? item.note_en : item.note_cz;
      var isOutOfStock = item.status === 'out_of_stock';

      var chip = document.createElement('div');
      chip.className = 'fabric-chip' + (isOutOfStock ? ' is-out-of-stock' : '');

      var label = document.createElement('label');
      label.className = 'fabric-chip-select';
      label.setAttribute('for', 'fabric-' + item.code);

      var img = document.createElement('img');
      img.className = 'fabric-swatch';
      img.src = 'public/patterns/' + item.image.split('/').map(encodeURIComponent).join('/');
      img.alt = '';
      img.loading = 'lazy';
      label.appendChild(img);

      var nameRow = document.createElement('div');
      nameRow.className = 'fabric-name-row';

      var input = document.createElement('input');
      input.type = 'radio';
      input.name = 'fabric';
      input.id = 'fabric-' + item.code;
      input.value = item.code;
      if (isOutOfStock) input.disabled = true;
      nameRow.appendChild(input);

      var nameSpan = document.createElement('span');
      nameSpan.className = 'fabric-name';
      nameSpan.textContent = name;
      nameRow.appendChild(nameSpan);

      if (note) {
        var noteSpan = document.createElement('span');
        noteSpan.className = 'fabric-note';
        noteSpan.textContent = note;
        nameRow.appendChild(noteSpan);
      }

      if (isOutOfStock) {
        var badge = document.createElement('span');
        badge.className = 'fabric-note fabric-out-of-stock-badge';
        badge.textContent = fabricI18nText('fabric-i18n-out-of-stock', 'Vyprodáno');
        nameRow.appendChild(badge);
      }

      label.appendChild(nameRow);
      chip.appendChild(label);

      var enlargeBtn = document.createElement('button');
      enlargeBtn.type = 'button';
      enlargeBtn.className = 'fabric-enlarge';
      enlargeBtn.setAttribute('data-fabric-code', item.code);
      enlargeBtn.setAttribute('aria-label', fabricI18nText('fabric-i18n-enlarge', 'Zvětšit'));
      enlargeBtn.innerHTML = fabricEnlargeIcon;
      chip.appendChild(enlargeBtn);

      return chip;
    };

    var renderFabricCatalogue = function () {
      if (!fabricCatalogueData) return;
      var lang = localStorage.getItem('poy-lang') === 'en' ? 'en' : 'cz';
      var previouslyChecked = document.querySelector('input[name="fabric"]:checked');
      var previousCode = previouslyChecked ? previouslyChecked.value : null;

      // no width chosen yet (Step 1/2, before that field) shows every
      // pattern; once a width is picked, patterns whose own `widths` list
      // (set per-pattern in catalogue.json) doesn't include it disappear
      // entirely — this is a visibility rule, not an out-of-stock state
      var widthChecked = document.querySelector('input[name="width"]:checked');
      var currentWidth = widthChecked ? widthChecked.value : null;
      var availableForWidth = function (item) {
        return !currentWidth || !item.widths || !item.widths.length || item.widths.indexOf(currentWidth) > -1;
      };

      fabricGrids.forEach(function (grid) {
        var category = grid.getAttribute('data-fabric-grid');
        grid.innerHTML = '';
        var visible = fabricCatalogueData.filter(function (item) {
          return item.category === category && item.status !== 'hidden' && availableForWidth(item);
        });
        if (visible.length) {
          visible.forEach(function (item) { grid.appendChild(buildFabricChip(item, lang)); });
        } else {
          var empty = document.createElement('p');
          empty.className = 'form-note fabric-grid-empty';
          empty.textContent = fabricI18nText('fabric-i18n-empty-for-width', 'No patterns available for this width.');
          grid.appendChild(empty);
        }
      });

      if (previousCode) {
        var restored = document.getElementById('fabric-' + previousCode);
        if (restored && !restored.disabled) restored.checked = true;
      }
    };

    fetch('public/patterns/catalogue.json')
      .then(function (res) {
        if (!res.ok) throw new Error('Failed to load catalogue.json');
        return res.json();
      })
      .then(function (data) {
        fabricCatalogueData = data;
        renderFabricCatalogue();
      })
      .catch(function (err) {
        console.error('[fabric catalogue]', err);
        var message = fabricI18nText('fabric-i18n-load-error', "Couldn't load the fabric patterns.");
        fabricGrids.forEach(function (grid) { grid.textContent = message; });
      });

    // language switch re-picks name_cz/name_en (and the badge/aria-label
    // text) without a re-fetch; also fires once on initial load (see
    // i18n.js), which self-heals if this render ran before i18n's own
    // first pass finished translating the hidden reference spans above
    document.addEventListener('poy:langchange', renderFabricCatalogue);
    // width changing may add/remove which patterns are visible — the
    // width radios themselves are static, so this listener is safe to
    // attach immediately regardless of catalogue fetch timing
    document.querySelectorAll('input[name="width"]').forEach(function (input) {
      input.addEventListener('change', renderFabricCatalogue);
    });
  }

  // Collar order page — fabric lightbox. Prev/Next (buttons or the
  // left/right arrow keys) cycle through whichever category tab was open
  // when the lightbox was launched, since that's the set the customer was
  // actually looking at. Uses event delegation (not per-button binding)
  // since the enlarge buttons are added asynchronously by the catalogue
  // render above.
  var lightbox = document.getElementById('fabric-lightbox');
  var lightboxImg = document.getElementById('lightbox-img');
  var lightboxCaption = document.getElementById('lightbox-caption');
  var lightboxClose = document.getElementById('lightbox-close');
  var lightboxPrev = document.getElementById('lightbox-prev');
  var lightboxNext = document.getElementById('lightbox-next');

  if (lightbox && lightboxImg && lightboxClose && lightboxPrev && lightboxNext) {
    var lightboxItems = [];
    var lightboxIndex = 0;

    var showLightboxItem = function (index) {
      lightboxIndex = (index + lightboxItems.length) % lightboxItems.length;
      var item = lightboxItems[lightboxIndex];
      lightboxImg.src = item.src;
      lightboxImg.alt = item.name;
      lightboxCaption.textContent = item.name;
    };

    var openLightbox = function (code, panel) {
      lightboxItems = Array.prototype.slice.call(panel.querySelectorAll('.fabric-chip')).map(function (chip) {
        return {
          code: chip.querySelector('.fabric-enlarge').getAttribute('data-fabric-code'),
          src: chip.querySelector('.fabric-swatch').src,
          name: chip.querySelector('.fabric-name').textContent
        };
      });
      var startIndex = lightboxItems.findIndex(function (item) { return item.code === code; });
      showLightboxItem(startIndex > -1 ? startIndex : 0);
      lightbox.hidden = false;
      document.body.style.overflow = 'hidden';
    };

    var closeLightbox = function () {
      lightbox.hidden = true;
      document.body.style.overflow = '';
    };

    document.addEventListener('click', function (event) {
      var btn = event.target.closest('.fabric-enlarge');
      if (!btn) return;
      event.preventDefault();
      var panel = btn.closest('.fabric-panel');
      openLightbox(btn.getAttribute('data-fabric-code'), panel);
    });

    lightboxClose.addEventListener('click', closeLightbox);
    lightboxPrev.addEventListener('click', function () { showLightboxItem(lightboxIndex - 1); });
    lightboxNext.addEventListener('click', function () { showLightboxItem(lightboxIndex + 1); });

    // clicking the dark backdrop (not the image/caption/nav buttons) also closes it
    lightbox.addEventListener('click', function (event) {
      if (event.target === lightbox) closeLightbox();
    });

    document.addEventListener('keydown', function (event) {
      if (lightbox.hidden) return;
      if (event.key === 'Escape') closeLightbox();
      else if (event.key === 'ArrowLeft') showLightboxItem(lightboxIndex - 1);
      else if (event.key === 'ArrowRight') showLightboxItem(lightboxIndex + 1);
    });
  }

  // Collar order page — nametag "with" reveals the extra fields below
  var nametagInputs = document.querySelectorAll('input[name="nametagChoice"]');
  var nametagDetails = document.getElementById('nametag-details');

  if (nametagInputs.length && nametagDetails) {
    var applyNametagToggle = function () {
      var checked = document.querySelector('input[name="nametagChoice"]:checked');
      nametagDetails.hidden = !checked || checked.value !== 'with';
    };
    nametagInputs.forEach(function (input) {
      input.addEventListener('change', applyNametagToggle);
    });
    applyNametagToggle();
  }

  // Collar order page — nametag sub-choices (background, embroidery color,
  // embroidery font) each reveal a free-text field when "custom" is picked
  var setupCustomToggle = function (radioName, detailId) {
    var inputs = document.querySelectorAll('input[name="' + radioName + '"]');
    var detail = document.getElementById(detailId);
    if (!inputs.length || !detail) return;
    var apply = function () {
      var checked = document.querySelector('input[name="' + radioName + '"]:checked');
      detail.hidden = !checked || checked.value !== 'custom';
    };
    inputs.forEach(function (input) {
      input.addEventListener('change', apply);
    });
    apply();
  };

  setupCustomToggle('nametagBackground', 'nametag-bg-custom-detail');
  setupCustomToggle('embroideryColor', 'embroidery-color-custom-detail');
  setupCustomToggle('nametagFont', 'nametag-font-custom-detail');

  // Collar order page — each shipping option reveals its own address field:
  // Balíkovna home delivery needs a street address, while Zásilkovna and
  // Balíkovna's own pickup-point option each need that network's pickup
  // point address instead; plain pickup needs none of them.
  var deliveryInputs = document.querySelectorAll('input[name="delivery"]');
  var deliveryAddressField = document.getElementById('delivery-address-field');
  var deliveryZasilkovnaPointField = document.getElementById('delivery-zasilkovna-point-field');
  var deliveryBalikovnaPointField = document.getElementById('delivery-balikovna-point-field');

  if (deliveryInputs.length && deliveryAddressField && deliveryZasilkovnaPointField && deliveryBalikovnaPointField) {
    var applyDeliveryAddressToggle = function () {
      var checked = document.querySelector('input[name="delivery"]:checked');
      var value = checked ? checked.value : 'pickup';
      deliveryAddressField.hidden = value !== 'balikovna_home';
      deliveryZasilkovnaPointField.hidden = value !== 'zasilkovna';
      deliveryBalikovnaPointField.hidden = value !== 'balikovna_box';
    };
    deliveryInputs.forEach(function (input) {
      input.addEventListener('change', applyDeliveryAddressToggle);
    });
    applyDeliveryAddressToggle();
  }

  // Collar order page — live price panel. Visible from Step 1 onward, so
  // it has to cope with no width being chosen yet (that field lives on
  // Step 2) — shows a "from 500 Kč" placeholder in that case rather than
  // silently assuming 25mm.
  var priceBase = document.getElementById('price-base');
  var priceTotal = document.getElementById('price-total');
  var priceCurrency = document.getElementById('price-currency');
  var priceFrom = document.getElementById('price-from');
  var priceLineNametag = document.getElementById('price-line-nametag');
  var priceNametag = document.getElementById('price-nametag');
  var priceLineDelivery = document.getElementById('price-line-delivery');
  var priceDelivery = document.getElementById('price-delivery');

  if (priceBase && priceTotal && priceCurrency) {
    var WIDTH_BASE_PRICE = { '25': 500, '40': 600 };
    var NAMETAG_PRICE = 100;
    var DELIVERY_PRICE = { pickup: 0, zasilkovna: 89, balikovna_home: 109, balikovna_box: 79 };

    var formatPrice = function (amount, withSign) {
      var currency = priceCurrency.textContent;
      var sign = withSign && amount > 0 ? '+' : '';
      return sign + amount + ' ' + currency;
    };

    var updatePrice = function () {
      var widthChecked = document.querySelector('input[name="width"]:checked');

      if (!widthChecked) {
        var minBase = Math.min(WIDTH_BASE_PRICE['25'], WIDTH_BASE_PRICE['40']);
        priceBase.textContent = '—';
        priceLineNametag.hidden = true;
        priceLineDelivery.hidden = true;
        priceTotal.textContent = (priceFrom ? priceFrom.textContent + ' ' : '') + formatPrice(minBase, false);
        return;
      }

      var nametagChecked = document.querySelector('input[name="nametagChoice"]:checked');
      var deliveryChecked = document.querySelector('input[name="delivery"]:checked');

      var base = WIDTH_BASE_PRICE[widthChecked.value] || 0;
      var hasNametag = !!nametagChecked && nametagChecked.value === 'with';
      var nametagCost = hasNametag ? NAMETAG_PRICE : 0;
      var deliveryCost = DELIVERY_PRICE[deliveryChecked ? deliveryChecked.value : 'pickup'] || 0;
      var total = base + nametagCost + deliveryCost;

      priceBase.textContent = formatPrice(base, false);
      priceLineNametag.hidden = !hasNametag;
      priceNametag.textContent = formatPrice(nametagCost, true);
      priceLineDelivery.hidden = deliveryCost <= 0;
      priceDelivery.textContent = formatPrice(deliveryCost, true);
      priceTotal.textContent = formatPrice(total, false);
    };

    document.querySelectorAll('input[name="width"], input[name="nametagChoice"], input[name="delivery"]').forEach(function (input) {
      input.addEventListener('change', updatePrice);
    });
    // currency suffix (Kč/CZK) comes from a data-i18n span, so re-read it
    // whenever the language switch finishes applying new strings
    document.addEventListener('poy:langchange', updatePrice);
    updatePrice();
  }

  // Collar order page — mobile price panel collapses to just the total;
  // the toggle button expands/collapses the breakdown. Desktop ignores
  // this (see .price-details[hidden] { display: block } override).
  var priceToggle = document.getElementById('price-toggle');
  var priceDetails = document.getElementById('price-details');
  var pricePanel = document.getElementById('price-panel');

  if (priceToggle && priceDetails && pricePanel) {
    priceToggle.addEventListener('click', function () {
      var expanded = !priceDetails.hidden;
      priceDetails.hidden = expanded;
      priceToggle.setAttribute('aria-expanded', expanded ? 'false' : 'true');
      pricePanel.setAttribute('data-expanded', expanded ? 'false' : 'true');
    });
  }

  // Collar order page — validation, split one function per step so Next
  // only checks the fields the customer can currently see. Inline errors
  // next to each field, not a generic top-of-page message. Submission goes
  // to a Google Apps Script Web App (see apps-script/Code.gs in this repo
  // for the script to deploy) which appends a row to the order Sheet and
  // sends the notification emails — replace the placeholder URL/token below
  // once that's deployed.
  var orderForm = document.getElementById('collar-order-form');
  var APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzXN-QtbUgBsNnLDC7bFrGixRv2uhyhDkHDop7JbB91GA_OxgfzOY3JCNp5l2vlT7rn/exec';
  var APPS_SCRIPT_TOKEN = 'poy-collar-order-form';

  if (orderForm) {
    var setFieldError = function (input, errorEl, isInvalid) {
      if (errorEl) errorEl.hidden = !isInvalid;
      if (input) {
        input.classList.toggle('is-invalid', isInvalid);
        input.setAttribute('aria-invalid', isInvalid ? 'true' : 'false');
      }
    };

    var setGroupError = function (container, errorEl, isInvalid) {
      if (errorEl) errorEl.hidden = !isInvalid;
      if (container) container.classList.toggle('is-invalid', isInvalid);
    };

    // Step 1 — dog's neck circumference + breed
    // both fields are optional — the only thing still checked is that a
    // neck circumference, if the customer bothers to type one, is a sane
    // positive number rather than 0/negative
    var validateStep1 = function () {
      var firstInvalid = null;
      var markInvalid = function (el) { if (!firstInvalid && el) firstInvalid = el; };

      var neckInput = document.getElementById('neck-circumference');
      var neckValue = neckInput.value.trim();
      var neckInvalid = neckValue !== '' && Number(neckValue) <= 0;
      setFieldError(neckInput, document.getElementById('error-neck-circumference'), neckInvalid);
      if (neckInvalid) markInvalid(neckInput);

      return firstInvalid;
    };

    // Step 2 — width, hardware, fabric (nametag moved to its own step 3)
    var validateStep2 = function () {
      var firstInvalid = null;
      var markInvalid = function (el) { if (!firstInvalid && el) firstInvalid = el; };

      var widthChecked = document.querySelector('input[name="width"]:checked');
      var widthSection = document.getElementById('section-width');
      var widthInvalid = !widthChecked;
      setGroupError(widthSection, document.getElementById('error-width'), widthInvalid);
      if (widthInvalid) markInvalid(widthSection);

      var hardwareChecked = document.querySelector('input[name="hardware"]:checked');
      var hardwareSection = document.getElementById('section-hardware');
      var hardwareInvalid = !hardwareChecked;
      setGroupError(hardwareSection, document.getElementById('error-hardware'), hardwareInvalid);
      if (hardwareInvalid) markInvalid(hardwareSection);

      var fabricChecked = document.querySelector('input[name="fabric"]:checked');
      var fabricSection = document.getElementById('section-fabric');
      var fabricInvalid = !fabricChecked;
      setGroupError(fabricSection, document.getElementById('error-fabric'), fabricInvalid);
      if (fabricInvalid) markInvalid(fabricSection);

      return firstInvalid;
    };

    // Step 3 — nametag (its sub-fields only required if toggled on)
    var validateStep3 = function () {
      var firstInvalid = null;
      var markInvalid = function (el) { if (!firstInvalid && el) firstInvalid = el; };

      var nametagChecked = document.querySelector('input[name="nametagChoice"]:checked');
      var hasNametag = !!nametagChecked && nametagChecked.value === 'with';
      var nametagTextInput = document.getElementById('nametag-text');
      var nametagTextInvalid = hasNametag && !nametagTextInput.value.trim();
      setFieldError(nametagTextInput, document.getElementById('error-nametag-text'), nametagTextInvalid);
      if (nametagTextInvalid) markInvalid(nametagTextInput);

      var validateCustomTextField = function (radioName, textInputId, errorId) {
        var checked = document.querySelector('input[name="' + radioName + '"]:checked');
        var isCustom = hasNametag && !!checked && checked.value === 'custom';
        var textInput = document.getElementById(textInputId);
        var invalid = isCustom && !textInput.value.trim();
        setFieldError(textInput, document.getElementById(errorId), invalid);
        if (invalid) markInvalid(textInput);
      };

      validateCustomTextField('nametagBackground', 'nametag-bg-text', 'error-nametag-bg-text');
      validateCustomTextField('embroideryColor', 'embroidery-color-text', 'error-embroidery-color-text');
      validateCustomTextField('nametagFont', 'nametag-font-text', 'error-nametag-font-text');

      return firstInvalid;
    };

    // Step 4 — delivery, contact (name + at least one of email/instagram/phone)
    var validateStep4 = function () {
      var firstInvalid = null;
      var markInvalid = function (el) { if (!firstInvalid && el) firstInvalid = el; };

      var deliveryChecked = document.querySelector('input[name="delivery"]:checked');
      var deliverySection = document.getElementById('section-delivery');
      var deliveryInvalid = !deliveryChecked;
      setGroupError(deliverySection, document.getElementById('error-delivery'), deliveryInvalid);
      if (deliveryInvalid) markInvalid(deliverySection);

      // each shipping option that needs an address checks its own field
      var validateDeliveryAddressField = function (deliveryValue, inputId, errorId) {
        var needed = !!deliveryChecked && deliveryChecked.value === deliveryValue;
        var input = document.getElementById(inputId);
        var invalid = needed && !input.value.trim();
        setFieldError(input, document.getElementById(errorId), invalid);
        if (invalid) markInvalid(input);
      };

      validateDeliveryAddressField('balikovna_home', 'delivery-address', 'error-delivery-address');
      validateDeliveryAddressField('zasilkovna', 'delivery-zasilkovna-point', 'error-delivery-zasilkovna-point');
      validateDeliveryAddressField('balikovna_box', 'delivery-balikovna-point', 'error-delivery-balikovna-point');

      // name, email and phone are always required (checkValidity() still
      // works with novalidate on the form — that attribute only suppresses
      // the native UI/blocking, not the underlying constraint API, and
      // catches both "empty" and "malformed" via the input's own
      // required+type=email constraints); Instagram stays optional.
      var nameInput = document.getElementById('contact-name');
      var nameInvalid = !nameInput.value.trim();
      setFieldError(nameInput, document.getElementById('error-contact-name'), nameInvalid);
      if (nameInvalid) markInvalid(nameInput);

      var emailInput = document.getElementById('contact-email');
      var emailInvalid = !emailInput.checkValidity();
      setFieldError(emailInput, document.getElementById('error-contact-email'), emailInvalid);
      if (emailInvalid) markInvalid(emailInput);

      var phoneInput = document.getElementById('contact-phone');
      var phoneInvalid = !phoneInput.value.trim();
      setFieldError(phoneInput, document.getElementById('error-contact-phone'), phoneInvalid);
      if (phoneInvalid) markInvalid(phoneInput);

      return firstInvalid;
    };

    var stepValidators = { 1: validateStep1, 2: validateStep2, 3: validateStep3, 4: validateStep4 };
    var attemptedSteps = {};
    var currentStep = 1;

    var focusInvalid = function (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      if (typeof el.focus === 'function') el.focus({ preventScroll: true });
    };

    // Step navigation — every selection lives in the same <form> the whole
    // time, so going back and forth never loses anything; only which
    // .form-step is `hidden` changes.
    var formSteps = Array.prototype.slice.call(document.querySelectorAll('.form-step'));
    var stepProgressItems = Array.prototype.slice.call(document.querySelectorAll('.step-progress-item'));

    var showStep = function (n) {
      currentStep = n;
      formSteps.forEach(function (stepEl) {
        stepEl.hidden = Number(stepEl.getAttribute('data-step')) !== n;
      });
      stepProgressItems.forEach(function (item) {
        var num = Number(item.getAttribute('data-step-progress'));
        item.classList.toggle('is-complete', num < n);
        item.classList.toggle('is-current', num === n);
      });
      var activeStep = document.getElementById('form-step-' + n);
      if (activeStep) activeStep.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    document.querySelectorAll('[data-step-next]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var stepEl = btn.closest('.form-step');
        var num = Number(stepEl.getAttribute('data-step'));
        attemptedSteps[num] = true;
        var firstInvalid = stepValidators[num] ? stepValidators[num]() : null;
        if (firstInvalid) { focusInvalid(firstInvalid); return; }
        showStep(num + 1);
      });
    });

    document.querySelectorAll('[data-step-back]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var stepEl = btn.closest('.form-step');
        var num = Number(stepEl.getAttribute('data-step'));
        showStep(num - 1);
      });
    });

    // Gathers every field into one plain object for the Apps Script POST —
    // reads the same ids/names the validators above already reference, plus
    // the checked option's visible label text for hardware/fabric (not just
    // its catalogue code) so the Sheet reads like the order the customer
    // actually saw, in whichever language they had the site set to.
    var getFieldValue = function (id) {
      var el = document.getElementById(id);
      return el ? el.value.trim() : '';
    };
    var getCheckedValue = function (name) {
      var checked = document.querySelector('input[name="' + name + '"]:checked');
      return checked ? checked.value : '';
    };
    var getCheckedLabel = function (name, chipClass, nameClass) {
      var checked = document.querySelector('input[name="' + name + '"]:checked');
      if (!checked) return '';
      var chip = checked.closest('.' + chipClass);
      var nameEl = chip ? chip.querySelector('.' + nameClass) : null;
      return nameEl ? nameEl.textContent.trim() : checked.value;
    };

    var collectOrderPayload = function () {
      var instagramRaw = getFieldValue('contact-instagram');
      var instagram = instagramRaw.replace(/^@/, '').length > 0 ? instagramRaw : '';

      return {
        token: APPS_SCRIPT_TOKEN,
        lang: localStorage.getItem('poy-lang') || 'cz',
        neckCircumference: getFieldValue('neck-circumference'),
        breed: getFieldValue('dog-breed'),
        width: getCheckedValue('width'),
        hardware: getCheckedLabel('hardware', 'hardware-chip', 'hardware-name'),
        fabric: getCheckedLabel('fabric', 'fabric-chip', 'fabric-name'),
        nametagChoice: getCheckedValue('nametagChoice'),
        nametagText: getFieldValue('nametag-text'),
        nametagBackground: getCheckedValue('nametagBackground'),
        nametagBackgroundText: getFieldValue('nametag-bg-text'),
        embroideryColor: getCheckedValue('embroideryColor'),
        embroideryColorText: getFieldValue('embroidery-color-text'),
        nametagFont: getCheckedValue('nametagFont'),
        nametagFontText: getFieldValue('nametag-font-text'),
        delivery: getCheckedValue('delivery'),
        deliveryAddress: getFieldValue('delivery-address'),
        deliveryZasilkovnaPoint: getFieldValue('delivery-zasilkovna-point'),
        deliveryBalikovnaPoint: getFieldValue('delivery-balikovna-point'),
        contactName: getFieldValue('contact-name'),
        contactEmail: getFieldValue('contact-email'),
        contactPhone: getFieldValue('contact-phone'),
        contactInstagram: instagram,
        notes: getFieldValue('order-notes')
      };
    };

    orderForm.addEventListener('submit', function (event) {
      event.preventDefault();
      attemptedSteps[4] = true;
      var firstInvalid = validateStep4();
      if (firstInvalid) { focusInvalid(firstInvalid); return; }

      var submitButton = document.getElementById('submit-button');
      var submitError = document.getElementById('error-submit');
      var orderSuccess = document.getElementById('order-success');
      var pricePanel = document.getElementById('price-panel');

      if (submitButton) {
        submitButton.disabled = true;
        submitButton.classList.add('is-loading');
      }
      if (submitError) submitError.hidden = true;

      fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        // text/plain keeps this a CORS "simple request" so the browser skips
        // a preflight OPTIONS call, which Apps Script Web Apps don't handle —
        // the body is still JSON and Code.gs parses it as such regardless of
        // the declared content-type.
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(collectOrderPayload())
      })
        .then(function (res) { return res.json(); })
        .then(function (data) {
          if (!data || !data.ok) throw new Error('submission rejected');
          orderForm.hidden = true;
          if (pricePanel) pricePanel.hidden = true;
          if (orderSuccess) orderSuccess.hidden = false;
        })
        .catch(function () {
          if (submitButton) {
            submitButton.disabled = false;
            submitButton.classList.remove('is-loading');
          }
          if (submitError) submitError.hidden = false;
        });
    });

    // once the customer has tried to advance past a step, keep its errors
    // in sync live as they fix fields, instead of making them click Next/
    // Send again to see the error clear
    orderForm.addEventListener('input', function () {
      if (attemptedSteps[currentStep] && stepValidators[currentStep]) stepValidators[currentStep]();
    });
    orderForm.addEventListener('change', function () {
      if (attemptedSteps[currentStep] && stepValidators[currentStep]) stepValidators[currentStep]();
    });
  }
});
