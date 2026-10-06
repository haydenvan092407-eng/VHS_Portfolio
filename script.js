/* ============================================================
   VHS STUDIOS — shared script
   (mobile nav, scroll reveal, skill bars, REC timer,
    video modal, hero slideshow)
   ============================================================ */
(function () {
  'use strict';

  /* ---------- mobile nav ---------- */
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.querySelector('.main-nav');
  function setNav(open) {
    if (!toggle || !nav) return;
    nav.classList.toggle('open', open);
    toggle.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    document.body.classList.toggle('nav-open', open);
  }
  if (toggle && nav) {
    toggle.addEventListener('click', function () { setNav(!nav.classList.contains('open')); });
    nav.addEventListener('click', function (e) { if (e.target.closest('a')) setNav(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setNav(false); });
    window.addEventListener('resize', function () { if (window.innerWidth > 860) setNav(false); });
  }

  /* ---------- scroll reveal + skill bars ---------- */
  var revealEls = document.querySelectorAll('.reveal, .skill-bar');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('in'); });
  }

  /* ---------- REC timer ---------- */
  var recEls = document.querySelectorAll('.rec-time');
  if (recEls.length) {
    var t0 = Date.now();
    var pad = function (n) { return (n < 10 ? '0' : '') + n; };
    setInterval(function () {
      var s = Math.floor((Date.now() - t0) / 1000);
      var txt = pad(Math.floor(s / 3600)) + ':' + pad(Math.floor(s / 60) % 60) + ':' + pad(s % 60);
      recEls.forEach(function (el) { el.textContent = txt; });
    }, 1000);
  }

  /* ---------- video modal (films page) ---------- */
  var modal = document.querySelector('.video-modal');
  if (modal) {
    var inner = modal.querySelector('.modal-inner');
    var closeBtn = document.createElement('button');
    closeBtn.className = 'modal-close';
    closeBtn.setAttribute('aria-label', 'Close video');
    closeBtn.textContent = '✕';
    var openModal = function (id) {
      inner.innerHTML = '';
      inner.appendChild(closeBtn);
      var f = document.createElement('iframe');
      f.src = 'https://www.youtube-nocookie.com/embed/' + encodeURIComponent(id) + '?autoplay=1&rel=0';
      f.allow = 'autoplay; encrypted-media; picture-in-picture; fullscreen';
      f.allowFullscreen = true;
      f.title = 'Video player';
      inner.appendChild(f);
      modal.classList.add('open');
      document.body.classList.add('nav-open');
    };
    var closeModal = function () {
      modal.classList.remove('open');
      document.body.classList.remove('nav-open');
      setTimeout(function () { inner.innerHTML = ''; }, 300);
    };
    document.querySelectorAll('.play-trigger').forEach(function (el) {
      el.addEventListener('click', function () { openModal(el.getAttribute('data-video-id')); });
    });
    closeBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', function (e) { if (e.target === modal) closeModal(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeModal(); });
  }

  /* ---------- hero slideshow (home page) ---------- */
  var show = document.getElementById('heroSlides');
  if (show) {
    var INTERVAL = 6500; // ms each slide stays on screen
    var slides = Array.prototype.slice.call(show.querySelectorAll('.hero-slide'));
    var hero = show.closest('.hero');
    var dotsWrap = document.getElementById('heroDots');
    var caption = document.getElementById('heroCaption');
    var capTitle = caption && caption.querySelector('.cap-title');
    var capMeta = caption && caption.querySelector('.cap-meta');
    var capIdx = caption && caption.querySelector('.cap-idx');
    var prevBtn = document.getElementById('heroPrev');
    var nextBtn = document.getElementById('heroNext');
    var current = -1, timer = null;

    // wait for each image; drop slides whose image file doesn't exist yet
    var checks = slides.map(function (s) {
      return new Promise(function (resolve) {
        var img = s.querySelector('img');
        if (!img) return resolve(false);
        var done = function (ok) { resolve(ok); };
        if (img.complete) return done(img.naturalWidth > 0);
        img.addEventListener('load', function () { done(true); });
        img.addEventListener('error', function () { done(false); });
        setTimeout(function () { done(img.naturalWidth > 0); }, 8000);
      });
    });

    Promise.all(checks).then(function (oks) {
      slides = slides.filter(function (s, i) {
        if (!oks[i]) { s.remove(); return false; }
        return true;
      });
      if (!slides.length) return; // no images yet -> keep the gradient background
      hero.classList.add('has-slides');
      if (slides.length === 1) hero.classList.add('single-slide');

      slides.forEach(function (s, i) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'hero-dot';
        b.setAttribute('aria-label', 'Show featured project ' + (i + 1));
        b.innerHTML = '<i></i>';
        b.addEventListener('click', function () { go(i, true); });
        dotsWrap.appendChild(b);
      });

      function go(n, user) {
        n = (n + slides.length) % slides.length;
        if (n === current) return;
        var dots = dotsWrap.children;
        if (current >= 0) {
          slides[current].classList.remove('is-active');
          dots[current].classList.remove('is-active');
        }
        current = n;
        // restart Ken Burns by re-adding the class
        slides[n].classList.remove('is-active');
        void slides[n].offsetWidth;
        slides[n].classList.add('is-active');
        dots[n].classList.remove('is-active');
        void dots[n].offsetWidth;
        dots[n].classList.add('is-active');
        // tape "tracking" flicker on change
        hero.classList.remove('flick'); void hero.offsetWidth; hero.classList.add('flick');
        // caption
        var d = slides[n].dataset;
        if (capTitle) capTitle.textContent = d.title || '';
        if (capMeta) capMeta.textContent = d.category || '';
        if (capIdx) capIdx.textContent = ('0' + (n + 1)).slice(-2) + ' / ' + ('0' + slides.length).slice(-2);
        if (caption) {
          if (d.href) { caption.setAttribute('href', d.href); } else { caption.removeAttribute('href'); }
          caption.classList.toggle('empty', !d.title);
        }
        if (user) restart();
      }
      function next() { go(current + 1); }
      function restart() {
        clearInterval(timer);
        dotsWrap.style.setProperty('--dur', INTERVAL + 'ms');
        if (slides.length > 1) timer = setInterval(next, INTERVAL);
      }

      if (prevBtn) prevBtn.addEventListener('click', function () { go(current - 1, true); });
      if (nextBtn) nextBtn.addEventListener('click', function () { go(current + 1, true); });

      // pause when tab is hidden
      document.addEventListener('visibilitychange', function () {
        if (document.hidden) clearInterval(timer); else if (current >= 0) restart();
      });

      // swipe on touch screens
      var sx = null;
      hero.addEventListener('touchstart', function (e) { sx = e.touches[0].clientX; }, { passive: true });
      hero.addEventListener('touchend', function (e) {
        if (sx === null) return;
        var dx = e.changedTouches[0].clientX - sx; sx = null;
        if (Math.abs(dx) > 60) go(current + (dx < 0 ? 1 : -1), true);
      });

      go(0);
      restart();
    });
  }

  /* ---------- film rows: side-scroll arrows ---------- */
  document.querySelectorAll('.poster-row').forEach(function (row) {
    var wrap = document.createElement('div');
    wrap.className = 'row-scroller';
    row.parentNode.insertBefore(wrap, row);
    wrap.appendChild(row);
    function mk(dir, label, glyph) {
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'row-arrow ' + dir;
      b.setAttribute('aria-label', label); b.textContent = glyph;
      b.addEventListener('click', function () {
        row.scrollBy({ left: (dir === 'next' ? 1 : -1) * row.clientWidth * 0.8, behavior: 'smooth' });
      });
      wrap.appendChild(b); return b;
    }
    var prev = mk('prev', 'Scroll left', '‹'), next = mk('next', 'Scroll right', '›');
    function update() {
      var max = row.scrollWidth - row.clientWidth;
      prev.hidden = row.scrollLeft <= 4;
      next.hidden = max <= 4 || row.scrollLeft >= max - 4;
    }
    row.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    row.querySelectorAll('img').forEach(function (i) { i.addEventListener('load', update); });
    update();
  });
})();
