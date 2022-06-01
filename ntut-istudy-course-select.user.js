// ==UserScript==
// @name         北科 i 學園課程選單分類
// @namespace    https://gnehs.net/
// @version      0.1
// @description  替課程選單新增分類功能
// @author       gnehs
// @match        https://istudy.ntut.edu.tw/learn/index.php
// @icon         https://www.google.com/s2/favicons?sz=64&domain=edu.tw
// @grant        none
// ==/UserScript==

let optionList = [...document.querySelectorAll(`select[name="selcourse"] option`)]
  .map(el => {
    if (el.innerHTML == "我的課程")
      return {

        name: el.innerHTML,
        value: el.value,
        group: ""
      }
    let groupItem = el.innerHTML.split('_')[0]
    groupItem = groupItem.slice(0, 3) + ' 年' + (groupItem.slice(3, 4) == '1' ? '上' : '下') + '學期'
    return {
      name: el.innerHTML.slice(5),
      value: el.value,
      group: groupItem
    }
  })
let res = {}
optionList.map(x => {
  if (!res[x.group]) res[x.group] = []
  res[x.group].push(x)
})
// build select option group
let select = document.querySelector('select[name="selcourse"]')
// clean select
select.innerHTML = ''
for (let [name, items] of Object.entries(res)) {
  let optgroup = document.createElement('optgroup')
  optgroup.label = name
  items.map(x => {
    let option = document.createElement('option')
    option.value = x.value
    option.innerHTML = x.name
    optgroup.appendChild(option)
  })
  select.appendChild(optgroup)
}
