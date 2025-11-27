import { PuppeteerBase } from './puppeteerBase.js';
import { Scraper } from './types.js';
import { ProductData } from '../types/index.js';

export class CostcoScraper extends PuppeteerBase implements Scraper {

    public canHandle(url: string): boolean {
        return url.includes('costco.ca');
    }

    public async scrapeProduct(productUrl: string): Promise<ProductData | null> {
        let page;
        try {
            console.log(`Scraping: ${productUrl}`);
            page = await this.createPage();

            // Warmup: Go to home page first to set cookies
            try {
                console.log('Navigating to home page...');
                await page.goto('https://www.costco.ca/', { waitUntil: 'domcontentloaded', timeout: 30000 });
                await this.randomMouseMove(page);
                await this.delay(2000 + Math.random() * 1000);
            } catch (e) {
                console.log('Home page warmup failed, continuing to product...');
            }

            // Navigate to product page
            console.log('Navigating to product page...');
            await page.goto(productUrl, {
                waitUntil: 'domcontentloaded', // Change to domcontentloaded to be faster
                timeout: 60000
            });

            const title = await page.title();
            const url = page.url();
            console.log(`Current Page Title: ${title}`);
            console.log(`Current Page URL: ${url}`);

            const content = await page.content();
            import('fs').then(fs => fs.writeFileSync('debug.html', content));
            console.log('Saved page content to debug.html');

            // Wait for key elements to ensure page loaded
            // Try waiting for either price or name
            try {
                await page.waitForSelector('h1', { timeout: 10000 });
            } catch (e) {
                console.log('Timeout waiting for h1, continuing anyway...');
            }

            // Extract data using page.evaluate
            const data = await page.evaluate(() => {
                // Helper to clean text
                const clean = (text: string | null | undefined) => text ? text.trim() : '';

                // Get Name
                const nameSelectors = [
                    'h1[itemprop="name"]',
                    'h1.product-h1',
                    'h1'
                ];

                let name = '';
                for (const sel of nameSelectors) {
                    const el = document.querySelector(sel);
                    if (el) {
                        name = clean(el.textContent);
                        if (name) break;
                    }
                }

                // Get Price
                // Costco has different price structures
                const priceSelectors = [
                    '.price-current',
                    '.your-price',
                    '[automation-id="productPriceOutput"]',
                    '.value',
                    '.op-value' // sometimes used for member only items
                ];

                let priceText = '';
                for (const sel of priceSelectors) {
                    const el = document.querySelector(sel);
                    if (el) {
                        priceText = clean(el.textContent);
                        if (priceText) break;
                    }
                }

                return { name, priceText };
            });

            const price = this.parsePrice(data.priceText);
            const itemNumber = this.extractItemNumber(productUrl);

            if (!data.name || price === null) {
                console.error('Could not extract product data');
                console.log('Name found:', data.name);
                console.log('Price text found:', data.priceText);

                // Take a screenshot for debugging if failed
                await page.screenshot({ path: 'debug-screenshot.png' });
                return null;
            }

            const productData: ProductData = {
                itemNumber,
                name: data.name,
                price,
                url: productUrl,
                timestamp: new Date().toISOString(),
            };

            console.log(`Successfully scraped: ${data.name} - $${price}`);
            return productData;

        } catch (error) {
            console.error(`Error scraping ${productUrl}:`, error);
            return null;
        } finally {
            if (page) {
                await page.close();
            }
        }
    }

    private parsePrice(priceText: string): number | null {
        if (!priceText) return null;

        // Remove currency symbols and extract number
        const cleaned = priceText.replace(/[^0-9.,]/g, '');
        const match = cleaned.match(/[\d,]+\.?\d*/);
        if (!match) return null;

        return parseFloat(match[0].replace(/,/g, ''));
    }

    private extractItemNumber(url: string): string {
        // Costco URLs are like: https://www.costco.ca/product-name.product.100123456.html
        const match = url.match(/\.product\.(\d+)\.html/) || url.match(/\/(\d{9,})\.html/);
        return match ? match[1] : 'unknown';
    }
}