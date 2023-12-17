// ==UserScript==
// @name         北科入口網站 - 驗證碼自動填入
// @namespace    https://gnehs.net/
// @version      0.1
// @description  自動填寫「北科入口網站」頁面之驗證碼
// @author       gnehs
// @match        https://nportal.ntut.edu.tw/index.do*
// @require      https://cdnjs.cloudflare.com/ajax/libs/onnxruntime-web/1.16.3/ort.webgpu.min.js
// @run-at       document-end
// ==/UserScript==
// add onnxruntime-web
ort.env.wasm.wasmPaths =
  "https://cdnjs.cloudflare.com/ajax/libs/onnxruntime-web/1.16.3/";

let captchaImg = document.getElementById("authImage");
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

async function decodeCaptcha() {
  let captchaInput = document.getElementById("authcode");
  captchaInput.disabled = true;
  captchaInput.value = "模型讀取中⋯";
  const session = await ort.InferenceSession.create(
    `https://gnehs.github.io/NTUT-Portal-CAPTCHA-Recognition/model.onnx`
  );
  captchaInput.value = "辨識中⋯";
  // decode captcha
  let canvas = document.createElement("canvas");
  canvas.width = captchaImg.width;
  canvas.height = captchaImg.height;
  let ctx = canvas.getContext("2d");

  ctx.drawImage(captchaImg, 0, 0);
  // Convert the image data to a tensor
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
  // remove alpha channel
  let pixels = [];
  for (let i = 0; i < imageData.length; i += 4) {
    pixels.push(imageData[i]);
    pixels.push(imageData[i + 1]);
    pixels.push(imageData[i + 2]);
  }
  // Normalize the pixels [0, 255] to be between [-1, 1].
  const mean = 127.5;
  const std = 128;
  pixels = pixels.map((val) => (val - mean) / std);
  // 轉換為 C x H x W 格式
  const transposedImage = new Float32Array(3 * canvas.height * canvas.width);
  for (let c = 0; c < 3; c++) {
    for (let h = 0; h < canvas.height; h++) {
      for (let w = 0; w < canvas.width; w++) {
        // 計算在 transposedImage 中的索引
        const index = c * canvas.height * canvas.width + h * canvas.width + w;

        // 計算在 image 中的索引
        const originalIndex = h * canvas.width * 3 + w * 3 + c;

        // 將數據從 np_img 複製到 transposedImage
        transposedImage[index] = pixels[originalIndex];
      }
    }
  }

  const inputTensor = new ort.Tensor(
    "float32",
    new Float32Array(transposedImage),
    [1, 3, canvas.height, canvas.width]
  );
  // Run inference
  session
    .run({ input: inputTensor })
    .then((output) => {
      // output.output.data is length 26*4 of possible alphabets
      let possibleAlphabets = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
      let outputString = "";
      for (let i = 0; i < 4; i += 1) {
        let max = -100;
        let maxIndex = 0;
        for (let j = 0; j < 26; j++) {
          if (output.output.data[i * 26 + j] > max) {
            max = output.output.data[i * 26 + j];
            maxIndex = j;
          }
        }
        outputString += possibleAlphabets[maxIndex];
      }
      captchaInput.value = outputString;
      captchaInput.disabled = false;
    })
    .catch((err) => {
      console.error("Error running inference:", err);
    });
}
