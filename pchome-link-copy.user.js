// ==UserScript==
// @name         PChome link Fix
// @namespace    https://gnehs.net/
// @version      0.3.1
// @description  複製帶有預覽的 PChome 連結
// @author       gnehs
// @match        https://24h.pchome.com.tw/prod/*
// @icon         https://p.pancake.tw/favicon.svg
// @grant        GM_addStyle
// ==/UserScript==

let buttonStyle = `
.copy-link-button {
  position: fixed;
  top: 3px;
  right: 3px;
  padding: 0.5rem;
  background: #fff;
  border: 1px solid #ccc;
  box-shadow: 0px 3px 3px rgb(0 0 0 / 15%);
  border-radius: 4px;
  z-index: 9999;

  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
}
.copy-link-button svg{
  width: 1rem;
  height: 1rem;
}
.copy-link-button:hover {
  background: #eee;
  border-color: #aaa;
}
.copy-link-button:active {
  background: #ddd;
  border-color: #999;
  transform: translateY(1.5px);
  box-shadow: 0px 1.5px 3px rgb(0 0 0 / 15%);
}
`
GM_addStyle(buttonStyle)

let link = location.href
  .replace('https://24h.pchome.com.tw', 'https://p.pancake.tw')
  .replace('/prod/v1/', '/prod/');
let button = document.createElement("button");
let copySvg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" style="fill: rgba(0, 0, 0, 1);transform: ;msFilter:;"><path d="M20 2H10c-1.103 0-2 .897-2 2v4H4c-1.103 0-2 .897-2 2v10c0 1.103.897 2 2 2h10c1.103 0 2-.897 2-2v-4h4c1.103 0 2-.897 2-2V4c0-1.103-.897-2-2-2zM4 20V10h10l.002 10H4zm16-6h-4v-4c0-1.103-.897-2-2-2h-4V4h10v10z"></path></svg>`
let checkSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" style="fill: rgba(0, 0, 0, 1);transform: ;msFilter:;"><path d="m10 15.586-3.293-3.293-1.414 1.414L10 18.414l9.707-9.707-1.414-1.414z"></path></svg>`
button.innerHTML = `${copySvg} 複製連結`;
button.classList.add("copy-link-button");
button.onclick = async function () {
  try {
    await navigator.clipboard.writeText(link)
    button.innerHTML = `${checkSvg} 已複製！`;
    setTimeout(function () {
      button.innerHTML = `${copySvg} 複製連結`;
    }, 500);
  } catch (e) {
    window.prompt("請複製以下內容", link)
  }
};
document.body.appendChild(button);