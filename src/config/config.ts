import { config as dotenvConfig } from 'dotenv';
dotenvConfig();

export const config = {
    telegram: {
        botToken: process.env.TELEGRAM_BOT_TOKEN || '',
        chatId: process.env.TELEGRAM_CHAT_ID || ''
    },
    tracking: {
        // List of Costco.ca product URLs to track
        productUrls: process.env.PRODUCT_URLS?.split(',') || [],
        // Check interval in minutes
        checkIntervalMinutes: parseInt(process.env.CHECK_INTERVAL_MINUTES || '60'),
        // Price change threshold to trigger notification (in percentage)
        priceChangeThreshold: parseFloat(process.env.PRICE_CHANGE_THRESHOLD || '0')
    },
    storage: {
        csvFilePath: process.env.CSV_FILE_PATH || './data/prices.csv'
    }
};

export function validateConfig(): boolean {
    const errors: string[] = [];

    if (!config.telegram.botToken) {
        errors.push('TELEGRAM_BOT_TOKEN is not set');
    }
    if (!config.telegram.chatId) {
        errors.push('TELEGRAM_CHAT_ID is not set');
    }
    if (config.tracking.productUrls.length === 0) {
        errors.push('PRODUCT_URLS is not set or empty');
    }

    if (errors.length > 0) {
        console.error('Configuration errors:');
        errors.forEach(err => console.error(`  - ${err}`));
        return false;
    }

    return true;
}