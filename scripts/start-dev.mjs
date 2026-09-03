import { existsSync, readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const envPath = existsSync(resolve(root, 'server/.env'))
  ? resolve(root, 'server/.env')
  : resolve(root, 'server/.env.example');

const env = { ...process.env };
for (const line of readFileSync(envPath, 'utf8').split(/\r?\n/)) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const separator = trimmed.indexOf('=');
  if (separator <= 0) continue;
  const key = trimmed.slice(0, separator).trim();
  const value = trimmed
    .slice(separator + 1)
    .trim()
    .replace(/^['"]|['"]$/g, '');
  if (env[key] === undefined) env[key] = value;
}

const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const commands = [
  ['API', 'run', 'dev:backend'],
  ['WORKER', 'run', 'worker:dev'],
  ['SCHEDULER', 'run', 'scheduler:dev'],
  ['FRONTEND', 'run', 'dev:frontend'],
];
const children = commands.map(([name, ...args]) => {
  const child = spawn(npm, args, {
    cwd: root,
    env,
    stdio: ['inherit', 'pipe', 'pipe'],
    shell: true,
  });
  const prefix = `[${name}] `;
  child.stdout.on('data', (chunk) => process.stdout.write(`${prefix}${chunk}`));
  child.stderr.on('data', (chunk) => process.stderr.write(`${prefix}${chunk}`));
  child.on('exit', (code, signal) => {
    if (code && !shuttingDown) {
      console.error(`${prefix}exited with code ${code}${signal ? ` (${signal})` : ''}`);
      shutdown(code);
    }
  });
  return child;
});

let shuttingDown = false;
const shutdown = (code = 0) => {
  if (shuttingDown) return;
  shuttingDown = true;
  for (const child of children) child.kill('SIGTERM');
  setTimeout(() => process.exit(code), 500);
};
process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));
console.log(`Loaded environment from ${envPath}`);
console.log('Started API, worker, scheduler, and frontend. Press Ctrl+C to stop all processes.');
