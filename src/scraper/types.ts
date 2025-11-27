import { ProductData } from '../types/index.js';

export interface Scraper {
    /**
     * Determines if this scraper can handle the given URL
     */
    canHandle(url: string): boolean;

    /**
     * Scrapes product data from the given URL
     */
    scrapeProduct(url: string): Promise<ProductData | null>;
    
    /**
     * Clean up any resources (browser instances, etc.)
     */
    close?(): Promise<void>;
}
