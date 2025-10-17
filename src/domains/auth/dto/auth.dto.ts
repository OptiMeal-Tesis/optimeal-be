import { z } from 'zod';
import { UserTypeEnum } from '@prisma/client';

// Signup DTO validation schema
export const SignupInputDTO = z.object({
    email: z.string()
        .email('Formato de email inválido')
        .refine(
            (email) => {
                const raw = process.env.ALLOWED_EMAIL_DOMAIN || '';
                const domains = raw
                    .split(',')
                    .map((s) => s.toLowerCase().trim())
                    .filter((s) => s.length > 0);
                const emailLc = email.toLowerCase();
                return domains.length > 0 && domains.some((d) => emailLc.endsWith(d));
            },
            { message: (() => {
                const raw = process.env.ALLOWED_EMAIL_DOMAIN || '';
                const domains = raw.split(',').map(s => s.trim()).filter(Boolean);
                const bullets = domains.map(d => `• ${d}`).join('\n');
                return `Solo se permiten correos de los siguientes dominios:\n${bullets}`;
            })() }
        ),
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

// Forgot password DTO validation schema
export const ForgotPasswordInputDTO = z.object({
    email: z.string().email('Formato de email inválido'),
});

// Confirm forgot password DTO validation schema
export const ConfirmForgotPasswordInputDTO = z.object({
    email: z.string().email('Formato de email inválido'),
    confirmationCode: z.string().length(6, 'Cantidad de dígitos del código de confirmación inválida'),
    newPassword: z.string().min(8, 'La contraseña debe tener al menos 8 caracteres'),
});

// Change password DTO validation schema (for authenticated users)
export const ChangePasswordInputDTO = z.object({
    oldPassword: z.string().min(1, 'La contraseña actual es requerida'),
    newPassword: z.string().min(8, 'La nueva contraseña debe tener al menos 8 caracteres'),
});

// Type exports
export type SignupInputDTO = z.infer<typeof SignupInputDTO>;
export type LoginInputDTO = z.infer<typeof LoginInputDTO>;
export type ConfirmSignupInputDTO = z.infer<typeof ConfirmSignupInputDTO>;
export type ForgotPasswordInputDTO = z.infer<typeof ForgotPasswordInputDTO>;
export type ConfirmForgotPasswordInputDTO = z.infer<typeof ConfirmForgotPasswordInputDTO>;
export type ChangePasswordInputDTO = z.infer<typeof ChangePasswordInputDTO>;
