// ==UserScript==
// @name         北科 i 學園影片下載工具
// @namespace    https://gnehs.net/
// @version      0.2.1
// @description  協助尼下載北科 i 學園影片的好朋友
// @author       gnehs
// @match        https://*.ntut.edu.tw/*
// @require      https://cdn.jsdelivr.net/npm/sweetalert2@11
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_addValueChangeListener
// ==/UserScript==
function addGlobalStyle(css) {
	var head, style;
	head = document.getElementsByTagName('head')[0];
	if (!head) { return; }
	style = document.createElement('style');
	style.innerHTML = css;
	head.appendChild(style);
}
addGlobalStyle(`
  .swal2-container{z-index: 100000000000; !important}
  .swal2-popup.swal2-toast.swal2-show { 
		animation: custom-toast-show .4s !important;
  }
  @keyframes custom-toast-show {
		0% {
			transform: translateX(50px);
			opacity: 0;
		} 
		100% {
			transform: translateY(0);
			opacity: 1;
		}
  }
  @keyframes swal2-toast-hide {
		100% {
			transform: translateX(50px);
			opacity: 0;
		}
  }
`);
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
			`
				請選擇要下載的影片<br>
				<a class="swal2-confirm swal2-styled"  
					style="display: inline-block;text-decoration: none;"
					href="${presenterLink}" 
					download="${courseName}_${courseTitle}_l.mp4">
						左方影片
				</a>
				<a class="swal2-confirm swal2-styled"  
					style="display: inline-block;text-decoration: none;"
					href="${presentationLink}" 
					download="${courseName}_${courseTitle}_r.mp4">
						右方影片
				</a>`
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
			`
				<a class="swal2-confirm swal2-styled"  
						style="display: inline-block;text-decoration: none;"
						href="${link}" 
						download="${courseName}_${courseTitle}.mp4">
						影片
				</a>
				`
	})
}
