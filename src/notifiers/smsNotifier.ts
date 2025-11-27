import { PriceChange } from '../types/index.js';

// SMS notifier - requires Twilio package
// To use: npm install twilio @types/twilio
export class SmsNotifier {
    private phoneNumber: string;
    private accountSid: string;
    private authToken: string;

    constructor(accountSid: string, authToken: string, phoneNumber: string) {
        this.accountSid = accountSid;
        this.authToken = authToken;
        this.phoneNumber = phoneNumber;
    }

    public async sendPriceAlert(priceChange: PriceChange): Promise<void> {
        const { product, previousPrice, newPrice, changePercent } = priceChange;
        
        let message = `Price Alert: ${product.name}\n`;
        
        if (previousPrice) {
            message += `Was: $${previousPrice.toFixed(2)}\n`;
            message += `Now: $${newPrice.toFixed(2)} (${changePercent > 0 ? '+' : ''}${changePercent.toFixed(2)}%)`;
        } else {
            message += `Price: $${newPrice.toFixed(2)}`;
        }

        console.log('📱 SMS notification (not implemented):');
        console.log(`  To: ${this.phoneNumber}`);
        console.log(`  Message: ${message}`);
        
        // TODO: Implement with Twilio
        // const twilio = require('twilio');
        // const client = twilio(this.accountSid, this.authToken);
        // await client.messages.create({...});
    }
}