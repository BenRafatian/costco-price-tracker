import { chromium, firefox, webkit, Browser, Page, BrowserType } from 'playwright';
import { Scraper } from './types.js';
import { ProductData } from '../types/index.js';
import * as fs from 'fs';

export class PlaywrightScraper implements Scraper {
    private browser: Browser | null = null;

    public canHandle(url: string): boolean {
        return url.includes('costco.ca');
    }

    public async scrapeProduct(productUrl: string): Promise<ProductData | null> {
        const maxRetries = 3;
        const browserType = process.env.BROWSER_TYPE || 'firefox';

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            let page: Page | null = null;
            try {
                console.log(`Scraping with Playwright (${browserType}) - Attempt ${attempt}/${maxRetries}: ${productUrl}`);

                if (!this.browser) {
                    const launchOptions: any = {
                        headless: process.env.HEADLESS !== 'false',
                    };

                    if (browserType === 'chromium') {
                        const { chromium: chromiumExtra } = await import('playwright-extra');
                        const stealth = await import('puppeteer-extra-plugin-stealth');
                        chromiumExtra.use(stealth.default());
                        this.browser = await chromiumExtra.launch(launchOptions);
                    } else if (browserType === 'firefox') {
                        this.browser = await firefox.launch(launchOptions);
                    } else {
                        // WebKit
                        this.browser = await webkit.launch(launchOptions);
                    }
                }

                const context = await this.browser.newContext({
                    viewport: { width: 800, height: 600 }, // Reduced from 1920x1080 to save memory
                    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
                    locale: 'en-US',
                    timezoneId: 'America/New_York',
                });

                // Block images and media at context level for better memory management
                await context.route('**/*.{png,jpg,jpeg,gif,webp,svg,woff,woff2,ttf,eot,mp4,webm,mp3,wav,ico}', route => route.abort());
                await context.route('**/*{analytics,tracker,marketing,advertisement,ads,tag,pixel}*', route => route.abort());

                page = await context.newPage();

                // Quick warmup - close page immediately after to free memory
                let warmupPage: any = null;
                try {
                    warmupPage = await context.newPage();
                    await warmupPage.goto('https://www.costco.ca/', { timeout: 15000, waitUntil: 'domcontentloaded' });
                    await warmupPage.waitForTimeout(1000);
                } catch (e) {
                    console.log('Warmup skipped or failed');
                } finally {
                    if (warmupPage) {
                        await warmupPage.close();
                        warmupPage = null;
                    }
                }

                // Go to product
                await page.goto(productUrl, { timeout: 60000, waitUntil: 'domcontentloaded' });

                // Wait for title
                const title = await page.title();
                console.log(`Page Title: ${title}`);

                if (!title || title.includes('Access Denied') || title.includes('Secure Connection Failed')) {
                    await page.screenshot({ path: 'debug-failure.png' });
                    const content = await page.content();
                    fs.writeFileSync('debug-failure.html', content);
                    throw new Error(`Blocked or failed load: ${title}`);
                }

                // Try to extract data (simplified to reduce wait time)
                try {
                    await page.waitForSelector('h1', { timeout: 5000 });
                } catch (e) {
                    console.log('Timeout waiting for h1');
                }

                // Simplified price extraction (reduced retries to save memory)
                let priceText = '';
                let name = '';

                // Try up to 2 times max
                for (let priceAttempt = 1; priceAttempt <= 2; priceAttempt++) {
                    console.log(`Waiting for price (Attempt ${priceAttempt})...`);

                    try {
                        await page.waitForSelector('.price-current, .your-price, [automation-id="productPriceOutput"]', { timeout: 3000 });
                    } catch (e) { }

                    // Extract data with simpler evaluate
                    const data = await page.evaluate(() => {
                        const name = document.querySelector('h1')?.textContent?.trim() || '';
                        const priceEl = document.querySelector('.price-current, .your-price, [automation-id="productPriceOutput"]');
                        const priceText = priceEl?.textContent?.trim() || '';
                        return { name, priceText };
                    });

                    name = data.name;
                    priceText = data.priceText;

                    if (priceText && /\d/.test(priceText) && !priceText.includes('--')) {
                        console.log('Found valid price:', priceText);
                        break;
                    }

                    console.log(`Price not ready yet: "${priceText}". Waiting...`);
                    if (priceAttempt < 2) {
                        await page.waitForTimeout(1500);
                    }
                }

                const content = await page.content();
                fs.writeFileSync('debug-playwright.html', content);

                const price = this.parsePrice(priceText);
                const itemNumber = this.extractItemNumber(productUrl);

                if (!name || price === null) {
                    console.error('Could not extract product data');
                    console.log('Name:', name);
                    console.log('Price:', priceText);
                    await page.screenshot({ path: 'debug-playwright.png' });

                    if (!name) {
                        throw new Error('No product data found');
                    }
                    // If we have name but no price, it might be out of stock or member only
                    // But if we got nothing, retry
                    return null;
                }

                return {
                    itemNumber,
                    name: name,
                    price,
                    url: productUrl,
                    timestamp: new Date().toISOString(),
                };

            } catch (error) {
                console.error(`Error scraping ${productUrl} (Attempt ${attempt}):`, error);
                if (attempt === maxRetries) return null;
                await new Promise(resolve => setTimeout(resolve, 5000)); // Wait before retry

                // Close browser to get a fresh session
                if (this.browser) {
                    await this.browser.close();
                    this.browser = null;
                }
            } finally {
                // Explicit cleanup
                if (page) {
                    try {
                        await page.close();
                    } catch (e) { }
                    page = null;
                }
            }
        }
        return null;
    }

    private parsePrice(priceText: string): number | null {
        if (!priceText) return null;
        const cleaned = priceText.replace(/[^0-9.,]/g, '');
        const match = cleaned.match(/[\d,]+\.?\d*/);
        if (!match) return null;
        return parseFloat(match[0].replace(/,/g, ''));
    }

    private extractItemNumber(url: string): string {
        const match = url.match(/\.product\.(\d+)\.html/) || url.match(/\/(\d{9,})\.html/);
        return match ? match[1] : 'unknown';
    }

    public async close(): Promise<void> {
        if (this.browser) {
            await this.browser.close();
            this.browser = null;
        }
    }
}
