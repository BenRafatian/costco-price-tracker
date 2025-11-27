import { prisma } from '../lib/prisma.js';
import { ScraperFactory } from '../scraper/scraperFactory.js';

export class ProductManager {
    private static MAX_PRODUCTS_PER_USER = 10;

    /**
     * Add a product for a user.
     * Scrapes initial data if product is new to the system.
     */
    public static async addProduct(userId: string, url: string, username?: string): Promise<{ success: boolean; message: string; product?: any }> {
        // 1. Check user limit
        const userProductCount = await prisma.userProduct.count({
            where: { userId },
        });

        if (userProductCount >= this.MAX_PRODUCTS_PER_USER) {
            return { success: false, message: `You have reached the limit of ${this.MAX_PRODUCTS_PER_USER} products.` };
        }

        // 2. Ensure user exists
        await prisma.user.upsert({
            where: { id: userId },
            update: { username },
            create: { id: userId, username },
        });

        // 3. Check if product exists
        let product = await prisma.product.findUnique({
            where: { url },
        });

        if (!product) {
            // New product: Scrape it first
            try {
                const scraper = ScraperFactory.getScraper(url);
                const data = await scraper.scrapeProduct(url);

                if (!data) {
                    return { success: false, message: 'Failed to scrape product. Please check the URL.' };
                }

                product = await prisma.product.create({
                    data: {
                        url,
                        name: data.name,
                        currentPrice: data.price,
                        lastChecked: new Date(),
                        // Add initial price history
                        priceHistory: {
                            create: {
                                price: data.price,
                            }
                        }
                    },
                });
            } catch (error) {
                console.error('Error adding product:', error);
                return { success: false, message: 'Invalid URL or scraper error.' };
            }
        }

        // 4. Link user to product
        try {
            await prisma.userProduct.create({
                data: {
                    userId,
                    productId: product.id,
                },
            });
        } catch (e) {
            return { success: false, message: 'You are already tracking this product.' };
        }

        return { success: true, message: `Tracking started for: ${product.name}`, product };
    }

    /**
     * Get all products for a user
     */
    public static async getUserProducts(userId: string) {
        return prisma.product.findMany({
            where: {
                users: {
                    some: { userId },
                },
            },
        });
    }

    /**
     * Remove a product for a user
     */
    public static async removeProduct(userId: string, url: string) {
        const product = await prisma.product.findUnique({ where: { url } });
        if (!product) return { success: false, message: 'Product not found.' };

        try {
            await prisma.userProduct.delete({
                where: {
                    userId_productId: {
                        userId,
                        productId: product.id,
                    },
                },
            });

            // Optional: Cleanup product if no users are tracking it anymore
            // For now, we keep it for history

            return { success: true, message: 'Stopped tracking product.' };
        } catch (e) {
            return { success: false, message: 'You were not tracking this product.' };
        }
    }

    /**
     * Get all active products that need checking
     */
    public static async getAllActiveProducts() {
        // Only get products that have at least one user tracking them
        return prisma.product.findMany({
            where: {
                users: {
                    some: {}, // At least one user
                },
            },
            include: {
                users: true, // Include users to notify them later
            }
        });
    }

    /**
     * Update product price
     */
    public static async updatePrice(productId: string, price: number) {
        return prisma.product.update({
            where: { id: productId },
            data: {
                currentPrice: price,
                lastChecked: new Date(),
                priceHistory: {
                    create: {
                        price,
                    }
                }
            },
        });
    }
}
