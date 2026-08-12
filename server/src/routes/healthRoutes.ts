import { Router } from 'express';
import { HealthController } from '../controllers/healthController.js';
import { HealthService } from '../services/healthService.js';
import { InMemoryHealthRepository } from '../repositories/healthRepository.js';

export const createHealthRoutes = (): Router => {
  const router = Router();
  const healthRepository = new InMemoryHealthRepository();
  const healthService = new HealthService(healthRepository);
  const healthController = new HealthController(healthService);

  router.get('/health', healthController.getHealth);

  return router;
};
