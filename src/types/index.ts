export interface ProductData {
    itemNumber: string;
    name: string;
    price: number;
    url: string;
    timestamp: string;
    previousPrice?: number;
}

export interface NotificationConfig {
    telegram?: {
        botToken: string;
        chatId: string;
    };
    email?: {
        service: string;
        user: string;
        pass: string;
        to: string;
    };
}

export interface PriceChange {
    product: ProductData;
    previousPrice: number | null;
    newPrice: number;
    changePercent: number;
}

export interface StoredPrice {
    itemNumber: string;
    name: string;
    price: number;
    timestamp: string;
}