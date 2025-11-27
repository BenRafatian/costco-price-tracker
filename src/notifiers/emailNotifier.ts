import { PriceChange } from '../types/index.js';

// Email notifier - requires nodemailer package
// To use: npm install nodemailer @types/nodemailer
export class EmailNotifier {
    private emailConfig: {
        service: string;
        user: string;
        pass: string;
        to: string;
    };

    constructor(service: string, user: string, pass: string, to: string) {
        this.emailConfig = { service, user, pass, to };
    }

    public async sendPriceAlert(priceChange: PriceChange): Promise<void> {
        const { product, previousPrice, newPrice, changePercent } = priceChange;
        
        const subject = `Price Alert: ${product.name}`;
        let body = `Price change detected!\n\n`;
        body += `Product: ${product.name}\n`;
        body += `Item #: ${product.itemNumber}\n\n`;
        
        if (previousPrice) {
            body += `Previous: $${previousPrice.toFixed(2)}\n`;
            body += `Current: $${newPrice.toFixed(2)}\n`;
            body += `Change: ${changePercent > 0 ? '+' : ''}${changePercent.toFixed(2)}%\n\n`;
        } else {
            body += `Price: $${newPrice.toFixed(2)}\n`;
            body += `(First time tracking this item)\n\n`;
        }
        
        body += `View: ${product.url}`;

        console.log('📧 Email notification (not implemented):');
        console.log(`  To: ${this.emailConfig.to}`);
        console.log(`  Subject: ${subject}`);
        console.log(`  Body: ${body}`);
        
        // TODO: Implement with nodemailer
        // const nodemailer = require('nodemailer');
        // const transporter = nodemailer.createTransporter({...});
        // await transporter.sendMail({...});
    }
}