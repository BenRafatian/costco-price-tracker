import { chromium, firefox, webkit, Browser, Page } from 'playwright';
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

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            let page: Page | null = null;
            try {
                console.log(`Scraping with Playwright (WebKit) - Attempt ${attempt}/${maxRetries}: ${productUrl}`);

                // Launch WebKit - mimics Safari
                if (!this.browser) {
                    this.browser = await webkit.launch({
                        headless: true,
                    });
                }

                const context = await this.browser.newContext({
                    viewport: { width: 1920, height: 1080 },
                    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
                    locale: 'en-US',
                    timezoneId: 'America/New_York',
                });

                page = await context.newPage();

                // Warmup
                try {
                    await page.goto('https://www.costco.ca/', { timeout: 30000, waitUntil: 'domcontentloaded' });
                    await page.waitForTimeout(2000 + Math.random() * 2000);
                } catch (e) {
                    console.log('Warmup failed or timed out');
                }

                // Go to product
                await page.goto(productUrl, { timeout: 60000, waitUntil: 'domcontentloaded' });

                // Wait for title
                const title = await page.title();
                console.log(`Page Title: ${title}`);

                if (!title || title.includes('Access Denied') || title.includes('Secure Connection Failed')) {
                    throw new Error(`Blocked or failed load: ${title}`);
                }

                // Try to extract data
                // Wait for h1
                try {
                    await page.waitForSelector('h1', { timeout: 10000 });
                } catch (e) {
                    console.log('Timeout waiting for h1');
                }

                // Smart wait for price
                let priceText = '';
                let name = '';

                // Try up to 3 times to get a valid price on this page load (waiting/refreshing)
                for (let priceAttempt = 1; priceAttempt <= 3; priceAttempt++) {
                    console.log(`Waiting for price (Attempt ${priceAttempt})...`);

                    // Wait for price selector to appear
                    try {
                        await page.waitForSelector('.price-current, .your-price, [automation-id="productPriceOutput"]', { timeout: 5000 });
                    } catch (e) { }

                    // Check current value
                    const data = await page.evaluate(() => {
                        const name = document.querySelector('h1')?.textContent?.trim() || '';
                        const priceEl = document.querySelector('.price-current, .your-price, [automation-id="productPriceOutput"]');
                        const priceText = priceEl?.textContent?.trim() || '';
                        return { name, priceText };
                    });

                    name = data.name;
                    priceText = data.priceText;

                    // Check if price is valid (has numbers and not just dashes)
                    if (priceText && /\d/.test(priceText) && !priceText.includes('--')) {
                        console.log('Found valid price:', priceText);
                        break;
                    }

                    console.log(`Price not ready yet: "${priceText}". Waiting/Reloading...`);

                    if (priceAttempt < 3) {
                        await page.waitForTimeout(2000);
                        if (priceAttempt === 2) {
                            console.log('Reloading page...');
                            await page.reload({ waitUntil: 'domcontentloaded' });
                        }
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
                if (page) {
                    await page.close();
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
