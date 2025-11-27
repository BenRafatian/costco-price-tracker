import { prisma } from '../lib/prisma.js';
import * as dotenv from 'dotenv';

dotenv.config();

export class ConfigManager {
    private static defaults = {
        CHECK_INTERVAL_MINUTES: 60,
        PRICE_CHANGE_THRESHOLD: 0,
    };

    /**
     * Get a config value, preferring DB over env over default
     */
    public static async get(key: string): Promise<string | null> {
        try {
            // Try DB first
            const dbConfig = await prisma.systemConfig.findUnique({
                where: { key },
            });
            if (dbConfig) return dbConfig.value;
        } catch (error) {
            console.warn(`Failed to fetch config ${key} from DB, falling back to env.`);
        }

        // Try Env
        if (process.env[key]) return process.env[key]!;

        // Try Default
        if (key in this.defaults) {
            return (this.defaults as any)[key].toString();
        }

        return null;
    }

    public static async getNumber(key: string): Promise<number | null> {
        const val = await this.get(key);
        return val ? parseFloat(val) : null;
    }

    public static async set(key: string, value: string, description?: string): Promise<void> {
        await prisma.systemConfig.upsert({
            where: { key },
            update: { value, description },
            create: { key, value, description },
        });
    }
}
