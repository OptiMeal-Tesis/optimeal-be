import { PrismaClient, Prisma } from '@prisma/client';
import { CreateProductRequest, UpdateProductRequest } from '../models/Product.js';
import { prisma } from '../../../lib/prisma.js';

// Use Prisma types
type Product = Prisma.ProductGetPayload<{
    include: {
        sides: true;
    };
}>;

export class ProductRepository {
    private prisma: PrismaClient;

    constructor() {
        this.prisma = prisma;
    }

    async create(productData: CreateProductRequest): Promise<Product> {
        const { sides, ...rest } = productData;
        return await this.prisma.product.create({
            data: {
                ...rest,
                sides: {
                    connect: sides.map(id => ({ id }))
                }
            },
            include: {
                sides: true
            }
        });
    }

    async findById(id: number): Promise<Product | null> {
        return await this.prisma.product.findFirst({
            where: {
              id,
              deletedAt: null,
            },
            include: {
              sides: true,
            },
        });
    }

    async findAll(): Promise<Product[]> {
        const products = await this.prisma.product.findMany({
            where: { deletedAt: null },
            include: { sides: true },
        });

        const groupRank = (p: Product) => {
            const isOutOfStock = p.stock == null || p.stock === 0;
            const isFood = p.type === 'FOOD';
            const isDrink = p.type === 'BEVERAGE';

            if (isFood && !isOutOfStock) return 0;
            if (isFood &&  isOutOfStock) return 1;
            if (isDrink && !isOutOfStock) return 2;
            return 3;
        };

        return products.sort((productA, productB) => {
            const rankA = groupRank(productA);
            const rankB = groupRank(productB);

            if (rankA !== rankB) {
                return rankA - rankB;
            }

            // Si son del mismo grupo, ordenar por stock descendente
            const stockA = productA.stock ?? -1;
            const stockB = productB.stock ?? -1;

            return stockB - stockA;
        });
    }

    async findAllGrouped(): Promise<{ foods: Product[]; beverages: Product[]; total: number }> {
        const [foods, beverages, total] = await Promise.all([
            this.prisma.product.findMany({
                where: { deletedAt: null, type: 'FOOD' },
                include: { sides: true },
            }),
            this.prisma.product.findMany({
                where: { deletedAt: null, type: 'BEVERAGE' },
                include: { sides: true },
            }),
            this.count(),
        ]);

        const sortByStockDescPuttingOutOfStockLast = (a: Product, b: Product) => {
            const stockA = a.stock ?? -1;
            const stockB = b.stock ?? -1;
            return stockB - stockA;
        };

        return {
            foods: foods
                .sort(sortByStockDescPuttingOutOfStockLast),
            beverages: beverages
                .sort(sortByStockDescPuttingOutOfStockLast),
            total,
        };
    }


    async update(id: number, productData: UpdateProductRequest): Promise<Product> {
        const { sides, ...rest } = productData;
        return await this.prisma.product.update({
            where: {
              id,
              deletedAt: null,
            },
            data: {
              ...rest,
              ...(sides !== undefined && {
                sides: {
                  set: sides.map((id) => ({ id })),
                },
              }),
            },
            include: {
              sides: true,
            },
        });
    }

    async delete(id: number): Promise<Product> {
      return await this.prisma.product.update({
          where: {
            id,
            deletedAt: null,
          },
          data: {
            deletedAt: new Date(),
          },
          include: {
            sides: true,
          },
        });
    }

    async count(): Promise<number> {
        return await this.prisma.product.count({
          where: {
            deletedAt: null,
          },
        });
    }

    async searchByName(name: string): Promise<Product[]> {
        return await this.prisma.product.findMany({
            where: {
                name: {
                    contains: name,
                    mode: 'insensitive',
                },
            },
            orderBy: { createdAt: 'desc' },
            include: {
                sides: true
            }
        });
    }

    async disconnect(): Promise<void> {
        await this.prisma.$disconnect();
    }
}
