import { Request, Response, NextFunction } from 'express';
import HttpStatus from 'http-status';
import { UserTypeEnum } from '@prisma/client';

// Extend the Request interface to include user information
declare global {
    namespace Express {
        interface Request {
            user?: {
                id: number;
                email: string;
                role: UserTypeEnum;
            };
        }
    }
}

/**
 * Middleware to check if the user is an admin
 * This middleware should be used after authentication middleware
 */
export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
    // Check if user is authenticated
    if (!req.user) {
        return res.status(HttpStatus.UNAUTHORIZED).json({
            success: false,
            message: 'Autenticación requerida',
        });
    }

    // Check if user is admin
    if (req.user.role !== UserTypeEnum.ADMIN) {
        return res.status(HttpStatus.FORBIDDEN).json({
            success: false,
            message: 'Acceso denegado: se requieren privilegios de administrador',
        });
    }

    next();
};

/**
 * Middleware to check if the user is authenticated (any type)
 */
export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
        return res.status(HttpStatus.UNAUTHORIZED).json({
            success: false,
            message: 'Autenticación requerida',
        });
    }

    next();
};

