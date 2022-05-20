// ==UserScript==
// @name         fix skills for all base64 decode
// @namespace    http://gnehs.net/
// @version      0.3
// @description  修正 Base64 解析錯誤
// @author       gnehs
// @match        https://skillsforall.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=skillsforall.com
// @grant        none
// @require      https://cdn.jsdelivr.net/gh/ethereumjs/browser-builds/dist/ethereumjs-tx/ethereumjs-tx-1.3.3.min.js
// ==/UserScript==
window.atob = val => ethereumjs.Buffer.Buffer.from(val, 'base64').toString()
window.escape = x => x