// Progressive enhancement: native playback remains available without JavaScript.
// Match the landing-page demo's click-to-play behavior without loading video on arrival.
(function () {
  var initialized = new WeakSet();
  function prepare(player) {
    if (initialized.has(player)) return;
    var video = player.querySelector("video");
    var button = player.querySelector("[data-docs-demo-play]");
    var status = player.querySelector("[data-docs-demo-status]");
    if (!video || !button) return;
    initialized.add(player);
    function fallback() {
      video.controls = true;
      button.hidden = true;
      if (status)
        status.textContent =
          "Use the video controls to start or retry playback.";
    }
    button.addEventListener("click", function () {
      if (status) status.textContent = "";
      video.controls = true;
      button.hidden = true;
      var attempt = video.play();
      if (attempt && typeof attempt.catch === "function")
        attempt.catch(fallback);
    });
    video.addEventListener("play", function () {
      video.controls = true;
      button.hidden = true;
    });
    video.addEventListener("error", fallback);
    video.controls = false;
    button.hidden = false;
  }
  function discover(node) {
    if (!node || node.nodeType !== 1) return;
    if (node.matches("[data-docs-demo]")) prepare(node);
    node.querySelectorAll("[data-docs-demo]").forEach(prepare);
  }
  function start() {
    discover(document.body);
    new MutationObserver(function (changes) {
      changes.forEach(function (change) {
        change.addedNodes.forEach(discover);
      });
    }).observe(document.body, { childList: true, subtree: true });
  }
  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", start, { once: true });
  else start();
})();
