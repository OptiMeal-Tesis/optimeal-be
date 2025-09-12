import { UserTypeEnum } from '@prisma/client';

export interface SignUpRequest {
    email: string;
    password: string;
    name?: string;
    national_id: string;
    role?: UserTypeEnum;
}

export interface LoginRequest {
    email: string;
    password: string;
}

export interface ConfirmSignUpRequest {
    email: string;
    confirmationCode: string;
}

export interface AuthResponse {
    success: boolean;
    message: string;
    data?: any;
}

export interface LoginResponse extends AuthResponse {
    accessToken?: string;
    refreshToken?: string;
    idToken?: string;
}
