// ==UserScript==
// @name         北科 i 學園 PDF 下載工具
// @namespace    https://gnehs.net/
// @version      0.1
// @description  協助尼下載北科 i 學園 PDF 的好朋友
// @author       gnehs
// @match        https://istudy.ntut.edu.tw/learn/path/viewPDF.php*
// @require      https://cdn.jsdelivr.net/npm/sweetalert2@11
// @icon         https://www.google.com/s2/favicons?sz=64&domain=edu.tw
// @grant        none
// ==/UserScript==
function addGlobalStyle(css) {
  var head, style;
  head = document.getElementsByTagName('head')[0];
  if (!head) { return; }
  style = document.createElement('style');
  style.type = 'text/css';
  style.innerHTML = css;
  head.appendChild(style);
}

addGlobalStyle('.swal2-container{z-index: 100000000000; !important}');
window.addEventListener("load", async function (event) {
  let url_string = "https://istudy.ntut.edu.tw/learn/path/" + DEFAULT_URL;
  let url = new URL(url_string);
  let u = await fetch(url_string, {
    method: 'GET'
  })
    .then(response => response.blob())
    .then(blob => {
      return window.URL.createObjectURL(blob);
    });
  Swal.fire({
    toast: true,
    position: 'top-end',
    showConfirmButton: true,
    title: `下載`,
    confirmButtonText: "關閉",
    html:
      `檔案：<a href="${u}" download="${url.searchParams.get("id")}">下載</a><br/>`
  })
});