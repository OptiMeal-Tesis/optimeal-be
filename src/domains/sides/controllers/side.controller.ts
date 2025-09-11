import { Request, Response, Router } from 'express';
import HttpStatus from 'http-status';
import { SideService } from '../services/side.service.js';
import { authenticateToken } from '../../../middleware/authentication.js';
import { requireAdmin } from '../../../middleware/authorization.js';
import { BodyValidation, ParamsValidation } from '../../../middleware/validation.js';
import { SideIdParamDTO, CreateSideInputDTO, UpdateSideActiveInputDTO } from '../dto/side.dto.js';

export const sideRouter = Router();

const service: SideService = new SideService();

// GET /api/sides - Get all sides (ADMIN ONLY)
sideRouter.get('/', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
    const result = await service.getAll();

    if (result.success) {
        return res.status(HttpStatus.OK).json(result);
    } else {
        return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(result);
    }
});

// GET /api/sides/active - Get active sides (PUBLIC)
sideRouter.get('/active', async (req: Request, res: Response) => {
    const result = await service.getActive();

    if (result.success) {
        return res.status(HttpStatus.OK).json(result);
    } else {
        return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(result);
    }
});

// DELETE /api/sides/:id - Delete side by ID (ADMIN ONLY)
sideRouter.delete('/:id', authenticateToken, requireAdmin, ParamsValidation(SideIdParamDTO), async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await service.deleteById(Number(id));

    if (result.success) {
        return res.status(HttpStatus.OK).json(result);
    } else {
        return res.status(HttpStatus.NOT_FOUND).json(result);
    }
});

// POST /api/sides - Create side (ADMIN ONLY)
sideRouter.post('/', authenticateToken, requireAdmin, BodyValidation(CreateSideInputDTO), async (req: Request, res: Response) => {
    const data = req.body;
    const result = await service.create(data);

    if (result.success) {
        return res.status(HttpStatus.CREATED).json(result);
    } else {
        return res.status(HttpStatus.BAD_REQUEST).json(result);
    }
});

// PUT /api/sides/:id/active - Update isActive (ADMIN ONLY)
sideRouter.put('/:id/active', authenticateToken, requireAdmin, ParamsValidation(SideIdParamDTO), BodyValidation(UpdateSideActiveInputDTO), async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await service.updateIsActive(Number(id), req.body);

    if (result.success) {
        return res.status(HttpStatus.OK).json(result);
    } else if (result.message === 'Side not found') {
        return res.status(HttpStatus.NOT_FOUND).json(result);
    } else {
        return res.status(HttpStatus.BAD_REQUEST).json(result);
    }
});

// (named export already declared above with `export const sideRouter = Router();`)

