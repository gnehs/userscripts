// ==UserScript==
// @name         北科 i 學園影片下載工具
// @namespace    https://gnehs.net/
// @version      0.2 
// @description  協助尼下載北科 i 學園影片的好朋友
// @author       gnehs
// @match        https://*.ntut.edu.tw/*
// @require      https://cdn.jsdelivr.net/npm/sweetalert2@11
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_addValueChangeListener
// ==/UserScript==

if (location.href.startsWith('https://istudy.ntut.edu.tw/learn/mooc_sysbar.php')) {
    window.addEventListener("load", function (event) {
        setTimeout(function () {
            GM_setValue("courseName", $("#selcourse option:selected").text());
        }, 100)
        $('#selcourse').on('change', function () {
            GM_setValue("courseName", $("#selcourse option:selected").text());
        });
    });
}

if (location.href.startsWith('https://istudy.ntut.edu.tw/learn/path/pathtree.php?cid=')) {
    window.addEventListener("load", function (event) {
        setTimeout(function () {
            GM_setValue("courseTitle", $(".step-process2 li.selected").text());
        }, 100)
        $(".step-process2 li").click(function () {
            setTimeout(function () {
                GM_setValue("courseTitle", $(".step-process2 li.selected").text());
                console.log("set", $(".step-process2 li.selected").text())
            }, 100)
        })
    });
}
if (location.href.startsWith('https://istream.ntut.edu.tw/videoplayer/player.php?vid=')) {
    let courseTitle = GM_getValue("courseTitle")
    let courseName = GM_getValue("courseName")
    GM_addValueChangeListener("courseTitle", function () {
        courseTitle = arguments[2]
    });
    GM_addValueChangeListener("courseName", function () {
        courseName = arguments[2]
    });
    const presenterLink = $('#src_presenter').attr('src')
    const presentationLink = $('#src_presentation').attr('src')
    Swal.fire({
        toast: true,
        position: 'top-end',
        showConfirmButton: true,
        title: `${courseName}<br/>${courseTitle}`,
        confirmButtonText: "關閉",
        html:
            `左方影片：<a href="${presenterLink}" download="${courseName}_${courseTitle}_l.mp4">下載</a><br/>` +
            `右方影片：<a href="${presentationLink}" download="${courseName}_${courseTitle}_r.mp4">下載</a>`
    })
}

if (location.href.startsWith('https://istudy.ntut.edu.tw/learn/path/player.php?file=')) {
    let courseTitle = GM_getValue("courseTitle")
    let courseName = GM_getValue("courseName")
    GM_addValueChangeListener("courseTitle", function () {
        courseTitle = arguments[2]
    });
    GM_addValueChangeListener("courseName", function () {
        courseName = arguments[2]
    });
    const link = new URL(location.href).searchParams.get('file')
    Swal.fire({
        toast: true,
        position: 'top-end',
        showConfirmButton: true,
        title: `${courseName}<br/>${courseTitle}`,
        confirmButtonText: "關閉",
        html:
            `影片：<a href="${link}" download="${courseName}_${courseTitle}.mp4">下載</a><br/>`
    })
}
