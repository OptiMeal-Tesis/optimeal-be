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

export interface ForgotPasswordRequest {
    email: string;
}

export interface ConfirmForgotPasswordRequest {
    email: string;
    confirmationCode: string;
    newPassword: string;
}

export interface ChangePasswordRequest {
    accessToken: string;
    oldPassword: string;
    newPassword: string;
    userEmail?: string; // Optional email for database update
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
