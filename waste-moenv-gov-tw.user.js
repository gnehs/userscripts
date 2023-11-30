// ==UserScript==
// @name         事業廢棄物申報及管理資訊系統 - 驗證碼自動填入
// @namespace    https://gnehs.net/
// @version      0.1
// @description  自動填寫「事業廢棄物申報及管理資訊系統」頁面之驗證碼
// @author       gnehs
// @match        https://waste.moenv.gov.tw/RWD/LGN/
// @require      https://cdn.jsdelivr.net/npm/tesseract.js
// @run-at       document-end
// ==/UserScript==
let captchaImg = document.getElementById("EriCaptcha");

// watch captchaImg src
let src = captchaImg.src || "";
setInterval(() => {
  if (src !== captchaImg.src) {
    src = captchaImg.src;
    captchaImg.complete
      ? decodeCaptcha()
      : captchaImg.addEventListener("load", decodeCaptcha);
  }
}, 100);

function decodeCaptcha() {
  console.log("decodeCaptcha");
  document.getElementById("txtCaptcha").disabled = true;
  document.getElementById("txtCaptcha").value = "辨識中⋯";
  // decode captcha
  let canvas = document.createElement("canvas");
  canvas.width = captchaImg.width;
  canvas.height = captchaImg.height;
  let ctx = canvas.getContext("2d");
  ctx.filter = "blur(0.75px) brightness(1.75) contrast(1.5)";
  ctx.drawImage(captchaImg, 0, 0);
  Tesseract.recognize(canvas, "eng", { logger: (m) => console.log(m) }).then(
    ({ data: { text } }) => {
      if (text === "" || text.trim().length !== 4) {
        captchaImg.click();
      } else {
        document.getElementById("txtCaptcha").value = text.toUpperCase();
        document.getElementById("txtCaptcha").disabled = false;
      }
    }
  );
}
