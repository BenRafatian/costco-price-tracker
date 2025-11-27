import * as dotenv from 'dotenv';
import { TelegramBot } from './notifiers/telegramBot.js';
import { Scheduler } from './scheduler.js';
import { ConfigManager } from './core/configManager.js';

dotenv.config();

async function main() {
    console.log('🚀 Starting Costco Price Tracker Bot...');

    // 1. Initialize Bot
    const token = await ConfigManager.get('TELEGRAM_BOT_TOKEN');
    if (!token) {
        console.error('TELEGRAM_BOT_TOKEN is missing!');
        process.exit(1);
    }

    const bot = new TelegramBot(token);
    bot.launch();

    // 2. Start Scheduler
    const scheduler = new Scheduler(bot);
    scheduler.start();

    console.log('✅ System is running. Waiting for messages...');
}

main().catch(console.error);