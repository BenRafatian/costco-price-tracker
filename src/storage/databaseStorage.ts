import { ProductData, StoredPrice } from '../types/index.js';

// Database storage - requires pg package for PostgreSQL
// To use: npm install pg @types/pg
export class DatabaseStorage {
    private connectionString: string;

    constructor(connectionString: string) {
        this.connectionString = connectionString;
    }

    public async savePrice(product: ProductData): Promise<void> {
        console.log('💾 Database storage (not implemented):');
        console.log(`  Would save: ${product.name} - $${product.price}`);
        
        // TODO: Implement with PostgreSQL
        // const { Pool } = require('pg');
        // const pool = new Pool({ connectionString: this.connectionString });
        // await pool.query('INSERT INTO prices ...');
    }

    public async getLatestPrice(itemNumber: string): Promise<StoredPrice | null> {
        console.log(`📊 Database query (not implemented): ${itemNumber}`);
        return null;
        
        // TODO: Implement with PostgreSQL
        // const result = await pool.query('SELECT * FROM prices WHERE item_number = $1 ORDER BY timestamp DESC LIMIT 1', [itemNumber]);
        // return result.rows[0] || null;
    }

    public async getPriceHistory(itemNumber: string): Promise<StoredPrice[]> {
        console.log(`📊 Database query (not implemented): ${itemNumber}`);
        return [];
        
        // TODO: Implement with PostgreSQL
        // const result = await pool.query('SELECT * FROM prices WHERE item_number = $1 ORDER BY timestamp DESC', [itemNumber]);
        // return result.rows;
    }
}