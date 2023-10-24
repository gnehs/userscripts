// ==UserScript==
// @name               Twitter link tracker remover
// @name:zh-TW         Twitter 追蹤連結移除器
// @namespace          https://gnehs.net/
// @version            0.3
// @description        Remove Twitter's link tracker, and replace it with vxtwitter link.
// @description:zh-TW  移除 Twitter 的連結追蹤器，並將連結改為 vxtwitter 連結來修復預覽圖片。
// @author             gnehs
// @match              https://twitter.com/*
// @icon               https://www.google.com/s2/favicons?sz=64&domain=twitter.com
// @grant              none
// ==/UserScript==
if (!localStorage["alert.msg"]) {
  let lang = navigator.language || navigator.userLanguage;
  if (lang === "zh-TW") {
    alert(
      "感謝安裝 Link tracker remover (Twitter)，請點擊「允許」按鈕允許該腳本讀取你的剪貼簿。"
    );
  } else {
    alert(
      'Thanks to the installation of Link tracker remover (Twitter), you need to allow the script to read your clipboard by clicking the "Allow" button.'
    );
  }
  navigator.clipboard.readText();
  localStorage["alert.msg"] = true;
}
document.addEventListener("copy", async (event) => {
  const text = await navigator.clipboard.readText();
  if (text.match(/^https:\/\/x\.com\/(.+)/)) {
    try {
      let link = new URL(text);
      link.search = "";
      link.hash = "";
      link.host = "vxtwitter.com";
      await navigator.clipboard.writeText(link.href);
    } catch (e) {
      console.log(e);
    }
  }
});
