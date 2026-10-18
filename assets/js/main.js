/* Charbel Toumieh: site behaviour. No dependencies. */
(() => {
  'use strict';

  const root = document.documentElement;

  // Local preview (file:// or localhost): empty frames say which file they are waiting for.
  const isLocal =
    location.protocol === 'file:' ||
    /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);

  const hint = (frame, text) => {
    if (!isLocal || frame.querySelector('.slot-hint')) return;
    const note = document.createElement('span');
    note.className = 'slot-hint';
    note.textContent = text;
    frame.append(note);
  };

  /* ---------- Portrait: the slot disappears until media/portrait.jpg exists ---------- */
  const portrait = document.querySelector('[data-portrait]');
  if (portrait) {
    const img = portrait.querySelector('img');
    const missing = () => portrait.classList.add('is-missing');
    if (img.complete && img.naturalWidth === 0) missing();
    else img.addEventListener('error', missing);
  }

  /* ---------- Menu: border once scrolled, small name once the big one is gone,
                current section underlined ---------- */
  const nav = document.querySelector('.site-nav');
  if (nav) {
    const onScroll = () => nav.classList.toggle('is-stuck', window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    const bigName = document.querySelector('.intro h1');
    if (bigName && 'IntersectionObserver' in window) {
      new IntersectionObserver(([entry]) => {
        nav.classList.toggle('show-name', !entry.isIntersecting);
      }, { rootMargin: '-56px 0px 0px 0px' }).observe(bigName);
    }
  }

  const navLinks = Array.from(document.querySelectorAll('.nav-links a[href^="#"]'));
  if (navLinks.length && 'IntersectionObserver' in window) {
    const byId = new Map(navLinks.map((a) => [a.getAttribute('href').slice(1), a]));
    const spy = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const link = byId.get(entry.target.id);
        if (!link) return;
        if (entry.isIntersecting) {
          navLinks.forEach((a) => a.removeAttribute('aria-current'));
          link.setAttribute('aria-current', 'location');
        } else if (link.hasAttribute('aria-current')) {
          link.removeAttribute('aria-current');
        }
      });
    }, { rootMargin: '-40% 0px -55% 0px' });
    byId.forEach((_, id) => {
      const section = document.getElementById(id);
      if (section) spy.observe(section);
    });
  }

  /* ---------- Pictures and clips ----------
     Each frame holds one <video> whose poster is the picture (media/posters/NAME.jpg)
     and whose data-src is an optional clip (media/clips/NAME.mp4).
     - No picture yet: the frame shows its data-label (the venue) instead.
     - No clip: the picture stays, with no play button.
     - Clip: it loads only when it comes near the screen, plays while at least a
       third of it is visible and pauses otherwise. Visitors who ask for reduced
       motion get the picture and a play button instead of autoplay. */
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const userPaused = new WeakSet();
  const ICONS =
    '<svg class="icon-pause" viewBox="0 0 16 16" aria-hidden="true"><rect x="3" y="2" width="3.5" height="12" rx="1"/><rect x="9.5" y="2" width="3.5" height="12" rx="1"/></svg>' +
    '<svg class="icon-play" viewBox="0 0 16 16" aria-hidden="true"><path d="M4 2.2v11.6a.8.8 0 0 0 1.2.7l9.3-5.8a.8.8 0 0 0 0-1.4L5.2 1.5A.8.8 0 0 0 4 2.2z"/></svg>';

  const sync = (video) => {
    const frame = video.closest('.media');
    const button = frame && frame.querySelector('.media-toggle');
    if (!button) return;
    frame.classList.toggle('is-paused', video.paused);
    button.setAttribute('aria-label', video.paused ? 'Play video' : 'Pause video');
  };

  const attach = (video, preload) => {
    if (video.dataset.attached) return;
    video.dataset.attached = 'true';
    video.preload = preload;
    video.src = video.dataset.src;
    video.load();
  };

  const play = (video) => {
    attach(video, 'auto');
    const attempt = video.play();
    // Autoplay can still be refused (iOS Low Power Mode, data saver): show the play button.
    if (attempt && typeof attempt.catch === 'function') attempt.catch(() => sync(video));
  };

  const videos = [];
  document.querySelectorAll('figure.media').forEach((frame) => {
    const video = frame.querySelector('video');
    if (!video) return;
    video.muted = true;

    const poster = video.getAttribute('poster');
    if (poster) {
      const probe = new Image();
      probe.onerror = () => {
        frame.classList.add('is-empty');
        hint(frame, `Add ${poster}`);
      };
      probe.src = poster;
    }

    if (!video.dataset.src) return;
    videos.push(video);

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'media-toggle';
    button.hidden = true;
    button.innerHTML = ICONS;
    frame.append(button);

    video.addEventListener('error', () => {
      button.hidden = true;
      // Research areas are meant to move; say so locally if the clip is missing.
      if (frame.closest('.area')) hint(frame, `Add ${video.dataset.src}`);
    });
    video.addEventListener('loadedmetadata', () => { button.hidden = false; });
    video.addEventListener('play', () => sync(video));
    video.addEventListener('pause', () => sync(video));

    button.addEventListener('click', () => {
      if (video.paused) {
        userPaused.delete(video);
        play(video);
      } else {
        userPaused.add(video);
        video.pause();
      }
    });
    sync(video);
  });

  if ('IntersectionObserver' in window) {
    const approaching = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        attach(entry.target, reduceMotion.matches ? 'metadata' : 'auto');
        approaching.unobserve(entry.target);
      });
    }, { rootMargin: '400px 0px' });

    const watching = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const video = entry.target;
        if (entry.isIntersecting) {
          if (!reduceMotion.matches && !userPaused.has(video)) play(video);
        } else if (!video.paused) {
          video.pause();
        }
      });
    }, { threshold: 0.35 });

    videos.forEach((video) => {
      approaching.observe(video);
      watching.observe(video);
    });
  } else {
    videos.forEach((video) => (reduceMotion.matches ? attach(video, 'metadata') : play(video)));
  }
})();
