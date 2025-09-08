import { Request, Response, Router } from 'express';
import HttpStatus from 'http-status';
import { ProductService } from '../services/product.service.js';
import { CreateProductInputDTO, UpdateProductInputDTO, ProductIdParamDTO } from '../dto/product.dto.js';
import { BodyValidation, ParamsValidation } from '../../../middleware/validation.js';
import { requireAdmin, requireAuth } from '../../../middleware/authorization.js';
import { authenticateToken } from '../../../middleware/authentication.js';
import { formDataWithOptionalFile, handleUploadError } from '../../../middleware/upload.js';
import { ProductTypeEnum, RestrictionEnum } from '@prisma/client';

export const productRouter = Router();

const service: ProductService = new ProductService();

// POST /api/products - Create a new product (ADMIN ONLY)
productRouter.post('/',
    authenticateToken,
    requireAdmin,
    formDataWithOptionalFile,
    handleUploadError,
    BodyValidation(CreateProductInputDTO),
    async (req: Request, res: Response) => {
        const data = req.body;
        const file = req.file;

        const result = await service.createProduct(data, file);

        if (result.success) {
            return res.status(HttpStatus.CREATED).json(result);
        } else {
            return res.status(HttpStatus.BAD_REQUEST).json(result);
        }
    });

// GET /api/products - Get all products (AUTHENTICATED USERS)
productRouter.get('/', authenticateToken, requireAuth, async (req: Request, res: Response) => {
    const result = await service.getAllProducts();

    if (result.success) {
        return res.status(HttpStatus.OK).json(result);
    } else {
        return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(result);
    }
});

// GET /api/products/:id - Get product by ID (AUTHENTICATED USERS)
productRouter.get('/:id', authenticateToken, requireAuth, ParamsValidation(ProductIdParamDTO), async (req: Request, res: Response) => {
    const { id } = req.params;

    const result = await service.getProductById(Number(id));

    if (result.success) {
        return res.status(HttpStatus.OK).json(result);
    } else {
        return res.status(HttpStatus.NOT_FOUND).json(result);
    }
});

// PUT /api/products/:id - Update product by ID (ADMIN ONLY)
productRouter.put('/:id',
    authenticateToken,
    requireAdmin,
    ParamsValidation(ProductIdParamDTO),
    formDataWithOptionalFile,
    handleUploadError,
    BodyValidation(UpdateProductInputDTO),
    async (req: Request, res: Response) => {
        const { id } = req.params;
        const data = req.body;
        const file = req.file;

        const result = await service.updateProduct(Number(id), data, file);

        if (result.success) {
            return res.status(HttpStatus.OK).json(result);
        } else {
            return res.status(HttpStatus.NOT_FOUND).json(result);
        }
    }
);

// DELETE /api/products/:id - Delete product by ID (ADMIN ONLY)
productRouter.delete('/:id', authenticateToken, requireAdmin, ParamsValidation(ProductIdParamDTO), async (req: Request, res: Response) => {
    const { id } = req.params;

    const result = await service.deleteProduct(Number(id));

    if (result.success) {
        return res.status(HttpStatus.OK).json(result);
    } else {
        return res.status(HttpStatus.NOT_FOUND).json(result);
    }
});
