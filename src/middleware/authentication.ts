import { Request, Response, NextFunction } from 'express';
import HttpStatus from 'http-status';
import { CognitoJwtVerifier } from 'aws-jwt-verify';
import { PrismaClient, UserTypeEnum } from '@prisma/client';

// Create a Cognito JWT verifier
const verifier = CognitoJwtVerifier.create({
    userPoolId: process.env.COGNITO_USER_POOL_ID!,
    tokenUse: 'access',
    clientId: process.env.COGNITO_CLIENT_ID!,
});

const prisma = new PrismaClient();

/**
 * Middleware to authenticate JWT tokens from AWS Cognito
 * This middleware extracts user information from the JWT token and adds it to req.user
 */
export const authenticateToken = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

        if (!token) {
            return res.status(HttpStatus.UNAUTHORIZED).json({
                success: false,
                message: 'Access token required',
            });
        }

        // Verify the JWT token with Cognito
        const payload = await verifier.verify(token);

        // Extract Cognito user ID from the payload
        const cognitoSub = payload.sub;

        if (!cognitoSub) {
            return res.status(HttpStatus.UNAUTHORIZED).json({
                success: false,
                message: 'User ID not found in token',
            });
        }

        // Get user information from our local database using Cognito sub
        const user = await prisma.user.findUnique({
            where: {
                cognito_sub: cognitoSub,
            },
            select: {
                id: true,
                email: true,
                role: true,
            },
        });

        if (!user) {
            return res.status(HttpStatus.UNAUTHORIZED).json({
                success: false,
                message: 'User not found',
            });
        }

        // Add user information to the request object
        req.user = {
            id: user.id,
            email: user.email,
            role: user.role,
        };

        next();
    } catch (error) {
        return res.status(HttpStatus.UNAUTHORIZED).json({
            success: false,
            message: 'Invalid or expired token',
        });
    }
};
