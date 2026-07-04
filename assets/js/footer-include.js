/**
 * footer-include.js
 * Fetches assets/components/footer.html, injects footer.css automatically,
 * then appends the footer to <body> on any page that includes this script.
 *
 * Usage on any page — just one line:
 *   <script src="assets/js/footer-include.js" defer></script>
 *
 * Features:
 *   - Auto-injects footer.css (no manual <link> needed)
 *   - Auto-updates "Last Updated" date
 *   - Animates hit counter when it scrolls into view
 *   - Newsletter email validation with success/error feedback
 */

(function () {
  'use strict';

  /* ── 1. Resolve root URL from this script's location ── */
  var scriptSrc    = document.currentScript
                   ? document.currentScript.src
                   : new URL('assets/js/footer-include.js', location.href).href;

  var scriptBase   = new URL(scriptSrc);
  var rootBase     = new URL('../../', scriptBase);       // project root
  var componentURL = new URL('assets/components/footer.html', rootBase).href;
  var cssURL       = new URL('assets/css/footer.css',         rootBase).href;

  /* ── 2. Inject footer.css if not already present ────── */
  if (!document.querySelector('link[href="' + cssURL + '"]')) {
    var cssLink  = document.createElement('link');
    cssLink.rel  = 'stylesheet';
    cssLink.href = cssURL;
    document.head.appendChild(cssLink);
  }

  /* ── 3. Fetch and inject footer HTML ─────────────────── */
  fetch(componentURL)
    .then(function (res) {
      if (!res.ok) throw new Error('Footer fetch failed: ' + res.status);
      return res.text();
    })
    .then(function (html) {
      /* Fix relative asset paths so the component works from any depth */
      html = html
        .replace(/href="assets\//g,  'href="'  + rootBase.pathname + 'assets/')
        .replace(/src="assets\//g,   'src="'   + rootBase.pathname + 'assets/')
        .replace(/href="index\.html"/g, 'href="' + rootBase.pathname + 'index.html"')
        .replace(/href="conferences\.html"/g, 'href="' + rootBase.pathname + 'conferences.html"');

      var wrapper      = document.createElement('div');
      wrapper.innerHTML = html.trim();
      var footerEl     = wrapper.firstElementChild;
      document.body.appendChild(footerEl);

      initFooter();
    })
    .catch(function (err) {
      console.warn('[footer-include] Could not load footer:', err);
    });

  /* ── 4. Initialise footer interactions ───────────────── */
  function initFooter() {

    /* Auto-set "Last Updated" to current month/year */
    var dateEl  = document.getElementById('footer-update-date');
    if (dateEl) {
      var months = ['Jan','Feb','Mar','Apr','May','Jun',
                    'Jul','Aug','Sep','Oct','Nov','Dec'];
      var now    = new Date();
      dateEl.textContent = months[now.getMonth()] + ' ' + now.getFullYear();
    }

    /* Animate the hit counter when it enters the viewport */
    startHitCounterAnimation();

    /* Newsletter form */
    var submitBtn  = document.getElementById('footer-submit-btn');
    var emailInput = document.getElementById('footer-email-input');

    if (submitBtn && emailInput) {
      submitBtn.addEventListener('click', handleNewsletterSubmit);
      emailInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') handleNewsletterSubmit();
      });
    }

    function handleNewsletterSubmit() {
      var email = emailInput.value.trim();
      var valid = email.length > 4 && email.includes('@') && email.includes('.');

      if (valid) {
        /* Success feedback */
        submitBtn.textContent       = '✓ Subscribed!';
        submitBtn.style.background  = '#059669';
        emailInput.style.borderColor = '#059669';
        setTimeout(function () {
          submitBtn.textContent       = 'Submit';
          submitBtn.style.background  = '';
          emailInput.style.borderColor = '';
          emailInput.value            = '';
        }, 3500);
      } else {
        /* Error feedback */
        emailInput.style.borderColor = '#ef4444';
        emailInput.focus();
        emailInput.style.animation   = 'none';
        setTimeout(function () {
          emailInput.style.borderColor = '';
        }, 2200);
      }
    }
  }

  /* ── 5. Hit-counter roll animation ───────────────────── */
  function startHitCounterAnimation() {
    var TARGET   = 1106149;   // Displayed final count
    var DURATION = 2000;      // ms

    var counterEl = document.getElementById('hit-counter');
    var digits    = counterEl ? counterEl.querySelectorAll('.hit-digit') : [];
    if (!digits.length) return;

    var startNum  = Math.max(0, TARGET - 5000);
    var started   = false;

    function run() {
      if (started) return;
      started      = true;
      var startTs  = null;

      function tick(ts) {
        if (!startTs) startTs = ts;
        var progress = Math.min((ts - startTs) / DURATION, 1);
        /* Ease-out cubic */
        var ease     = 1 - Math.pow(1 - progress, 3);
        var current  = Math.round(startNum + (TARGET - startNum) * ease);
        var str      = String(current).padStart(digits.length, '0');

        digits.forEach(function (d, i) {
          d.textContent = str[i] !== undefined ? str[i] : '0';
        });

        if (progress < 1) requestAnimationFrame(tick);
      }

      requestAnimationFrame(tick);
    }

    /* Use IntersectionObserver so animation triggers on scroll */
    if ('IntersectionObserver' in window) {
      var obs = new IntersectionObserver(function (entries) {
        if (entries[0].isIntersecting) { run(); obs.disconnect(); }
      }, { threshold: 0.2 });
      obs.observe(counterEl);
    } else {
      run(); // fallback: run immediately
    }
  }

})();
