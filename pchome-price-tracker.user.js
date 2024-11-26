// ==UserScript==
// @name         PChome 價格追蹤器
// @namespace    https://gnehs.net/
// @version      0.0.1
// @description  使用了 savingsbot.luxurai.com & biggo.com.tw 的價格資訊，在 PChome 商品頁面顯示歷史價格圖表
// @author       gnehs
// @match        https://24h.pchome.com.tw/prod/*
// @icon         https://p.pancake.tw/favicon.svg
// @grant        GM_addStyle
// @grant        GM_xmlhttpRequest
// @connect      prod-myshopper.azurewebsites.net
// @connect      biggo.com.tw
// @require      https://cdn.jsdelivr.net/npm/apexcharts
// @run-at       document-start
// ==/UserScript==

(function () {
  "use strict";

  // Add styles for the chart container
  GM_addStyle(`
      .price-history-container {
          margin: 20px 0;
      }
      .price-history-chart {
          padding: 20px;
      }
      .apexcharts-tooltip {
          background: #fff;
          border: 1px solid #e3e3e3;
          box-shadow: 0 4px 0 rgba(43, 43, 43, .1);
          border-radius: 8px; 
      }
  `);

  // Function to fetch product ID from URL with retry
  async function getProductId(url, retryCount = 0) {
    return new Promise((resolve, reject) => {
      GM_xmlhttpRequest({
        method: "GET",
        url: `https://prod-myshopper.azurewebsites.net/api/my_shopper/products/pidFromUrl?url=${encodeURIComponent(
          url
        )}`,
        headers: {
          Accept: "*/*",
          Origin: "https://savingsbot.luxurai.com",
          Referer: "https://savingsbot.luxurai.com/",
        },
        onload: function (response) {
          if (response.status === 409 && retryCount < 3) {
            // Wait for 1 second before retrying
            setTimeout(() => {
              getProductId(url, retryCount + 1)
                .then(resolve)
                .catch(reject);
            }, 1000);
          } else if (response.status === 200) {
            const data = JSON.parse(response.responseText);
            resolve(data._id);
          } else {
            reject(
              new Error(
                `API error: ${response.status} - ${response.statusText}`
              )
            );
          }
        },
        onerror: reject,
      });
    });
  }

  // Function to fetch price history with retry
  async function getPriceHistory(productId, productCode, retryCount = 0) {
    return new Promise((resolve, reject) => {
      GM_xmlhttpRequest({
        method: "GET",
        url: `https://prod-myshopper.azurewebsites.net/api/my_shopper/products/${productId}/price_strategy?icode=${productCode}`,
        headers: {
          Accept: "*/*",
          Origin: "https://savingsbot.luxurai.com",
          Referer: "https://savingsbot.luxurai.com/",
        },
        onload: function (response) {
          if (response.status === 409 && retryCount < 3) {
            // Wait for 1 second before retrying
            setTimeout(() => {
              getPriceHistory(productId, productCode, retryCount + 1)
                .then(resolve)
                .catch(reject);
            }, 1000);
          } else if (response.status === 200) {
            const data = JSON.parse(response.responseText);
            resolve(data.price_history);
          } else {
            reject(
              new Error(
                `API error: ${response.status} - ${response.statusText}`
              )
            );
          }
        },
        onerror: reject,
      });
    });
  }

  // Function to fetch price history from BigGo
  async function getPriceHistoryFromBigGo(productCode) {
    const response = await fetch("https://biggo.com.tw/api/v1/spa/product/history", {
      method: "POST",
      headers: {
        "accept": "application/json",
        "accept-language": "zh-TW,zh;q=0.9,en-US;q=0.8,en;q=0.7",
        "User-Agent": "RapidAPI/4.2.5 (Macintosh; OS X/15.1.1) GCDHTTPRequest",
        "Connection": "close", 
        "Origin": "https://biggo.com.tw",
        "Referer": "https://biggo.com.tw",
      },
      body: JSON.stringify({
        history_id: `tw_ec_pchome24h-${productCode}`,
        days: 90,
      }),
    });

    if (!response.ok) {
      throw new Error(`BigGo API request failed with status ${response.status}`);
    }

    const data = await response.json();
    console.log('BigGo API response:', data);
    
    if (data.result && data.price_history) {
      // Convert BigGo format to our format
      const priceHistory = data.price_history.map(item => ({
        date: new Date(item.x).toISOString(),
        price: item.y
      }));
      return priceHistory;
    } else {
      throw new Error("No price history data from BigGo");
    }
  }

  // Function to create and render the chart
  function createPriceChart(priceHistory, productName, dataSource = 'savingsbot.luxurai.com') {
    const container = document.createElement("div");
    container.className = "price-history-container";
    container.innerHTML = `
          <div class="c-boxGrid c-boxGrid--base" tabindex="0">
              <div class="c-listTitle">
                  <div class="c-listTitle__title">
                      <div class="c-listTitle__text">
                          <div class="c-listTitle__icon">
                              <div class="c-colorTag c-colorTag--blueIcon">
                                  <div class="c-colorTag__iconBg"></div>
                              </div>
                              <h3>價格走勢</h3>
                          </div>
                      </div>
                  </div>
              </div>
              <div class="c-listInfoGrid c-listInfoGrid--additional price-history-chart" tabindex="0">
                  <div id="priceChart"></div> 
              </div>
          </div>
      `;

    // Insert before #Additional
    const additionalSection = document.querySelector("#Additional");
    if (additionalSection) {
      additionalSection.parentNode.insertBefore(container, additionalSection);
    } else {
      // Fallback: append to product info section if #Additional not found
      document
        .querySelector("#ProdReview")
        .parentNode.insertBefore(
          container,
          document.querySelector("#ProdReview")
        );
    }

    const options = {
      series: [
        {
          name: "價格",
          data: priceHistory.map((item) => ({
            x: new Date(item.date).getTime(),
            y: item.price,
          })),
        },
      ],
      chart: {
        type: "line",
        height: 350,
        zoom: {
          enabled: false,
        },
        animations: {
          enabled: false,
        },
      },
      dataLabels: {
        enabled: false,
      },
      stroke: {
        curve: "stepline",
        width: 2,
      },
      markers: {
        size: 4,
        colors: ["#ec6c00"],
        strokeColors: "#fff",
        strokeWidth: 2,
        hover: {
          size: 6,
        },
      },
      grid: {
        row: {
          colors: ["#f3f3f3", "transparent"],
          opacity: 0.5,
        },
      },
      xaxis: {
        type: "datetime",
        labels: {
          datetimeUTC: false,
          format: "yyyy/MM/dd",
        },
      },
      yaxis: { 
        labels: {
          formatter: function (val) {
            return "$" + val;
          },
        },
      },
      title: {
        text: `${productName}`,
        align: "left",
        style: {
          fontSize: "16px",
          color: "#111",
        },
      },
      subtitle: {
        text: `資料來源：${dataSource}`,
        align: "left",
        style: {
          fontSize: "12px",
          color: "#999",
        },
      },
      tooltip: {
        x: {
          format: "yyyy/MM/dd",
        },
        y: {
          formatter: function (val) {
            return "$" + val;
          },
        },
      }, 
    };

    const chart = new ApexCharts(
      document.querySelector("#priceChart"),
      options
    );
    chart.render();
  }

  // Main function
  async function init() {
    try {
      const productCode = location.pathname.split("/").pop().split("?")[0];
      console.log("Product code:", productCode);
      let priceHistory;
      let dataSource = 'savingsbot.luxurai.com';

      try {
        // Try primary API first
        const productId = await getProductId(location.href);
        priceHistory = await getPriceHistory(productId, productCode);
      } catch (primaryError) {
        console.log("Primary API failed, trying BigGo API...", primaryError);
        // If primary API fails, try BigGo API
        priceHistory = await getPriceHistoryFromBigGo(productCode);
        dataSource = 'biggo.com.tw';
      }

      // Get current price from the page
      const currentPriceElement = document.querySelector(".o-prodPrice__price");
      const currentPrice = currentPriceElement
        ? parseInt(currentPriceElement.textContent.replace(/[^0-9]/g, ""))
        : null;

      // Get product name
      const productNameElement = document.querySelector(
        ".o-prodMainName--prodNick"
      );
      const productName = productNameElement
        ? productNameElement.textContent.trim()
        : ""; 

      // Add current price to history if available
      if (currentPrice) {
        priceHistory.push({
          date: new Date().toISOString(),
          price: currentPrice,
        });
      }

      createPriceChart(priceHistory, productName, dataSource);
    } catch (error) {
      console.error("Price tracker error:", error);
    }
  }

  // Start the script
  init();
})();
