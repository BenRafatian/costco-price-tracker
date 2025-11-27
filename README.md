# 🛒 Costco Price Tracker

A robust Node.js application that tracks product prices on Costco.ca and sends notifications via Telegram when prices change. It uses **Playwright** with **WebKit** to bypass bot detection and handles dynamic price loading.

## Features

✅ **Robust Scraping**: Uses Playwright (WebKit) to bypass Akamai bot detection.
✅ **Dynamic Price Handling**: Automatically waits for prices to load and reloads if necessary.
✅ **Instant Notifications**: Get Telegram alerts when prices change.
✅ **Price History**: Stores all price checks in a CSV file (`data/prices.csv`).
✅ **Configurable**: Set check intervals, price thresholds, and multiple products.
✅ **Modular**: Designed to easily support other websites in the future.

## Quick Start Guide

### 1. Prerequisites
- Node.js (v18 or higher)
- A Telegram account

### 2. Installation
```bash
git clone https://github.com/yourusername/costco-price-tracker.git
cd costco-price-tracker
npm install
npx playwright install webkit
```

### 3. Set up Telegram Bot
1. Open Telegram and search for `@BotFather`.
2. Send `/newbot` and follow the instructions to create a bot.
3. **Copy the bot token** you receive.
4. Search for `@userinfobot` and send `/start`.
5. **Copy your chat ID**.
6. **Start a chat** with your new bot (search for its username and click Start).

### 4. Configure Environment
Copy the example configuration:
```bash
cp .env.example .env
```

Edit `.env` and fill in your details:
```env
TELEGRAM_BOT_TOKEN=your_bot_token_here
TELEGRAM_CHAT_ID=your_chat_id_here
PRODUCT_URLS=https://www.costco.ca/item1.html,https://www.costco.ca/item2.html
CHECK_INTERVAL_MINUTES=60
PRICE_CHANGE_THRESHOLD=0
```

**To find product URLs:**
1. Go to [Costco.ca](https://www.costco.ca).
2. Click on a product.
3. Copy the full URL from the browser.

## Usage

### Run Once (Test Mode)
Great for verifying your setup:
```bash
npm start -- --once
```

### Run Continuously (Scheduled Mode)
Checks prices at your configured interval:
```bash
npm start
```

### Development Mode
Auto-restarts on code changes:
```bash
npm run dev
```

## Project Structure

```
costco-price-tracker/
├── src/
│   ├── index.ts                 # Main application entry point
│   ├── scraper/
│   │   ├── scraperFactory.ts    # Factory to select correct scraper
│   │   ├── playwrightScraper.ts # Costco scraper using Playwright/WebKit
│   │   └── types.ts             # Scraper interfaces
│   ├── notifiers/
│   │   └── telegramNotifier.ts  # Telegram notification logic
│   ├── storage/
│   │   └── csvStorage.ts        # CSV file storage logic
│   └── config/
│       └── config.ts            # Configuration management
├── data/
│   └── prices.csv               # Price history (auto-generated)
├── .env                         # Your private configuration
└── README.md                    # This file
```

## How It Works

1.  **Initialization**: Loads config and initializes the `ScraperFactory`.
2.  **Scraping**:
    *   Uses **Playwright (WebKit)** to mimic a Safari browser on Mac.
    *   Navigates to the product page.
    *   Waits for the price to appear (handling dynamic loading).
    *   Retries up to 3 times if the price is missing or blocked.
3.  **Storage**: Saves the scraped data to `data/prices.csv`.
4.  **Notification**: Compares the new price with the last stored price. If it changed (beyond the threshold), sends a Telegram message.
5.  **Scheduling**: Repeats the process based on `CHECK_INTERVAL_MINUTES`.

## Troubleshooting

### "Failed to scrape" or "Blocked"
*   The scraper has built-in retry logic. If it fails consistently, Costco might have updated their bot detection.
*   Try increasing the interval to avoid rate limiting.

### No Telegram notifications
*   Verify `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` in `.env`.
*   **Crucial**: Make sure you have started a chat with your bot in Telegram.

### "Command not found: npm"
*   Install Node.js from [nodejs.org](https://nodejs.org/).

## Future Enhancements
- [ ] Email notifications
- [ ] Database storage (SQLite/PostgreSQL)
- [ ] Web dashboard for viewing price history
- [ ] Support for other retailers (Amazon, Best Buy, etc.)

## License
MIT