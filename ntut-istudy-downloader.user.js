// ==UserScript==
// @name         北科 i 學園 PDF 下載工具
// @namespace    https://gnehs.net/
// @version      0.3
// @description  協助尼下載北科 i 學園 PDF 的好朋友
// @author       gnehs
// @match        https://istudy.ntut.edu.tw/learn/path/viewPDF.php*
// @require      https://cdn.jsdelivr.net/npm/sweetalert2@11
// @icon         https://www.google.com/s2/favicons?sz=64&domain=edu.tw
// @grant        none
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

let url_string = "https://istudy.ntut.edu.tw/learn/path/" + window.DEFAULT_URL;
let url = new URL(url_string);
Swal.fire({
	toast: true,
	position: 'top-end',
	showConfirmButton: true,
	showCancelButton: true,
	title: `北科 i 學園 PDF 下載工具`,
	confirmButtonText: `下載 PDF`,
	cancelButtonText: "關閉",
	html: `${url.searchParams.get("id")}`
}).then(async (result) => {
	if (result.value) {
		let loader = Swal.fire({
			toast: true,
			position: 'top-end',
			title: `正在下載「${url.searchParams.get("id")}」`,
			html: `下載中...`,
			showConfirmButton: false,
			didOpen: () => {
				Swal.showLoading()
			}
		})
		let u = await fetch(url_string, { method: 'GET' })
			.then(response => response.blob())
			.then(blob => {
				return window.URL.createObjectURL(blob);
			});
		loader.close()
		let a = document.createElement('a');
		a.href = u;
		a.download = url.searchParams.get("id");
		a.click();
	}
})
