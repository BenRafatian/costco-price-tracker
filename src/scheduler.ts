import cron from 'node-cron';
import { ScraperFactory } from './scraper/scraperFactory.js';
import { ProductManager } from './core/productManager.js';
import { ConfigManager } from './core/configManager.js';
import { TelegramBot } from './notifiers/telegramBot.js';

export class Scheduler {
    private bot: TelegramBot;

    constructor(bot: TelegramBot) {
        this.bot = bot;
    }

    public async start() {
        // Default to every hour, but check config
        // Note: node-cron doesn't support dynamic intervals easily without restarting.
        // For simplicity, we'll run every minute and check if enough time has passed, 
        // OR just stick to a fixed cron schedule like "0 * * * *" (hourly).
        // Let's use a fixed hourly schedule for now, or read from config.

        const intervalMinutes = await ConfigManager.getNumber('CHECK_INTERVAL_MINUTES') || 60;
        const cronExpression = `*/${intervalMinutes} * * * *`; // This is simplistic, assumes < 60

        console.log(`Starting scheduler with interval: ${intervalMinutes} minutes`);

        // Run immediately on start
        this.checkPrices();

        // Schedule
        cron.schedule(cronExpression, () => {
            this.checkPrices();
        });
    }

    private async checkPrices() {
        console.log('=== Starting scheduled price check ===');
        const products = await ProductManager.getAllActiveProducts();
        console.log(`Checking ${products.length} products...`);

        for (const product of products) {
            try {
                const scraper = ScraperFactory.getScraper(product.url);
                const data = await scraper.scrapeProduct(product.url);

                if (data && data.price !== null) {
                    const oldPrice = product.currentPrice || 0;
                    const newPrice = data.price;

                    // Update DB
                    await ProductManager.updatePrice(product.id, newPrice);

                    // Check for change
                    if (oldPrice !== 0 && oldPrice !== newPrice) {
                        const change = ((newPrice - oldPrice) / oldPrice) * 100;
                        const threshold = await ConfigManager.getNumber('PRICE_CHANGE_THRESHOLD') || 0;

                        if (Math.abs(change) >= threshold) {
                            // Notify all users tracking this product
                            const message = `🚨 **Price Change Alert!**\n\n[${product.name}](${product.url})\n\nOld Price: $${oldPrice}\nNew Price: $${newPrice}\nChange: ${change.toFixed(2)}%`;

                            for (const userProduct of product.users) {
                                await this.bot.notifyUser(userProduct.userId, message);
                            }
                        }
                    }
                }
            } catch (error) {
                console.error(`Failed to check ${product.name}:`, error);
            }
        }
        console.log('=== Price check complete ===');
    }
}
