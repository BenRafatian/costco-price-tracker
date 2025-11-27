import { ProductData, PriceChange } from '../types/index.js';

export class TelegramNotifier {
    private botToken: string;
    private chatId: string;

    constructor(botToken: string, chatId: string) {
        this.botToken = botToken;
        this.chatId = chatId;
    }

    public async sendPriceAlert(priceChange: PriceChange): Promise<void> {
        const { product, previousPrice, newPrice, changePercent } = priceChange;
        
        const emoji = changePercent < 0 ? '📉' : '📈';
        const changeText = changePercent < 0 ? 'decreased' : 'increased';
        
        let message = `${emoji} *Price Alert!*\n\n`;
        message += `*Product:* ${product.name}\n`;
        message += `*Item #:* ${product.itemNumber}\n\n`;
        
        if (previousPrice) {
            message += `*Previous:* $${previousPrice.toFixed(2)}\n`;
            message += `*Current:* $${newPrice.toFixed(2)}\n`;
            message += `*Change:* ${changePercent > 0 ? '+' : ''}${changePercent.toFixed(2)}%\n\n`;
        } else {
            message += `*Price:* $${newPrice.toFixed(2)}\n`;
            message += `(First time tracking this item)\n\n`;
        }
        
        message += `[View on Costco](${product.url})`;

        await this.sendTelegramMessage(message);
    }

    public async sendTelegramMessage(message: string): Promise<void> {
        const url = `https://api.telegram.org/bot${this.botToken}/sendMessage`;
        const payload = {
            chat_id: this.chatId,
            text: message,
            parse_mode: 'Markdown',
            disable_web_page_preview: false
        };

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`Error sending message: ${JSON.stringify(errorData)}`);
            }
            
            console.log('✓ Telegram notification sent');
        } catch (error) {
            console.error('Failed to send Telegram message:', error);
        }
    }
}