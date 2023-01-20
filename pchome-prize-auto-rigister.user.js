// ==UserScript==
// @name         PChome 抽獎自動登記
// @namespace    https://gnehs.net/
// @version      0.2.0
// @description  自動幫你登記 PChome 抽獎
// @author       gnehs
// @match        https://ecvip.pchome.com.tw/web/prize/register*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=pchome.com.tw
// @grant        none
// ==/UserScript==
const alertContainer = document.createElement("div")
alertContainer.id = "alert-container"
alertContainer.style = `position: fixed;bottom: 8px;left: 0px;right: 0px;width: 500px;line-height: 1.5;display: inline-block;z-index: 9999;margin: 0px auto;text-align: center;background: rgb(34, 34, 34);border: 1px solid rgb(17, 17, 17);box-shadow: rgba(0, 0, 0, 0.15) 0px 3px 3px;border-radius: 100em;padding: 16px 24px;font-size: 14px;color: rgb(255, 255, 255);`
alertContainer.innerHTML = "🥞 載入中…"
document.body.appendChild(alertContainer)

window.alert = function (message) {
  alertContainer.innerHTML = message
}

window.addEventListener("load", function (event) {
  alert("✨ 正在檢查獎項…")
  setTimeout(function () {
    if (document.querySelector(".doReg")) {
      console.log("doreg")
      if (!localStorage["register-data"]) {
        showRegisterDialog()
      }
      document.querySelector(".doReg").click()
      setTimeout(function () {
        document.getElementById("regMobile").value = localStorage["register-data"];
        if (!document.getElementById("regSameEmailBox").checked) {
          document.getElementById("regSameEmailLabel").click()
        }
        document.getElementById("regSubmit").click()
      }, 1000)
    } else {
      if (document.querySelector(`li:nth-last-child(1) span.page`)) {
        let page = document.querySelector(`li:nth-last-child(1) span.page`).attributes.getNamedItem("data-act").value
        alert("➡️ 正在前往下一頁…")
        location.href = `https://ecvip.pchome.com.tw/web/prize/register&p=${page}`
      } else {
        alert("🎉 所有獎項皆已登記完成！")
        setTimeout(function () {
          alertContainer.style.display = "none"
        }, 3000)
      }
    }
  }, 1000)
});
function showRegisterDialog() {
  let phone = prompt("請填寫手機號碼：", "");
  let isOk = confirm(`確定要登記為「${phone}」？`);
  if (isOk) {
    localStorage["register-data"] = phone;
    alert("將自動使用此手機號碼與您購物時所登記之電子郵件進行登記。")
  }
  else {
    showRegisterDialog();
  }
}
