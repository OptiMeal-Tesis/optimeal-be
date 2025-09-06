import { AuthRepository } from '../repositories/auth.repository.js';
import {
    SignUpRequest,
    LoginRequest,
    ConfirmSignUpRequest,
    AuthResponse,
    LoginResponse
} from '../models/User.js';
import { PrismaClient, UserTypeEnum } from '@prisma/client';

export class AuthService {
    private authRepository: AuthRepository;
    private prisma: PrismaClient;

    constructor() {
        this.authRepository = new AuthRepository();
        this.prisma = new PrismaClient();
    }

    async signUp(signUpRequest: SignUpRequest): Promise<AuthResponse> {
        try {
            // Business validations
            this.validateSignUpRequest(signUpRequest);

            // Check if user already exists in our database
            const existingUser = await this.prisma.user.findFirst({
                where: {
                    OR: [
                        { email: signUpRequest.email },
                        { national_id: signUpRequest.national_id }
                    ]
                }
            });

            if (existingUser) {
                if (existingUser.email === signUpRequest.email) {
                    return {
                        success: false,
                        message: 'Email is already registered',
                    };
                }
                if (existingUser.national_id === signUpRequest.national_id) {
                    return {
                        success: false,
                        message: 'National ID is already registered',
                    };
                }
            }

            const result = await this.authRepository.signUp(signUpRequest);

            // Only save user to our local database if Cognito signup was successful
            if (result.UserSub) {
                await this.prisma.user.create({
                    data: {
                        email: signUpRequest.email,
                        name: signUpRequest.name,
                        national_id: signUpRequest.national_id,
                        password: signUpRequest.password, // Encrypt in production
                        role: signUpRequest.role || UserTypeEnum.USER, // Use provided role or default to USER
                        cognito_sub: result.UserSub, // Store Cognito user ID
                    },
                });

                return {
                    success: true,
                    message: 'User registered successfully. Please confirm your email.',
                    data: {
                        userId: result.UserSub,
                        email: signUpRequest.email,
                    },
                };
            } else {
                return {
                    success: false,
                    message: 'Failed to register user with Cognito',
                };
            }
        } catch (error: any) {
            return {
                success: false,
                message: this.getErrorMessage(error),
            };
        }
    }

    async confirmSignUp(confirmRequest: ConfirmSignUpRequest): Promise<AuthResponse> {
        try {
            this.validateConfirmSignUpRequest(confirmRequest);

            await this.authRepository.confirmSignUp(confirmRequest);

            return {
                success: true,
                message: 'Email confirmed successfully. You can now log in.',
                data: {
                    email: confirmRequest.email,
                },
            };
        } catch (error: any) {
            return {
                success: false,
                message: this.getErrorMessage(error),
            };
        }
    }

    async login(loginRequest: LoginRequest): Promise<LoginResponse> {
        try {
            this.validateLoginRequest(loginRequest);

            const result = await this.authRepository.login(loginRequest);

            if (result.AuthenticationResult) {
                return {
                    success: true,
                    message: 'Login successful',
                    accessToken: result.AuthenticationResult.AccessToken,
                    refreshToken: result.AuthenticationResult.RefreshToken,
                    idToken: result.AuthenticationResult.IdToken,
                    data: {
                        email: loginRequest.email,
                        expiresIn: result.AuthenticationResult.ExpiresIn,
                    },
                };
            } else {
                return {
                    success: false,
                    message: 'Authentication error',
                };
            }
        } catch (error: any) {
            return {
                success: false,
                message: this.getErrorMessage(error),
            };
        }
    }

    private validateSignUpRequest(request: SignUpRequest): void {
        if (!request.email || !request.password || !request.national_id) {
            throw new Error('Email, password and national_id are required');
        }

        if (!this.isValidEmail(request.email)) {
            throw new Error('Invalid email format');
        }

        if (request.password.length < 8) {
            throw new Error('Password must be at least 8 characters');
        }

        if (request.name && request.name.trim().length < 2) {
            throw new Error('Name must be at least 2 characters');
        }

        if (!this.isValidNationalId(request.national_id)) {
            throw new Error('Invalid national_id format');
        }
    }

    private validateConfirmSignUpRequest(request: ConfirmSignUpRequest): void {
        if (!request.email || !request.confirmationCode) {
            throw new Error('Email and confirmation code are required');
        }

        if (!this.isValidEmail(request.email)) {
            throw new Error('Invalid email format');
        }

        if (request.confirmationCode.length !== 6) {
            throw new Error('Confirmation code must be 6 digits');
        }
    }

    private validateLoginRequest(request: LoginRequest): void {
        if (!request.email || !request.password) {
            throw new Error('Email and password are required');
        }

        if (!this.isValidEmail(request.email)) {
            throw new Error('Invalid email format');
        }
    }

    private isValidEmail(email: string): boolean {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    private isValidNationalId(nationalId: string): boolean {
        // Remove spaces and dashes
        const cleanId = nationalId.replace(/[\s-]/g, '');

        // Validate that it's numeric and has 7-10 digits
        const numericRegex = /^\d{7,10}$/;
        return numericRegex.test(cleanId);
    }

    private getErrorMessage(error: any): string {
        if (error.name === 'UsernameExistsException') {
            return 'User already exists';
        }
        if (error.name === 'InvalidPasswordException') {
            return 'Password does not meet security requirements';
        }
        if (error.name === 'NotAuthorizedException') {
            return 'Invalid credentials';
        }
        if (error.name === 'UserNotConfirmedException') {
            return 'User not confirmed. Please verify your email';
        }
        if (error.name === 'CodeMismatchException') {
            return 'Invalid verification code';
        }
        if (error.name === 'ExpiredCodeException') {
            return 'Verification code expired';
        }

        return error.message || 'Internal server error';
    }
}
