// ==UserScript==
// @name         qBittorrent RSS 管理器
// @namespace    https://gnehs.net/
// @version      0.2.3
// @description  在 qBittorrent WebUI 新增一個 RSS 管理分頁，可用一次輸入完成 RSS Feed + Rule 設定，並提供修改與刪除
// @author       gnehs
// @match        *://*/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function () {
    "use strict";

    if (window.__qBittorrentRssManagerUserscriptLoaded === true)
        return;

    window.__qBittorrentRssManagerUserscriptLoaded = true;

    sessionStorage.removeItem("qbt_rss_manager_last_tab");

    const TAB_LINK_ID = "rssManagerTabLink";
    const TAB_COLUMN_ID = "rssManagerTabColumn";
    const TAB_TEXT = "RSS 管理器";

    const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

    const waitUntil = async (predicate, timeout = 20000, interval = 150) => {
        const start = Date.now();
        while (Date.now() - start < timeout) {
            if (predicate())
                return true;
            await sleep(interval);
        }
        return false;
    };

    const escapeHtml = (value) => {
        return String(value)
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#39;");
    };

    const setElementVisible = (id, isVisible) => {
        const el = document.getElementById(id);
        if (!el)
            return;
        el.classList.toggle("invisible", !isVisible);
    };

    const normalizeFeedPath = (path) => {
        return String(path || "")
            .trim()
            .replace(/[\\/]+/g, "\\")
            .replace(/^\\+/, "")
            .replace(/\\+$/, "");
    };

    const toStringArray = (value) => {
        if (Array.isArray(value))
            return value
                .map((v) => String(v))
                .filter((v) => v !== "");

        if (value === undefined || value === null)
            return [];

        return [String(value)];
    };

    const apiGet = async (url, params = {}) => {
        const u = new URL(url, window.location.href);
        for (const [key, value] of Object.entries(params))
            u.searchParams.set(key, String(value));

        const response = await fetch(u.toString(), {cache: "no-store"});
        if (!response.ok)
            throw new Error(`API error: ${response.status}`);

        return response.json();
    };

    const apiPost = async (url, params = {}) => {
        const response = await fetch(url, {
            method: "POST",
            body: new URLSearchParams(params),
            cache: "no-store"
        });
        if (!response.ok) {
            const text = await response.text();
            throw new Error(text || `API error: ${response.status}`);
        }
        return response;
    };

    const getRssItems = async () => {
        return apiGet("api/v2/rss/items", {withData: true});
    };

    const getRssRules = async () => {
        return apiGet("api/v2/rss/rules", {});
    };

    const flattenFeeds = (current, fullName = "") => {
        const rows = [];

        for (const key of Object.keys(current || {})) {
            const child = current[key];
            const itemFullName = fullName ? `${fullName}\\${key}` : key;

            if (!child)
                continue;

            if (Object.prototype.hasOwnProperty.call(child, "uid")) {
                if (typeof child.url !== "string" || child.url.length === 0)
                    continue;

                rows.push({
                    path: itemFullName,
                    url: child.url,
                    uid: child.uid,
                    isLoading: !!child.isLoading,
                    hasError: !!child.hasError,
                    unread: Number.isNaN(Number(child.unread)) ? 0 : Number(child.unread)
                });
            }
            else {
                rows.push(...flattenFeeds(child, itemFullName));
            }
        }

        return rows;
    };

    const buildDefaultRule = (feedUrl, savePath) => {
        return {
            enabled: true,
            priority: 0,
            useRegex: false,
            mustContain: "",
            mustNotContain: "",
            episodeFilter: "",
            affectedFeeds: [feedUrl],
            ignoreDays: 0,
            smartFilter: false,
            previouslyMatchedEpisodes: [],
            torrentParams: {
                category: "",
                tags: [],
                stopped: null,
                content_layout: null,
                use_auto_tmm: false,
                save_path: savePath
            }
        };
    };

    const setStatus = (messageEl, text, isError = false) => {
        if (!messageEl)
            return;

        messageEl.textContent = text || "";
        messageEl.className = isError ? "qbRssManagerMessage qbRssManagerMessageError" : "qbRssManagerMessage";
    };

    const getRuleNamesForUrl = (rulesMap, url) => {
        return Object.entries(rulesMap).reduce((acc, [ruleName, ruleDef]) => {
            const affected = toStringArray(ruleDef.affectedFeeds);
            if (affected.includes(url))
                acc.push(ruleName);
            return acc;
        }, []);
    };

    const saveRule = async (ruleName, ruleDef) => {
        const sanitized = {
            ...ruleDef,
            affectedFeeds: toStringArray(ruleDef.affectedFeeds),
            torrentParams: {
                ...(ruleDef.torrentParams || {}),
                save_path: (ruleDef.torrentParams && ruleDef.torrentParams.save_path !== undefined)
                    ? ruleDef.torrentParams.save_path
                    : "",
            }
        };

        sanitized.torrentParams = sanitized.torrentParams === undefined || sanitized.torrentParams === null
            ? null
            : sanitized.torrentParams;

        return apiPost("api/v2/rss/setRule", {
            ruleName,
            ruleDef: JSON.stringify(sanitized)
        });
    };

    const ensureUniqueRuleName = (baseName, rules) => {
        const base = baseName.trim() || "Rule";
        if (!Object.prototype.hasOwnProperty.call(rules, base))
            return base;

        let suffix = 1;
        while (Object.prototype.hasOwnProperty.call(rules, `${base} (${suffix})`))
            ++suffix;

        return `${base} (${suffix})`;
    };

    const createRssManagerPanelHTML = () => `
        <div class="qbRssManagerWrap">
            <section class="qbRssManagerCard">
                <h3>RSS 一鍵管理</h3>
                <form id="qbRssManagerForm" autocomplete="off">
                    <div class="qbRssManagerField">
                        <label for="qbRssManagerName">名稱</label>
                        <input id="qbRssManagerName" type="text" required>
                    </div>
                    <div class="qbRssManagerField">
                        <label for="qbRssManagerUrl">RSS 網址</label>
                        <input id="qbRssManagerUrl" type="text" required>
                    </div>
                    <div class="qbRssManagerField">
                        <label for="qbRssManagerPath">儲存路徑</label>
                        <input id="qbRssManagerPath" type="text" required>
                    </div>
                    <div id="qbRssManagerButtons" class="qbRssManagerButtons">
                        <button id="qbRssManagerSubmit" type="submit">新增</button>
                        <button id="qbRssManagerCancel" type="button" style="display:none;">取消編輯</button>
                        <button id="qbRssManagerRefresh" type="button">重新整理</button>
                    </div>
                </form>
                <div id="qbRssManagerMessage" class="qbRssManagerMessage"></div>
            </section>
            <section class="qbRssManagerCard qbRssManagerListCard">
                <h3>已建立訂閱</h3>
                <div class="qbRssManagerTableWrap">
                    <table>
                        <thead>
                            <tr>
                                <th class="qbRssManagerColName">名稱</th>
                                <th class="qbRssManagerColUrl">RSS 網址</th>
                                <th class="qbRssManagerColPath">儲存路徑</th>
                                <th class="qbRssManagerColRule">關聯規則</th>
                                <th class="qbRssManagerColActions">操作</th>
                            </tr>
                        </thead>
                        <tbody id="qbRssManagerRows"></tbody>
                    </table>
                </div>
            </section>
        </div>
        <style>
            .qbRssManagerWrap {
                padding: 12px;
                box-sizing: border-box;
                color: var(--color-text-default);
                min-height: 100%;
                background: linear-gradient(180deg, #f7f9fc 0%, #eef2f7 100%);
            }

            .qbRssManagerCard {
                border: 1px solid #d4dce8;
                border-radius: 8px;
                background: #ffffff;
                padding: 14px;
                margin-bottom: 14px;
                box-shadow: 0 2px 8px rgba(25, 42, 70, 0.08);
            }

            .qbRssManagerCard h3 {
                margin: 0 0 8px 0;
                font-size: 16px;
            }

            .qbRssManagerField {
                display: grid;
                grid-template-columns: 90px 1fr;
                align-items: center;
                gap: 6px;
                margin-bottom: 8px;
            }

            .qbRssManagerField input {
                width: 100%;
                box-sizing: border-box;
            }

            .qbRssManagerButtons {
                margin-top: 10px;
            }

            .qbRssManagerButtons button {
                margin-right: 6px;
                padding: 4px 10px;
            }

            .qbRssManagerMessage {
                min-height: 20px;
                margin-top: 6px;
                color: var(--color-text-green);
            }

            .qbRssManagerMessageError {
                color: var(--color-text-red);
            }

            .qbRssManagerTableWrap {
                max-height: calc(100vh - 350px);
                overflow: auto;
                border: 1px solid #d4dce8;
                border-radius: 6px;
                background: #ffffff;
            }

            .qbRssManagerTableWrap table {
                width: 100%;
                border-collapse: collapse;
                table-layout: fixed;
            }

            .qbRssManagerColName {
                width: 22%;
            }

            .qbRssManagerColUrl {
                width: 44%;
            }

            .qbRssManagerColPath {
                width: 16%;
            }

            .qbRssManagerColRule {
                width: 12%;
            }

            .qbRssManagerColActions {
                width: 6%;
            }

            .qbRssManagerCellEllipsis {
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }

            .qbRssManagerCellEllipsis,
            .qbRssManagerTableWrap th {
                min-width: 0;
            }

            .qbRssManagerTableWrap th,
            .qbRssManagerTableWrap td {
                padding: 6px;
                border-bottom: 1px solid var(--color-border-default);
                text-align: left;
                vertical-align: top;
            }

            .qbRssManagerTableWrap th {
                position: sticky;
                top: 0;
                z-index: 1;
                background-color: var(--color-background-blue);
                color: var(--color-text-white);
            }

            .qbRssManagerActionBtn {
                margin-right: 6px;
                padding: 2px 7px;
            }

            .qbRssManagerListCard .qbRssManagerTableWrap {
                max-height: 370px;
            }

            .qbRssManagerLoading {
                opacity: 0.6;
            }

            #rssManagerTabColumn {
                position: absolute;
                inset: 0;
                overflow: auto;
                background: var(--color-background-default, #fff);
                z-index: 2;
            }
        </style>
    `;

    const initRssManager = async () => {
        const canInit = await waitUntil(() => {
            return Boolean(
                window.MochaUI?.Desktop
                && window.qBittorrent?.Client
                && document.getElementById("mainWindowTabsList")
                && document.getElementById("filtersColumn")
                && document.getElementById("mainColumn")
            );
        });

        if (!canInit)
            return;

        const mainTabs = document.getElementById("mainWindowTabsList");
        if (!mainTabs)
            return;

        const state = {
            panelReady: false,
            rows: [],
            rules: {},
            editingPath: null,
            isBusy: false
        };

        const setLoading = (loading) => {
            const wrap = document.querySelector(`#${TAB_COLUMN_ID} .qbRssManagerWrap`);
            if (!wrap)
                return;

            wrap.classList.toggle("qbRssManagerLoading", loading);
            document.getElementById("qbRssManagerSubmit")?.toggleAttribute("disabled", loading);
            document.getElementById("qbRssManagerRefresh")?.toggleAttribute("disabled", loading);
            document.getElementById("qbRssManagerCancel")?.toggleAttribute("disabled", loading);
        };

        const withBusy = async (task) => {
            if (state.isBusy)
                return;

            state.isBusy = true;
            setLoading(true);
            try {
                await task();
            }
            finally {
                state.isBusy = false;
                setLoading(false);
            }
        };

        const syncBuildInTabs = () => {
            mainTabs.addEventListener("click", (event) => {
                const clickedTab = event.target.closest("li");
                if (!clickedTab || clickedTab.id === TAB_LINK_ID)
                    return;

                if (["transfersTabLink", "searchTabLink", "rssTabLink", "logTabLink"].includes(clickedTab.id)) {
                    setElementVisible(TAB_COLUMN_ID, false);
                    document.getElementById(TAB_LINK_ID)?.classList.remove("selected");
                }
            }, true);
        };

        const showManagerTab = async () => {
            const initialized = await initPanel();
            if (!initialized)
                throw new Error("RSS 管理器尚未初始化完成，請稍後再試");

            setElementVisible(TAB_COLUMN_ID, true);
            for (const tab of mainTabs.children)
                tab.classList.toggle("selected", tab.id === TAB_LINK_ID);
            setStatus(document.getElementById("qbRssManagerMessage"), "", false);
            await refreshData();
        };

        const showManager = async (ev) => {
            ev?.preventDefault();

            try {
                await showManagerTab();
            }
            catch (error) {
                setStatus(document.getElementById("qbRssManagerMessage"), error.message || "切換管理器分頁失敗", true);
            }
        };

        const showFeedsPanel = (feeds, rules) => {
            const tbody = document.getElementById("qbRssManagerRows");
            if (!tbody)
                return;

            if (feeds.length === 0) {
                tbody.innerHTML = "<tr><td colspan=\"5\">目前沒有 RSS 訂閱</td></tr>";
                return;
            }

            const rows = [];
            for (const feed of feeds) {
                const ruleNames = getRuleNamesForUrl(rules, feed.url);
                let savePath = "";
                if (ruleNames.length > 0) {
                    const firstRule = rules[ruleNames[0]] || {};
                    savePath = (firstRule.torrentParams && firstRule.torrentParams.save_path)
                        ? firstRule.torrentParams.save_path
                        : "";
                }

                rows.push({
                    path: feed.path,
                    url: feed.url,
                    savePath,
                    ruleNames
                });
            }

            state.rows = rows;
            tbody.innerHTML = rows.map((row) => `<tr>
                    <td class="qbRssManagerCellEllipsis" title="${escapeHtml(row.path)}">${escapeHtml(row.path)}</td>
                    <td class="qbRssManagerCellEllipsis" title="${escapeHtml(row.url)}">${escapeHtml(row.url)}</td>
                    <td class="qbRssManagerCellEllipsis" title="${escapeHtml(row.savePath || "")}">${escapeHtml(row.savePath || "")}</td>
                    <td class="qbRssManagerCellEllipsis" title="${escapeHtml((row.ruleNames.join(", ") || "-") )}">${escapeHtml(row.ruleNames.join(", ") || "- ")}</td>
                    <td>
                        <button class="qbRssManagerActionBtn" data-action="edit" data-path="${escapeHtml(row.path)}">編輯</button>
                        <button class="qbRssManagerActionBtn" data-action="delete" data-path="${escapeHtml(row.path)}">刪除</button>
                    </td>
            </tr>`).join("");
        };

        const refreshData = async () => {
            await withBusy(async () => {
                const [items, rules] = await Promise.all([getRssItems(), getRssRules()]);
                const feedNodes = flattenFeeds(items);
                const sortedFeeds = feedNodes.sort((a, b) => a.path.localeCompare(b.path));
                state.rules = rules || {};
                showFeedsPanel(sortedFeeds, state.rules);

                if (window.qBittorrent?.Rss?.updateRssFeedList)
                    window.qBittorrent.Rss.updateRssFeedList();
                if (window.qBittorrent?.RssDownloader?.updateRulesList)
                    window.qBittorrent.RssDownloader.updateRulesList();
                setStatus(document.getElementById("qbRssManagerMessage"), "重新整理完成");
            }).catch((error) => {
                setStatus(document.getElementById("qbRssManagerMessage"), error.message, true);
            });
        };

        const resetForm = () => {
            state.editingPath = null;
            const nameInput = document.getElementById("qbRssManagerName");
            const urlInput = document.getElementById("qbRssManagerUrl");
            const pathInput = document.getElementById("qbRssManagerPath");
            const submitButton = document.getElementById("qbRssManagerSubmit");
            const cancelButton = document.getElementById("qbRssManagerCancel");

            if (nameInput)
                nameInput.value = "";
            if (urlInput)
                urlInput.value = "";
            if (pathInput)
                pathInput.value = "";

            if (submitButton)
                submitButton.textContent = "新增";

            if (cancelButton)
                cancelButton.style.display = "none";

            if (nameInput)
                nameInput.focus();
        };

        const createNewSubscription = async () => {
            const nameInput = document.getElementById("qbRssManagerName");
            const urlInput = document.getElementById("qbRssManagerUrl");
            const pathInput = document.getElementById("qbRssManagerPath");
            const messageEl = document.getElementById("qbRssManagerMessage");

            const path = normalizeFeedPath(nameInput.value);
            const url = String(urlInput.value || "").trim();
            const savePath = String(pathInput.value || "").trim();

            if (!path || !url || !savePath) {
                setStatus(messageEl, "名稱、RSS 網址與儲存路徑都不能為空", true);
                return;
            }

            const ruleName = ensureUniqueRuleName(path, state.rules);
            await apiPost("api/v2/rss/addFeed", {url, path});
            try {
                await saveRule(ruleName, buildDefaultRule(url, savePath));
            }
            catch (error) {
                await apiPost("api/v2/rss/removeItem", {path}).catch(() => {});
                throw error;
            }

            resetForm();
            await refreshData();
            setStatus(messageEl, `已新增訂閱：${path}`);
        };

        const updateSubscription = async () => {
            const messageEl = document.getElementById("qbRssManagerMessage");
            const target = state.rows.find((row) => row.path === state.editingPath);
            if (!target)
                throw new Error("找不到正在編輯的訂閱") ;

            const nameInput = document.getElementById("qbRssManagerName");
            const urlInput = document.getElementById("qbRssManagerUrl");
            const pathInput = document.getElementById("qbRssManagerPath");

            const newPath = normalizeFeedPath(nameInput.value);
            const newUrl = String(urlInput.value || "").trim();
            const newSavePath = String(pathInput.value || "").trim();

            if (!newPath || !newUrl || !newSavePath) {
                setStatus(messageEl, "名稱、RSS 網址與儲存路徑都不能為空", true);
                return;
            }

            let currentPath = target.path;
            let currentUrl = target.url;

            if (newPath !== target.path) {
                await apiPost("api/v2/rss/moveItem", {
                    itemPath: target.path,
                    destPath: newPath
                });
                currentPath = newPath;
            }

            if (newUrl !== target.url) {
                await apiPost("api/v2/rss/setFeedURL", {
                    path: currentPath,
                    url: newUrl
                });
                currentUrl = newUrl;
            }

            const affectedRules = getRuleNamesForUrl(state.rules, target.url);
            if (affectedRules.length > 0) {
                for (const ruleName of affectedRules) {
                    const ruleDef = {...(state.rules[ruleName] || {})};
                    ruleDef.affectedFeeds = toStringArray(ruleDef.affectedFeeds);
                    if (newUrl !== target.url)
                        ruleDef.affectedFeeds = ruleDef.affectedFeeds.map((value) => (value === target.url ? newUrl : value));

                    ruleDef.torrentParams = {
                        ...((ruleDef.torrentParams || {})),
                        save_path: newSavePath,
                        use_auto_tmm: false
                    };

                    await saveRule(ruleName, ruleDef);
                }
            }
            else if (newSavePath) {
                const ruleName = ensureUniqueRuleName(newPath, state.rules);
                await saveRule(ruleName, buildDefaultRule(newUrl, newSavePath));
            }

            resetForm();
            await refreshData();
            setStatus(messageEl, `已更新訂閱：${currentPath}`);
        };

        const deleteSubscription = async (path) => {
            const messageEl = document.getElementById("qbRssManagerMessage");
            const target = state.rows.find((row) => row.path === path);
            if (!target)
                throw new Error("找不到目標訂閱");

            await apiPost("api/v2/rss/removeItem", {path: target.path});

            const affectedRules = getRuleNamesForUrl(state.rules, target.url);
            for (const ruleName of affectedRules) {
                const ruleDef = state.rules[ruleName] || {};
                const affected = toStringArray(ruleDef.affectedFeeds).filter((url) => url !== target.url);

                if (affected.length === 0) {
                    await apiPost("api/v2/rss/removeRule", {ruleName});
                    continue;
                }

                const nextRuleDef = {
                    ...ruleDef,
                    affectedFeeds: affected
                };
                await saveRule(ruleName, nextRuleDef);
            }

            if (state.editingPath === target.path)
                resetForm();

            await refreshData();
            setStatus(messageEl, `已刪除訂閱：${target.path}`);
        };

        const enterEditMode = (path) => {
            const target = state.rows.find((row) => row.path === path);
            if (!target)
                return;

            state.editingPath = target.path;

            const nameInput = document.getElementById("qbRssManagerName");
            const urlInput = document.getElementById("qbRssManagerUrl");
            const pathInput = document.getElementById("qbRssManagerPath");
            const submitButton = document.getElementById("qbRssManagerSubmit");
            const cancelButton = document.getElementById("qbRssManagerCancel");

            nameInput.value = target.path;
            urlInput.value = target.url;
            pathInput.value = target.savePath || "";
            submitButton.textContent = "更新";
            cancelButton.style.display = "inline-block";

            setStatus(document.getElementById("qbRssManagerMessage"), `編輯中：${target.path}`);
            nameInput.focus();
        };

        const bindPanelEvents = (container) => {
            if (state.panelReady)
                return;
            state.panelReady = true;

            container.addEventListener("submit", (event) => {
                event.preventDefault();
                withBusy(async () => {
                    if (state.editingPath === null)
                        await createNewSubscription();
                    else
                        await updateSubscription();
                }).catch((error) => {
                    setStatus(document.getElementById("qbRssManagerMessage"), error.message, true);
                });
            });

            container.querySelector("#qbRssManagerCancel").addEventListener("click", () => {
                resetForm();
                setStatus(document.getElementById("qbRssManagerMessage"), "已取消編輯");
            });

            container.querySelector("#qbRssManagerRefresh").addEventListener("click", () => {
                refreshData().catch((error) => {
                    setStatus(document.getElementById("qbRssManagerMessage"), error.message, true);
                });
            });

            container.querySelector("#qbRssManagerRows").addEventListener("click", (event) => {
                const actionButton = event.target.closest("button[data-action]");
                if (!actionButton)
                    return;

                const action = actionButton.dataset.action;
                const path = actionButton.dataset.path;

                if (!path)
                    return;

                if (action === "edit") {
                    enterEditMode(path);
                    return;
                }

                if (action === "delete") {
                    const target = state.rows.find((row) => row.path === path);
                    if (!target)
                        return;
                    if (!window.confirm(`確認刪除訂閱 ${target.path}？`))
                        return;

                    withBusy(async () => {
                        await deleteSubscription(path);
                    }).catch((error) => {
                        setStatus(document.getElementById("qbRssManagerMessage"), error.message, true);
                    });
                }
            });

        };

        if (!document.getElementById(TAB_LINK_ID)) {
            const li = document.createElement("li");
            li.id = TAB_LINK_ID;
            li.innerHTML = `<a><img alt="RSS Manager" src="images/application-rss.svg" width="16" height="16">${TAB_TEXT}</a>`;
            mainTabs.appendChild(li);
        }

        const ensureManagerView = () => {
            let view = document.getElementById(TAB_COLUMN_ID);
            if (view)
                return view;

            const pageWrapper = document.getElementById("pageWrapper");
            if (!pageWrapper)
                return null;

            view = document.createElement("div");
            view.id = TAB_COLUMN_ID;
            view.classList.add("invisible");
            pageWrapper.appendChild(view);
            return view;
        };

        const initPanel = async () => {
            const isPanelReady = await waitUntil(() => {
                return Boolean(ensureManagerView());
            }, 5000);
            if (!isPanelReady)
                return false;

            const view = ensureManagerView();
            if (!view)
                return false;
            if (view.dataset.qbRssManagerInitialized === "1")
                return true;

            view.dataset.qbRssManagerInitialized = "1";
            view.innerHTML = createRssManagerPanelHTML();
            bindPanelEvents(view);
            await refreshData();
            return true;
        };

        // qBittorrent initializes MochaUI tabs before this userscript appends the
        // manager tab, so this tab needs its own delegated route. Keeping a single
        // route also avoids firing showManager() twice for one click.
        mainTabs.addEventListener("click", (event) => {
            const clickedTab = event.target.closest("li");
            if (!clickedTab)
                return;

            if (clickedTab.id === TAB_LINK_ID) {
                event.preventDefault();
                showManager(event);
            }
        });

        syncBuildInTabs();
    };

    initRssManager().catch((error) => {
        console.error("Failed to initialize qBittorrent RSS Manager userscript.", error);
    });
})();
