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
        return await this.prisma.product.findUnique({
            where: { id },
            include: {
                sides: true
            }
        });
    }

    async findAll(): Promise<Product[]> {
        return await this.prisma.product.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                sides: true
            }
        });
    }

    async update(id: number, productData: UpdateProductRequest): Promise<Product> {
        const { sides, ...rest } = productData;
        return await this.prisma.product.update({
            where: { id },
            data: {
                ...rest,
                ...(sides !== undefined && {
                    sides: {
                        set: sides.map(id => ({ id }))
                    }
                })
            },
            include: {
                sides: true
            }
        });
    }

    async delete(id: number): Promise<Product> {
        return await this.prisma.product.delete({
            where: { id },
            include: {
                sides: true
            }
        });
    }

    async count(): Promise<number> {
        return await this.prisma.product.count();
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
