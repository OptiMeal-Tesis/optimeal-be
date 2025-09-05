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

authRouter.post('/login', BodyValidation(LoginInputDTO), async (req: Request, res: Response) => {
    const data = req.body;

    const result = await service.login(data);

    if (result.success) {
        return res.status(HttpStatus.OK).json(result);
    } else {
        return res.status(HttpStatus.UNAUTHORIZED).json(result);
    }
});