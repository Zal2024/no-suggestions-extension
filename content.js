(() => {
  'use strict';

  const host = location.hostname.replace(/^www\./, '');
  let site = 'other';
  if (host.includes('youtube.com') || host.includes('youtube-nocookie.com')) {
    site = 'youtube';
  } else if (host.includes('instagram.com')) {
    site = 'instagram';
  } else if (host === 'x.com' || host.endsWith('.x.com') || host.includes('twitter.com')) {
    site = 'x';
  } else if (host.includes('reddit.com')) {
    site = 'reddit';
  }

  let lastAutonavAttempt = 0;

  function computePageType() {
    const path = location.pathname;

    if (site === 'youtube') {
      if (path === '/' || path === '') return 'home';
      if (path.startsWith('/shorts/')) return 'shorts';
      if (path.startsWith('/watch')) return 'watch';
      return 'other';
    }

    if (site === 'instagram') {
      if (path === '/' || path === '') return 'home';
      if (path.startsWith('/reels')) return 'reels';
      if (path.startsWith('/explore')) return 'explore';
      if (path.startsWith('/stories')) return 'stories';
      if (path.startsWith('/direct')) return 'direct';
      return 'other';
    }

    if (site === 'x') {
      if (path === '/' || path === '' || path.startsWith('/home')) return 'home';
      if (path.startsWith('/explore') || path.startsWith('/i/trends')) return 'explore';
      if (path.includes('/status/')) return 'post';
      return 'other';
    }

    if (site === 'reddit') {
      if (
        path.includes('/comments/') ||
        path.startsWith('/search') ||
        path.startsWith('/message') ||
        path.startsWith('/chat') ||
        path.startsWith('/settings') ||
        path.startsWith('/notifications')
      ) {
        return 'post';
      }
      return 'feed';
    }

    return 'other';
  }

  function syncRouteAttributes() {
    const root = document.documentElement;
    if (!root) return;
    const page = computePageType();
    if (root.getAttribute('data-anti-scroll-site') !== site) {
      root.setAttribute('data-anti-scroll-site', site);
    }
    if (root.getAttribute('data-anti-scroll-page') !== page) {
      root.setAttribute('data-anti-scroll-page', page);
    }
  }

  // Apply immediately at document_start and across lifecycle events
  syncRouteAttributes();
  window.addEventListener('DOMContentLoaded', syncRouteAttributes);
  window.addEventListener('load', syncRouteAttributes);
  window.addEventListener('popstate', syncRouteAttributes);

  // =========================================================================
  // YOUTUBE: Disable Autoplay + Lock Shorts to Single Video (No Infinite Scroll)
  // =========================================================================
  function enforceYouTubeCleanliness() {
    if (site !== 'youtube') return;

    // 1. Disable autoplay & cancel up-next on regular watch player
    const now = Date.now();
    if (now - lastAutonavAttempt >= 2000) {
      const autonavBtn = document.querySelector('.ytp-autonav-toggle-button[aria-checked="true"]');
      if (autonavBtn && typeof autonavBtn.click === 'function') {
        lastAutonavAttempt = now;
        autonavBtn.click();
      }
      const cancelBtn = document.querySelector('.ytp-autonav-endscreen-upnext-cancel-button');
      if (cancelBtn && typeof cancelBtn.click === 'function') {
        lastAutonavAttempt = now;
        cancelBtn.click();
      }
    }

    // 2. If on /shorts/<id>, keep the first Short video (id="0") working,
    //    but strip all subsequent queued Shorts (id="1", "2", ...).
    if (location.pathname.startsWith('/shorts/')) {
      const extraSequenceItems = document.querySelectorAll(
        'ytd-shorts .reel-video-in-sequence-new:not([id="0"]), ytd-shorts .reel-video-in-sequence:not([id="0"])'
      );
      for (const item of extraSequenceItems) {
        item.remove();
      }
      const shortsContainer = document.querySelector('ytd-shorts #shorts-container');
      if (shortsContainer && shortsContainer.scrollTop !== 0) {
        shortsContainer.scrollTop = 0;
      }
    }
  }

  if (site === 'youtube') {
    const isInsideScrollableDrawer = (target) => {
      if (!target || typeof target.closest !== 'function') return false;
      return Boolean(
        target.closest('ytd-engagement-panel-section-list-renderer') ||
        target.closest('#search-form') ||
        target.closest('tp-yt-paper-dialog')
      );
    };

    window.addEventListener(
      'wheel',
      (e) => {
        if (location.pathname.startsWith('/shorts/') && !isInsideScrollableDrawer(e.target)) {
          e.preventDefault();
          e.stopImmediatePropagation();
        }
      },
      { capture: true, passive: false }
    );

    window.addEventListener(
      'touchmove',
      (e) => {
        if (location.pathname.startsWith('/shorts/') && !isInsideScrollableDrawer(e.target)) {
          e.preventDefault();
          e.stopImmediatePropagation();
        }
      },
      { capture: true, passive: false }
    );

    window.addEventListener(
      'keydown',
      (e) => {
        if (!location.pathname.startsWith('/shorts/')) return;
        if (isInsideScrollableDrawer(e.target)) return;
        const tag = e.target && e.target.tagName ? e.target.tagName.toLowerCase() : '';
        if (tag === 'input' || tag === 'textarea' || (e.target && e.target.isContentEditable)) return;

        const blockedKeys = ['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'j', 'k', 'J', 'K'];
        if (blockedKeys.includes(e.key)) {
          e.preventDefault();
          e.stopImmediatePropagation();
        }
      },
      { capture: true }
    );

    window.addEventListener('yt-navigate-finish', () => {
      syncRouteAttributes();
      setTimeout(enforceYouTubeCleanliness, 300);
    });

    document.addEventListener('play', enforceYouTubeCleanliness, true);
    document.addEventListener('ended', () => {
      lastAutonavAttempt = 0;
      enforceYouTubeCleanliness();
    }, true);
  }

  // =========================================================================
  // INSTAGRAM: Preserve Friends' Stories Tray at top of Home, Push Feed
  //            Offscreen so IntersectionObserver Never Triggers Pagination
  // =========================================================================
  function enforceInstagramCleanliness() {
    if (site !== 'instagram') return;
    if (location.pathname !== '/' && location.pathname !== '') return;

    // 1. Mark articles and their feed container so they stay 10,000vh offscreen
    //    (preventing IntersectionObserver from seeing the bottom loader sentinel),
    //    and pause any autoplaying video inside the hidden initial articles.
    const articles = document.querySelectorAll('main article');
    for (const article of articles) {
      article.setAttribute('data-anti-scroll-ig-feed', 'true');
      const videos = article.querySelectorAll('video');
      for (const v of videos) {
        if (!v.paused) v.pause();
        v.muted = true;
      }
    }

    // 2. Hide the "Suggested for you" right-sidebar block on Home
    const spans = document.querySelectorAll('main span, aside span');
    for (const span of spans) {
      if (span.textContent && span.textContent.trim() === 'Suggested for you') {
        const container = span.closest('div[class]') && span.parentElement && span.parentElement.parentElement;
        if (container && !container.querySelector('[role="menu"]')) {
          container.setAttribute('data-anti-scroll-ig-suggested', 'true');
        }
      }
    }
  }

  // =========================================================================
  // Periodic SPA URL & DOM Sync
  // =========================================================================
  setInterval(() => {
    syncRouteAttributes();
    if (site === 'youtube') {
      enforceYouTubeCleanliness();
    } else if (site === 'instagram') {
      enforceInstagramCleanliness();
    }
  }, 300);
})();
