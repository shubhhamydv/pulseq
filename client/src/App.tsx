// import { useEffect, useMemo, useState, type ReactNode } from 'react';
// import type { FormEvent } from 'react';
// import { Link, Route, Switch, useLocation } from 'wouter';
// import {
//   Activity,
//   AlertTriangle,
//   BarChart3,
//   Boxes,
//   ChevronLeft,
//   ChevronRight,
//   Check,
//   Clipboard,
//   Clock3,
//   Database,
//   Menu,
//   Plus,
//   RefreshCw,
//   Send,
//   Server,
//   Settings2,
//   ShieldAlert,
//   X,
// } from 'lucide-react';
// import {
//   Area,
//   AreaChart,
//   CartesianGrid,
//   ResponsiveContainer,
//   Tooltip,
//   XAxis,
//   YAxis,
// } from 'recharts';
// import './App.css';

// type Job = {
//   id: string;
//   jobType: string;
//   status: string;
//   priority: number;
//   scheduledAt: string;
//   retryCount: number;
//   maxRetries: number;
//   createdAt: string;
//   payload?: unknown;
//   lastError?: string | null;
// };
// type Worker = {
//   workerId: string;
//   hostname?: string;
//   processId?: string;
//   lastHeartbeat?: string;
//   activeJobs: number;
//   status: string;
//   health: string;
// };
// const API = import.meta.env.VITE_API_URL ?? '';
// const request = async <T,>(path: string): Promise<T> => {
//   const response = await fetch(`${API}${path}`);
//   if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
//   return response.json();
// };
// const formatDate = (value?: string) =>
//   value ? new Date(value).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : '—';
// const statusClass = (status: string) => status.toLowerCase().replace('processing', 'running');
// const workerHealth = (worker: Worker) => {
//   if (worker.health === 'healthy') return 'HEALTHY';
//   if (!worker.lastHeartbeat || Date.now() - Date.parse(worker.lastHeartbeat) > 60_000)
//     return 'OFFLINE';
//   return 'DEGRADED';
// };
// function Badge({ value }: { value: string }) {
//   return <span className={`badge badge-${statusClass(value)}`}>{value}</span>;
// }
// function MetricCard({
//   label,
//   value,
//   icon: Icon,
//   tone = 'cyan',
//   hint,
// }: {
//   label: string;
//   value: string | number;
//   icon: typeof Activity;
//   tone?: string;
//   hint?: string;
// }) {
//   return (
//     <div className={`metric-card tone-${tone}`}>
//       <div className="metric-icon">
//         <Icon size={18} />
//       </div>
//       <div>
//         <p>{label}</p>
//         <strong>{value}</strong>
//         {hint && <small>{hint}</small>}
//       </div>
//     </div>
//   );
// }
// function Loading({ text = 'Loading operational data…' }) {
//   return (
//     <div className="state">
//       <RefreshCw className="spin" size={20} />
//       {text}
//     </div>
//   );
// }
// function ErrorState({ message }: { message: string }) {
//   return (
//     <div className="state error-state">
//       <AlertTriangle size={20} />
//       <span>{message}</span>
//     </div>
//   );
// }
// function Empty({ text }: { text: string }) {
//   return (
//     <div className="state empty-state">
//       <Boxes size={22} />
//       {text}
//     </div>
//   );
// }
// function Table({ children }: { children: ReactNode }) {
//   return (
//     <div className="table-wrap">
//       <table>{children}</table>
//     </div>
//   );
// }
// function Shell({ children }: { children: ReactNode }) {
//   const [open, setOpen] = useState(false);
//   const [location] = useLocation();
//   const items = [
//     ['/', 'Dashboard', Activity],
//     ['/jobs', 'Jobs', Boxes],
//     ['/workers', 'Workers', Server],
//     ['/failed', 'Failed jobs', AlertTriangle],
//     ['/dlq', 'DLQ', ShieldAlert],
//     ['/metrics', 'Metrics', BarChart3],
//     ['/architecture', 'Architecture', Database],
//   ] as const;
//   return (
//     <div className="app-shell">
//       <aside className={open ? 'sidebar open' : 'sidebar'}>
//         <div className="brand">
//           <div className="brand-mark">PQ</div>
//           <div>
//             <strong>PulseQ</strong>
//             <span>distributed scheduler</span>
//           </div>
//           <button
//             className="icon-button close-menu"
//             aria-label="Close navigation"
//             onClick={() => setOpen(false)}
//           >
//             <X size={18} />
//           </button>
//         </div>
//         <nav>
//           {items.map(([href, label, Icon]) => (
//             <Link key={href} href={href} onClick={() => setOpen(false)}>
//               <span
//                 className={
//                   location === href || (href !== '/' && location.startsWith(href))
//                     ? 'nav-item active'
//                     : 'nav-item'
//                 }
//               >
//                 <Icon size={17} />
//                 {label}
//               </span>
//             </Link>
//           ))}
//         </nav>
//         <div className="sidebar-footer">
//           <div className="pulse-dot" />
//           System connected<span>Postgres · Redis</span>
//         </div>
//       </aside>
//       <main className="content">
//         <header className="topbar">
//           <button
//             className="icon-button menu-button"
//             aria-label="Open navigation"
//             onClick={() => setOpen(true)}
//           >
//             <Menu size={20} />
//           </button>
//           <div>
//             <span className="eyebrow">PULSEQ / DISTRIBUTED SYSTEMS</span>
//             <h1>Control center</h1>
//           </div>
//           <div className="topbar-meta">
//             <span className="live-indicator">
//               <span />
//               Live telemetry
//             </span>
//             <Settings2 size={18} />
//           </div>
//         </header>
//         <div className="page-content">{children}</div>
//       </main>
//     </div>
//   );
// }
// function PageHeader({
//   eyebrow,
//   title,
//   description,
//   action,
// }: {
//   eyebrow: string;
//   title: string;
//   description: string;
//   action?: ReactNode;
// }) {
//   return (
//     <div className="page-header">
//       <div>
//         <span className="eyebrow">{eyebrow}</span>
//         <h2>{title}</h2>
//         <p>{description}</p>
//       </div>
//       {action}
//     </div>
//   );
// }
// function SystemTopology({ queueDepth, activeJobs }: { queueDepth: number; activeJobs: number }) {
//   const nodes = [
//     { key: 'api', label: 'API', sub: 'intake', tone: 'cyan' },
//     { key: 'queue', label: 'QUEUE', sub: `${queueDepth} pending`, tone: 'amber' },
//     { key: 'workers', label: 'WORKERS', sub: `${activeJobs} active`, tone: 'violet' },
//     { key: 'store', label: 'STORE', sub: 'Postgres', tone: 'green' },
//   ];
//   return (
//     <section className="topology panel" aria-label="Scheduler topology">
//       <div className="topology-header">
//         <div>
//           <span className="eyebrow">LIVE SYSTEM TOPOLOGY</span>
//           <h3>Execution plane</h3>
//         </div>
//         <span className="topology-caption">
//           <span className="chip-dot" /> adaptive visual · backend telemetry
//         </span>
//       </div>
//       <div className="topology-canvas">
//         <div className="topology-grid" />
//         <div className="topology-line line-one" />
//         <div className="topology-line line-two" />
//         <div className="topology-line line-three" />
//         <div className="topology-nodes">
//           {nodes.map((node, index) => (
//             <div className={`topology-node node-${node.key}`} key={node.key}>
//               <div className={`node-core node-${node.tone}`}>
//                 <span>{index + 1}</span>
//               </div>
//               <strong>{node.label}</strong>
//               <small>{node.sub}</small>
//             </div>
//           ))}
//         </div>
//         <div className="topology-packet packet-one" />
//         <div className="topology-packet packet-two" />
//       </div>
//     </section>
//   );
// }
// function Dashboard() {
//   const [jobs, setJobs] = useState<Job[]>([]);
//   const [queue, setQueue] = useState({ queueDepth: 0, activeJobs: 0, dlqSize: 0 });
//   const [jobMetrics, setJobMetrics] = useState({
//     submitted: 0,
//     completed: 0,
//     failed: 0,
//     retries: 0,
//     throughput: 0,
//     averageExecutionLatencyMs: 0,
//     dlqSize: 0,
//   });
//   const [error, setError] = useState('');
//   const load = async () => {
//     try {
//       setError('');
//       const [j, q, m] = await Promise.all([
//         request<{ data: Job[] }>('/api/v1/jobs?page=1&limit=8'),
//         request<typeof queue>('/api/v1/metrics/queue'),
//         request<typeof jobMetrics>('/api/v1/metrics/jobs'),
//       ]);
//       setJobs(j.data);
//       setQueue(q);
//       setJobMetrics(m);
//     } catch (e) {
//       setError(e instanceof Error ? e.message : 'Unable to load dashboard');
//     }
//   };
//   useEffect(() => {
//     void load();
//     const timer = setInterval(() => void load(), 15000);
//     return () => clearInterval(timer);
//   }, []); // eslint-disable-line react-hooks/exhaustive-deps
//   const successRate =
//     jobMetrics.completed + jobMetrics.failed
//       ? Math.round((jobMetrics.completed / (jobMetrics.completed + jobMetrics.failed)) * 100)
//       : 0;
//   return (
//     <>
//       <PageHeader
//         eyebrow="SYSTEM OVERVIEW"
//         title="Dashboard"
//         description="A real-time read on queue pressure, execution outcomes, and worker capacity."
//         action={
//           <button className="button secondary" onClick={() => void load()}>
//             <RefreshCw size={15} />
//             Refresh
//           </button>
//         }
//       />
//       <section className="demo-banner panel">
//         <div className="demo-banner-mark">
//           <ShieldAlert size={18} />
//         </div>
//         <div>
//           <span className="eyebrow">PUBLIC DEMO MODE</span>
//           <strong>Explore the scheduler with real backend telemetry</strong>
//           <p>
//             Use safe job presets to submit work, inspect execution attempts, and follow retry or DLQ
//             outcomes.
//           </p>
//         </div>
//         <Link className="button secondary" href="/jobs/new">
//           <Plus size={15} /> Try a job
//         </Link>
//       </section>
//       <SystemTopology queueDepth={queue.queueDepth} activeJobs={queue.activeJobs} />
//       {error ? (
//         <ErrorState message={error} />
//       ) : (
//         <>
//           <div className="metric-grid">
//             <MetricCard
//               label="Jobs submitted"
//               value={jobMetrics.submitted}
//               icon={Boxes}
//               hint="all time"
//             />
//             <MetricCard
//               label="Queue depth"
//               value={queue.queueDepth}
//               icon={Clock3}
//               tone="amber"
//               hint="scheduled backlog"
//             />
//             <MetricCard
//               label="Active jobs"
//               value={queue.activeJobs}
//               icon={Activity}
//               tone="violet"
//               hint="currently running"
//             />
//             <MetricCard
//               label="Success rate"
//               value={`${successRate}%`}
//               icon={BarChart3}
//               tone="green"
//               hint={`${jobMetrics.completed} completed`}
//             />
//           </div>
//           <div className="dashboard-grid">
//             <section className="panel wide">
//               <div className="panel-heading">
//                 <div>
//                   <span className="eyebrow">LATEST ACTIVITY</span>
//                   <h3>Recent jobs</h3>
//                 </div>
//                 <Link href="/jobs" className="text-link">
//                   View all <ChevronRight size={15} />
//                 </Link>
//               </div>
//               {jobs.length ? (
//                 <Table>
//                   <thead>
//                     <tr>
//                       <th>Job</th>
//                       <th>Type</th>
//                       <th>Status</th>
//                       <th>Priority</th>
//                       <th>Scheduled</th>
//                     </tr>
//                   </thead>
//                   <tbody>
//                     {jobs.map((job) => (
//                       <tr key={job.id}>
//                         <td>
//                           <Link className="job-link" href={`/jobs/${job.id}`}>
//                             {job.id.slice(0, 12)}…
//                           </Link>
//                         </td>
//                         <td>{job.jobType}</td>
//                         <td>
//                           <Badge value={job.status} />
//                         </td>
//                         <td>
//                           <span className="priority">P{job.priority}</span>
//                         </td>
//                         <td>{formatDate(job.scheduledAt)}</td>
//                       </tr>
//                     ))}
//                   </tbody>
//                 </Table>
//               ) : (
//                 <Empty text="No jobs have been submitted yet." />
//               )}
//             </section>
//             <section className="panel">
//               <div className="panel-heading">
//                 <div>
//                   <span className="eyebrow">FAILURE PIPELINE</span>
//                   <h3>Recovery posture</h3>
//                 </div>
//               </div>
//               <div className="recovery-row">
//                 <span>Failed jobs</span>
//                 <strong>{jobMetrics.failed}</strong>
//               </div>
//               <div className="recovery-row">
//                 <span>Retry attempts</span>
//                 <strong>{jobMetrics.retries}</strong>
//               </div>
//               <div className="recovery-row">
//                 <span>Dead-letter queue</span>
//                 <strong className={queue.dlqSize ? 'danger-text' : ''}>{queue.dlqSize}</strong>
//               </div>
//               <div className="recovery-note">
//                 <ShieldAlert size={17} />
//                 <span>
//                   Retries use exponential backoff with jitter. DLQ items require operator action.
//                 </span>
//               </div>
//             </section>
//           </div>
//         </>
//       )}
//     </>
//   );
// }
// const DEMO_PRESETS = [
//   {
//     id: 'email',
//     label: 'EMAIL_NOTIFICATION · success path',
//     jobType: 'EMAIL_NOTIFICATION',
//     payload: '{\n  "to": "demo@example.com",\n  "subject": "PulseQ demo notification"\n}',
//     maxRetries: '3',
//   },
//   {
//     id: 'report',
//     label: 'REPORT_GENERATION · failure path',
//     jobType: 'REPORT_GENERATION',
//     payload: '{\n  "report": "daily-operations",\n  "format": "json"\n}',
//     maxRetries: '2',
//   },
//   {
//     id: 'webhook',
//     label: 'WEBHOOK · failure path',
//     jobType: 'WEBHOOK',
//     payload: '{\n  "event": "demo.job.created",\n  "target": "demo-endpoint"\n}',
//     maxRetries: '2',
//   },
// ] as const;

// function CreateJobPage() {
//   const [, setLocation] = useLocation();
//   const [preset, setPreset] = useState('');
//   const [jobType, setJobType] = useState('');
//   const [payloadText, setPayloadText] = useState('{\n  "example": true\n}');
//   const [scheduledAt, setScheduledAt] = useState('');
//   const [priority, setPriority] = useState('');
//   const [maxRetries, setMaxRetries] = useState('');
//   const [submitting, setSubmitting] = useState(false);
//   const [error, setError] = useState('');
//   const [success, setSuccess] = useState('');

//   const submit = async (event: FormEvent<HTMLFormElement>) => {
//     event.preventDefault();
//     setError('');
//     setSuccess('');
//     let payload: unknown;
//     try {
//       payload = JSON.parse(payloadText);
//     } catch {
//       setError('Payload must be valid JSON.');
//       return;
//     }
//     if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
//       setError('Payload must be a JSON object.');
//       return;
//     }
//     const body: Record<string, unknown> = { jobType: jobType.trim(), payload };
//     if (!body.jobType) {
//       setError('Job type is required.');
//       return;
//     }
//     if (scheduledAt) body.scheduledAt = new Date(scheduledAt).toISOString();
//     if (priority !== '') body.priority = Number(priority);
//     if (maxRetries !== '') body.maxRetries = Number(maxRetries);
//     if (
//       priority !== '' &&
//       (!Number.isInteger(body.priority) || Number(body.priority) < 0 || Number(body.priority) > 100)
//     ) {
//       setError('Priority must be an integer from 0 to 100.');
//       return;
//     }
//     if (
//       maxRetries !== '' &&
//       (!Number.isInteger(body.maxRetries) ||
//         Number(body.maxRetries) < 0 ||
//         Number(body.maxRetries) > 100)
//     ) {
//       setError('Max retries must be an integer from 0 to 100.');
//       return;
//     }
//     try {
//       setSubmitting(true);
//       const response = await fetch(`${API}/api/v1/jobs`, {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify(body),
//       });
//       if (!response.ok) {
//         const detail = (await response.json().catch(() => null)) as { message?: string } | null;
//         throw new Error(detail?.message || `${response.status} ${response.statusText}`);
//       }
//       const created = (await response.json()) as Job;
//       setSuccess(`Job ${created.id} created successfully.`);
//       window.setTimeout(() => setLocation(`/jobs/${created.id}`), 500);
//     } catch (e) {
//       setError(e instanceof Error ? e.message : 'Unable to create job');
//     } finally {
//       setSubmitting(false);
//     }
//   };

//   return (
//     <>
//       <PageHeader
//         eyebrow="JOB SUBMISSION"
//         title="Create job"
//         description="Submit work to the scheduler with the same production API used by external clients."
//         action={
//           <Link className="button secondary" href="/jobs">
//             Cancel
//           </Link>
//         }
//       />
//       <form className="create-job-layout" onSubmit={(event) => void submit(event)}>
//         <section className="panel create-job-panel">
//           <div className="panel-heading">
//             <div>
//               <span className="eyebrow">JOB DEFINITION</span>
//               <h3>Execution envelope</h3>
//             </div>
//             <span className="trace-chip">
//               <span className="chip-dot" /> POST /api/v1/jobs
//             </span>
//           </div>
//           <label className="field-label" htmlFor="demo-preset">
//             Demo preset<span>Optional</span>
//           </label>
//           <select
//             id="demo-preset"
//             value={preset}
//             onChange={(event) => {
//               const selected = DEMO_PRESETS.find((item) => item.id === event.target.value);
//               setPreset(event.target.value);
//               if (!selected) return;
//               setJobType(selected.jobType);
//               setPayloadText(selected.payload);
//               setMaxRetries(selected.maxRetries);
//             }}
//           >
//             <option value="">Start from a blank job</option>
//             {DEMO_PRESETS.map((item) => (
//               <option key={item.id} value={item.id}>
//                 {item.label}
//               </option>
//             ))}
//           </select>
//           <p className="field-help demo-preset-help">
//             Presets use job types already registered by the worker. Failure-path presets
//             intentionally exercise the existing retry and DLQ behavior.
//           </p>
//           <label className="field-label" htmlFor="job-type">
//             Job type<span>Required</span>
//           </label>
//           <input
//             id="job-type"
//             value={jobType}
//             onChange={(event) => setJobType(event.target.value)}
//             placeholder="e.g. send-email"
//             required
//             autoFocus
//           />
//           <div className="form-grid-two">
//             <div>
//               <label className="field-label" htmlFor="job-priority">
//                 Priority<span>0–100</span>
//               </label>
//               <input
//                 id="job-priority"
//                 type="number"
//                 min="0"
//                 max="100"
//                 step="1"
//                 value={priority}
//                 onChange={(event) => setPriority(event.target.value)}
//                 placeholder="Default"
//               />
//             </div>
//             <div>
//               <label className="field-label" htmlFor="job-retries">
//                 Max retries<span>0–100</span>
//               </label>
//               <input
//                 id="job-retries"
//                 type="number"
//                 min="0"
//                 max="100"
//                 step="1"
//                 value={maxRetries}
//                 onChange={(event) => setMaxRetries(event.target.value)}
//                 placeholder="Default"
//               />
//             </div>
//           </div>
//           <label className="field-label" htmlFor="job-schedule">
//             Scheduled at<span>Optional</span>
//           </label>
//           <input
//             id="job-schedule"
//             type="datetime-local"
//             value={scheduledAt}
//             onChange={(event) => setScheduledAt(event.target.value)}
//           />
//           <div className="form-actions">
//             <button className="button" type="submit" disabled={submitting}>
//               {submitting ? <RefreshCw className="spin" size={15} /> : <Send size={15} />}
//               {submitting ? 'Submitting…' : 'Submit job'}
//             </button>
//             <span className="form-hint">
//               The scheduler will assign the job to an available worker.
//             </span>
//           </div>
//         </section>
//         <section className="panel payload-editor-panel">
//           <div className="panel-heading">
//             <div>
//               <span className="eyebrow">REQUEST PAYLOAD</span>
//               <h3>JSON object</h3>
//             </div>
//             <span className="chart-unit">Required</span>
//           </div>
//           <label className="sr-only" htmlFor="job-payload">
//             Job payload JSON
//           </label>
//           <textarea
//             id="job-payload"
//             className="payload-editor"
//             value={payloadText}
//             onChange={(event) => setPayloadText(event.target.value)}
//             spellCheck={false}
//             aria-describedby="payload-help"
//           />
//           <p id="payload-help" className="field-help">
//             Use a JSON object. Arrays and primitive values are rejected by the backend contract.
//           </p>
//         </section>
//       </form>
//       {error && (
//         <div className="state error-state form-state">
//           <AlertTriangle size={18} />
//           <span>{error}</span>
//         </div>
//       )}
//       {success && (
//         <div className="state success-state form-state">
//           <Check size={18} />
//           <span>{success}</span>
//         </div>
//       )}
//     </>
//   );
// }
// function JobsPage({ failedOnly = false }: { failedOnly?: boolean }) {
//   const [jobs, setJobs] = useState<Job[]>([]);
//   const [page, setPage] = useState(1);
//   const [totalPages, setTotalPages] = useState(1);
//   const [status, setStatus] = useState(failedOnly ? 'FAILED' : '');
//   const [query, setQuery] = useState('');
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState('');
//   const [summary, setSummary] = useState({
//     submitted: 0,
//     pending: 0,
//     running: 0,
//     completed: 0,
//     failed: 0,
//     cancelled: 0,
//   });
//   const load = async () => {
//     try {
//       setLoading(true);
//       const [data, metrics] = await Promise.all([
//         request<{ data: Job[]; pagination: { totalPages: number } }>(
//           `/api/v1/jobs?page=${page}&limit=15`
//         ),
//         request<
//           typeof summary & {
//             retries: number;
//             dlqSize: number;
//             throughput: number;
//             averageExecutionLatencyMs: number;
//           }
//         >('/api/v1/metrics/jobs'),
//       ]);
//       setJobs(data.data);
//       setTotalPages(data.pagination.totalPages);
//       setSummary(metrics);
//       setError('');
//     } catch (e) {
//       setError(e instanceof Error ? e.message : 'Unable to load jobs');
//     } finally {
//       setLoading(false);
//     }
//   };
//   useEffect(() => {
//     void load();
//   }, [page]); // eslint-disable-line react-hooks/exhaustive-deps
//   const visible = useMemo(
//     () =>
//       jobs.filter(
//         (job) =>
//           (!status || job.status === status) &&
//           (!query ||
//             job.jobType.toLowerCase().includes(query.toLowerCase()) ||
//             job.id.includes(query))
//       ),
//     [jobs, status, query]
//   );
//   return (
//     <>
//       <PageHeader
//         eyebrow={failedOnly ? 'FAILURE ANALYSIS' : 'JOB INVENTORY'}
//         title={failedOnly ? 'Failed jobs' : 'Jobs'}
//         description={
//           failedOnly
//             ? 'Inspect jobs that need attention and understand their retry posture.'
//             : 'Search, filter, and inspect scheduled work across the fleet.'
//         }
//         action={
//           <div className="header-actions">
//             {!failedOnly && (
//               <Link className="button" href="/jobs/new">
//                 <Plus size={15} /> Create job
//               </Link>
//             )}
//             <button className="button secondary" onClick={() => void load()}>
//               <RefreshCw size={15} />
//               Refresh
//             </button>
//           </div>
//         }
//       />
//       <div className="metric-grid compact-grid">
//         <MetricCard label="Total jobs" value={summary.submitted} icon={Boxes} />
//         <MetricCard label="Pending" value={summary.pending} icon={Clock3} tone="amber" />
//         <MetricCard label="Processing" value={summary.running} icon={Activity} tone="violet" />
//         <MetricCard label="Completed" value={summary.completed} icon={BarChart3} tone="green" />
//         <MetricCard label="Failed" value={summary.failed} icon={AlertTriangle} tone="red" />
//         <MetricCard label="Cancelled" value={summary.cancelled} icon={ShieldAlert} tone="red" />
//       </div>
//       <section className="panel">
//         <div className="filters">
//           <input
//             value={query}
//             onChange={(e) => setQuery(e.target.value)}
//             placeholder="Search ID or job type…"
//           />
//           <select
//             value={status}
//             onChange={(e) => {
//               setStatus(e.target.value);
//               setPage(1);
//             }}
//           >
//             <option value="">All statuses</option>
//             <option value="PENDING">Pending</option>
//             <option value="RUNNING">Running</option>
//             <option value="COMPLETED">Completed</option>
//             <option value="FAILED">Failed</option>
//             <option value="CANCELLED">Cancelled</option>
//           </select>
//         </div>
//         {loading ? (
//           <Loading />
//         ) : error ? (
//           <ErrorState message={error} />
//         ) : visible.length ? (
//           <Table>
//             <thead>
//               <tr>
//                 <th>ID</th>
//                 <th>Type</th>
//                 <th>Status</th>
//                 <th>Priority</th>
//                 <th>Scheduled time</th>
//                 <th>Retries</th>
//                 <th>Created</th>
//               </tr>
//             </thead>
//             <tbody>
//               {visible.map((job) => (
//                 <tr key={job.id}>
//                   <td>
//                     <Link className="job-link" href={`/jobs/${job.id}`}>
//                       {job.id.slice(0, 14)}…
//                     </Link>
//                   </td>
//                   <td>{job.jobType}</td>
//                   <td>
//                     <Badge value={job.status} />
//                   </td>
//                   <td>
//                     <span className="priority">P{job.priority}</span>
//                   </td>
//                   <td>{formatDate(job.scheduledAt)}</td>
//                   <td>
//                     {job.retryCount} / {job.maxRetries}
//                   </td>
//                   <td>{formatDate(job.createdAt)}</td>
//                 </tr>
//               ))}
//             </tbody>
//           </Table>
//         ) : (
//           <Empty text="No jobs match the current filters." />
//         )}
//         <div className="pagination">
//           <span>
//             Page {page} of {Math.max(1, totalPages)}
//           </span>
//           <div>
//             <button
//               className="icon-button"
//               disabled={page <= 1}
//               onClick={() => setPage((value) => value - 1)}
//             >
//               <ChevronLeft size={17} />
//             </button>
//             <button
//               className="icon-button"
//               disabled={page >= totalPages}
//               onClick={() => setPage((value) => value + 1)}
//             >
//               <ChevronRight size={17} />
//             </button>
//           </div>
//         </div>
//       </section>
//     </>
//   );
// }
// function WorkersPage() {
//   const [workers, setWorkers] = useState<Worker[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState('');
//   const load = async () => {
//     try {
//       setWorkers((await request<{ workers: Worker[] }>('/api/v1/metrics/workers')).workers);
//       setError('');
//     } catch (e) {
//       setError(e instanceof Error ? e.message : 'Unable to load workers');
//     } finally {
//       setLoading(false);
//     }
//   };
//   useEffect(() => {
//     void load();
//     const timer = setInterval(() => void load(), 10000);
//     return () => clearInterval(timer);
//   }, []);
//   return (
//     <>
//       <PageHeader
//         eyebrow="FLEET HEALTH"
//         title="Workers"
//         description="Monitor worker liveness, active capacity, and heartbeat freshness."
//         action={
//           <button className="button secondary" onClick={() => void load()}>
//             <RefreshCw size={15} />
//             Refresh
//           </button>
//         }
//       />
//       {loading ? (
//         <Loading text="Discovering workers…" />
//       ) : error ? (
//         <ErrorState message={error} />
//       ) : workers.length ? (
//         <div className="worker-grid">
//           {workers.map((worker) => (
//             <section className="panel worker-card" key={worker.workerId}>
//               <div className="worker-card-head">
//                 <div className="worker-avatar">{worker.workerId.slice(-2).toUpperCase()}</div>
//                 <div>
//                   <h3>{worker.workerId}</h3>
//                   <p>{worker.hostname || 'Unknown host'}</p>
//                 </div>
//                 <Badge value={workerHealth(worker)} />
//               </div>
//               <div className="worker-details">
//                 <span>
//                   Status<strong>{worker.status}</strong>
//                 </span>
//                 <span>
//                   Active jobs<strong>{worker.activeJobs}</strong>
//                 </span>
//                 <span>
//                   Heartbeat<strong>{formatDate(worker.lastHeartbeat)}</strong>
//                 </span>
//                 <span>
//                   Process<strong>{worker.processId || '—'}</strong>
//                 </span>
//               </div>
//             </section>
//           ))}
//         </div>
//       ) : (
//         <Empty text="No workers are currently registered." />
//       )}
//     </>
//   );
// }
// function MetricsPage() {
//   const [data, setData] = useState<{
//     queueDepth: number;
//     activeJobs: number;
//     dlqSize: number;
//     submitted: number;
//     completed: number;
//     failed: number;
//     retries: number;
//     throughput: number;
//     averageExecutionLatencyMs: number;
//   } | null>(null);
//   const [error, setError] = useState('');
//   useEffect(() => {
//     void Promise.all([
//       request<typeof data>('/api/v1/metrics/jobs'),
//       request<{ queueDepth: number; activeJobs: number; dlqSize: number }>('/api/v1/metrics/queue'),
//     ])
//       .then(([jobs, queue]) => setData({ ...jobs!, ...queue }))
//       .catch((e) => setError(e instanceof Error ? e.message : 'Unable to load metrics'));
//   }, []);
//   const points = data
//     ? [
//         { name: 'Submitted', value: data.submitted },
//         { name: 'Completed', value: data.completed },
//         { name: 'Failed', value: data.failed },
//         { name: 'Retries', value: data.retries },
//       ]
//     : [];
//   return (
//     <>
//       <PageHeader
//         eyebrow="TELEMETRY"
//         title="Metrics"
//         description="Current-state metrics and outcome distribution for the scheduler."
//       />
//       {error ? (
//         <ErrorState message={error} />
//       ) : !data ? (
//         <Loading text="Loading telemetry…" />
//       ) : (
//         <>
//           <div className="metric-grid">
//             <MetricCard label="Queue depth" value={data.queueDepth} icon={Clock3} tone="amber" />
//             <MetricCard label="DLQ size" value={data.dlqSize} icon={ShieldAlert} tone="red" />
//             <MetricCard
//               label="Throughput"
//               value={data.throughput}
//               icon={BarChart3}
//               tone="green"
//               hint="completed jobs"
//             />
//             <MetricCard
//               label="Avg latency"
//               value={`${Math.round(data.averageExecutionLatencyMs)} ms`}
//               icon={Activity}
//               tone="violet"
//             />
//           </div>
//           <section className="analytics-ribbon" aria-label="Analytics summary">
//             <div>
//               <span className="eyebrow">LIFECYCLE COVERAGE</span>
//               <strong>
//                 {data.submitted ? Math.round((data.completed / data.submitted) * 100) : 0}%
//               </strong>
//               <small>completed of submitted</small>
//             </div>
//             <div>
//               <span className="eyebrow">RETRY PRESSURE</span>
//               <strong>
//                 {data.submitted ? Math.round((data.retries / data.submitted) * 100) : 0}%
//               </strong>
//               <small>retry attempts / submitted</small>
//             </div>
//             <div>
//               <span className="eyebrow">FAILURE RATE</span>
//               <strong className={data.failed ? 'danger-text' : ''}>
//                 {data.submitted ? Math.round((data.failed / data.submitted) * 100) : 0}%
//               </strong>
//               <small>failed of submitted</small>
//             </div>
//             <div className="ribbon-note">
//               <span className="pulse-dot" />
//               <span>Values reflect current backend telemetry. No synthetic samples.</span>
//             </div>
//           </section>
//           <section className="panel chart-panel">
//             <div className="panel-heading">
//               <div>
//                 <span className="eyebrow">OUTCOME DISTRIBUTION</span>
//                 <h3>Job lifecycle totals</h3>
//               </div>
//               <span className="chart-unit">count</span>
//             </div>
//             <div className="chart">
//               <ResponsiveContainer width="100%" height="100%">
//                 <AreaChart data={points}>
//                   <defs>
//                     <linearGradient id="area" x1="0" y1="0" x2="0" y2="1">
//                       <stop offset="0%" stopColor="#44d7c0" stopOpacity={0.45} />
//                       <stop offset="100%" stopColor="#44d7c0" stopOpacity={0.02} />
//                     </linearGradient>
//                   </defs>
//                   <CartesianGrid strokeDasharray="3 3" stroke="#243246" />
//                   <XAxis dataKey="name" stroke="#718198" />
//                   <YAxis stroke="#718198" />
//                   <Tooltip
//                     contentStyle={{
//                       background: '#101a29',
//                       border: '1px solid #2b3c54',
//                       borderRadius: 8,
//                     }}
//                   />
//                   <Area
//                     type="monotone"
//                     dataKey="value"
//                     stroke="#44d7c0"
//                     fill="url(#area)"
//                     strokeWidth={2}
//                   />
//                 </AreaChart>
//               </ResponsiveContainer>
//             </div>
//           </section>
//         </>
//       )}
//     </>
//   );
// }
// function DlqPage() {
//   const [ids, setIds] = useState<string[]>([]);
//   const [error, setError] = useState('');
//   const load = async () => {
//     try {
//       setIds((await request<{ data: string[] }>('/api/v1/jobs/dlq')).data);
//     } catch (e) {
//       setError(e instanceof Error ? e.message : 'Unable to load DLQ');
//     }
//   };
//   useEffect(() => {
//     void load();
//   }, []);
//   return (
//     <>
//       <PageHeader
//         eyebrow="FAILURE RECOVERY"
//         title="Dead-letter queue"
//         description="Jobs that exhausted retries and are waiting for manual replay."
//         action={
//           <button className="button secondary" onClick={() => void load()}>
//             <RefreshCw size={15} />
//             Refresh
//           </button>
//         }
//       />
//       <section className={`dlq-hero panel ${ids.length ? 'dlq-alert' : 'dlq-clear'}`}>
//         <div className="dlq-signal">
//           <ShieldAlert size={24} />
//         </div>
//         <div>
//           <span className="eyebrow">OPERATOR QUEUE</span>
//           <h3>
//             {ids.length
//               ? `${ids.length} job${ids.length === 1 ? '' : 's'} require replay`
//               : 'Dead-letter queue clear'}
//           </h3>
//           <p>
//             {ids.length
//               ? 'These jobs exhausted their retry policy and are isolated from normal execution.'
//               : 'No jobs are currently waiting for manual recovery.'}
//           </p>
//         </div>
//         <div className="dlq-count">
//           <strong>{ids.length}</strong>
//           <span>items</span>
//         </div>
//       </section>
//       {error ? (
//         <ErrorState message={error} />
//       ) : ids.length ? (
//         <section className="panel">
//           <Table>
//             <thead>
//               <tr>
//                 <th>Job ID</th>
//                 <th>Action</th>
//               </tr>
//             </thead>
//             <tbody>
//               {ids.map((id) => (
//                 <tr key={id}>
//                   <td>
//                     <Link className="job-link" href={`/jobs/${id}`}>
//                       {id}
//                     </Link>
//                   </td>
//                   <td>
//                     <button
//                       className="button small"
//                       onClick={async () => {
//                         await fetch(`${API}/api/v1/jobs/${id}/retry`, { method: 'POST' });
//                         void load();
//                       }}
//                     >
//                       Replay job
//                     </button>
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </Table>
//         </section>
//       ) : (
//         <Empty text="The dead-letter queue is clear." />
//       )}
//     </>
//   );
// }
// function JobDetail({ id }: { id: string }) {
//   const [job, setJob] = useState<Job | null>(null);
//   const [history, setHistory] = useState<
//     Array<{
//       id: string;
//       workerId: string;
//       startedAt: string;
//       completedAt?: string;
//       durationMs?: number;
//       status?: string;
//       error?: string;
//     }>
//   >([]);
//   const [error, setError] = useState('');
//   const [copied, setCopied] = useState(false);
//   useEffect(() => {
//     let active = true;
//     const load = async () => {
//       try {
//         const [j, h] = await Promise.all([
//           request<Job>(`/api/v1/jobs/${id}`),
//           request<{
//             data: Array<{
//               id: string;
//               workerId: string;
//               startedAt: string;
//               completedAt?: string;
//               durationMs?: number;
//               status?: string;
//               error?: string;
//             }>;
//           }>(`/api/v1/jobs/${id}/executions`),
//         ]);
//         if (!active) return;
//         setJob(j);
//         setHistory(h.data);
//         setError('');
//       } catch (e) {
//         if (active) setError(e instanceof Error ? e.message : 'Unable to load job');
//       }
//     };
//     void load();
//     const timer = window.setInterval(() => void load(), 5000);
//     return () => {
//       active = false;
//       window.clearInterval(timer);
//     };
//   }, [id]);
//   const copyPayload = async () => {
//     if (!job) return;
//     await navigator.clipboard?.writeText(JSON.stringify(job.payload ?? {}, null, 2));
//     setCopied(true);
//     window.setTimeout(() => setCopied(false), 1600);
//   };
//   if (error) return <ErrorState message={error} />;
//   if (!job) return <Loading text="Hydrating execution trace…" />;
//   const lastAttempt = history[history.length - 1];
//   const totalDuration = history.reduce((sum, attempt) => sum + (attempt.durationMs ?? 0), 0);
//   return (
//     <>
//       <Link href="/jobs" className="back-link">
//         <ChevronLeft size={15} /> Back to jobs
//       </Link>
//       <PageHeader
//         eyebrow="EXECUTION TRACE / JOB INSPECTION"
//         title={job.id}
//         description={`${job.jobType} · created ${formatDate(job.createdAt)}`}
//         action={
//           <span className="trace-chip">
//             <span className="chip-dot" /> Trace retained
//           </span>
//         }
//       />
//       <section className="execution-hero panel">
//         <div className="execution-hero-copy">
//           <span className="eyebrow">CURRENT STATE</span>
//           <div className="execution-state-row">
//             <Badge value={job.status} />
//             <strong>{job.jobType}</strong>
//           </div>
//           <p>
//             One job, from schedule admission through worker execution. The timeline below is sourced
//             from the existing execution log.
//           </p>
//         </div>
//         <div className="execution-facts">
//           <div>
//             <span>Attempt count</span>
//             <strong>{history.length}</strong>
//           </div>
//           <div>
//             <span>Total runtime</span>
//             <strong>{totalDuration} ms</strong>
//           </div>
//           <div>
//             <span>Retry budget</span>
//             <strong>
//               {job.retryCount} / {job.maxRetries}
//             </strong>
//           </div>
//         </div>
//       </section>
//       <div className="detail-grid detail-grid-premium">
//         <section className="panel payload-panel">
//           <div className="panel-heading">
//             <div>
//               <span className="eyebrow">REQUEST ENVELOPE</span>
//               <h3>Payload</h3>
//             </div>
//             <button
//               className="icon-button"
//               aria-label={copied ? 'Payload copied' : 'Copy payload'}
//               onClick={() => void copyPayload()}
//               title={copied ? 'Copied' : 'Copy payload'}
//             >
//               {copied ? <Check size={16} /> : <Clipboard size={16} />}
//             </button>
//           </div>
//           <div className="payload-meta">
//             <span>
//               <Database size={14} /> JSON document
//             </span>
//             <span>Priority P{job.priority}</span>
//             <span>Scheduled {formatDate(job.scheduledAt)}</span>
//           </div>
//           <pre className="payload">{JSON.stringify(job.payload ?? {}, null, 2)}</pre>
//           {job.lastError && (
//             <div className="error-box">
//               <AlertTriangle size={16} />{' '}
//               <span>
//                 <strong>Last failure</strong>
//                 {job.lastError}
//               </span>
//             </div>
//           )}
//         </section>
//         <section className="panel timeline-panel">
//           <div className="panel-heading">
//             <div>
//               <span className="eyebrow">EXECUTION HISTORY</span>
//               <h3>Worker attempts</h3>
//             </div>
//             <span className="chart-unit">{history.length} recorded</span>
//           </div>
//           {history.length ? (
//             <div className="timeline">
//               {history.map((attempt, index) => (
//                 <div
//                   className={`timeline-item ${attempt.status?.toLowerCase() === 'failed' ? 'timeline-failed' : ''}`}
//                   key={attempt.id}
//                 >
//                   <div className="timeline-rail">
//                     <div className="timeline-dot" />
//                   </div>
//                   <div className="timeline-content">
//                     <div className="attempt-head">
//                       <strong>Attempt {String(index + 1).padStart(2, '0')}</strong>
//                       <Badge value={attempt.status || 'UNKNOWN'} />
//                     </div>
//                     <p>
//                       <span className="mono">{attempt.workerId}</span>{' '}
//                       <span className="muted-separator">·</span> {formatDate(attempt.startedAt)}
//                     </p>
//                     <div className="attempt-meta">
//                       <span>{attempt.durationMs ?? 0} ms duration</span>
//                       <span>
//                         {attempt.completedAt
//                           ? `completed ${formatDate(attempt.completedAt)}`
//                           : 'completion pending'}
//                       </span>
//                     </div>
//                     {attempt.error && <div className="attempt-error">{attempt.error}</div>}
//                   </div>
//                 </div>
//               ))}
//             </div>
//           ) : (
//             <Empty text="No execution attempts recorded." />
//           )}
//           {lastAttempt && (
//             <div className="trace-footer">
//               <span className="chip-dot" /> Last event{' '}
//               {formatDate(lastAttempt.completedAt || lastAttempt.startedAt)}
//             </div>
//           )}
//         </section>
//       </div>
//     </>
//   );
// }
// function ArchitecturePage() {
//   const layers = [
//     {
//       title: 'Experience',
//       icon: Activity,
//       items: ['React dashboard', 'Create Job workflow', 'Live job inspection'],
//     },
//     {
//       title: 'Control plane',
//       icon: Server,
//       items: ['Express API', 'Validation middleware', 'Prometheus-compatible metrics'],
//     },
//     {
//       title: 'State and scheduling',
//       icon: Database,
//       items: ['PostgreSQL / Prisma', 'Redis queues and locks', 'Recurring scheduler'],
//     },
//     {
//       title: 'Execution plane',
//       icon: Boxes,
//       items: ['Worker 1 … N', 'Heartbeats', 'Retries and DLQ'],
//     },
//   ];
//   return (
//     <>
//       <PageHeader
//         eyebrow="SYSTEM ARCHITECTURE"
//         title="Architecture"
//         description="A grounded view of how PulseQ accepts, schedules, executes, and observes distributed work."
//       />
//       <section className="architecture-flow panel" aria-label="PulseQ architecture flow">
//         {layers.map((layer, index) => {
//           const Icon = layer.icon;
//           return (
//             <div className="architecture-step" key={layer.title}>
//               <div className="architecture-node">
//                 <Icon size={20} />
//                 <span>0{index + 1}</span>
//               </div>
//               <div>
//                 <span className="eyebrow">{layer.title}</span>
//                 <ul>
//                   {layer.items.map((item) => (
//                     <li key={item}>{item}</li>
//                   ))}
//                 </ul>
//               </div>
//               {index < layers.length - 1 && (
//                 <ChevronRight className="architecture-arrow" size={18} />
//               )}
//             </div>
//           );
//         })}
//       </section>
//       <div className="architecture-grid">
//         <section className="panel architecture-copy">
//           <span className="eyebrow">RELIABILITY MODEL</span>
//           <h3>One job, observable at every boundary</h3>
//           <p>
//             Clients submit jobs to the API. PostgreSQL stores durable job state while Redis carries
//             scheduling, priority, distributed locks, heartbeats, and DLQ membership.
//           </p>
//           <p>
//             The recurring scheduler claims due definitions, and workers acquire execution leases
//             before recording attempts and applying retry policy. The UI reads the resulting state
//             through monitoring endpoints rather than simulating infrastructure.
//           </p>
//         </section>
//         <section className="panel architecture-copy">
//           <span className="eyebrow">OPERATING LOOP</span>
//           <h3>Inspect the system like an operator</h3>
//           <div className="architecture-checks">
//             <span>
//               <Check size={15} /> Submit a safe demo job
//             </span>
//             <span>
//               <Check size={15} /> Follow its execution history
//             </span>
//             <span>
//               <Check size={15} /> Inspect workers and queue pressure
//             </span>
//             <span>
//               <Check size={15} /> Replay exhausted jobs from the DLQ
//             </span>
//           </div>
//         </section>
//       </div>
//     </>
//   );
// }
// function App() {
//   return (
//     <Shell>
//       <Switch>
//         <Route path="/" component={Dashboard} />
//         <Route path="/jobs/new" component={CreateJobPage} />
//         <Route path="/jobs" component={() => <JobsPage />} />
//         <Route path="/failed" component={() => <JobsPage failedOnly />} />
//         <Route path="/workers" component={WorkersPage} />
//         <Route path="/metrics" component={MetricsPage} />
//         <Route path="/architecture" component={ArchitecturePage} />
//         <Route path="/dlq" component={DlqPage} />
//         <Route path="/jobs/:id">{(params) => <JobDetail id={params.id} />}</Route>
//         <Route>
//           <Dashboard />
//         </Route>
//       </Switch>
//     </Shell>
//   );
// }
// export default App;

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import type { FormEvent } from 'react';
import { Link, Route, Switch, useLocation } from 'wouter';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Boxes,
  ChevronLeft,
  ChevronRight,
  Check,
  Clipboard,
  Clock3,
  Database,
  Menu,
  Plus,
  RefreshCw,
  Send,
  Server,
  Settings2,
  ShieldAlert,
  X,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import './App.css';

type Job = {
  id: string;
  jobType: string;
  status: string;
  priority: number;
  scheduledAt: string;
  retryCount: number;
  maxRetries: number;
  createdAt: string;
  payload?: unknown;
  lastError?: string | null;
};
type Worker = {
  workerId: string;
  hostname?: string;
  processId?: string;
  lastHeartbeat?: string;
  activeJobs: number;
  status: string;
  health: string;
};
const API = import.meta.env.VITE_API_URL ?? '';
const request = async <T,>(path: string): Promise<T> => {
  const response = await fetch(`${API}${path}`);
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
  return response.json();
};
const formatDate = (value?: string) =>
  value ? new Date(value).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : '—';
const statusClass = (status: string) => status.toLowerCase().replace('processing', 'running');
const workerHealth = (worker: Worker) => {
  if (worker.health === 'healthy') return 'HEALTHY';
  if (!worker.lastHeartbeat || Date.now() - Date.parse(worker.lastHeartbeat) > 60_000)
    return 'OFFLINE';
  return 'DEGRADED';
};
function Badge({ value }: { value: string }) {
  return <span className={`badge badge-${statusClass(value)}`}>{value}</span>;
}
function MetricCard({
  label,
  value,
  icon: Icon,
  tone = 'cyan',
  hint,
}: {
  label: string;
  value: string | number;
  icon: typeof Activity;
  tone?: string;
  hint?: string;
}) {
  return (
    <div className={`metric-card tone-${tone}`}>
      <div className="metric-icon">
        <Icon size={18} />
      </div>
      <div>
        <p>{label}</p>
        <strong>{value}</strong>
        {hint && <small>{hint}</small>}
      </div>
    </div>
  );
}
function Loading({ text = 'Loading operational data…' }) {
  return (
    <div className="state">
      <RefreshCw className="spin" size={20} />
      {text}
    </div>
  );
}
function ErrorState({ message }: { message: string }) {
  return (
    <div className="state error-state">
      <AlertTriangle size={20} />
      <span>{message}</span>
    </div>
  );
}
function Empty({ text }: { text: string }) {
  return (
    <div className="state empty-state">
      <Boxes size={22} />
      {text}
    </div>
  );
}
function Table({ children }: { children: ReactNode }) {
  return (
    <div className="table-wrap">
      <table>{children}</table>
    </div>
  );
}
function Shell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [location] = useLocation();
  const items = [
    ['/', 'Dashboard', Activity],
    ['/jobs', 'Jobs', Boxes],
    ['/workers', 'Workers', Server],
    ['/failed', 'Failed jobs', AlertTriangle],
    ['/dlq', 'DLQ', ShieldAlert],
    ['/metrics', 'Metrics', BarChart3],
    ['/architecture', 'Architecture', Database],
  ] as const;
  return (
    <div className="app-shell">
      <aside className={open ? 'sidebar open' : 'sidebar'}>
        <div className="brand">
          <div className="brand-mark">PQ</div>
          <div>
            <strong>PulseQ</strong>
            <span>distributed scheduler</span>
          </div>
          <button
            className="icon-button close-menu"
            aria-label="Close navigation"
            onClick={() => setOpen(false)}
          >
            <X size={18} />
          </button>
        </div>
        <nav>
          {items.map(([href, label, Icon]) => (
            <Link key={href} href={href} onClick={() => setOpen(false)}>
              <span
                className={
                  location === href || (href !== '/' && location.startsWith(href))
                    ? 'nav-item active'
                    : 'nav-item'
                }
              >
                <Icon size={17} />
                {label}
              </span>
            </Link>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="pulse-dot" />
          System connected<span>Postgres · Redis</span>
        </div>
      </aside>
      <main className="content">
        <header className="topbar">
          <button
            className="icon-button menu-button"
            aria-label="Open navigation"
            onClick={() => setOpen(true)}
          >
            <Menu size={20} />
          </button>
          <div>
            <span className="eyebrow">PULSEQ / DISTRIBUTED SYSTEMS</span>
            <h1>Control center</h1>
          </div>
          <div className="topbar-meta">
            <span className="live-indicator">
              <span />
              Live telemetry
            </span>
            <Settings2 size={18} />
          </div>
        </header>
        <div className="page-content">{children}</div>
      </main>
    </div>
  );
}
function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="page-header">
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
      {action}
    </div>
  );
}
function SystemTopology({ queueDepth, activeJobs }: { queueDepth: number; activeJobs: number }) {
  const nodes = [
    { key: 'api', label: 'API', sub: 'intake', tone: 'cyan' },
    { key: 'queue', label: 'QUEUE', sub: `${queueDepth} pending`, tone: 'amber' },
    { key: 'workers', label: 'WORKERS', sub: `${activeJobs} active`, tone: 'violet' },
    { key: 'store', label: 'STORE', sub: 'Postgres', tone: 'green' },
  ];
  return (
    <section className="topology panel" aria-label="Scheduler topology">
      <div className="topology-header">
        <div>
          <span className="eyebrow">LIVE SYSTEM TOPOLOGY</span>
          <h3>Execution plane</h3>
        </div>
        <span className="topology-caption">
          <span className="chip-dot" /> adaptive visual · backend telemetry
        </span>
      </div>
      <div className="topology-canvas">
        <div className="topology-grid" />
        <div className="topology-line line-one" />
        <div className="topology-line line-two" />
        <div className="topology-line line-three" />
        <div className="topology-nodes">
          {nodes.map((node, index) => (
            <div className={`topology-node node-${node.key}`} key={node.key}>
              <div className={`node-core node-${node.tone}`}>
                <span>{index + 1}</span>
              </div>
              <strong>{node.label}</strong>
              <small>{node.sub}</small>
            </div>
          ))}
        </div>
        <div className="topology-packet packet-one" />
        <div className="topology-packet packet-two" />
      </div>
    </section>
  );
}
function Dashboard() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [queue, setQueue] = useState({ queueDepth: 0, activeJobs: 0, dlqSize: 0 });
  const [jobMetrics, setJobMetrics] = useState({
    submitted: 0,
    completed: 0,
    failed: 0,
    retries: 0,
    throughput: 0,
    averageExecutionLatencyMs: 0,
    dlqSize: 0,
  });
  const [error, setError] = useState('');
  const load = async () => {
    try {
      setError('');
      const [j, q, m] = await Promise.all([
        request<{ data: Job[] }>('/api/v1/jobs?page=1&limit=8'),
        request<typeof queue>('/api/v1/metrics/queue'),
        request<typeof jobMetrics>('/api/v1/metrics/jobs'),
      ]);
      setJobs(j.data);
      setQueue(q);
      setJobMetrics(m);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to load dashboard');
    }
  };
  useEffect(() => {
    void load();
    const timer = setInterval(() => void load(), 15000);
    return () => clearInterval(timer);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const successRate =
    jobMetrics.completed + jobMetrics.failed
      ? Math.round((jobMetrics.completed / (jobMetrics.completed + jobMetrics.failed)) * 100)
      : 0;
  return (
    <>
      <PageHeader
        eyebrow="SYSTEM OVERVIEW"
        title="Dashboard"
        description="A real-time read on queue pressure, execution outcomes, and worker capacity."
        action={
          <button className="button secondary" onClick={() => void load()}>
            <RefreshCw size={15} />
            Refresh
          </button>
        }
      />
      <section className="demo-banner panel">
        <div className="demo-banner-mark">
          <ShieldAlert size={18} />
        </div>
        <div>
          <span className="eyebrow">PUBLIC DEMO MODE</span>
          <strong>Explore the scheduler with real backend telemetry</strong>
          <p>
            Use safe job presets to submit work, inspect execution attempts, and follow retry or DLQ
            outcomes.
          </p>
        </div>
        <Link className="button secondary" href="/jobs/new">
          <Plus size={15} /> Try a job
        </Link>
      </section>
      <SystemTopology queueDepth={queue.queueDepth} activeJobs={queue.activeJobs} />
      {error ? (
        <ErrorState message={error} />
      ) : (
        <>
          <div className="metric-grid">
            <MetricCard
              label="Jobs submitted"
              value={jobMetrics.submitted}
              icon={Boxes}
              hint="all time"
            />
            <MetricCard
              label="Queue depth"
              value={queue.queueDepth}
              icon={Clock3}
              tone="amber"
              hint="scheduled backlog"
            />
            <MetricCard
              label="Active jobs"
              value={queue.activeJobs}
              icon={Activity}
              tone="violet"
              hint="currently running"
            />
            <MetricCard
              label="Success rate"
              value={`${successRate}%`}
              icon={BarChart3}
              tone="green"
              hint={`${jobMetrics.completed} completed`}
            />
          </div>
          <div className="dashboard-grid">
            <section className="panel wide">
              <div className="panel-heading">
                <div>
                  <span className="eyebrow">LATEST ACTIVITY</span>
                  <h3>Recent jobs</h3>
                </div>
                <Link href="/jobs" className="text-link">
                  View all <ChevronRight size={15} />
                </Link>
              </div>
              {jobs.length ? (
                <Table>
                  <thead>
                    <tr>
                      <th>Job</th>
                      <th>Type</th>
                      <th>Status</th>
                      <th>Priority</th>
                      <th>Scheduled</th>
                    </tr>
                  </thead>
                  <tbody>
                    {jobs.map((job) => (
                      <tr key={job.id}>
                        <td>
                          <Link className="job-link" href={`/jobs/${job.id}`}>
                            {job.id.slice(0, 12)}…
                          </Link>
                        </td>
                        <td>{job.jobType}</td>
                        <td>
                          <Badge value={job.status} />
                        </td>
                        <td>
                          <span className="priority">P{job.priority}</span>
                        </td>
                        <td>{formatDate(job.scheduledAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              ) : (
                <Empty text="No jobs have been submitted yet." />
              )}
            </section>
            <section className="panel">
              <div className="panel-heading">
                <div>
                  <span className="eyebrow">FAILURE PIPELINE</span>
                  <h3>Recovery posture</h3>
                </div>
              </div>
              <div className="recovery-row">
                <span>Failed jobs</span>
                <strong>{jobMetrics.failed}</strong>
              </div>
              <div className="recovery-row">
                <span>Retry attempts</span>
                <strong>{jobMetrics.retries}</strong>
              </div>
              <div className="recovery-row">
                <span>Dead-letter queue</span>
                <strong className={queue.dlqSize ? 'danger-text' : ''}>{queue.dlqSize}</strong>
              </div>
              <div className="recovery-note">
                <ShieldAlert size={17} />
                <span>
                  Retries use exponential backoff with jitter. DLQ items require operator action.
                </span>
              </div>
            </section>
          </div>
        </>
      )}
    </>
  );
}
const DEMO_PRESETS = [
  {
    id: 'email',
    label: 'EMAIL_NOTIFICATION · success path',
    jobType: 'EMAIL_NOTIFICATION',
    payload: '{\n  "to": "demo@example.com",\n  "subject": "PulseQ demo notification"\n}',
    maxRetries: '3',
  },
  {
    id: 'report',
    label: 'REPORT_GENERATION · failure path',
    jobType: 'REPORT_GENERATION',
    payload: '{\n  "report": "daily-operations",\n  "format": "json"\n}',
    maxRetries: '2',
  },
  {
    id: 'webhook',
    label: 'WEBHOOK · failure path',
    jobType: 'WEBHOOK',
    payload: '{\n  "event": "demo.job.created",\n  "target": "demo-endpoint"\n}',
    maxRetries: '2',
  },
] as const;

function CreateJobPage() {
  const [, setLocation] = useLocation();
  const [preset, setPreset] = useState('');
  const [jobType, setJobType] = useState('');
  const [payloadText, setPayloadText] = useState('{\n  "example": true\n}');
  const [scheduledAt, setScheduledAt] = useState('');
  const [priority, setPriority] = useState('');
  const [maxRetries, setMaxRetries] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    let payload: unknown;
    try {
      payload = JSON.parse(payloadText);
    } catch {
      setError('Payload must be valid JSON.');
      return;
    }
    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
      setError('Payload must be a JSON object.');
      return;
    }
    const body: Record<string, unknown> = { jobType: jobType.trim(), payload };
    if (!body.jobType) {
      setError('Job type is required.');
      return;
    }
    if (scheduledAt) body.scheduledAt = new Date(scheduledAt).toISOString();
    if (priority !== '') body.priority = Number(priority);
    if (maxRetries !== '') body.maxRetries = Number(maxRetries);
    if (
      priority !== '' &&
      (!Number.isInteger(body.priority) || Number(body.priority) < 0 || Number(body.priority) > 100)
    ) {
      setError('Priority must be an integer from 0 to 100.');
      return;
    }
    if (
      maxRetries !== '' &&
      (!Number.isInteger(body.maxRetries) ||
        Number(body.maxRetries) < 0 ||
        Number(body.maxRetries) > 100)
    ) {
      setError('Max retries must be an integer from 0 to 100.');
      return;
    }
    try {
      setSubmitting(true);
      const response = await fetch(`${API}/api/v1/jobs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        const detail = (await response.json().catch(() => null)) as { message?: string } | null;
        throw new Error(detail?.message || `${response.status} ${response.statusText}`);
      }
      const created = (await response.json()) as Job;
      setSuccess(`Job ${created.id} created successfully.`);
      window.setTimeout(() => setLocation(`/jobs/${created.id}`), 500);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to create job');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="JOB SUBMISSION"
        title="Create job"
        description="Submit work to the scheduler with the same production API used by external clients."
        action={
          <Link className="button secondary" href="/jobs">
            Cancel
          </Link>
        }
      />
      <form className="create-job-layout" onSubmit={(event) => void submit(event)}>
        <section className="panel create-job-panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">JOB DEFINITION</span>
              <h3>Execution envelope</h3>
            </div>
            <span className="trace-chip">
              <span className="chip-dot" /> POST /api/v1/jobs
            </span>
          </div>
          <label className="field-label" htmlFor="demo-preset">
            Demo preset<span>Optional</span>
          </label>
          <select
            id="demo-preset"
            value={preset}
            onChange={(event) => {
              const selected = DEMO_PRESETS.find((item) => item.id === event.target.value);
              setPreset(event.target.value);
              if (!selected) return;
              setJobType(selected.jobType);
              setPayloadText(selected.payload);
              setMaxRetries(selected.maxRetries);
            }}
          >
            <option value="">Start from a blank job</option>
            {DEMO_PRESETS.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
          <p className="field-help demo-preset-help">
            Presets use job types already registered by the worker. Failure-path presets
            intentionally exercise the existing retry and DLQ behavior.
          </p>
          <label className="field-label" htmlFor="job-type">
            Job type<span>Required</span>
          </label>
          <input
            id="job-type"
            value={jobType}
            onChange={(event) => setJobType(event.target.value)}
            placeholder="e.g. send-email"
            required
            autoFocus
          />
          <div className="form-grid-two">
            <div>
              <label className="field-label" htmlFor="job-priority">
                Priority<span>0–100</span>
              </label>
              <input
                id="job-priority"
                type="number"
                min="0"
                max="100"
                step="1"
                value={priority}
                onChange={(event) => setPriority(event.target.value)}
                placeholder="Default"
              />
            </div>
            <div>
              <label className="field-label" htmlFor="job-retries">
                Max retries<span>0–100</span>
              </label>
              <input
                id="job-retries"
                type="number"
                min="0"
                max="100"
                step="1"
                value={maxRetries}
                onChange={(event) => setMaxRetries(event.target.value)}
                placeholder="Default"
              />
            </div>
          </div>
          <label className="field-label" htmlFor="job-schedule">
            Scheduled at<span>Optional</span>
          </label>
          <input
            id="job-schedule"
            type="datetime-local"
            value={scheduledAt}
            onChange={(event) => setScheduledAt(event.target.value)}
          />
          <div className="form-actions">
            <button className="button" type="submit" disabled={submitting}>
              {submitting ? <RefreshCw className="spin" size={15} /> : <Send size={15} />}
              {submitting ? 'Submitting…' : 'Submit job'}
            </button>
            <span className="form-hint">
              The scheduler will assign the job to an available worker.
            </span>
          </div>
        </section>
        <section className="panel payload-editor-panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">REQUEST PAYLOAD</span>
              <h3>JSON object</h3>
            </div>
            <span className="chart-unit">Required</span>
          </div>
          <label className="sr-only" htmlFor="job-payload">
            Job payload JSON
          </label>
          <textarea
            id="job-payload"
            className="payload-editor"
            value={payloadText}
            onChange={(event) => setPayloadText(event.target.value)}
            spellCheck={false}
            aria-describedby="payload-help"
          />
          <p id="payload-help" className="field-help">
            Use a JSON object. Arrays and primitive values are rejected by the backend contract.
          </p>
        </section>
      </form>
      {error && (
        <div className="state error-state form-state">
          <AlertTriangle size={18} />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="state success-state form-state">
          <Check size={18} />
          <span>{success}</span>
        </div>
      )}
    </>
  );
}
function JobsPage({ failedOnly = false }: { failedOnly?: boolean }) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [status, setStatus] = useState(failedOnly ? 'FAILED' : '');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [summary, setSummary] = useState({
    submitted: 0,
    pending: 0,
    running: 0,
    completed: 0,
    failed: 0,
    cancelled: 0,
  });
  const load = async () => {
    try {
      setLoading(true);
      const [data, metrics] = await Promise.all([
        request<{ data: Job[]; pagination: { totalPages: number } }>(
          `/api/v1/jobs?page=${page}&limit=15`
        ),
        request<
          typeof summary & {
            retries: number;
            dlqSize: number;
            throughput: number;
            averageExecutionLatencyMs: number;
          }
        >('/api/v1/metrics/jobs'),
      ]);
      setJobs(data.data);
      setTotalPages(data.pagination.totalPages);
      setSummary(metrics);
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to load jobs');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    void load();
  }, [page]); // eslint-disable-line react-hooks/exhaustive-deps
  const visible = useMemo(
    () =>
      jobs.filter(
        (job) =>
          (!status || job.status === status) &&
          (!query ||
            job.jobType.toLowerCase().includes(query.toLowerCase()) ||
            job.id.includes(query))
      ),
    [jobs, status, query]
  );
  return (
    <>
      <PageHeader
        eyebrow={failedOnly ? 'FAILURE ANALYSIS' : 'JOB INVENTORY'}
        title={failedOnly ? 'Failed jobs' : 'Jobs'}
        description={
          failedOnly
            ? 'Inspect jobs that need attention and understand their retry posture.'
            : 'Search, filter, and inspect scheduled work across the fleet.'
        }
        action={
          <div className="header-actions">
            {!failedOnly && (
              <Link className="button" href="/jobs/new">
                <Plus size={15} /> Create job
              </Link>
            )}
            <button className="button secondary" onClick={() => void load()}>
              <RefreshCw size={15} />
              Refresh
            </button>
          </div>
        }
      />
      <div className="metric-grid compact-grid">
        <MetricCard label="Total jobs" value={summary.submitted} icon={Boxes} />
        <MetricCard label="Pending" value={summary.pending} icon={Clock3} tone="amber" />
        <MetricCard label="Processing" value={summary.running} icon={Activity} tone="violet" />
        <MetricCard label="Completed" value={summary.completed} icon={BarChart3} tone="green" />
        <MetricCard label="Failed" value={summary.failed} icon={AlertTriangle} tone="red" />
        <MetricCard label="Cancelled" value={summary.cancelled} icon={ShieldAlert} tone="red" />
      </div>
      <section className="panel">
        <div className="filters">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search ID or job type…"
          />
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All statuses</option>
            <option value="PENDING">Pending</option>
            <option value="RUNNING">Running</option>
            <option value="COMPLETED">Completed</option>
            <option value="FAILED">Failed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
        {loading ? (
          <Loading />
        ) : error ? (
          <ErrorState message={error} />
        ) : visible.length ? (
          <Table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Type</th>
                <th>Status</th>
                <th>Priority</th>
                <th>Scheduled time</th>
                <th>Retries</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((job) => (
                <tr key={job.id}>
                  <td>
                    <Link className="job-link" href={`/jobs/${job.id}`}>
                      {job.id.slice(0, 14)}…
                    </Link>
                  </td>
                  <td>{job.jobType}</td>
                  <td>
                    <Badge value={job.status} />
                  </td>
                  <td>
                    <span className="priority">P{job.priority}</span>
                  </td>
                  <td>{formatDate(job.scheduledAt)}</td>
                  <td>
                    {job.retryCount} / {job.maxRetries}
                  </td>
                  <td>{formatDate(job.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        ) : (
          <Empty text="No jobs match the current filters." />
        )}
        <div className="pagination">
          <span>
            Page {page} of {Math.max(1, totalPages)}
          </span>
          <div>
            <button
              className="icon-button"
              disabled={page <= 1}
              onClick={() => setPage((value) => value - 1)}
            >
              <ChevronLeft size={17} />
            </button>
            <button
              className="icon-button"
              disabled={page >= totalPages}
              onClick={() => setPage((value) => value + 1)}
            >
              <ChevronRight size={17} />
            </button>
          </div>
        </div>
      </section>
    </>
  );
}
function WorkersPage() {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const load = async () => {
    try {
      setWorkers((await request<{ workers: Worker[] }>('/api/v1/metrics/workers')).workers);
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to load workers');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    void load();
    const timer = setInterval(() => void load(), 10000);
    return () => clearInterval(timer);
  }, []);
  return (
    <>
      <PageHeader
        eyebrow="FLEET HEALTH"
        title="Workers"
        description="Monitor worker liveness, active capacity, and heartbeat freshness."
        action={
          <button className="button secondary" onClick={() => void load()}>
            <RefreshCw size={15} />
            Refresh
          </button>
        }
      />
      {loading ? (
        <Loading text="Discovering workers…" />
      ) : error ? (
        <ErrorState message={error} />
      ) : workers.length ? (
        <div className="worker-grid">
          {workers.map((worker) => (
            <section className="panel worker-card" key={worker.workerId}>
              <div className="worker-card-head">
                <div className="worker-avatar">{worker.workerId.slice(-2).toUpperCase()}</div>
                <div>
                  <h3>{worker.workerId}</h3>
                  <p>{worker.hostname || 'Unknown host'}</p>
                </div>
                <Badge value={workerHealth(worker)} />
              </div>
              <div className="worker-details">
                <span>
                  Status<strong>{worker.status}</strong>
                </span>
                <span>
                  Active jobs<strong>{worker.activeJobs}</strong>
                </span>
                <span>
                  Heartbeat<strong>{formatDate(worker.lastHeartbeat)}</strong>
                </span>
                <span>
                  Process<strong>{worker.processId || '—'}</strong>
                </span>
              </div>
            </section>
          ))}
        </div>
      ) : (
        <Empty text="No workers are currently registered." />
      )}
    </>
  );
}
function MetricsPage() {
  const [data, setData] = useState<{
    queueDepth: number;
    activeJobs: number;
    dlqSize: number;
    submitted: number;
    completed: number;
    failed: number;
    retries: number;
    throughput: number;
    averageExecutionLatencyMs: number;
  } | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    void Promise.all([
      request<typeof data>('/api/v1/metrics/jobs'),
      request<{ queueDepth: number; activeJobs: number; dlqSize: number }>('/api/v1/metrics/queue'),
    ])
      .then(([jobs, queue]) => setData({ ...jobs!, ...queue }))
      .catch((e) => setError(e instanceof Error ? e.message : 'Unable to load metrics'));
  }, []);
  const points = data
    ? [
        { name: 'Submitted', value: data.submitted },
        { name: 'Completed', value: data.completed },
        { name: 'Failed', value: data.failed },
        { name: 'Retries', value: data.retries },
      ]
    : [];
  return (
    <>
      <PageHeader
        eyebrow="TELEMETRY"
        title="Metrics"
        description="Current-state metrics and outcome distribution for the scheduler."
      />
      {error ? (
        <ErrorState message={error} />
      ) : !data ? (
        <Loading text="Loading telemetry…" />
      ) : (
        <>
          <div className="metric-grid">
            <MetricCard label="Queue depth" value={data.queueDepth} icon={Clock3} tone="amber" />
            <MetricCard label="DLQ size" value={data.dlqSize} icon={ShieldAlert} tone="red" />
            <MetricCard
              label="Throughput"
              value={data.throughput}
              icon={BarChart3}
              tone="green"
              hint="completed jobs"
            />
            <MetricCard
              label="Avg latency"
              value={`${Math.round(data.averageExecutionLatencyMs)} ms`}
              icon={Activity}
              tone="violet"
            />
          </div>
          <section className="analytics-ribbon" aria-label="Analytics summary">
            <div>
              <span className="eyebrow">LIFECYCLE COVERAGE</span>
              <strong>
                {data.submitted ? Math.round((data.completed / data.submitted) * 100) : 0}%
              </strong>
              <small>completed of submitted</small>
            </div>
            <div>
              <span className="eyebrow">RETRY PRESSURE</span>
              <strong>
                {data.submitted ? Math.round((data.retries / data.submitted) * 100) : 0}%
              </strong>
              <small>retry attempts / submitted</small>
            </div>
            <div>
              <span className="eyebrow">FAILURE RATE</span>
              <strong className={data.failed ? 'danger-text' : ''}>
                {data.submitted ? Math.round((data.failed / data.submitted) * 100) : 0}%
              </strong>
              <small>failed of submitted</small>
            </div>
            <div className="ribbon-note">
              <span className="pulse-dot" />
              <span>Values reflect current backend telemetry. No synthetic samples.</span>
            </div>
          </section>
          <section className="panel chart-panel">
            <div className="panel-heading">
              <div>
                <span className="eyebrow">OUTCOME DISTRIBUTION</span>
                <h3>Job lifecycle totals</h3>
              </div>
              <span className="chart-unit">count</span>
            </div>
            <div className="chart">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={points}>
                  <defs>
                    <linearGradient id="area" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#44d7c0" stopOpacity={0.45} />
                      <stop offset="100%" stopColor="#44d7c0" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#243246" />
                  <XAxis dataKey="name" stroke="#718198" />
                  <YAxis stroke="#718198" />
                  <Tooltip
                    contentStyle={{
                      background: '#101a29',
                      border: '1px solid #2b3c54',
                      borderRadius: 8,
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#44d7c0"
                    fill="url(#area)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </section>
        </>
      )}
    </>
  );
}
function DlqPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [error, setError] = useState('');
  const load = async () => {
    try {
      setJobs((await request<{ data: Job[] }>('/api/v1/jobs/dlq')).data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unable to load DLQ');
    }
  };
  useEffect(() => {
    void load();
  }, []);
  return (
    <>
      <PageHeader
        eyebrow="FAILURE RECOVERY"
        title="Dead-letter queue"
        description="Jobs that exhausted retries and are waiting for manual replay."
        action={
          <button className="button secondary" onClick={() => void load()}>
            <RefreshCw size={15} />
            Refresh
          </button>
        }
      />
      <section className={`dlq-hero panel ${jobs.length ? 'dlq-alert' : 'dlq-clear'}`}>
        <div className="dlq-signal">
          <ShieldAlert size={24} />
        </div>
        <div>
          <span className="eyebrow">OPERATOR QUEUE</span>
          <h3>
            {jobs.length
              ? `${jobs.length} job${jobs.length === 1 ? '' : 's'} require replay`
              : 'Dead-letter queue clear'}
          </h3>
          <p>
            {jobs.length
              ? 'These jobs exhausted their retry policy and are isolated from normal execution.'
              : 'No jobs are currently waiting for manual recovery.'}
          </p>
        </div>
        <div className="dlq-count">
          <strong>{jobs.length}</strong>
          <span>items</span>
        </div>
      </section>
      {error ? (
        <ErrorState message={error} />
      ) : jobs.length ? (
        <section className="panel">
          <Table>
            <thead>
              <tr>
                <th>Job ID</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => (
                <tr key={job.id}>
                  <td>
                    <Link className="job-link" href={`/jobs/${job.id}`}>
                      {job.id}
                    </Link>
                    <div className="muted">{job.jobType}</div>
                  </td>
                  <td>
                    <button
                      className="button small"
                      onClick={async () => {
                        await fetch(`${API}/api/v1/jobs/${job.id}/retry`, { method: 'POST' });
                        void load();
                      }}
                    >
                      Replay job
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </section>
      ) : (
        <Empty text="The dead-letter queue is clear." />
      )}
    </>
  );
}
function JobDetail({ id }: { id: string }) {
  const [job, setJob] = useState<Job | null>(null);
  const [history, setHistory] = useState<
    Array<{
      id: string;
      workerId: string;
      startedAt: string;
      completedAt?: string;
      durationMs?: number;
      status?: string;
      error?: string;
    }>
  >([]);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const [j, h] = await Promise.all([
          request<Job>(`/api/v1/jobs/${id}`),
          request<{
            data: Array<{
              id: string;
              workerId: string;
              startedAt: string;
              completedAt?: string;
              durationMs?: number;
              status?: string;
              error?: string;
            }>;
          }>(`/api/v1/jobs/${id}/executions`),
        ]);
        if (!active) return;
        setJob(j);
        setHistory(h.data);
        setError('');
      } catch (e) {
        if (active) setError(e instanceof Error ? e.message : 'Unable to load job');
      }
    };
    void load();
    const timer = window.setInterval(() => void load(), 5000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [id]);
  const copyPayload = async () => {
    if (!job) return;
    await navigator.clipboard?.writeText(JSON.stringify(job.payload ?? {}, null, 2));
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };
  if (error) return <ErrorState message={error} />;
  if (!job) return <Loading text="Hydrating execution trace…" />;
  const lastAttempt = history[history.length - 1];
  const totalDuration = history.reduce((sum, attempt) => sum + (attempt.durationMs ?? 0), 0);
  return (
    <>
      <Link href="/jobs" className="back-link">
        <ChevronLeft size={15} /> Back to jobs
      </Link>
      <PageHeader
        eyebrow="EXECUTION TRACE / JOB INSPECTION"
        title={job.id}
        description={`${job.jobType} · created ${formatDate(job.createdAt)}`}
        action={
          <span className="trace-chip">
            <span className="chip-dot" /> Trace retained
          </span>
        }
      />
      <section className="execution-hero panel">
        <div className="execution-hero-copy">
          <span className="eyebrow">CURRENT STATE</span>
          <div className="execution-state-row">
            <Badge value={job.status} />
            <strong>{job.jobType}</strong>
          </div>
          <p>
            One job, from schedule admission through worker execution. The timeline below is sourced
            from the existing execution log.
          </p>
        </div>
        <div className="execution-facts">
          <div>
            <span>Attempt count</span>
            <strong>{history.length}</strong>
          </div>
          <div>
            <span>Total runtime</span>
            <strong>{totalDuration} ms</strong>
          </div>
          <div>
            <span>Retry budget</span>
            <strong>
              {job.retryCount} / {job.maxRetries}
            </strong>
          </div>
        </div>
      </section>
      <div className="detail-grid detail-grid-premium">
        <section className="panel payload-panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">REQUEST ENVELOPE</span>
              <h3>Payload</h3>
            </div>
            <button
              className="icon-button"
              aria-label={copied ? 'Payload copied' : 'Copy payload'}
              onClick={() => void copyPayload()}
              title={copied ? 'Copied' : 'Copy payload'}
            >
              {copied ? <Check size={16} /> : <Clipboard size={16} />}
            </button>
          </div>
          <div className="payload-meta">
            <span>
              <Database size={14} /> JSON document
            </span>
            <span>Priority P{job.priority}</span>
            <span>Scheduled {formatDate(job.scheduledAt)}</span>
          </div>
          <pre className="payload">{JSON.stringify(job.payload ?? {}, null, 2)}</pre>
          {job.lastError && (
            <div className="error-box">
              <AlertTriangle size={16} />{' '}
              <span>
                <strong>Last failure</strong>
                {job.lastError}
              </span>
            </div>
          )}
        </section>
        <section className="panel timeline-panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">EXECUTION HISTORY</span>
              <h3>Worker attempts</h3>
            </div>
            <span className="chart-unit">{history.length} recorded</span>
          </div>
          {history.length ? (
            <div className="timeline">
              {history.map((attempt, index) => (
                <div
                  className={`timeline-item ${attempt.status?.toLowerCase() === 'failed' ? 'timeline-failed' : ''}`}
                  key={attempt.id}
                >
                  <div className="timeline-rail">
                    <div className="timeline-dot" />
                  </div>
                  <div className="timeline-content">
                    <div className="attempt-head">
                      <strong>Attempt {String(index + 1).padStart(2, '0')}</strong>
                      <Badge value={attempt.status || 'UNKNOWN'} />
                    </div>
                    <p>
                      <span className="mono">{attempt.workerId}</span>{' '}
                      <span className="muted-separator">·</span> {formatDate(attempt.startedAt)}
                    </p>
                    <div className="attempt-meta">
                      <span>{attempt.durationMs ?? 0} ms duration</span>
                      <span>
                        {attempt.completedAt
                          ? `completed ${formatDate(attempt.completedAt)}`
                          : 'completion pending'}
                      </span>
                    </div>
                    {attempt.error && <div className="attempt-error">{attempt.error}</div>}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Empty text="No execution attempts recorded." />
          )}
          {lastAttempt && (
            <div className="trace-footer">
              <span className="chip-dot" /> Last event{' '}
              {formatDate(lastAttempt.completedAt || lastAttempt.startedAt)}
            </div>
          )}
        </section>
      </div>
    </>
  );
}
function ArchitecturePage() {
  const layers = [
    {
      title: 'Experience',
      icon: Activity,
      items: ['React dashboard', 'Create Job workflow', 'Live job inspection'],
    },
    {
      title: 'Control plane',
      icon: Server,
      items: ['Express API', 'Validation middleware', 'Prometheus-compatible metrics'],
    },
    {
      title: 'State and scheduling',
      icon: Database,
      items: ['PostgreSQL / Prisma', 'Redis queues and locks', 'Recurring scheduler'],
    },
    {
      title: 'Execution plane',
      icon: Boxes,
      items: ['Worker 1 … N', 'Heartbeats', 'Retries and DLQ'],
    },
  ];
  return (
    <>
      <PageHeader
        eyebrow="SYSTEM ARCHITECTURE"
        title="Architecture"
        description="A grounded view of how PulseQ accepts, schedules, executes, and observes distributed work."
      />
      <section className="architecture-flow panel" aria-label="PulseQ architecture flow">
        {layers.map((layer, index) => {
          const Icon = layer.icon;
          return (
            <div className="architecture-step" key={layer.title}>
              <div className="architecture-node">
                <Icon size={20} />
                <span>0{index + 1}</span>
              </div>
              <div>
                <span className="eyebrow">{layer.title}</span>
                <ul>
                  {layer.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
              {index < layers.length - 1 && (
                <ChevronRight className="architecture-arrow" size={18} />
              )}
            </div>
          );
        })}
      </section>
      <div className="architecture-grid">
        <section className="panel architecture-copy">
          <span className="eyebrow">RELIABILITY MODEL</span>
          <h3>One job, observable at every boundary</h3>
          <p>
            Clients submit jobs to the API. PostgreSQL stores durable job state while Redis carries
            scheduling, priority, distributed locks, heartbeats, and DLQ membership.
          </p>
          <p>
            The recurring scheduler claims due definitions, and workers acquire execution leases
            before recording attempts and applying retry policy. The UI reads the resulting state
            through monitoring endpoints rather than simulating infrastructure.
          </p>
        </section>
        <section className="panel architecture-copy">
          <span className="eyebrow">OPERATING LOOP</span>
          <h3>Inspect the system like an operator</h3>
          <div className="architecture-checks">
            <span>
              <Check size={15} /> Submit a safe demo job
            </span>
            <span>
              <Check size={15} /> Follow its execution history
            </span>
            <span>
              <Check size={15} /> Inspect workers and queue pressure
            </span>
            <span>
              <Check size={15} /> Replay exhausted jobs from the DLQ
            </span>
          </div>
        </section>
      </div>
    </>
  );
}
function App() {
  return (
    <Shell>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/jobs/new" component={CreateJobPage} />
        <Route path="/jobs" component={() => <JobsPage />} />
        <Route path="/failed" component={() => <JobsPage failedOnly />} />
        <Route path="/workers" component={WorkersPage} />
        <Route path="/metrics" component={MetricsPage} />
        <Route path="/architecture" component={ArchitecturePage} />
        <Route path="/dlq" component={DlqPage} />
        <Route path="/jobs/:id">{(params) => <JobDetail id={params.id} />}</Route>
        <Route>
          <Dashboard />
        </Route>
      </Switch>
    </Shell>
  );
}
export default App;
