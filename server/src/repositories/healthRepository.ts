export interface HealthRepository {
  getHealthStatus(): Promise<{ status: 'ok'; service: string; timestamp: string }>;
}

export class InMemoryHealthRepository implements HealthRepository {
  async getHealthStatus() {
    return {
      status: 'ok' as const,
      service: 'distributed-job-scheduler',
      timestamp: new Date().toISOString(),
    };
  }
}
