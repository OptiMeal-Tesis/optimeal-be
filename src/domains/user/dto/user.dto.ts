import { z } from 'zod';
import { UserTypeEnum } from '@prisma/client';

// Create user DTO validation schema
export const CreateUserInputDTO = z.object({
    email: z.string().email('Formato de email inválido'),
    password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
    name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').optional(),
    last_name: z.string().min(2, 'El apellido debe tener al menos 2 caracteres').optional(),
    national_id: z.string().regex(/^\d{7,10}$/, 'El DNI debe tener entre 7 y 10 dígitos'),
    role: z.nativeEnum(UserTypeEnum).optional().default(UserTypeEnum.USER),
    cognito_sub: z.string().optional(),
});

// Update user DTO validation schema
export const UpdateUserInputDTO = z.object({
    name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').optional(),
    last_name: z.string().min(2, 'El apellido debe tener al menos 2 caracteres').optional(),
    // national_id: z.string().regex(/^\d{7,10}$/, 'El DNI debe tener entre 7 y 10 dígitos').optional(),
    role: z.nativeEnum(UserTypeEnum).optional(),
});

// Get user by ID DTO validation schema
export const GetUserByIdInputDTO = z.object({
    // id: z.number().int().positive('El ID del usuario debe ser un entero positivo'),
    id: z.string().regex(/^\d+$/, 'El ID debe ser un número').transform(Number)
});

// Get user by email DTO validation schema
export const GetUserByEmailInputDTO = z.object({
    email: z.string().email('Formato de email inválido'),
});

// Get user by national ID DTO validation schema
export const GetUserByNationalIdInputDTO = z.object({
    national_id: z.string().regex(/^\d{7,10}$/, 'El DNI debe tener entre 7 y 10 dígitos'),
});

// Type exports
export type CreateUserInputDTO = z.infer<typeof CreateUserInputDTO>;
export type UpdateUserInputDTO = z.infer<typeof UpdateUserInputDTO>;
export type GetUserByIdInputDTO = z.infer<typeof GetUserByIdInputDTO>;
export type GetUserByEmailInputDTO = z.infer<typeof GetUserByEmailInputDTO>;
export type GetUserByNationalIdInputDTO = z.infer<typeof GetUserByNationalIdInputDTO>;
