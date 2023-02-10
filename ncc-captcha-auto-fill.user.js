// ==UserScript==
// @name         NCC 型式認證資料查詢 - 驗證碼自動填入
// @namespace    https://gnehs.net/
// @version      0.1.1
// @description  自動填寫「NCC 型式認證資料查詢」頁面之驗證碼
// @author       gnehs
// @match        https://nccmember.ncc.gov.tw/Application/Fun/Fun016.aspx
// @grant        GM_addStyle
// @require      https://cdn.jsdelivr.net/npm/tesseract.js
// ==/UserScript==
let captchaImg = document.getElementById("imgValid");
if (captchaImg) {
  document.getElementById("txbVerify").disabled = true;
  document.getElementById("txbVerify").value = "辨識中⋯"
  // decode captcha
  let canvas = document.createElement('canvas');
  canvas.width = captchaImg.width;
  canvas.height = captchaImg.height;
  let ctx = canvas.getContext('2d')
  ctx.filter = "brightness(6) grayscale(1) contrast(20)";
  ctx.drawImage(captchaImg, 0, 0);
  Tesseract
    .recognize(canvas, 'eng', { logger: m => console.log(m) })
    .then(({ data: { text } }) => {
      document.getElementById("txbVerify").value = text;
      document.getElementById("txbVerify").disabled = false;
    });
}