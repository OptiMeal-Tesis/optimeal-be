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
            this.validateSignUpRequest(signUpRequest);

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
                        message: 'El email ya está registrado',
                    };
                }
                if (existingUser.national_id === signUpRequest.national_id) {
                    return {
                        success: false,
                        message: 'El DNI ya está registrado',
                    };
                }
            }

            const result = await this.authRepository.signUp(signUpRequest);

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
                    message: 'Usuario registrado exitosamente. Por favor confirma tu correo electrónico.',
                    data: {
                        userId: result.UserSub,
                        email: signUpRequest.email,
                    },
                };
            } else {
                return {
                    success: false,
                    message: 'No se pudo registrar el usuario.',
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
                message: 'Email confirmado exitosamente. Ya puede iniciar sesión.',
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
                    message: 'Inicio de sesión exitoso',
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
                    message: 'Error de autenticación',
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
            throw new Error('Email, contraseña y DNI son obligatorios');
        }

        if (!this.isValidEmail(request.email)) {
            throw new Error('Formato de email inválido');
        }

        if (request.password.length < 8) {
            throw new Error('La contraseña debe tener al menos 8 caracteres');
        }

        if (request.name && request.name.trim().length < 2) {
            throw new Error('El nombre debe tener al menos 2 caracteres');
        }

        if (!this.isValidNationalId(request.national_id)) {
            throw new Error('Formato de DNI inválido. Sin puntos ni espacios.');
        }
    }

    private validateConfirmSignUpRequest(request: ConfirmSignUpRequest): void {
        if (!request.email || !request.confirmationCode) {
            throw new Error('Email y código de confirmación son obligatorios');
        }

        if (!this.isValidEmail(request.email)) {
            throw new Error('Formato de correo electrónico inválido');
        }

        if (request.confirmationCode.length !== 6) {
            throw new Error('El código de confirmación debe tener 6 dígitos');
        }
    }

    private validateLoginRequest(request: LoginRequest): void {
        if (!request.email || !request.password) {
            throw new Error('Email y contraseña son obligatorios');
        }

        if (!this.isValidEmail(request.email)) {
            throw new Error('Formato de email inválido');
        }
    }

    private isValidEmail(email: string): boolean {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    private isValidNationalId(nationalId: string): boolean {
        // Eliminar espacios y guiones
        const cleanId = nationalId.replace(/[\s-]/g, '');

        // Validar que sea numérico de 7 a 10 dígitos
        const numericRegex = /^\d{7,10}$/;
        return numericRegex.test(cleanId);
    }

    private getErrorMessage(error: any): string {
        if (error.name === 'UsernameExistsException') {
            return 'El usuario ya existe';
        }
        if (error.name === 'InvalidPasswordException') {
            return 'La contraseña no cumple los requisitos de seguridad. Debe contener al menos 1 mayúscula, 1 minúscula, 1 número y 1 caracter especial (./?$#@).';
        }
        if (error.name === 'NotAuthorizedException') {
            return 'Credenciales inválidas';
        }
        if (error.name === 'UserNotConfirmedException') {
            return 'Usuario no confirmado. Por favor verifique su correo electrónico';
        }
        if (error.name === 'CodeMismatchException') {
            return 'Código de verificación inválido';
        }
        if (error.name === 'ExpiredCodeException') {
            return 'El código de verificación ha expirado';
        }

        return error.message || 'Error interno del servidor';
    }
}