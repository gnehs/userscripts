// ==UserScript==
// @name         智障轉換器
// @namespace    https://gnehs.net/
// @version      0.1
// @description  自動將頁面中的「智能」轉換為「智障」
// @author       gnehs
// @match        *://*/*
// @grant        none
// ==/UserScript==
const ob = new MutationObserver(function (mutationsList, observer) {
  _replaceText_()
  // clear out any changes made during this function - prevents bouncing
  observer.takeRecords();
})

ob.observe(document, {
  childList: true,
  subtree: true
});

document.addEventListener('DOMContentLoaded', _replaceText_());

function _replaceText_() {
  document.querySelectorAll("*").forEach((element) => {
    // ignore script and style
    if (element.tagName === "SCRIPT" || element.tagName === "STYLE") {
      return;
    }
    if (element.childNodes.length <= 1) {
      if (!element.innerHTML.match(/<[^>]*>/g)) {
        if (element.innerHTML.includes("智能")) {
          element.innerHTML = element.innerHTML.replace(/智能/g, "智障");
          console.log(element.childNodes.length, element.tagName, element.innerHTML);
        }
      }
    }
  });
}