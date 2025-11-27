import puppeteer, { Browser, Page } from 'puppeteer';
import puppeteerExtra from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

// Add stealth plugin to avoid detection
puppeteerExtra.use(StealthPlugin());

export abstract class PuppeteerBase {
    protected browser: Browser | null = null;

    protected async getBrowser(): Promise<Browser> {
        if (!this.browser) {
            this.browser = await puppeteerExtra.launch({
                headless: true,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-accelerated-2d-canvas',
                    '--disable-gpu',
                    '--window-size=1920,1080',
                    '--disable-http2',
                ]
            }) as unknown as Browser;
        }
        return this.browser;
    }

    protected async createPage(): Promise<Page> {
        const browser = await this.getBrowser();
        const page = await browser.newPage();

        // Set realistic viewport and user agent
        await page.setViewport({ width: 1920, height: 1080 });
        // Use a very recent Chrome Mac User Agent
        await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');

        // Add extra headers
        await page.setExtraHTTPHeaders({
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
            'Upgrade-Insecure-Requests': '1',
            'Sec-Ch-Ua': '"Chromium";v="122", "Not(A:Brand";v="24", "Google Chrome";v="122"',
            'Sec-Ch-Ua-Mobile': '?0',
            'Sec-Ch-Ua-Platform': '"macOS"',
        });

        return page;
    }

    public async close(): Promise<void> {
        if (this.browser) {
            await this.browser.close();
            this.browser = null;
        }
    }

    public async delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    protected async randomMouseMove(page: Page): Promise<void> {
        const width = 1920;
        const height = 1080;

        // Move mouse to random coordinates
        const x = Math.floor(Math.random() * width);
        const y = Math.floor(Math.random() * height);

        await page.mouse.move(x, y, { steps: 10 });
    }
}
