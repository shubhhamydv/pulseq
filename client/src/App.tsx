import { useEffect, useState } from 'react';
import './App.css';

interface HealthResponse {
  status: string;
  timestamp: string;
}

function App() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const response = await fetch('/api/v1/health');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data: HealthResponse = await response.json();
        setHealth(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to connect to server');
        setHealth(null);
      } finally {
        setLoading(false);
      }
    };

    checkHealth();
    const interval = setInterval(checkHealth, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="app">
      <header className="header">
        <h1>Distributed Job Scheduler</h1>
        <p className="subtitle">Async Event Engine</p>
      </header>

      <main className="main">
        <section className="status-section">
          <h2>Backend Status</h2>
          {loading && <p className="status-loading">Checking server status...</p>}
          {error && <p className="status-error">Error: {error}</p>}
          {health && (
            <div className="status-ok">
              <p>✓ Server is running</p>
              <p className="timestamp">
                Last checked: {new Date(health.timestamp).toLocaleTimeString()}
              </p>
            </div>
          )}
        </section>

        <section className="info-section">
          <h2>Project Status</h2>
          <p>
            This is the initial foundation of the Distributed Job Scheduler & Async Event Engine.
          </p>
          <ul>
            <li>✓ Monorepo structure initialized</li>
            <li>✓ Backend API with Express</li>
            <li>✓ Frontend with React + Vite</li>
            <li>• Job scheduling (planned)</li>
            <li>• Event processing (planned)</li>
            <li>• Worker pools (planned)</li>
          </ul>
        </section>
      </main>

      <footer className="footer">
        <p>Distributed Job Scheduler © 2025</p>
      </footer>
    </div>
  );
}

export default App;
