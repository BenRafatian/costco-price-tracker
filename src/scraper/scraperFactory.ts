import { Scraper } from './types.js';
import { PlaywrightScraper } from './playwrightScraper.js';

export class ScraperFactory {
    private static scrapers: Scraper[] = [];

    public static registerScraper(scraper: Scraper) {
        this.scrapers.push(scraper);
    }

    public static getScraper(url: string): Scraper {
        // Initialize scrapers if empty (lazy initialization)
        if (this.scrapers.length === 0) {
            this.scrapers.push(new PlaywrightScraper());
        }

        const scraper = this.scrapers.find(s => s.canHandle(url));

        if (!scraper) {
            throw new Error(`No scraper found for URL: ${url}`);
        }

        return scraper;
    }

    public static async closeAll() {
        for (const scraper of this.scrapers) {
            if (scraper.close) {
                await scraper.close();
            }
        }
    }
}
