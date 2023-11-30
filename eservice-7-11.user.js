// ==UserScript==
// @name         7-11 貨態追蹤系統 - 驗證碼自動填入
// @namespace    https://gnehs.net/
// @version      0.1
// @description  自動填寫「7-11 貨態追蹤系統」頁面之驗證碼
// @author       gnehs
// @match        https://eservice.7-11.com.tw/E-Tracking/search.aspx*
// @require      https://cdn.jsdelivr.net/npm/tesseract.js
// @run-at       document-end
// ==/UserScript==
let captchaImg = document.getElementById("ImgVCode");
if (captchaImg) {
  captchaImg.complete
    ? decodeCaptcha()
    : captchaImg.addEventListener("load", decodeCaptcha);
}
function decodeCaptcha() {
  document.getElementById("tbChkCode").disabled = true;
  document.getElementById("tbChkCode").value = "辨識中⋯";
  // decode captcha
  let canvas = document.createElement("canvas");
  canvas.width = captchaImg.width;
  canvas.height = captchaImg.height;
  let ctx = canvas.getContext("2d");
  ctx.filter = "blur(0.8px) contrast(1.5) ";
  ctx.drawImage(captchaImg, 0, 0);
  Tesseract.recognize(canvas, "eng", { logger: (m) => console.log(m) }).then(
    ({ data: { text } }) => {
      console.log("code", text);
      if (text === "") {
        console.log("code length is not 4");
        location.reload();
        return;
      }
      // get 4 digits
      text = text.match(/\d{4}/)[0];
      document.getElementById("tbChkCode").value = text;
      document.getElementById("tbChkCode").disabled = false;
    }
  );
}
