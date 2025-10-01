import { Request, Response, Router } from 'express';
import HttpStatus from 'http-status';
import { AuthService } from '../services/auth.service.js';
import { SignupInputDTO, LoginInputDTO, ConfirmSignupInputDTO } from '../dto/auth.dto.js';
import { BodyValidation } from '../../../middleware/validation.js';

export const authRouter = Router();

const service: AuthService = new AuthService();

authRouter.post('/signup', BodyValidation(SignupInputDTO), async (req: Request, res: Response) => {
    const data = req.body;

    const result = await service.signUp(data);

    if (result.success) {
        return res.status(HttpStatus.CREATED).json(result);
    } else {
        return res.status(HttpStatus.BAD_REQUEST).json(result);
    }
});

authRouter.post('/confirm', BodyValidation(ConfirmSignupInputDTO), async (req: Request, res: Response) => {
    const data = req.body;

    const result = await service.confirmSignUp(data);

    if (result.success) {
        return res.status(HttpStatus.OK).json(result);
    } else {
        return res.status(HttpStatus.BAD_REQUEST).json(result);
    }
});

authRouter.get('/confirm', async (req: Request, res: Response) => {
    const email = req.query.email as string;
    const code = req.query.code as string;
    const frontendLoginUrl = 'https://d3ejrhibfrfytu.cloudfront.net/login';

    if (!email || !code) {
        return res.status(HttpStatus.BAD_REQUEST).send(`
            <html>
                <head>
                    <meta charset="utf-8">
                    <style>
                        body { font-family: 'Futura', Helvetica, Arial, sans-serif; background-color: #F7F8FB; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
                        .container { background: white; padding: 40px; border-radius: 16px; text-align: center; max-width: 400px; }
                        h1 { color: #1E1E1E; margin-bottom: 16px; }
                        p { color: #45556C; }
                        a { color: #0d47a1; text-decoration: none; font-weight: 600; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <h1>Error de verificación</h1>
                        <p>El link de verificación es inválido o está incompleto.</p>
                        <p><a href="${frontendLoginUrl}">Ir al login</a></p>
                    </div>
                </body>
            </html>
        `);
    }

    const result = await service.confirmSignUp({
        email,
        confirmationCode: code
    });

    if (result.success) {
        // Success verification - redirect to login with success message
        return res.send(`
            <html>
                <head>
                    <meta charset="utf-8">
                    <meta http-equiv="refresh" content="3;url=${frontendLoginUrl}">
                    <style>
                        body { font-family: 'Futura', Helvetica, Arial, sans-serif; background-color: #F7F8FB; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
                        .container { background: white; padding: 40px; border-radius: 16px; text-align: center; max-width: 400px; }
                        h1 { color: #1E1E1E; margin-bottom: 16px; }
                        p { color: #45556C; margin-bottom: 16px; }
                        .success { color: #10B981; font-size: 48px; margin-bottom: 16px; }
                        .btn { display: inline-block; border: 2px solid #0d47a1; border-radius: 10px; padding: 12px 28px; color: #0d47a1; text-decoration: none; font-weight: 600; margin-top: 16px; }
                        .btn:hover { background-color: #0d47a1; color: white; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="success">✓</div>
                        <h1>¡Cuenta verificada exitosamente!</h1>
                        <p>Tu cuenta ha sido confirmada. Serás redirigido al login en unos segundos...</p>
                        <a href="${frontendLoginUrl}" class="btn">Ir al login ahora</a>
                    </div>
                </body>
            </html>
        `);
    } else {
        // Error in verification
        return res.status(HttpStatus.BAD_REQUEST).send(`
            <html>
                <head>
                    <meta charset="utf-8">
                    <style>
                        body { font-family: 'Futura', Helvetica, Arial, sans-serif; background-color: #F7F8FB; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
                        .container { background: white; padding: 40px; border-radius: 16px; text-align: center; max-width: 400px; }
                        h1 { color: #1E1E1E; margin-bottom: 16px; }
                        p { color: #45556C; margin-bottom: 16px; }
                        .error { color: #EF4444; font-size: 48px; margin-bottom: 16px; }
                        .btn { display: inline-block; border: 2px solid #0d47a1; border-radius: 10px; padding: 12px 28px; color: #0d47a1; text-decoration: none; font-weight: 600; margin-top: 16px; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="error">✗</div>
                        <h1>Error al verificar la cuenta</h1>
                        <p>${result.message}</p>
                        <a href="${frontendLoginUrl}" class="btn">Ir al login</a>
                    </div>
                </body>
            </html>
        `);
    }
});

authRouter.post('/login', BodyValidation(LoginInputDTO), async (req: Request, res: Response) => {
    const data = req.body;
    const isBackoffice = req.query.isBackoffice === 'true';

    const result = await service.login(data, isBackoffice);

    if (result.success) {
        return res.status(HttpStatus.OK).json(result);
    } else {
        return res.status(HttpStatus.UNAUTHORIZED).json(result);
    }
});