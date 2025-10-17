import { AuthRepository } from '../repositories/auth.repository.js';
import {
    SignUpRequest,
    LoginRequest,
    ConfirmSignUpRequest,
    ForgotPasswordRequest,
    ConfirmForgotPasswordRequest,
    ChangePasswordRequest,
    AuthResponse,
    LoginResponse
} from '../models/User.js';
import { UserService } from '../../user/services/user.service.js';
import { CreateUserRequest } from '../../user/models/User.js';
import { UserTypeEnum } from '@prisma/client';

export class AuthService {
    private authRepository: AuthRepository;
    private userService: UserService;

    constructor() {
        this.authRepository = new AuthRepository();
        this.userService = new UserService();
    }

    async signUp(signUpRequest: SignUpRequest): Promise<AuthResponse> {
        try {
            this.validateSignUpRequest(signUpRequest);

            // Check if user already exists using the user service
            const existingUserByEmail = await this.userService.getUserByEmail(signUpRequest.email);
            if (existingUserByEmail.success) {
                return {
                    success: false,
                    message: 'El email ya está registrado',
                };
            }

            const existingUserByNationalId = await this.userService.getUserByNationalId(signUpRequest.national_id);
            if (existingUserByNationalId.success) {
                return {
                    success: false,
                    message: 'El DNI ya está registrado',
                };
            }

            // Register user in Cognito
            const result = await this.authRepository.signUp(signUpRequest);

            if (result.UserSub) {
                // Create user in database using the user service
                const createUserRequest: CreateUserRequest = {
                    email: signUpRequest.email,
                    name: signUpRequest.name,
                    national_id: signUpRequest.national_id,
                    password: signUpRequest.password, // Encrypt in production
                    role: signUpRequest.role || UserTypeEnum.USER,
                    cognito_sub: result.UserSub,
                };

                const userResult = await this.userService.createUser(createUserRequest);
                
                if (!userResult.success) {
                    return {
                        success: false,
                        message: 'Error al crear el usuario en la base de datos',
                    };
                }

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

    async login(loginRequest: LoginRequest, isBackoffice: boolean = false): Promise<LoginResponse> {
        try {
            this.validateLoginRequest(loginRequest);

            // First, check if user exists in database
            const userResult = await this.userService.getUserByEmail(loginRequest.email);
            if (!userResult.success || !userResult.data || Array.isArray(userResult.data)) {
                return {
                    success: false,
                    message: 'Usuario no encontrado',
                };
            }

            // If this is a backoffice login, check if user is ADMIN
            if (isBackoffice && userResult.data.role !== 'ADMIN') {
                return {
                    success: false,
                    message: 'Acceso denegado. Solo los administradores pueden acceder al backoffice.',
                };
            }

            // Then authenticate with Cognito
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
                        userId: userResult.data.id,
                        role: userResult.data.role,
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

        // Validate allowed email domain
        if (!this.isValidEmailDomain(request.email)) {
            const allowedDomains = this.getAllowedDomains();
            const bullets = (allowedDomains.length > 0 ? allowedDomains : (process.env.ALLOWED_EMAIL_DOMAIN || '').split(',').map(s => s.trim()).filter(Boolean))
                .map((d) => `• ${d}`)
                .join('\n');
            const envMap = {
                ALLOWED_EMAIL_DOMAIN: (process.env.ALLOWED_EMAIL_DOMAIN || null) as any,
            } as const;
            const err: any = new Error(`Solo se permiten correos de los siguientes dominios:\n${bullets}`);
            err.env = envMap;
            throw err;
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

    private isValidEmailDomain(email: string): boolean {
        const emailLc = email.toLowerCase();
        const domains = this.getAllowedDomains();
        if (domains.length === 0) return false;
        return domains.some((d) => emailLc.endsWith(d));
    }

    private getAllowedDomains(): string[] {
        const raw = process.env.ALLOWED_EMAIL_DOMAIN || '';
        return raw
            .split(',')
            .map((s) => s.toLowerCase().trim())
            .filter((s) => s.length > 0);
    }

    private isValidNationalId(nationalId: string): boolean {
        // Eliminar espacios y guiones
        const cleanId = nationalId.replace(/[\s-]/g, '');

        // Validar que sea numérico de 7 a 10 dígitos
        const numericRegex = /^\d{7,10}$/;
        return numericRegex.test(cleanId);
    }

    async forgotPassword(forgotPasswordRequest: ForgotPasswordRequest): Promise<AuthResponse> {
        try {
            if (!forgotPasswordRequest.email) {
                throw new Error('El email es obligatorio');
            }

            if (!this.isValidEmail(forgotPasswordRequest.email)) {
                throw new Error('Formato de email inválido');
            }

            // Check if user exists in database
            const userResult = await this.userService.getUserByEmail(forgotPasswordRequest.email);
            if (!userResult.success || !userResult.data || Array.isArray(userResult.data)) {
                return {
                    success: false,
                    message: 'User not found',
                };
            }

            await this.authRepository.forgotPassword(forgotPasswordRequest);

            return {
                success: true,
                message: 'Se ha enviado un código de verificación a tu correo electrónico',
                data: {
                    email: forgotPasswordRequest.email,
                },
            };
        } catch (error: any) {
            return {
                success: false,
                message: this.getErrorMessage(error),
            };
        }
    }

    async confirmForgotPassword(confirmRequest: ConfirmForgotPasswordRequest): Promise<AuthResponse> {
        try {
            if (!confirmRequest.email || !confirmRequest.confirmationCode || !confirmRequest.newPassword) {
                throw new Error('Email, código de confirmación y nueva contraseña son obligatorios');
            }

            if (!this.isValidEmail(confirmRequest.email)) {
                throw new Error('Formato de email inválido');
            }

            if (confirmRequest.confirmationCode.length !== 6) {
                throw new Error('El código de confirmación debe tener 6 dígitos');
            }

            if (confirmRequest.newPassword.length < 8) {
                throw new Error('La nueva contraseña debe tener al menos 8 caracteres');
            }

            // Confirm password change in Cognito
            await this.authRepository.confirmForgotPassword(confirmRequest);

            // Update password in local database
            const updatePasswordResult = await this.userService.updateUserPassword(
                confirmRequest.email, 
                confirmRequest.newPassword
            );

            if (!updatePasswordResult.success) {
                // If database update fails, log but don't fail the operation
                console.error('Error updating password in database:', updatePasswordResult.message);
            }

            return {
                success: true,
                message: 'Tu contraseña ha sido cambiada exitosamente',
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

    async changePassword(changePasswordRequest: ChangePasswordRequest): Promise<AuthResponse> {
        try {
            if (!changePasswordRequest.accessToken || !changePasswordRequest.oldPassword || !changePasswordRequest.newPassword) {
                throw new Error('Token de acceso, contraseña actual y nueva contraseña son obligatorios');
            }

            if (changePasswordRequest.newPassword.length < 8) {
                throw new Error('La nueva contraseña debe tener al menos 8 caracteres');
            }

            if (changePasswordRequest.oldPassword === changePasswordRequest.newPassword) {
                throw new Error('La nueva contraseña debe ser diferente a la actual');
            }

            // Change password in Cognito
            await this.authRepository.changePassword(changePasswordRequest);

            // Update password in local database if email is provided
            if (changePasswordRequest.userEmail) {
                const updatePasswordResult = await this.userService.updateUserPassword(
                    changePasswordRequest.userEmail, 
                    changePasswordRequest.newPassword
                );

                if (!updatePasswordResult.success) {
                    // If database update fails, log but don't fail the operation
                    console.error('Error updating password in database:', updatePasswordResult.message);
                }
            }
            
            return {
                success: true,
                message: 'Tu contraseña ha sido cambiada exitosamente',
            };
        } catch (error: any) {
            return {
                success: false,
                message: this.getErrorMessage(error),
            };
        }
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
        if (error.name === 'LimitExceededException') {
            return 'Se ha excedido el límite de intentos. Por favor intenta más tarde';
        }
        if (error.name === 'InvalidParameterException') {
            return 'Parámetros inválidos';
        }
        if (error.name === 'UserNotFoundException') {
            return 'Usuario no encontrado';
        }

        return error.message || 'Error interno del servidor';
    }
}