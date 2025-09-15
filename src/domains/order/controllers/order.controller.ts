import { Request, Response, Router } from 'express';
import HttpStatus from 'http-status';
import { OrderService } from '../services/order.service.js';
import { CreateOrderDTO, UpdateOrderStatusDTO, OrderIdParamDTO, OrderQueryParamsDTO } from '../dto/order.dto.js';
import { BodyValidation, ParamsValidation } from '../../../middleware/validation.js';
import { requireAdmin, requireAuth } from '../../../middleware/authorization.js';
import { authenticateToken } from '../../../middleware/authentication.js';

export const orderRouter = Router();

const service: OrderService = new OrderService();

// POST /api/orders - Create a new order (AUTHENTICATED USERS)
orderRouter.post('/',
    authenticateToken,
    requireAuth,
    BodyValidation(CreateOrderDTO),
    async (req: Request, res: Response) => {
        const data = req.body;
        const userId = (req as any).user.id; // Get user ID from JWT token

        const orderData = {
            ...data,
            userId,
        };

        const result = await service.createOrder(orderData);

        if (result.success) {
            return res.status(HttpStatus.CREATED).json(result);
        } else {
            return res.status(HttpStatus.BAD_REQUEST).json(result);
        }
    });

// GET /api/orders - Get all orders with filters and pagination (ADMIN ONLY)
orderRouter.get('/', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
    try {
        // Validate query parameters
        const queryValidation = OrderQueryParamsDTO.safeParse(req.query);
        
        if (!queryValidation.success) {
            return res.status(HttpStatus.BAD_REQUEST).json({
                success: false,
                message: 'Invalid query parameters',
                errors: queryValidation.error.issues,
            });
        }

        const filters = queryValidation.data;
        const result = await service.getOrdersWithFilters(filters);

        if (result.success) {
            return res.status(HttpStatus.OK).json(result);
        } else {
            return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(result);
        }
    } catch (error: any) {
        return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Internal server error',
        });
    }
});

// GET /api/orders/my - Get current user's orders (AUTHENTICATED USERS)
orderRouter.get('/my', authenticateToken, requireAuth, async (req: Request, res: Response) => {
    const userId = (req as any).user.id; // Get user ID from JWT token

    const result = await service.getOrdersByUserId(userId);

    if (result.success) {
        return res.status(HttpStatus.OK).json(result);
    } else {
        return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(result);
    }
});

// GET /api/orders/:id - Get order by ID (AUTHENTICATED USERS)
orderRouter.get('/:id', authenticateToken, requireAuth, ParamsValidation(OrderIdParamDTO), async (req: Request, res: Response) => {
    const { id } = req.params;
    const userId = (req as any).user.id;
    const userRole = (req as any).user.role;

    const result = await service.getOrderById(Number(id));

    if (result.success) {
        if (result.data?.userId !== userId && userRole !== 'ADMIN') {
            return res.status(HttpStatus.FORBIDDEN).json({
                success: false,
                message: 'Access denied',
            });
        }

        return res.status(HttpStatus.OK).json(result);
    } else {
        return res.status(HttpStatus.NOT_FOUND).json(result);
    }
});

// PUT /api/orders/:id/status - Update order status (ADMIN ONLY)
orderRouter.put('/:id/status',
    authenticateToken,
    requireAdmin,
    ParamsValidation(OrderIdParamDTO),
    BodyValidation(UpdateOrderStatusDTO),
    async (req: Request, res: Response) => {
        const { id } = req.params;
        const { status } = req.body;

        const result = await service.updateOrderStatus(Number(id), status);

        if (result.success) {
            return res.status(HttpStatus.OK).json(result);
        } else {
            return res.status(HttpStatus.BAD_REQUEST).json(result);
        }
    }
);
