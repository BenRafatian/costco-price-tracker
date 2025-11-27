import { Telegraf, Context } from 'telegraf';
import { ProductManager } from '../core/productManager.js';
import { ConfigManager } from '../core/configManager.js';

export class TelegramBot {
    private bot: Telegraf;

    constructor(token: string) {
        this.bot = new Telegraf(token);
        this.initializeCommands();
    }

    private initializeCommands() {
        // Start command
        this.bot.start(async (ctx) => {
            const userId = ctx.from.id.toString();
            const username = ctx.from.username;
            const firstName = ctx.from.first_name;

            await ctx.reply(`Welcome ${firstName}! 🛒\n\nI can help you track prices on Costco.ca.\n\nCommands:\n/add <url> - Track a new product\n/list - See your tracked products\n/remove <url> - Stop tracking a product\n\nJust send me a Costco URL to get started!`);
        });

        // List command
        this.bot.command('list', async (ctx) => {
            const userId = ctx.from.id.toString();
            const products = await ProductManager.getUserProducts(userId);

            if (products.length === 0) {
                return ctx.reply('You are not tracking any products yet. Use /add <url> to start.');
            }

            let message = '📋 **Your Tracked Products:**\n\n';
            products.forEach((p: any, i: number) => {
                message += `${i + 1}. [${p.name}](${p.url})\n   💰 Current: $${p.currentPrice}\n\n`;
            });

            ctx.replyWithMarkdown(message);
        });

        // Remove command
        this.bot.command('remove', async (ctx) => {
            const userId = ctx.from.id.toString();
            // Extract URL from message: "/remove https://..."
            const text = ctx.message.text;
            const url = text.split(' ')[1];

            if (!url) {
                return ctx.reply('Usage: /remove <url>');
            }

            const result = await ProductManager.removeProduct(userId, url);
            ctx.reply(result.message);
        });

        // Add command (explicit)
        this.bot.command('add', async (ctx) => {
            await this.handleAdd(ctx);
        });

        // Handle text messages (implicit add)
        this.bot.on('text', async (ctx) => {
            const text = ctx.message.text;
            if (text.startsWith('/')) return; // Ignore other commands

            if (text.includes('costco.ca')) {
                await this.handleAdd(ctx);
            } else {
                ctx.reply('Please send a valid Costco.ca product URL.');
            }
        });
    }

    private async handleAdd(ctx: Context) {
        // @ts-ignore
        const text = ctx.message.text;
        // Simple regex to find URL in text
        const urlMatch = text.match(/https?:\/\/[^\s]+/);

        if (!urlMatch) {
            return ctx.reply('Please provide a valid URL.');
        }

        const url = urlMatch[0];
        const userId = ctx.from?.id.toString();
        const username = ctx.from?.username;

        if (!userId) return;

        ctx.reply('🔍 Checking product... this may take a moment.');

        const result = await ProductManager.addProduct(userId, url, username);

        if (result.success && result.product) {
            ctx.reply(`✅ Started tracking:\n${result.product.name}\n💰 Current Price: $${result.product.currentPrice}`);
        } else {
            ctx.reply(`❌ ${result.message}`);
        }
    }

    public launch() {
        this.bot.launch();
        console.log('Telegram bot started');

        // Enable graceful stop
        process.once('SIGINT', () => this.bot.stop('SIGINT'));
        process.once('SIGTERM', () => this.bot.stop('SIGTERM'));
    }

    public async notifyUser(userId: string, message: string) {
        try {
            await this.bot.telegram.sendMessage(userId, message, { parse_mode: 'Markdown' });
        } catch (e) {
            console.error(`Failed to send notification to ${userId}:`, e);
        }
    }
}
