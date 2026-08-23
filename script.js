// Poy — sticky header shrink + mobile nav toggle + reviews carousel.
// No framework, no build step.
document.addEventListener('DOMContentLoaded', function () {
  var header = document.querySelector('.site-header');
  if (header) {
    var updateScrolled = function () {
      header.classList.toggle('is-scrolled', window.scrollY > 10);
    };
    updateScrolled();
    window.addEventListener('scroll', updateScrolled, { passive: true });
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
  // the other options left visible-but-disabled (not hidden) alongside
  // the note explaining why, per the brief.
  var widthInputs = document.querySelectorAll('input[name="width"]');
  var hardwareInputs = document.querySelectorAll('input[name="hardware"]');
  var widthLockNote = document.getElementById('width-lock-note');

  if (widthInputs.length && hardwareInputs.length && widthLockNote) {
    var silverInput = document.getElementById('hardware-silver');

    var applyWidthLock = function () {
      var checked = document.querySelector('input[name="width"]:checked');
      var is40 = !!checked && checked.value === '40';
      widthLockNote.hidden = !is40;
      hardwareInputs.forEach(function (input) {
        var card = input.closest('.option-card');
        if (input === silverInput) {
          if (is40) input.checked = true;
          return;
        }
        input.disabled = is40;
        if (card) card.classList.toggle('is-disabled', is40);
      });
    };

    widthInputs.forEach(function (input) {
      input.addEventListener('change', applyWidthLock);
    });
    applyWidthLock();
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

  // Collar order page — fabric lightbox. Prev/Next (buttons or the
  // left/right arrow keys) cycle through whichever category tab was open
  // when the lightbox was launched, since that's the set the customer was
  // actually looking at.
  var fabricEnlargeButtons = document.querySelectorAll('.fabric-enlarge');
  var lightbox = document.getElementById('fabric-lightbox');
  var lightboxImg = document.getElementById('lightbox-img');
  var lightboxCaption = document.getElementById('lightbox-caption');
  var lightboxClose = document.getElementById('lightbox-close');
  var lightboxPrev = document.getElementById('lightbox-prev');
  var lightboxNext = document.getElementById('lightbox-next');

  if (fabricEnlargeButtons.length && lightbox && lightboxImg) {
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

    fabricEnlargeButtons.forEach(function (btn) {
      btn.addEventListener('click', function (event) {
        event.preventDefault();
        var panel = btn.closest('.fabric-panel');
        openLightbox(btn.getAttribute('data-fabric-code'), panel);
      });
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

  // Collar order page — shipping (Balíkovna/Zásilkovna) reveals an address
  // field; pickup needs no address so it stays hidden for that option
  var deliveryInputs = document.querySelectorAll('input[name="delivery"]');
  var deliveryAddressField = document.getElementById('delivery-address-field');

  if (deliveryInputs.length && deliveryAddressField) {
    var applyDeliveryAddressToggle = function () {
      var checked = document.querySelector('input[name="delivery"]:checked');
      deliveryAddressField.hidden = !checked || checked.value === 'pickup';
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
    var DELIVERY_PRICE = { pickup: 0, balikovna: 79, zasilkovna: 89 };

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
  // next to each field, not a generic top-of-page message. No submission
  // wiring yet: a clean Step 3 submit just falls through with a comment
  // marking where Stage 5 (EmailJS / Google Sheets) hooks in.
  var orderForm = document.getElementById('collar-order-form');

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

    // Step 2 — width, hardware, fabric, nametag (its sub-fields only if toggled on)
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

      var nametagChecked = document.querySelector('input[name="nametagChoice"]:checked');
      var hasNametag = !!nametagChecked && nametagChecked.value === 'with';
      var nametagTextInput = document.getElementById('nametag-text');
      var nametagTextInvalid = hasNametag && !nametagTextInput.value.trim();
      setFieldError(nametagTextInput, document.getElementById('error-nametag-text'), nametagTextInvalid);
      if (nametagTextInvalid) markInvalid(nametagTextInput);

      return firstInvalid;
    };

    // Step 3 — delivery, contact (name + at least one of email/instagram/phone)
    var validateStep3 = function () {
      var firstInvalid = null;
      var markInvalid = function (el) { if (!firstInvalid && el) firstInvalid = el; };

      var deliveryChecked = document.querySelector('input[name="delivery"]:checked');
      var deliverySection = document.getElementById('section-delivery');
      var deliveryInvalid = !deliveryChecked;
      setGroupError(deliverySection, document.getElementById('error-delivery'), deliveryInvalid);
      if (deliveryInvalid) markInvalid(deliverySection);

      // shipping (not pickup) needs somewhere to actually ship to
      var needsAddress = !!deliveryChecked && deliveryChecked.value !== 'pickup';
      var addressInput = document.getElementById('delivery-address');
      var addressInvalid = needsAddress && !addressInput.value.trim();
      setFieldError(addressInput, document.getElementById('error-delivery-address'), addressInvalid);
      if (addressInvalid) markInvalid(addressInput);

      // name and a valid email are always required (checkValidity() still
      // works with novalidate on the form — that attribute only suppresses
      // the native UI/blocking, not the underlying constraint API, and
      // catches both "empty" and "malformed" via the input's own
      // required+type=email constraints); instagram/phone need at least
      // one filled in between them.
      var nameInput = document.getElementById('contact-name');
      var nameInvalid = !nameInput.value.trim();
      setFieldError(nameInput, document.getElementById('error-contact-name'), nameInvalid);
      if (nameInvalid) markInvalid(nameInput);

      var emailInput = document.getElementById('contact-email');
      var emailInvalid = !emailInput.checkValidity();
      setFieldError(emailInput, document.getElementById('error-contact-email'), emailInvalid);
      if (emailInvalid) markInvalid(emailInput);

      var instagramInput = document.getElementById('contact-instagram');
      var phoneInput = document.getElementById('contact-phone');
      // the field is prefilled with "@" so that alone doesn't count as filled in
      var instagramValue = instagramInput.value.trim().replace(/^@/, '');
      var hasInstagram = instagramValue.length > 0;
      var hasPhone = !!phoneInput.value.trim();
      var contactMethodInvalid = !hasInstagram && !hasPhone;
      setGroupError(null, document.getElementById('error-contact-method'), contactMethodInvalid);
      if (contactMethodInvalid) markInvalid(instagramInput);

      return firstInvalid;
    };

    var stepValidators = { 1: validateStep1, 2: validateStep2, 3: validateStep3 };
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

    var showStep = function (n) {
      currentStep = n;
      formSteps.forEach(function (stepEl) {
        stepEl.hidden = Number(stepEl.getAttribute('data-step')) !== n;
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

    orderForm.addEventListener('submit', function (event) {
      event.preventDefault();
      attemptedSteps[3] = true;
      var firstInvalid = validateStep3();
      if (firstInvalid) { focusInvalid(firstInvalid); return; }
      // Stage 5: EmailJS + Google Sheets submission hooks in here.
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
