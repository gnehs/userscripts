// ==UserScript==
// @name         威秀 - 驗證碼自動填入
// @namespace    https://gnehs.net/
// @version      0.1
// @description  自動填寫「威秀」頁面之驗證碼
// @author       gnehs
// @match        https://sales.vscinemas.com.tw/VieShowTicket/PaymentHistory*
// @grant        GM_addStyle
// @require      https://cdn.jsdelivr.net/npm/tesseract.js
// ==/UserScript==
let captchaImg = document.getElementById("valiCode");

// watch captchaImg src
let src = "";
setInterval(() => {
  if (src !== captchaImg.src) {
    src = captchaImg.src;
    captchaImg.complete
      ? decodeCaptcha()
      : captchaImg.addEventListener("load", decodeCaptcha);
  }
}, 100);

function decodeCaptcha() {
  document.getElementById("inputValidateCode").disabled = true;
  document.getElementById("inputValidateCode").value = "辨識中⋯";
  // decode captcha
  let canvas = document.createElement("canvas");
  canvas.width = captchaImg.width;
  canvas.height = captchaImg.height;
  let ctx = canvas.getContext("2d");
  ctx.filter = "blur(0.9px) contrast(1.5)";
  ctx.drawImage(captchaImg, 0, 0);
  Tesseract.recognize(canvas, "eng", { logger: (m) => console.log(m) }).then(
    ({ data: { text } }) => {
      document.getElementById("inputValidateCode").value = text;
      document.getElementById("inputValidateCode").disabled = false;
    }
  );
}
