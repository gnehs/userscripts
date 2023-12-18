// ==UserScript==
// @name         通用驗證碼填入工具
// @namespace    https://gnehs.net/
// @version      0.1
// @description  沒有人喜歡驗證碼，本程式透過 ddddocr 在本機完成驗證碼辨識並填入，在支援的網站上再也無需手動輸入驗證碼！
// @author       gnehs
// @match        https://irs.thsrc.com.tw/IMINT*
// @grant        GM_addStyle
// @require      https://cdnjs.cloudflare.com/ajax/libs/onnxruntime-web/1.16.3/ort.webgpu.min.js
// @resource     model  https://github.com/gnehs/userscripts/raw/main/assets/ddddocr/common.onnx
// @resource     modelChar  https://github.com/gnehs/userscripts/raw/main/assets/ddddocr/char.json
// @grant        GM_getResourceURL
// @run-at       document-end
// ==/UserScript==
const websites = [
  {
    name: "台灣高鐵網路訂位",
    url: "https://irs.thsrc.com.tw/IMINT",
    captcha: "img#BookingS1Form_homeCaptcha_passCode",
    captchaRegex: /^[A-Z0-9]{4}$/,
    captchaParser: (x) => x.toUpperCase(),
    captchaInput: "input#securityCode",
    captchaReload: "#BookingS1Form_homeCaptcha_reCodeLink",
  },
];

ort.env.wasm.wasmPaths =
  "https://cdnjs.cloudflare.com/ajax/libs/onnxruntime-web/1.16.3/";

let website = websites.filter((website) =>
  window.location.href.startsWith(website.url)
)[0];
if (website) {
  console.log(`[通用驗證碼填入工具] ${website.name}`);

  const captchaInput = document.querySelector(website.captchaInput);
  captchaInput.disabled = true;
  captchaInput.value = "模型讀取中⋯";

  const model = await fetch(GM_getResourceURL("model")).then((res) =>
    res.arrayBuffer()
  );
  const modelChar = await fetch(GM_getResourceURL("modelChar")).then((res) =>
    res.json()
  );
  const session = await ort.InferenceSession.create(model);

  let captchaImg;
  let captchaImgSrc;
  setInterval(() => {
    captchaImg = document.querySelector(website.captcha);
    if (!captchaImg) return;
    if (captchaImgSrc !== captchaImg.src) {
      console.log("[通用驗證碼填入工具] 驗證碼圖片已更新");
      captchaImgSrc = document.querySelector(website.captcha).src;
      captchaImg.complete
        ? decodeCaptcha()
        : captchaImg.addEventListener("load", decodeCaptcha);
    }
  }, 100);
  async function decodeCaptcha() {
    captchaInput.disabled = true;
    captchaInput.value = "辨識中⋯";
    console.log("[通用驗證碼填入工具] 正在辨識驗證碼");
    let result = await classifyImage(captchaImgSrc);
    result = website.captchaParser(result);
    console.log(`[通用驗證碼填入工具] 辨識結果：${result}`);
    if (!result.match(website.captchaRegex)) {
      console.log(
        `[通用驗證碼填入工具] 辨識結果不符合驗證碼格式，重新載入驗證碼`
      );
      document.querySelector(website.captchaReload).click();
    } else {
      captchaInput.value = result;
      captchaInput.disabled = false;
    }
  }
  async function classifyImage(src) {
    const inputTensor = await coverImageToTensor(src);
    const {
      output: { data: outputData },
    } = await session.run({ input1: inputTensor });
    let res = [...outputData]
      .filter(Boolean)
      .map((i) => modelChar[Number(i)])
      .join("");
    return res;
  }
  async function coverImageToTensor() {
    let canvas = document.createElement("canvas");
    let width = captchaImg.width;
    let height = captchaImg.height;
    let dims = [1, 1, 64, Math.floor(width * (64 / height))];
    canvas.height = dims[2];
    canvas.width = dims[3];
    let ctx = canvas.getContext("2d");
    ctx.filter = "grayscale(1)";
    ctx.drawImage(captchaImg, 0, 0, dims[3], dims[2]);
    const bitmapData = ctx.getImageData(0, 0, dims[3], dims[2]).data;
    // coverImageToTensor
    const redArray = [];
    const greenArray = [];
    const blueArray = [];
    for (let i = 0; i < bitmapData.length; i += 4) {
      redArray.push(bitmapData[i]);
      greenArray.push(bitmapData[i + 1]);
      blueArray.push(bitmapData[i + 2]);
    }

    const transposedData = redArray.concat(greenArray).concat(blueArray);

    const float32Data = new Float32Array(dims.reduce((a, b) => a * b));
    for (let i = 0; i < transposedData.length; i++) {
      float32Data[i] = transposedData[i] / 255;
    }

    return new ort.Tensor("float32", float32Data, dims);
  }
}
