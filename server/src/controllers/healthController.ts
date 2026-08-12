import { Request, Response, NextFunction } from 'express';
import { HealthService } from '../services/healthService.js';

export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  getHealth = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.healthService.getHealthStatus();
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  };
}
