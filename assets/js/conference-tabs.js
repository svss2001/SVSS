/**
 * conference-tabs.js
 * Filters .conference-card[data-year] elements when a .year-tab is clicked.
 * Cards appear immediately below the tab bar with a staggered fade-in.
 */
(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', init);

  function init() {
    var tabs     = document.querySelectorAll('.year-tab');
    var cards    = document.querySelectorAll('.conference-card');
    var emptyEl  = document.getElementById('conf-empty-state');
    var tabsBar  = document.getElementById('conf-tabs-bar');

    if (!tabs.length || !cards.length) return;

    /* Show the default active year on load */
    var activeTab = document.querySelector('.year-tab.active');
    if (activeTab) showYear(activeTab.dataset.year, cards, emptyEl);

    /* Tab click */
    tabs.forEach(function (tab) {
      tab.addEventListener('click', function () {

        /* Swap active class */
        tabs.forEach(function (t) { t.classList.remove('active'); });
        tab.classList.add('active');

        /* Filter cards for chosen year */
        showYear(tab.dataset.year, cards, emptyEl);

        /* Smooth-scroll so the grid appears just below the tab bar */
        var gridWrap = document.getElementById('conf-grid-wrap');
        if (gridWrap && tabsBar) {
          var tabsBottom = tabsBar.getBoundingClientRect().bottom + window.scrollY;
          var navBar     = document.querySelector('.nav-links-bar');
          var navH       = navBar ? navBar.offsetHeight : 52;
          var tabH       = tabsBar.offsetHeight;
          /* Scroll so the top of the grid section sits right below both sticky bars */
          var target = gridWrap.getBoundingClientRect().top + window.scrollY - navH - tabH;
          window.scrollTo({ top: target, behavior: 'smooth' });
        }
      });
    });
  }

  /**
   * Show cards matching `year`, hide all others.
   * Assigns CSS --ci counter for stagger animation.
   */
  function showYear(year, cards, emptyEl) {
    var count = 0;

    cards.forEach(function (card) {
      /* Remove existing animation so it re-triggers each tab click */
      card.classList.remove('visible');
      void card.offsetWidth; /* force reflow */

      if (card.dataset.year === year) {
        card.classList.remove('hidden');
        card.style.setProperty('--ci', count);
        count++;

        /* Double rAF ensures display:block is applied before animation */
        (function (c) {
          requestAnimationFrame(function () {
            requestAnimationFrame(function () { c.classList.add('visible'); });
          });
        })(card);

      } else {
        card.classList.add('hidden');
      }
    });

    if (emptyEl) {
      emptyEl.style.display = count === 0 ? 'block' : 'none';
    }
  }

})();
