// ==UserScript==
// @name         Google Maps Fix
// @namespace    https://gnehs.net/
// @version      0.6.0
// @description  複製帶有預覽的 Google Maps 連結
// @author       gnehs
// @match        https://www.google.com/maps/*
// @match        https://www.google.com/maps/
// @match        https://www.google.com/maps
// @match        https://p.pancake.tw/gmaps/*
// @icon         https://p.pancake.tw/favicon.svg
// @run-at       document-start
// ==/UserScript==
(function () {
  if (location.href.startsWith("https://p.pancake.tw/gmaps")) {
    location.href = location.href.replace(
      "https://p.pancake.tw/gmaps",
      "https://maps.app.goo.gl"
    );
  }

  const ob = new MutationObserver(function (mutationsList, observer) {
    updateLink();
  });

  ob.observe(document, {
    childList: true,
    subtree: true,
  });
  function updateLink() {
    const input = document.querySelector(
      `[jsaction="pane.copyLink.clickInput"]`
    );
    if (input.value.startsWith("https://maps.app.goo.gl")) {
      input.value = input.value.replace(
        "https://maps.app.goo.gl",
        "https://p.pancake.tw/gmaps"
      );
    }
  }
})();
