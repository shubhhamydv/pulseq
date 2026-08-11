import express, { Express, Request, Response, NextFunction } from 'express';

const app: Express = express();
const port = process.env.PORT || 3000;
const nodeEnv = process.env.NODE_ENV || 'development';

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS middleware
app.use((_req: Request, res: Response, next: NextFunction): void => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  if (_req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Request logging middleware
app.use((req: Request, _res: Response, next: NextFunction): void => {
  // eslint-disable-next-line no-console
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Root endpoint - API documentation
app.get('/', (_req: Request, res: Response): void => {
  res.status(200).json({
    name: 'Distributed Job Scheduler API',
    version: '0.0.1',
    description: 'Backend API for Distributed Job Scheduler & Async Event Engine',
    environment: nodeEnv,
    endpoints: {
      health: {
        path: '/api/v1/health',
        method: 'GET',
        description: 'Check if the server is running',
      },
      status: {
        path: '/api/v1/status',
        method: 'GET',
        description: 'Get detailed server status information',
      },
    },
    documentation: 'See README.md for complete documentation',
  });
});

// Health check endpoint (minimal response)
app.get('/api/v1/health', (_req: Request, res: Response): void => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

// Status endpoint (detailed information)
app.get('/api/v1/status', (_req: Request, res: Response): void => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: nodeEnv,
    memory: {
      heapUsed: `${Math.round((process.memoryUsage().heapUsed / 1024 / 1024) * 100) / 100} MB`,
      heapTotal: `${Math.round((process.memoryUsage().heapTotal / 1024 / 1024) * 100) / 100} MB`,
    },
    version: '0.0.1',
  });
});

// 404 handler
app.use((req: Request, res: Response): void => {
  // eslint-disable-next-line no-console
  console.warn(`404: ${req.method} ${req.path}`);
  res.status(404).json({
    error: 'Not Found',
    message: `The requested resource '${req.path}' was not found`,
    method: req.method,
    timestamp: new Date().toISOString(),
  });
});

// Error handler
app.use((err: Error, req: Request, res: Response, _next: NextFunction): void => {
  // eslint-disable-next-line no-console
  console.error(`Error on ${req.method} ${req.path}:`, err.message);
  res.status(500).json({
    error: 'Internal Server Error',
    message: nodeEnv === 'development' ? err.message : 'An error occurred',
    timestamp: new Date().toISOString(),
  });
});

// Start server
// eslint-disable-next-line no-console
const server = app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`\n✓ Distributed Job Scheduler API started`);
  // eslint-disable-next-line no-console
  console.log(`✓ Server running on http://localhost:${port}`);
  // eslint-disable-next-line no-console
  console.log(`✓ Environment: ${nodeEnv}`);
  // eslint-disable-next-line no-console
  console.log(`✓ Endpoints:`);
  // eslint-disable-next-line no-console
  console.log(`  - GET  http://localhost:${port}/ (API documentation)`);
  // eslint-disable-next-line no-console
  console.log(`  - GET  http://localhost:${port}/api/v1/health (health check)`);
  // eslint-disable-next-line no-console
  console.log(`  - GET  http://localhost:${port}/api/v1/status (detailed status)\n`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  // eslint-disable-next-line no-console
  console.log('\nShutting down gracefully...');
  server.close(() => {
    // eslint-disable-next-line no-console
    console.log('✓ Server closed');
    process.exit(0);
  });
});

export default app;

