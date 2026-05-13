const { chromium } = require("playwright");
const axios = require("axios");
const fs = require("fs");


// =====================================
// SETTINGS
// =====================================

const LOGIN_URL =
"https://watertankcontroller.com/login";

const TARGET_URL =
"https://watertankcontroller.com/aDm1n-D@sh80ard_9L/dashboard/order?query=Packaging";


const BOT_TOKEN = "8689421739:AAFDBqArLgSseuxVwHClNphg-bQmpuUeO20";

const CHAT_ID = "6893268965";


// FULL COOKIE STRING
const COOKIE = "__Secure-next-auth.session-token=eyJhbGciOiJkaXIiLCJlbmMiOiJBMjU2R0NNIn0..qRT3_ojbgHX_zn0J.y59ezbNrIGE3TQWGmOUGXE71KzXAFptv04wrUwHFs0YZISvFQbMhVo2qBc0Qsg0xM32FzyA8g3-grc-LdScat0rXOHQp1sd-61R8x7VyJaKctCWO_QdGh9NGxVdW5WDmxMjdioGw6RhUBswSFcqwGSeGE7S6MdQ9P6wyvhX8DMg2XEXZ_0KgI-p0GMlosjrXwil9YUtoWICrZzV79nBudTDO1GpTc1jNChK4VvSfTqvlo7hLDpm9chg4gcvf_RkzOV4SX6alyxDq5gqYdprKXPKdVSZmAzY72SRCY1la6TJ_5-ursCDqUpTLMGAbNpekWHd3APVz5EL80j5TUU-9L7y9wbu8MO5dGm8Ss_HTIBIDHSqRRoCNQRvNtq0mtg27MmyJvEssCN1IWBPqJT5gHRqQphmREglY8WoBm6D2ykHnLQcmVdZfu4HYDt8WkacZgRWija4ncBgEgWFy5kHWbQnRkCyyTh_ACGguZeQEM-QzBUVHXhYcEbrmpy_A8Lm4HzzU2uyx7IUBoszCm__-pHaIvwBSz2-tVPVhS7MC-rjDaGvsbzN3NrMNIL6Sv3D12L4tHB31vbs-Mi74Dj4Iath5sg_RixF8G2xo4oFduoIgoPo6bcsXJi0F1hOcrg6M9IiSSaAUZxwgufd8Siv-F6pX75YqbVyXgdRRsQIOjlyZXAYsoIiOcT6THU1BSWmYRfuXYHdV5d6hBIFnUxGSMZQHJaZFGMSdLbi0YSFenDRJ_iJMdjSyRASpkMA6r3rz2-GIEROkgf7TCHoAp0yH8JiE91BTYZ5TdTJADhFAXJ9u7aQ9Svd8emWifYexyNj2PuyqpWysZulMYP9SlV0Txt1CQQ0V-J75IfOuJW5D_OWH9lTq3gLhr7JlUL-v2nx0CwyWF3H3y7CV8xSnfCvXwVW5VxRUFiYUYJpSlwkzlBEhGPtYrXzp6wqwJCU62ETYm3_ed6Hx5AjY5FnkYvzf5h933qU-q2ploPqgXUfPxUBNdVz9a_pP9DOVgOVgHPu0EY5FwlBglYnF5rmqdQOp7Yip5Voys_eRXjnlBRX7mZAGJLx94CytJIKZ-Ll6YwMZh52v4ZmKqynuRLDs8penMud8fJshJ5wGDKI0UQoEf-vRVd4lMtNu8VgWabDvUwSw7E85lSMlaUaEPu8G3sZiXLe9QmT8TUpP7N3Za_pXgLdEhbIINSqdRtq-R6YsZEWZ01uzYKYe1ZNsrXUXDk6xNhkI7QVsLSCZVa8upEpVVzFCEEXID-QRK6fXt0CpjNEQzp8rTOzI.6JGPECqqCCpBax1BIUgkVw;__Host-next-auth.csrf-token=31af1e78b853cb0c16c569171c46c24b476af9fada440f5bab062161fda12bed%7C8cd6f4864761d44251dcd320e6788afb23f1a8889a8a9c1a199a21c424466949;__Secure-next-auth.callback-url=https%3A%2F%2Fwatertankcontroller.com%2FaDm1n-D%40sh80ard_9L";


// 10 seconds
const CHECK_INTERVAL = 10000;


// =====================================
// STORAGE
// =====================================

const FILE_NAME = "orders.json";

let lastOrders = [];


if (fs.existsSync(FILE_NAME)) {
  lastOrders = JSON.parse(
    fs.readFileSync(FILE_NAME)
  );
}


function saveOrders() {
  fs.writeFileSync(
    FILE_NAME,
    JSON.stringify(lastOrders)
  );
}


// =====================================
// TELEGRAM
// =====================================

async function sendTelegramMessage(message) {

  try {

    await axios.post(
      `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
      {
        chat_id: CHAT_ID,
        text: message,
        parse_mode: "HTML"
      }
    );

    console.log("Telegram Message Sent");

  } catch (e) {

    console.log(e.message);
  }
}


async function sendScreenshot(path, caption) {

  try {

    const formData = new FormData();

    formData.append(
      "chat_id",
      CHAT_ID
    );

    formData.append(
      "caption",
      caption
    );

    formData.append(
      "photo",
      new Blob([
        fs.readFileSync(path)
      ]),
      "order.png"
    );


    await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`,
      {
        method: "POST",
        body: formData
      }
    );


    console.log("Screenshot Sent");

  } catch (e) {

    console.log(
      "Screenshot Error:",
      e.message
    );
  }
}


// =====================================
// MAIN BOT
// =====================================

async function startBot() {

  const browser = await chromium.launch({
    headless: true
  });


  const context = await browser.newContext();


  await context.addCookies([
    {
      name: "cookie",
      value: COOKIE,
      domain: "watertankcontroller.com",
      path: "/"
    }
  ]);


  const page = await context.newPage();


  console.log(
    "Smart Order Alert Started..."
  );


  await sendTelegramMessage(
    "✅ Smart Order Alert Started"
  );


  async function checkWebsite() {

    try {

      console.log("Checking Orders...");


      await page.goto(TARGET_URL, {
        waitUntil: "networkidle"
      });


      const html = await page.content();


      // LOGIN EXPIRED CHECK
      if (
        html.includes("login") ||
        html.includes("password")
      ) {

        await sendTelegramMessage(
          "⚠️ Login Session Expired"
        );

        return;
      }


      const rows = await page.locator("tr").all();


      if (rows.length <= 1) {
        console.log("No Orders Found");
        return;
      }


      for (let i = 1; i < rows.length; i++) {

        const text = await rows[i].innerText();

        const lines = text
          .split("\n")
          .map(v => v.trim())
          .filter(Boolean);


        if (lines.length < 4) continue;


        const orderDate = lines[0] || "N/A";
        const orderId = lines[1] || "N/A";
        const customer = lines[2] || "N/A";
        const packageInfo = lines[3] || "N/A";


        if (!lastOrders.includes(orderId)) {

          lastOrders.push(orderId);

          saveOrders();


          const message =
`🚨 নতুন অর্ডার এসেছে

🆔 Order ID: ${orderId}

👤 Customer:
${customer}

💰 Package:
${packageInfo}

📅 ${orderDate}`;


          await sendTelegramMessage(message);


          // SCREENSHOT
          const screenshotPath =
            `order-${orderId}.png`;


          await page.screenshot({
            path: screenshotPath,
            fullPage: true
          });


          await sendScreenshot(
            screenshotPath,
            `📸 Order Screenshot (${orderId})`
          );


          console.log(
            "New Order:",
            orderId
          );
        }
      }

    } catch (e) {

      console.log(
        "Check Error:",
        e.message
      );
    }
  }


  await checkWebsite();


  setInterval(
    checkWebsite,
    CHECK_INTERVAL
  );
}


startBot();
