export interface HealthResponse {
  status: 'ok';
  service: string;
  timestamp: string;
}

export interface ErrorResponse {
  status: 'error';
  error: string;
  details?: unknown;
  timestamp: string;
}
