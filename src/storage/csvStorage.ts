import { createObjectCsvWriter } from 'csv-writer';
import * as fs from 'fs';
import * as path from 'path';
import { ProductData, StoredPrice } from '../types/index.js';
import csvParser from 'csv-parser';

export class CsvStorage {
    private filePath: string;

    constructor(filePath: string = './data/prices.csv') {
        this.filePath = filePath;
        this.ensureFileExists();
    }

    private ensureFileExists(): void {
        const dir = path.dirname(this.filePath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        if (!fs.existsSync(this.filePath)) {
            // Create file with headers
            fs.writeFileSync(this.filePath, 'timestamp,itemNumber,name,price,url\n');
        }
    }

    public async savePrice(product: ProductData): Promise<void> {
        const csvWriter = createObjectCsvWriter({
            path: this.filePath,
            header: [
                { id: 'timestamp', title: 'timestamp' },
                { id: 'itemNumber', title: 'itemNumber' },
                { id: 'name', title: 'name' },
                { id: 'price', title: 'price' },
                { id: 'url', title: 'url' }
            ],
            append: true
        });

        await csvWriter.writeRecords([{
            timestamp: product.timestamp,
            itemNumber: product.itemNumber,
            name: product.name,
            price: product.price,
            url: product.url
        }]);

        console.log(`Saved to CSV: ${product.name} - $${product.price}`);
    }

    public async getLatestPrice(itemNumber: string): Promise<StoredPrice | null> {
        const prices = await this.loadPrices();
        const itemPrices = prices.filter(p => p.itemNumber === itemNumber);
        
        if (itemPrices.length === 0) return null;
        
        // Return the most recent price
        return itemPrices[itemPrices.length - 1];
    }

    public async loadPrices(): Promise<StoredPrice[]> {
        return new Promise((resolve, reject) => {
            const results: StoredPrice[] = [];
            
            if (!fs.existsSync(this.filePath)) {
                resolve([]);
                return;
            }

            fs.createReadStream(this.filePath)
                .pipe(csvParser())
                .on('data', (data) => {
                    results.push({
                        timestamp: data.timestamp,
                        itemNumber: data.itemNumber,
                        name: data.name,
                        price: parseFloat(data.price)
                    });
                })
                .on('end', () => resolve(results))
                .on('error', reject);
        });
    }

    public async getPriceHistory(itemNumber: string): Promise<StoredPrice[]> {
        const prices = await this.loadPrices();
        return prices.filter(p => p.itemNumber === itemNumber);
    }
}