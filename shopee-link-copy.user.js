// ==UserScript==
// @name         蝦皮短網址
// @namespace    https://gnehs.net/
// @version      0.2
// @description  複製蝦皮商品連結短網址
// @icon         https://shopee.tw/pcmall-assets/assets/icon_favicon_1_96.png
// @author       gnehs
// @match        https://shopee.tw/*
// @grant        GM_addStyle
// ==/UserScript==

let buttonStyle = `
.copy-link-button {
  all: unset;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  font-size: 16px;
  color: #222;
  cursor: pointer;
}
.copy-link-button svg{
  width: 24px;
  height: 24px;
}
`;
GM_addStyle(buttonStyle);
(function () {
  const ob = new MutationObserver(function (mutationsList, observer) {
    addCopyLinkButton();
  });

  ob.observe(document, {
    childList: true,
    subtree: true,
  });
  function addCopyLinkButton() {
    let container = document.querySelector(
      '.flex[style="margin-top: 15px;"]:not(:has(.copy-link-button))'
    );
    if (container) {
      container.querySelector(".V5X-KA").remove();
      container.style = `margin-top: 15px; display: grid; grid-template-columns: repeat(2, 1fr);`;
      console.log(new Date().toLocaleString(), "add button");
      let buttonContainer = document.createElement("div");
      let button = document.createElement("button");
      buttonContainer.className = "flex items-center V5X-KA justify-center";

      let copySvg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" style="fill: rgba(0, 0, 0, 1);transform: ;msFilter:;"><path d="M20 2H10c-1.103 0-2 .897-2 2v4H4c-1.103 0-2 .897-2 2v10c0 1.103.897 2 2 2h10c1.103 0 2-.897 2-2v-4h4c1.103 0 2-.897 2-2V4c0-1.103-.897-2-2-2zM4 20V10h10l.002 10H4zm16-6h-4v-4c0-1.103-.897-2-2-2h-4V4h10v10z"></path></svg>`;
      let checkSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" style="fill: rgba(0, 0, 0, 1);transform: ;msFilter:;"><path d="m10 15.586-3.293-3.293-1.414 1.414L10 18.414l9.707-9.707-1.414-1.414z"></path></svg>`;
      button.innerHTML = `${copySvg} 複製連結`;
      button.classList.add("copy-link-button");
      button.onclick = async function () {
        try {
          let link = location.href;
          let parser = document.createElement("a");
          parser.href = link;

          let shopeePath = parser.pathname.split("-");
          shopeePath = shopeePath[shopeePath.length - 1].split(".");
          if (shopeePath[0] == "i" && shopeePath.length == 3) {
            link =
              "https://shopee.tw/product/" +
              shopeePath[1] +
              "/" +
              shopeePath[2];
          }
          await navigator.clipboard.writeText(link);
          button.innerHTML = `${checkSvg} 已複製！`;
          setTimeout(function () {
            button.innerHTML = `${copySvg} 複製連結`;
          }, 500);
        } catch (e) {
          window.prompt("請複製以下內容", text);
        }
      };
      buttonContainer.appendChild(button);
      container.prepend(buttonContainer);
    }
  }
})();
