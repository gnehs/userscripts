// ==UserScript==
// @name         PChome 抽獎自動登記
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  自動幫你登記 PChome 抽獎
// @author       gnehs
// @match        https://ecvip.pchome.com.tw/web/prize/register*
// @require      https://cdn.jsdelivr.net/npm/sweetalert2@11
// @icon         https://www.google.com/s2/favicons?sz=64&domain=pchome.com.tw
// @grant        none
// ==/UserScript==

window.alert = function (message) {
  Swal.fire({
    toast: true,
    position: 'top-end',
    title: '提醒',
    text: message,
    icon: 'info',
    showConfirmButton: false,
    timer: 1500
  })
}

window.addEventListener("load", function (event) {
  let checkToast = Swal.fire({
    toast: true,
    position: 'top-end',
    title: `檢查中...`,
    html: `正在檢查獎項`,
    icon: 'info',
    showConfirmButton: false
  })
  setTimeout(function () {
    checkToast.close();
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
        alert("正在前往下一頁")
        location.href = `https://ecvip.pchome.com.tw/web/prize/register&p=${page}`
      } else {
        Swal.fire({
          title: `完成`,
          html: `所有獎項皆已登記完成！`,
          icon: 'success',
        })
      }
    }
  }, 1000)
});
function showRegisterDialog() {
  let phone = prompt("請填寫手機號碼：", "");
  let isOk = confirm(`確定要登記為 ${phone}？`);
  if (isOk) {
    localStorage["register-data"] = phone;
  }
  else {
    showRegisterDialog();
  }
}
