// ==UserScript==
// @name         北科入口自動跳過驗證碼
// @namespace    https://gnehs.net/
// @version      0.2 
// @description  免驗證碼登入北科入口
// @author       gnehs
// @match        https://nportal.ntut.edu.tw/index.do*
// @grant        GM_cookie
// @grant        GM.cookie
// @require      https://cdn.jsdelivr.net/npm/sweetalert2@11
// ==/UserScript==

//clear cookies
GM_cookie('list', {}, function (cookies, error) {
    if (!error) {
        for (let { name } of cookies) {
            GM_cookie.delete({ name }, () => { })
        }
    } else {
        Swal.fire({
            title: '發生了錯誤',
            html: `您安裝的版本不支援此功能，推薦安裝 <a href="https://chrome.google.com/webstore/detail/tampermonkey-beta/gcalenpjmijncebpfijmoaglllgpjagf/">Tampermonkey BETA</a> 來使用這個 Script<br/>Error: ${error}`,
            icon: 'error',
            confirmButtonText: '好喔'
        })
    }
});
window.addEventListener("load", function (event) {
    // login
    document.oncontextmenu = () => true;
    for (let ele of document.querySelectorAll(".authcode.co,.authcode.co+.co,input:not(#muid):not(#mpassword):not(.l_icon01)")) {
        ele.remove();
    }
    login1 = () => {
        document.login.submit();
    }
})