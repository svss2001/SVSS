/**
 * navbar-include.js
 * Fetches assets/components/navbar.html and injects it at the
 * top of <body> on any page that includes this script.
 *
 * Usage in any HTML page:
 *   <script src="assets/js/navbar-include.js" defer></script>
 *
 * The script also:
 *   - Auto-marks the current page's nav link as .active
 *   - Handles the hamburger toggle on mobile
 *   - Resolves relative asset paths so the component works from
 *     any folder depth
 */

(function () {
  'use strict';

  /* ── 1. Resolve path to the component relative to this script ── */
  const scriptSrc   = document.currentScript
                    ? document.currentScript.src
                    : new URL('assets/js/navbar-include.js', location.href).href;

  // Walk up from assets/js/ → assets/ → root
  const scriptBase  = new URL(scriptSrc);
  const rootBase    = new URL('../../', scriptBase);          // project root
  const componentURL = new URL('assets/components/navbar.html', rootBase).href;

  /* ── 2. Fetch and inject ──────────────────────────────────────── */
  fetch(componentURL)
    .then(function (res) {
      if (!res.ok) throw new Error('Navbar fetch failed: ' + res.status);
      return res.text();
    })
    .then(function (html) {
      // Fix image / href paths relative to root
      html = html.replace(/src="assets\//g,  'src="'  + rootBase.pathname + 'assets/');
      html = html.replace(/href="assets\//g, 'href="' + rootBase.pathname + 'assets/');

      const wrapper = document.createElement('div');
      wrapper.innerHTML = html;

      // navbar.html now produces TWO sibling root elements:
      //   1. #site-navbar  (brand header — scrolls away)
      //   2. #nav-links-bar  (sticky nav — must be a sibling of body children)
      // We must insert ALL of them, not just the first one.
      var firstChild = document.body.firstChild;
      var elems = Array.from(wrapper.children); // snapshot before DOM moves them
      elems.forEach(function (el) {
        document.body.insertBefore(el, firstChild);
      });

      initNavbar();
    })
    .catch(function (err) {
      console.warn('[navbar-include] Could not load navbar:', err);
    });

  /* ── 3. Initialise interactions after injection ─────────────── */
  function initNavbar() {

    /* Active link: match href to current page filename */
    var links     = document.querySelectorAll('.nav-link');
    var page      = location.pathname.split('/').pop() || 'index.html';

    links.forEach(function (a) {
      var href = a.getAttribute('href').split('/').pop();
      if (href && href === page) {
        a.classList.add('active');
        a.setAttribute('aria-current', 'page');
      }
    });

    /* Hamburger toggle */
    var hamburger    = document.getElementById('nav-hamburger');
    var navLinksList = document.getElementById('nav-links-list');
    var navLinksBar  = document.getElementById('nav-links-bar');
    var siteNavbar   = document.getElementById('site-navbar');

    function updateNavOffset() {
        if (window.innerWidth <= 768 && siteNavbar && navLinksBar) {
            navLinksBar.style.top = siteNavbar.offsetHeight + 'px';
        } else if (navLinksBar) {
            navLinksBar.style.top = '0';
        }
    }
    window.addEventListener('resize', updateNavOffset);
    updateNavOffset();

    if (hamburger && navLinksList) {
      hamburger.addEventListener('click', function () {
        var isOpen = navLinksList.classList.toggle('open');
        hamburger.classList.toggle('open', isOpen);
        hamburger.setAttribute('aria-expanded', String(isOpen));
      });

      // Close on outside click
      document.addEventListener('click', function (e) {
        if (!document.getElementById('site-navbar').contains(e.target)) {
          navLinksList.classList.remove('open');
          hamburger.classList.remove('open');
          hamburger.setAttribute('aria-expanded', 'false');
        }
      });

      // Close on link click (mobile)
      navLinksList.querySelectorAll('.nav-link').forEach(function (a) {
        a.addEventListener('click', function () {
          navLinksList.classList.remove('open');
          hamburger.classList.remove('open');
          hamburger.setAttribute('aria-expanded', 'false');
        });
      });
    }

    /* Search — basic handler (extend as needed) */
    var searchBtn   = document.getElementById('nav-search-btn');
    var searchInput = document.getElementById('nav-search-input');

    if (searchBtn && searchInput) {
      searchBtn.addEventListener('click', function () {
        var q = searchInput.value.trim();
        if (q) {
          console.log('[SCRS Search]', q);
        }
      });

      searchInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') searchBtn.click();
      });
    }

    /* ── Sticky nav-links-bar detection ─────────────────────────
     *
     * Strategy: insert an invisible 1-px sentinel <div> immediately
     * BEFORE .nav-links-bar in the DOM.  An IntersectionObserver
     * watches it: when it scrolls out of view (isIntersecting=false)
     * the nav bar has become pinned, so we add .is-sticky.
     * When it re-enters we remove .is-sticky.
     *
     * This is more reliable than scroll events and costs zero CPU
     * while the page is at rest.
     * ─────────────────────────────────────────────────────────── */
    var navLinksBar = document.getElementById('nav-links-bar');

    if (navLinksBar && 'IntersectionObserver' in window) {

      /* Sentinel sits just above the body's first child (the brand header).
         When it leaves the viewport the nav-links-bar has scrolled to top. */
      var sentinel        = document.createElement('div');
      sentinel.id         = 'nav-sticky-sentinel';
      sentinel.style.cssText = [
        'position:absolute',
        'top:0',
        'left:0',
        'height:1px',
        'width:1px',
        'visibility:hidden',
        'pointer-events:none'
      ].join(';');

      /* Prepend sentinel before #site-navbar (very top of body) */
      var navWrapper = document.getElementById('site-navbar');
      if (navWrapper) navWrapper.insertBefore(sentinel, navWrapper.firstChild);

      var observer = new IntersectionObserver(
        function (entries) {
          navLinksBar.classList.toggle('is-sticky', !entries[0].isIntersecting);
        },
        { threshold: 0, rootMargin: '0px' }
      );

      observer.observe(sentinel);
    }

    /* Compensate anchor-link scroll so targets aren't hidden behind
       the 52px sticky bar */
    document.documentElement.style.scrollPaddingTop = '60px';
  }

})()
