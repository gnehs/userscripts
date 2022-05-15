// ==UserScript==
// @name         Skill for all fix
// @namespace    http://gnehs.net/
// @version      0.1.1
// @description  修正 Base64 解析錯誤
// @author       You
// @match        https://skillsforall.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=skillsforall.com
// @require      https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.1.1/crypto-js.min.js
// @grant        none
// ==/UserScript==

window.atob = val => CryptoJS.enc.Base64.parse(val).toString(CryptoJS.enc.Utf8)
let originalJSONParse = JSON.parse

JSON.parse = val => {
  console.log('[JSON.parse]', val)
  return val ? originalJSONParse(val) : {}
}
window.escape = x => x