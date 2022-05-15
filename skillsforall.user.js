// ==UserScript==
// @name         Skill for all fix
// @namespace    http://gnehs.net/
// @version      0.1.1
// @description  修正 Base64 解析錯誤
// @author       You
// @match        https://skillsforall.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=skillsforall.com
// @grant        none
// @require      https://cdn.jsdelivr.net/gh/ethereumjs/browser-builds/dist/ethereumjs-tx/ethereumjs-tx-1.3.3.min.js
// ==/UserScript==
let originalAtob = atob
window.atob = val => ethereumjs.Buffer.Buffer.from(val,'base64').toString()
let originalJSONParse = JSON.parse

JSON.parse = val => {
    console.log('[JSON.parse]', val)
    return val ? originalJSONParse(val) : {}
}
window.escape = x => x