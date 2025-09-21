import { StatsRepository } from "../repositories/stats.repository.js";
import {
  StatsQueryParams,
  StatsResponse,
  StatsQueryResponse,
} from "../models/Stats.js";

export class StatsService {
  private statsRepository: StatsRepository;

  constructor() {
    this.statsRepository = new StatsRepository();
  }

  async getStats(params: StatsQueryParams): Promise<StatsResponse> {
    try {
      this.validateStatsParams(params);

      const result = await this.statsRepository.getOrdersWithStats(params);

      return {
        success: true,
        message: "Statistics retrieved successfully",
        data: {
          summary: result.summary,
          orders: result.orders,
          total: result.total,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        message: this.getErrorMessage(error),
      };
    }
  }

  async getStatsPaginated(
    params: StatsQueryParams & { page: number; limit: number }
  ): Promise<StatsQueryResponse> {
    try {
      this.validateStatsParams(params);

      const result = await this.statsRepository.getOrdersWithStatsPaginated(
        params
      );

      return {
        success: true,
        message: "Statistics retrieved successfully",
        data: {
          summary: result.summary,
          orders: result.orders,
          pagination: {
            page: params.page,
            limit: params.limit,
            total: result.total,
            totalPages: result.totalPages,
          },
        },
      };
    } catch (error: any) {
      return {
        success: false,
        message: this.getErrorMessage(error),
      };
    }
  }

  private validateStatsParams(params: StatsQueryParams): void {
    if (!params.start_date || !params.end_date) {
      throw new Error("Start date and end date are required");
    }

    const startDate = new Date(params.start_date);
    const endDate = new Date(params.end_date);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      throw new Error("Invalid date format. Please use YYYY-MM-DD format");
    }

    if (startDate > endDate) {
      throw new Error("Start date cannot be after end date");
    }

    // Check if date range is not too large (e.g., more than 1 year)
    const oneYearInMs = 365 * 24 * 60 * 60 * 1000;
    if (endDate.getTime() - startDate.getTime() > oneYearInMs) {
      throw new Error("Date range cannot exceed 1 year");
    }
  }

  private getErrorMessage(error: any): string {
    if (error.message) {
      return error.message;
    }
    return "An unexpected error occurred while retrieving statistics";
  }
}
