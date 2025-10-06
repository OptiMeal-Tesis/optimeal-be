import { UserRepository } from '../repositories/user.repository.js';
import {
    User,
    CreateUserRequest,
    UpdateUserRequest,
    UserResponse,
    UserValidationResult
} from '../models/User.js';
import { UserTypeEnum } from '@prisma/client';

export class UserService {
    private userRepository: UserRepository;

    constructor() {
        this.userRepository = new UserRepository();
    }

    async createUser(userData: CreateUserRequest): Promise<UserResponse> {
        try {
            // Validate user data
            const validation = this.validateUserData(userData);
            if (!validation.isValid) {
                return {
                    success: false,
                    message: 'Datos de usuario inválidos',
                    data: validation.errors
                };
            }

            // Check if user already exists
            const exists = await this.userRepository.checkUserExists(userData.email, userData.national_id);
            if (exists.emailExists) {
                return {
                    success: false,
                    message: 'El email ya está registrado',
                };
            }
            if (exists.nationalIdExists) {
                return {
                    success: false,
                    message: 'El DNI ya está registrado',
                };
            }

            // Create user
            const user = await this.userRepository.createUser(userData);

            return {
                success: true,
                message: 'Usuario creado exitosamente',
                data: user,
            };
        } catch (error: any) {
            return {
                success: false,
                message: this.getErrorMessage(error),
            };
        }
    }

    async getUserById(id: number): Promise<UserResponse> {
        try {
            const user = await this.userRepository.getUserById(id);
            
            if (!user) {
                return {
                    success: false,
                    message: 'Usuario no encontrado',
                };
            }

            return {
                success: true,
                message: 'Usuario encontrado',
                data: user,
            };
        } catch (error: any) {
            return {
                success: false,
                message: this.getErrorMessage(error),
            };
        }
    }

    async getUserByEmail(email: string): Promise<UserResponse> {
        try {
            const user = await this.userRepository.getUserByEmail(email);
            
            if (!user) {
                return {
                    success: false,
                    message: 'Usuario no encontrado',
                };
            }

            return {
                success: true,
                message: 'Usuario encontrado',
                data: user,
            };
        } catch (error: any) {
            return {
                success: false,
                message: this.getErrorMessage(error),
            };
        }
    }

    async getUserByNationalId(nationalId: string): Promise<UserResponse> {
        try {
            const user = await this.userRepository.getUserByNationalId(nationalId);
            
            if (!user) {
                return {
                    success: false,
                    message: 'Usuario no encontrado',
                };
            }

            return {
                success: true,
                message: 'Usuario encontrado',
                data: user,
            };
        } catch (error: any) {
            return {
                success: false,
                message: this.getErrorMessage(error),
            };
        }
    }

    async getUserByCognitoSub(cognitoSub: string): Promise<UserResponse> {
        try {
            const user = await this.userRepository.getUserByCognitoSub(cognitoSub);
            
            if (!user) {
                return {
                    success: false,
                    message: 'Usuario no encontrado',
                };
            }

            return {
                success: true,
                message: 'Usuario encontrado',
                data: user,
            };
        } catch (error: any) {
            return {
                success: false,
                message: this.getErrorMessage(error),
            };
        }
    }

    async updateUser(id: number, userData: UpdateUserRequest): Promise<UserResponse> {
        try {
            // Validate user data
            const validation = this.validateUpdateUserData(userData);
            if (!validation.isValid) {
                return {
                    success: false,
                    message: 'Datos de usuario inválidos',
                    data: validation.errors
                };
            }

            // Check if user exists
            const existingUser = await this.userRepository.getUserById(id);
            if (!existingUser) {
                return {
                    success: false,
                    message: 'Usuario no encontrado',
                };
            }

            // Check for conflicts if updating email or national_id
            if (userData.national_id && userData.national_id !== existingUser.national_id) {
                const nationalIdExists = await this.userRepository.getUserByNationalId(userData.national_id);
                if (nationalIdExists) {
                    return {
                        success: false,
                        message: 'El DNI ya está registrado por otro usuario',
                    };
                }
            }

            // Update user
            const updatedUser = await this.userRepository.updateUser(id, userData);

            return {
                success: true,
                message: 'Usuario actualizado exitosamente',
                data: updatedUser,
            };
        } catch (error: any) {
            return {
                success: false,
                message: this.getErrorMessage(error),
            };
        }
    }

    async deleteUser(id: number): Promise<UserResponse> {
        try {
            const user = await this.userRepository.getUserById(id);
            if (!user) {
                return {
                    success: false,
                    message: 'Usuario no encontrado',
                };
            }

            await this.userRepository.deleteUser(id);

            return {
                success: true,
                message: 'Usuario eliminado exitosamente',
            };
        } catch (error: any) {
            return {
                success: false,
                message: this.getErrorMessage(error),
            };
        }
    }

    async getAllUsers(): Promise<UserResponse> {
        try {
            const users = await this.userRepository.getAllUsers();

            return {
                success: true,
                message: 'Usuarios obtenidos exitosamente',
                data: users,
            };
        } catch (error: any) {
            return {
                success: false,
                message: this.getErrorMessage(error),
            };
        }
    }

    async getUsersByRole(role: UserTypeEnum): Promise<UserResponse> {
        try {
            const users = await this.userRepository.getUsersByRole(role);

            return {
                success: true,
                message: 'Usuarios obtenidos exitosamente',
                data: users,
            };
        } catch (error: any) {
            return {
                success: false,
                message: this.getErrorMessage(error),
            };
        }
    }

    async updateUserPassword(email: string, newPassword: string): Promise<UserResponse> {
        try {
            // Check if user exists
            const userResult = await this.getUserByEmail(email);
            if (!userResult.success || !userResult.data || Array.isArray(userResult.data)) {
                return {
                    success: false,
                    message: 'User not found',
                };
            }

            // Ensure we have a valid user object
            const user = userResult.data as any;
            if (!user || !user.id) {
                return {
                    success: false,
                    message: 'Invalid user data',
                };
            }

            // Update password in database
            const updatedUser = await this.userRepository.updateUserPassword(user.id, newPassword);

            return {
                success: true,
                message: 'Password updated successfully',
                data: updatedUser,
            };
        } catch (error: any) {
            return {
                success: false,
                message: this.getErrorMessage(error),
            };
        }
    }

    private validateUserData(userData: CreateUserRequest): UserValidationResult {
        const errors: string[] = [];

        if (!userData.email || !userData.password || !userData.national_id) {
            errors.push('Email, contraseña y DNI son obligatorios');
        }

        if (userData.email && !this.isValidEmail(userData.email)) {
            errors.push('Formato de email inválido');
        }

        if (userData.password && userData.password.length < 8) {
            errors.push('La contraseña debe tener al menos 8 caracteres');
        }

        if (userData.name && userData.name.trim().length < 2) {
            errors.push('El nombre debe tener al menos 2 caracteres');
        }

        if (userData.national_id && !this.isValidNationalId(userData.national_id)) {
            errors.push('Formato de DNI inválido. Sin puntos ni espacios.');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    private validateUpdateUserData(userData: UpdateUserRequest): UserValidationResult {
        const errors: string[] = [];

        if (userData.name && userData.name.trim().length < 2) {
            errors.push('El nombre debe tener al menos 2 caracteres');
        }

        if (userData.national_id && !this.isValidNationalId(userData.national_id)) {
            errors.push('Formato de DNI inválido. Sin puntos ni espacios.');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
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
        if (error.code === 'P2002') {
            return 'Ya existe un usuario con estos datos';
        }
        if (error.code === 'P2025') {
            return 'Usuario no encontrado';
        }

        return error.message || 'Error interno del servidor';
    }
}
