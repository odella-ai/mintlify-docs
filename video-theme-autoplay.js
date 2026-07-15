(function () {
  // Browsers suspend playback of autoplay <video> elements that are
  // display:none. The light/dark video pairs use Tailwind's dark:hidden /
  // hidden dark:block to swap, so the newly-visible video needs to be
  // resumed manually after a theme change — it doesn't restart on its own.
  function syncThemedVideos() {
    // Match by the autoplay attribute rather than Tailwind class names —
    // Mintlify rewrites dark:hidden/dark:block internally (e.g. to
    // dark:mint-hidden), so relying on exact class strings is fragile.
    document
      .querySelectorAll('video[autoplay]')
      .forEach(function (video) {
        if (window.getComputedStyle(video).display === 'none') {
          if (!video.paused) video.pause();
          return;
        }
        if (video.paused) {
          var playPromise = video.play();
          if (playPromise && typeof playPromise.catch === 'function') {
            playPromise.catch(function () {});
          }
        }
      });
  }

  var observer = new MutationObserver(function (mutations) {
    for (var i = 0; i < mutations.length; i++) {
      if (mutations[i].attributeName === 'class') {
        syncThemedVideos();
        return;
      }
    }
  });

  function init() {
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    document.addEventListener('click', function (event) {
      if (event.target.closest('[data-component-name="theme-toggle"]')) {
        setTimeout(syncThemedVideos, 50);
      }
    });
    syncThemedVideos();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
