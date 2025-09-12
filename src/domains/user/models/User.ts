import { UserTypeEnum } from '@prisma/client';

export interface User {
    id?: number;
    email: string;
    name?: string | null;
    national_id: string;
    password: string;
    role: UserTypeEnum;
    cognito_sub?: string | null;
    isConfirmed?: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface CreateUserRequest {
    email: string;
    password: string;
    name?: string;
    national_id: string;
    role?: UserTypeEnum;
    cognito_sub?: string;
}

export interface UpdateUserRequest {
    name?: string;
    national_id?: string;
    role?: UserTypeEnum;
}

export interface UserResponse {
    success: boolean;
    message: string;
    data?: User | User[] | string[];
}

export interface UserValidationResult {
    isValid: boolean;
    errors: string[];
}
