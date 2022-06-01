// ==UserScript==
// @name         北科網路教學評量自動填寫小精靈
// @namespace    https://gnehs.net/
// @version      0.4
// @description  幫你自動填寫北科教學評量系統
// @author       gnehs
// @match        https://isms-nagios.ntut.edu.tw/tgrade/PortalTGrade.jsp
// @require      https://cdn.jsdelivr.net/npm/sweetalert2@11
// @grant        none
// ==/UserScript==
Array.prototype.pickRandom = function () {
    return this[Math.floor(Math.random() * this.length)];
}
const goodWords = ["好", "優質", "讚", "棒", "認真"]
const badWords = ["不好", "差勁", "爛", "壞"]
const ProsSentences = [
    `老師很${goodWords.pickRandom()} 講話幽默 希望我們能上課盡量學起來`,
    `老師上課教學非常${goodWords.pickRandom()}!!`,
    `老師上課${goodWords.pickRandom()}`,
    `符合教學目標或課程進度`,
    `講解得很${goodWords.pickRandom()}~`,
    `非常豐富${goodWords.pickRandom()}`,
    `教學${goodWords.pickRandom()} 顧及全全體學生的品行 程度 切合覺生得需求`,
    `持續進步中....:D`,
    `出乎意料之外的${goodWords.pickRandom()}!!!。感覺上課是一件令人亢奮的事`,
    `老師上課很${goodWords.pickRandom()}`,
    `老師教學方式${goodWords.pickRandom()}`,
    `覺得老師的上課態度非常${goodWords.pickRandom()}~  很喜歡上老師的課`,
    `教學認真,有朝氣,有活力,很讚!GOOD。`,
    `很${goodWords.pickRandom()}！繼續保持`,
    `教學認真,準備充分!`,
    `老師上課認真  準時上下課`,
    `教學方法能夠引起興趣，講解清楚，${goodWords.pickRandom()}！`,
    `內容淺顯易懂`,
    `評量方式清楚且公平，作業安排很好`,
    `老師上課講解都很清楚`,
    `準備充分,認真負責`,
]
const ConsSentences = [
    `普普通通而已`,
    `教學時 很容易變得很沉悶 ${badWords.pickRandom()}`,
    `老師很${badWords.pickRandom()}也會督促學生努力向上`,
    `在課堂上覺得${badWords.pickRandom()}`,
    `覺得上課很${badWords.pickRandom()}`,
    `少當一點人`,
    `內容有點難，希望老師能多給一點時間讓學生思考`,
    `上課內容無聊，很${badWords.pickRandom()}`,
    `希望可以說慢一點可以更容易理解`,
    `課程進度落後。就有點在趕進度。有些會不懂在說什麼`,
]

Swal.fire({
    toast: true,
    icon: 'info',
    position: 'top-end',
    title: `自動填寫小精靈`,
    showConfirmButton: true,
    showCancelButton: true,
    confirmButtonText: `填同意`,
    cancelButtonText: `填不同意`,
    html: `要幫你填嗎？`
}).then((result) => {
    document.querySelector(`input[type=CheckBox][name="dec"]`).checked = true
    if (result.isConfirmed) {
        // 同意
        for (let ele of document.querySelectorAll(`tr:not([bgcolor="#CCFFCC"])>td:nth-child(2)>input`)) {
            ele.checked = true;
        }
        for (let ele of document.querySelectorAll(`tr:not([bgcolor="#CCFFCC"])>td:nth-child(3)>input`)) {
            if (Math.random() > 0.6) ele.checked = true;
        }
        for (let ele of document.querySelectorAll(`textarea`)) {
            ele.value = ProsSentences.pickRandom()
        }
    } else if (result.isDismissed) {
        // 不同意
        for (let ele of document.querySelectorAll(`tr:not([bgcolor="#CCFFCC"])>td:last-child>input`)) {
            ele.checked = true;
        }
        for (let ele of document.querySelectorAll(`tr:not([bgcolor="#CCFFCC"])>td:nth-last-child(2)>input`)) {
            if (Math.random() > 0.35) ele.checked = true;
        }
        for (let ele of document.querySelectorAll(`textarea`)) {
            ele.value = ConsSentences.pickRandom()
        }
    }
    // 其他
    [...document.querySelectorAll(`tr:not([bgcolor="#CCFFCC"])>td:nth-child(2)>input[type="checkbox"]`)].at(-1).checked = false
    if (result.isConfirmed || result.isDismissed) {
        Swal.fire('填寫完畢', '記得檢查一下內容再送出', 'success')
    }
})