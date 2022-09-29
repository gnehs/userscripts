// ==UserScript==
// @name         PChome link Fix
// @namespace    https://gnehs.net/
// @version      0.1
// @description  複製帶有預覽的 PChome 連結
// @author       gnehs
// @match        https://24h.pchome.com.tw/prod/*
// @grant        none
// ==/UserScript==

window.addEventListener("load", function (event) {
  let buttonStyle = `
  .copy-link-button {
    position: fixed;
    top: 3px;
    right: 3px;
    padding: 0.5rem;
    background: #fff;
    border: 1px solid #ccc;
    border-radius: 4px;
    z-index: 9999;
  }
  .copy-link-button:hover {
    background: #eee;
    border-color: #aaa;
  }
  .copy-link-button:active {
    background: #ddd;
    border-color: #999;
  }
  `
  let style = document.createElement('style');
  style.innerHTML = buttonStyle;
  document.head.appendChild(style);

  let link = location.href.replace('https://24h.pchome.com.tw', 'https://p.pancake.tw');
  let button = document.createElement("button");
  button.innerText = "複製連結";
  button.classList.add("copy-link-button");
  button.onclick = async function () {
    try {
      await navigator.clipboard.writeText(link)
      button.innerText = "已複製！";
      setTimeout(function () {
        button.innerText = "複製連結";
      }, 1000);
    } catch (e) {
      window.prompt("請複製以下內容", text)
    }
  };
  document.body.appendChild(button);
})