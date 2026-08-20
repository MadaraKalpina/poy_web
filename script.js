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
});
