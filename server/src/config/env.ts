export interface AppConfig {
  nodeEnv: string;
  port: number;
  serviceName: string;
}

export const loadConfig = (): AppConfig => ({
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 3000,
  serviceName: 'distributed-job-scheduler',
});
