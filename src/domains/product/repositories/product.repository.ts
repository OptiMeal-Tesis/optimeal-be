import { PrismaClient, Prisma } from '@prisma/client';
import { CreateProductRequest, UpdateProductRequest } from '../models/Product.js';
import { prisma } from '../../../lib/prisma.js';

// Use Prisma types
type Product = Prisma.ProductGetPayload<{}>;

export class ProductRepository {
    private prisma: PrismaClient;

    constructor() {
        this.prisma = prisma;
    }

    async create(productData: CreateProductRequest): Promise<Product> {
        return await this.prisma.product.create({
            data: productData,
        });
    }

    async findById(id: number): Promise<Product | null> {
        return await this.prisma.product.findUnique({
            where: { id },
        });
    }

    async findAll(): Promise<Product[]> {
        return await this.prisma.product.findMany({
            orderBy: { createdAt: 'desc' },
        });
    }

    async update(id: number, productData: UpdateProductRequest): Promise<Product> {
        return await this.prisma.product.update({
            where: { id },
            data: productData,
        });
    }

    async delete(id: number): Promise<Product> {
        return await this.prisma.product.delete({
            where: { id },
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
        });
    }

    async disconnect(): Promise<void> {
        await this.prisma.$disconnect();
    }
}
