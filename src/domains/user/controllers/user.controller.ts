import { Request, Response, Router } from "express";
import HttpStatus from "http-status";
import { UserService } from "../services/user.service.js";
import {
  CreateUserInputDTO,
  UpdateUserInputDTO,
  GetUserByIdInputDTO,
  GetUserByEmailInputDTO,
  GetUserByNationalIdInputDTO,
} from "../dto/user.dto.js";
import {
  BodyValidation,
  ParamsValidation,
} from "../../../middleware/validation.js";
import { authenticateToken } from "../../../middleware/authentication.js";
import { requireAuth } from "../../../middleware/authorization.js";

export const userRouter = Router();

const service: UserService = new UserService();

// Get current logged-in user
userRouter.get(
  "/me",
  authenticateToken,
  requireAuth,
  async (req: Request, res: Response) => {
    const userId = (req as any).user.id;

    const result = await service.getUserById(Number(userId));

    if (result.success) {
      return res.status(HttpStatus.OK).json(result);
    } else {
      return res.status(HttpStatus.NOT_FOUND).json(result);
    }
  }
);

// Get user by ID
userRouter.get(
  "/:id",
  ParamsValidation(GetUserByIdInputDTO),
  async (req: Request, res: Response) => {
    const { id } = req.params;

    const result = await service.getUserById(parseInt(id));

    if (result.success) {
      return res.status(HttpStatus.OK).json(result);
    } else {
      return res.status(HttpStatus.NOT_FOUND).json(result);
    }
  }
);

// Get user by email
userRouter.get(
  "/email/:email",
  ParamsValidation(GetUserByEmailInputDTO),
  async (req: Request, res: Response) => {
    const { email } = req.params;

    const result = await service.getUserByEmail(email);

    if (result.success) {
      return res.status(HttpStatus.OK).json(result);
    } else {
      return res.status(HttpStatus.NOT_FOUND).json(result);
    }
  }
);

// Get user by national ID
userRouter.get(
  "/national-id/:national_id",
  ParamsValidation(GetUserByNationalIdInputDTO),
  async (req: Request, res: Response) => {
    const { national_id } = req.params;

    const result = await service.getUserByNationalId(national_id);

    if (result.success) {
      return res.status(HttpStatus.OK).json(result);
    } else {
      return res.status(HttpStatus.NOT_FOUND).json(result);
    }
  }
);

// Get all users
userRouter.get("/", async (req: Request, res: Response) => {
  const result = await service.getAllUsers();

  if (result.success) {
    return res.status(HttpStatus.OK).json(result);
  } else {
    return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(result);
  }
});

// Update user
userRouter.put(
  "/:id",
  ParamsValidation(GetUserByIdInputDTO),
  BodyValidation(UpdateUserInputDTO),
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const data = req.body;

    const result = await service.updateUser(parseInt(id), data);

    if (result.success) {
      return res.status(HttpStatus.OK).json(result);
    } else {
      return res.status(HttpStatus.BAD_REQUEST).json(result);
    }
  }
);

// Delete user
userRouter.delete(
  "/:id",
  ParamsValidation(GetUserByIdInputDTO),
  async (req: Request, res: Response) => {
    const { id } = req.params;

    const result = await service.deleteUser(parseInt(id));

    if (result.success) {
      return res.status(HttpStatus.OK).json(result);
    } else {
      return res.status(HttpStatus.NOT_FOUND).json(result);
    }
  }
);
