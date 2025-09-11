import { PrismaClient, Prisma } from '@prisma/client';
import { prisma } from '../../../lib/prisma.js';

type Side = Prisma.SideGetPayload<{}>;

export class SideRepository {
    private prisma: PrismaClient;

    constructor() {
        this.prisma = prisma;
    }

    async create(data: { name: string; isActive: boolean; }): Promise<Side> {
        return await this.prisma.side.create({ data });
    }

    async findAll(): Promise<Side[]> {
        return await this.prisma.side.findMany({
            orderBy: { id: 'asc' }
        });
    }

    async findActive(): Promise<Side[]> {
        return await this.prisma.side.findMany({
            where: { isActive: true },
            orderBy: { id: 'asc' }
        });
    }

    async deleteById(id: number): Promise<Side> {
        return await this.prisma.side.delete({
            where: { id }
        });
    }

    async findById(id: number): Promise<Side | null> {
        return await this.prisma.side.findUnique({
            where: { id }
        });
    }

    async updateIsActive(id: number, isActive: boolean): Promise<Side> {
        return await this.prisma.side.update({
            where: { id },
            data: { isActive }
        });
    }
}

