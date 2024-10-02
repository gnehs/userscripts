// ==UserScript==
// @name         通用驗證碼填入工具
// @namespace    https://gnehs.net/
// @icon         https://gnehs.github.io/userscripts/assets/universal-captcha-recognition.png
// @version      0.3.2
// @description  沒有人喜歡驗證碼，本程式透過 ddddocr 在本機完成驗證碼辨識並填入，在支援的網站上再也無需手動輸入驗證碼！
// @author       gnehs
// @match        https://irs.thsrc.com.tw/IMINT*
// @match        https://www.einvoice.nat.gov.tw/*
// @match        https://apply.jcic.org.tw/CreditQueryInput.do
// @match        https://b2cinv.tradevan.com.tw/pinvc/Default.aspx
// @match        https://cart.books.com.tw/member/login*
// @match        https://hnetreg.cthyh.org.tw/new_CthWebReg/webreg/Reg/clinic_query.aspx*
// @match        https://cnms.chief.com.tw/*
// @require      https://cdnjs.cloudflare.com/ajax/libs/onnxruntime-web/1.16.3/ort.webgpu.min.js
// @run-at       document-end
// @updateURL    https://github.com/gnehs/userscripts/raw/main/universal-captcha-recognition.user.js
// @downloadURL  https://github.com/gnehs/userscripts/raw/main/universal-captcha-recognition.user.js
// ==/UserScript==
ort.env.wasm.wasmPaths =
  "https://cdnjs.cloudflare.com/ajax/libs/onnxruntime-web/1.16.3/";
(async () => {
  const websites = [
    {
      name: "台灣高鐵網路訂位",
      url: "https://irs.thsrc.com.tw/IMINT",
      captcha: "img#BookingS1Form_homeCaptcha_passCode",
      captchaRegex: /^[A-Z0-9]{4,5}$/,
      captchaParser: (x) => x.toUpperCase(),
      captchaInput: "input#securityCode",
      captchaReload: "#BookingS1Form_homeCaptcha_reCodeLink",
    },
    {
      name: "電子發票服務整合平台",
      url: "https://www.einvoice.nat.gov.tw/",
      captcha: `[alt="圖形驗證碼"]`,
      captchaRegex: /^[0-9]{5}$/,
      captchaParser: (x) => x,
      captchaInput: "input#captcha",
      captchaReload: `[aria-label="更新圖形驗證碼"]`,
    },
    {
      name: "個人線上查閱信用報告 | 財團法人金融聯合徵信中心",
      url: "https://apply.jcic.org.tw/CreditQueryInput.do",
      captcha: `#verify_code_image`,
      captchaRegex: /^[A-Z0-9]{6}$/,
      captchaParser: (x) => x.toUpperCase(),
      captchaInput: "input#verify_code",
      captchaReload: `[title="重新產生驗證碼"]`,
    },
    {
      name: "全聯 | B2C 電子發票服務",
      url: "https://b2cinv.tradevan.com.tw/pinvc/Default.aspx",
      captcha: `#captcha`,
      captchaRegex: /^[0-9]{5}$/,
      captchaParser: (x) => x,
      captchaInput: "input#captchaText",
      captchaReload: `a[href="javascript:changeCaptcha()"]`,
    },
    {
      name: "博客來_會員登入",
      url: "https://cart.books.com.tw/member/login",
      captcha: `#captcha_img img`,
      captchaFilter: "brightness(2) invert(1)",
      captchaRegex: /^[a-zA-Z0-9]{4}$/,
      captchaParser: (x) => x,
      captchaInput: "input#captcha",
      captchaReload: `a#regen`,
    },
    {
      name: "永和耕莘醫院 門診查詢",
      url: "https://hnetreg.cthyh.org.tw/new_CthWebReg/webreg/Reg/clinic_query.aspx",
      captcha: `[src="CheckImageCode.aspx"]`,
      captchaRegex: /^[A-Z0-9]{4}$/,
      captchaParser: (x) => x.toUpperCase(),
      captchaInput: "input#newtxtCheckCode",
    },
    {
      name: "是方電訊 流量分析暨網管監控系統",
      url: "https://cnms.chief.com.tw/#/login",
      captcha: `.imagesblock > img`,
      captchaRegex: /^[0-9]{5}$/,
      captchaParser: (x) => x.toUpperCase(),
      captchaInput: "input.inputblock_input",
    },
  ];

  let website = websites.filter((website) =>
    window.location.href.startsWith(website.url)
  )[0];
  if (website) {
    console.log(`[通用驗證碼填入工具] ${website.name}`);
    let toastContainer = document.createElement("div");
    toastContainer.className = "🥞toast-container";
    document.body.appendChild(toastContainer);

    let modelChar;
    let session;
    let classifying = false;
    let retryTimes = 0;

    let captchaInput;
    let captchaImg;
    let captchaImgSrc;

    new MutationObserver(checkInput).observe(document, {
      childList: true,
      subtree: true,
    });
    function checkInput(changes, observer) {
      captchaInput = document.querySelector(website.captchaInput);
      if (captchaInput && captchaInput.getAttribute("ucr") !== "inited") {
        captchaInput.disabled = true;
        captchaInput.value = "辨識中⋯";
        // add attr
        captchaInput.setAttribute("ucr", "inited");
      }
    }

    new MutationObserver(check).observe(document, {
      childList: true,
      subtree: true,
    });
    async function check(changes, observer) {
      // wait random time to avoid fire too many times
      await new Promise((resolve) => setTimeout(resolve, Math.random() * 200));
      captchaImg = document.querySelector(website.captcha);
      if (classifying) return;
      if (!captchaImg) return;

      if (captchaImgSrc !== captchaImg.src) {
        classifying = true;
        captchaInput.disabled = true;
        captchaInput.value = "辨識中⋯";

        // Image changed
        captchaImgSrc = document.querySelector(website.captcha).src;
        captchaImg.complete
          ? decodeCaptcha()
          : captchaImg.addEventListener("load", decodeCaptcha);
      }
    }
    async function loadModel() {
      let { remove } = toast("正在載入模型", "loading");
      modelChar = await fetch(
        `https://gnehs.github.io/userscripts/assets/ddddocr/char.json`
      ).then((res) => res.json());
      session = await ort.InferenceSession.create(
        await fetch(
          `https://gnehs.github.io/userscripts/assets/ddddocr/common.onnx`
        ).then((res) => res.arrayBuffer())
      );
      remove();
    }
    async function decodeCaptcha() {
      if (!session) await loadModel();
      console.log("[通用驗證碼填入工具] 正在辨識驗證碼");
      let result = await classifyImage(captchaImgSrc);
      result = website.captchaParser(result);
      console.log(`[通用驗證碼填入工具] 辨識結果：${result}`);
      if (!result.match(website.captchaRegex)) {
        if (retryTimes > 10) {
          toast(`辨識失敗，請手動輸入驗證碼`, "error");
        } else {
          console.log(
            `[通用驗證碼填入工具] 辨識結果不符合驗證碼格式，重新載入驗證碼`
          );
          if (website.captchaReload) {
            document.querySelector(website.captchaReload).click();
          } else {
            return location.reload();
          }
          retryTimes++;
          classifying = false;
        }
      } else {
        toast(`完成辨識：${result}`);
        captchaInput.disabled = false;
        captchaInput.focus();
        captchaInput.value = result;
        captchaInput.dispatchEvent(new Event("input", { bubbles: true })); // trigger input event
        captchaInput.dispatchEvent(new Event("blur", { bubbles: true })); // trigger input event
        classifying = false;
      }
      async function classifyImage(src) {
        const inputTensor = await convertImageToTensor(src);
        const {
          output: { data: outputData },
        } = await session.run({ input1: inputTensor });
        let res = [...outputData]
          .filter(Boolean)
          .map((i) => modelChar[Number(i)])
          .join("");
        return res;
      }
      async function convertImageToTensor() {
        let canvas = document.createElement("canvas");
        let width = captchaImg.width;
        let height = captchaImg.height;
        let dims = [1, 1, 64, Math.floor(width * (64 / height))];
        canvas.height = dims[2];
        canvas.width = dims[3];
        let ctx = canvas.getContext("2d");
        // fill white
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, dims[3], dims[2]);
        // filter
        if (website.captchaFilter) {
          ctx.filter = website.captchaFilter;
        }
        // draw captcha
        ctx.filter = `grayscale(1) ${
          website.captchaFilter ? website.captchaFilter : ""
        }`;
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

    //-
    // Notification Center
    //-
    function appendStyle() {
      // Add CSS Style
      const style = document.createElement("style");
      style.innerHTML = `
  .🥞toast-container,
  .🥞toast-container * {
    box-sizing: border-box;
  }
  .🥞toast-container {
    view-transition-name: toast-container;
    position: fixed;
    bottom: 8px;
    left: 0;
    right: 0;
    margin: auto;
    width: 240px;
    height: 100%;
    pointer-events: none;
    z-index: 999999;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-end;
    flex-wrap: wrap;
    gap: 8px;
  }
  .🥞toast{
    padding: 8px 12px;
    padding-left: 16px;
    border-radius: 100em;
    background-color: rgba(0, 0, 0, 0.8);
    color: #fff;
    font-family: Lato, 'Noto Sans TC', sans-serif;
    font-size: 14px;
    text-align: left;
    transition: all 0.25s ease;
    pointer-events: all;
    width: 100%;
    line-height: 1.5em;
    overflow: hidden;
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: flex-start;
    gap: 16px;
  }
  .🥞toast-content{
    flex: 1;
  }
  .🥞toast-icon{
    height: 24px;
    width: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: rgba(0, 0, 0, 0.05);
    border-radius: 12px;
  }
  .🥞toast-icon i{
    font-size: 24px;
  }
`;
      document.head.appendChild(style);
      function addStyleSheet(href) {
        var head = document.getElementsByTagName("head")[0];
        var link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = href;
        head.appendChild(link);
      }
      addStyleSheet(
        "https://cdn.jsdelivr.net/npm/boxicons/css/boxicons.min.css"
      );
      addStyleSheet(
        "https://fonts.googleapis.com/css2?family=Lato:wght@400;700&family=Noto+Sans+TC:wght@400;700&display=swap"
      );
    }
    appendStyle();
    function toast(message, type = "info", { timeout = 3000 } = {}) {
      const toast = document.createElement("div");
      const toastId = Math.random().toString(36).substr(2, 9);
      toast.className = `🥞toast 🥞toast-${type}`;
      let icon = `<i class='bx bx-info-circle'></i>`;
      if (type === "success") icon = `<i class='bx bx-check-circle' ></i>`;
      if (type === "loading") icon = `<i class='bx bx-loader bx-spin' ></i>`;
      if (type === "error") icon = `<i class='bx bx-x' ></i>`;
      if (type === "warn") icon = `<i class='bx bx-error' ></i>`;
      toast.innerHTML = `<div class="🥞toast-icon">${icon}</div><div class="🥞toast-content"><div class="🥞toast-message">${message}</div></div>`;
      toast.style = `view-transition-name: toast-${toastId};`;

      document.startViewTransition(() => toastContainer.appendChild(toast));
      let removeTimeout = setTimeout(() => remove(), timeout);
      function remove() {
        removeTimeout && clearTimeout(removeTimeout);
        document.startViewTransition(() => toast.remove());
      }
      return { remove };
    }
  }
})();
