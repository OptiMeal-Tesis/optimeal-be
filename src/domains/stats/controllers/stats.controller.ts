import { Request, Response, Router } from "express";
import HttpStatus from "http-status";
import { StatsService } from "../services/stats.service.js";
import { StatsQueryParamsDTO } from "../dto/stats.dto.js";
import { requireAdmin } from "../../../middleware/authorization.js";
import { authenticateToken } from "../../../middleware/authentication.js";

export const statsRouter = Router();

const service: StatsService = new StatsService();

// GET /api/stats - Get statistics for orders within date range (ADMIN ONLY)
statsRouter.get(
  "/",
  authenticateToken,
  requireAdmin,
  async (req: Request, res: Response) => {
    try {
      // Validate query parameters
      const queryValidation = StatsQueryParamsDTO.safeParse(req.query);

      if (!queryValidation.success) {
        return res.status(HttpStatus.BAD_REQUEST).json({
          success: false,
          message: "Invalid query parameters",
          errors: queryValidation.error.issues,
        });
      }

      const params = queryValidation.data;

      // Check if pagination is requested
      if (params.page && params.limit) {
        const result = await service.getStatsPaginated({
          start_date: params.start_date,
          end_date: params.end_date,
          search: params.search,
          page: params.page,
          limit: params.limit,
        });

        if (result.success) {
          return res.status(HttpStatus.OK).json(result);
        } else {
          return res.status(HttpStatus.BAD_REQUEST).json(result);
        }
      } else {
        // Return all results without pagination
        const result = await service.getStats({
          start_date: params.start_date,
          end_date: params.end_date,
          search: params.search,
        });

        if (result.success) {
          return res.status(HttpStatus.OK).json(result);
        } else {
          return res.status(HttpStatus.BAD_REQUEST).json(result);
        }
      }
    } catch (error: any) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: "Internal server error",
      });
    }
  }
);
