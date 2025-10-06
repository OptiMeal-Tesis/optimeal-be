import { PrismaClient, UserTypeEnum } from '@prisma/client';
import { User, CreateUserRequest, UpdateUserRequest } from '../models/User.js';

export class UserRepository {
    private prisma: PrismaClient;

    constructor() {
        this.prisma = new PrismaClient();
    }

    async createUser(userData: CreateUserRequest): Promise<User> {
        return await this.prisma.user.create({
            data: {
                email: userData.email,
                name: userData.name,
                national_id: userData.national_id,
                password: userData.password,
                role: userData.role || UserTypeEnum.USER,
                cognito_sub: userData.cognito_sub,
            },
        });
    }

    async getUserById(id: number): Promise<User | null> {
        return await this.prisma.user.findUnique({
            where: { id },
        });
    }

    async getUserByEmail(email: string): Promise<User | null> {
        return await this.prisma.user.findUnique({
            where: { email },
        });
    }

    async getUserByNationalId(nationalId: string): Promise<User | null> {
        return await this.prisma.user.findUnique({
            where: { national_id: nationalId },
        });
    }

    async getUserByCognitoSub(cognitoSub: string): Promise<User | null> {
        return await this.prisma.user.findUnique({
            where: { cognito_sub: cognitoSub },
        });
    }

    async checkUserExists(email: string, nationalId: string): Promise<{ emailExists: boolean; nationalIdExists: boolean }> {
        const existingUser = await this.prisma.user.findFirst({
            where: {
                OR: [
                    { email },
                    { national_id: nationalId }
                ]
            }
        });

        return {
            emailExists: existingUser?.email === email,
            nationalIdExists: existingUser?.national_id === nationalId
        };
    }

    async updateUser(id: number, userData: UpdateUserRequest): Promise<User> {
        return await this.prisma.user.update({
            where: { id },
            data: userData,
        });
    }

    async deleteUser(id: number): Promise<User> {
        return await this.prisma.user.delete({
            where: { id },
        });
    }

    async getAllUsers(): Promise<User[]> {
        return await this.prisma.user.findMany({
            orderBy: { id: 'desc' },
        });
    }

    async getUsersByRole(role: UserTypeEnum): Promise<User[]> {
        return await this.prisma.user.findMany({
            where: { role },
            orderBy: { id: 'desc' },
        });
    }

    async updateUserPassword(id: number, newPassword: string): Promise<User> {
        return await this.prisma.user.update({
            where: { id },
            data: { password: newPassword },
        });
    }
}
