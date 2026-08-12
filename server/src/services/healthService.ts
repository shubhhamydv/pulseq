import { HealthRepository } from '../repositories/healthRepository.js';

export class HealthService {
  constructor(private readonly healthRepository: HealthRepository) {}

  async getHealthStatus() {
    return this.healthRepository.getHealthStatus();
  }
}
