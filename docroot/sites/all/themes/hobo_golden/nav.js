/**
 * Click/tap-to-toggle navigation. No hover dependency, no jQuery, no
 * Superfish/Simplemenu - plain HTML/CSS/JS that will migrate to any
 * future platform unchanged.
 */
(function () {
  'use strict';

  function ready(fn) {
    if (document.readyState !== 'loading') {
      fn();
    }
    else {
      document.addEventListener('DOMContentLoaded', fn);
    }
  }

  ready(function () {
    var nav = document.getElementById('main-nav');
    if (!nav) {
      return;
    }

    var toggle = nav.querySelector('.nav-toggle');
    var menu = document.getElementById('main-nav-menu');

    function closeAll() {
      nav.classList.remove('nav-open');
      if (toggle) {
        toggle.setAttribute('aria-expanded', 'false');
      }
      var open = nav.querySelectorAll('.nav-open');
      for (var i = 0; i < open.length; i++) {
        open[i].classList.remove('nav-open');
      }
      var buttons = nav.querySelectorAll('.submenu-toggle[aria-expanded="true"]');
      for (var j = 0; j < buttons.length; j++) {
        buttons[j].setAttribute('aria-expanded', 'false');
      }
    }

    if (toggle && menu) {
      toggle.addEventListener('click', function (event) {
        event.stopPropagation();
        var isOpen = nav.classList.toggle('nav-open');
        toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      });
    }

    // Give every item that has children its own expand/collapse button,
    // separate from the link itself so the link stays directly clickable.
    var parents = nav.querySelectorAll('li.expanded');
    for (var i = 0; i < parents.length; i++) {
      (function (li) {
        var link = li.querySelector('a');
        if (!link) {
          return;
        }
        var button = document.createElement('button');
        button.type = 'button';
        button.className = 'submenu-toggle';
        button.setAttribute('aria-expanded', 'false');
        button.setAttribute('aria-label', 'Show submenu for ' + link.textContent);
        link.parentNode.insertBefore(button, link.nextSibling);

        button.addEventListener('click', function (event) {
          event.stopPropagation();
          var isOpen = li.classList.toggle('nav-open');
          button.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        });
      })(parents[i]);
    }

    document.addEventListener('click', function (event) {
      if (!nav.contains(event.target)) {
        closeAll();
      }
    });

    document.addEventListener('keyup', function (event) {
      if (event.key === 'Escape') {
        closeAll();
      }
    });
  });
}());
