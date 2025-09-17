import { z } from 'zod';
import { UserTypeEnum } from '@prisma/client';

// Signup DTO validation schema
export const SignupInputDTO = z.object({
    email: z.string().email('Formato de email inválido'),
    password: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
    name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').optional(),
    national_id: z.string().regex(/^\d{7,10}$/, 'El DNI debe tener entre 7-10 dígitos'),
    role: z.nativeEnum(UserTypeEnum).optional().default(UserTypeEnum.USER),
});

// Login DTO validation schema
export const LoginInputDTO = z.object({
    email: z.string().email('Formato de email inválido'),
    password: z.string().min(1, 'La contraseña es requerida'),
});

// Confirm signup DTO validation schema
export const ConfirmSignupInputDTO = z.object({
    email: z.string().email('Formato de email inválido'),
    confirmationCode: z.string().length(6, 'Cantidad de dígitos del código de confirmación inválida'),
});

// Type exports
export type SignupInputDTO = z.infer<typeof SignupInputDTO>;
export type LoginInputDTO = z.infer<typeof LoginInputDTO>;
export type ConfirmSignupInputDTO = z.infer<typeof ConfirmSignupInputDTO>;
