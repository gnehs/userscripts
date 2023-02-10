// ==UserScript==
// @name         PChome 新版商品頁面
// @namespace    https://gnehs.net/
// @version      0.1.0
// @description  自動幫你導向新版 PChome 商品頁面
// @author       gnehs
// @match        https://24h.pchome.com.tw/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=pchome.com.tw
// @grant        none
// ==/UserScript==
(() => {
  let url = new URL(location.href)
  let paths = url.pathname.split("/")
  if (paths[1] == 'prod' && paths[2] != 'v1') {
    location.href = `https://24h.pchome.com.tw/prod/v1/${paths[2]}`
  }
})();