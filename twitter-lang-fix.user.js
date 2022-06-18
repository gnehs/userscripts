// ==UserScript==
// @name         Twitter 標點符號修正
// @namespace    https://gnehs.net/
// @version      0.1
// @description  Twitter 預設會使用中國標準的標點符號，這個能夠幫你修正回台灣標準。
// @author       gnehs
// @match        https://twitter.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=twitter.com
// @grant        none
// ==/UserScript==

const observer = new MutationObserver((mutations, observer) => {
  document.querySelectorAll('[lang="zh"]').forEach(el => {
    el.lang = "zh-TW";
  });
});
observer.observe(document, {
  subtree: true,
  attributes: true
});