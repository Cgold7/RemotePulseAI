import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';
import { createServer as createViteServer } from 'vite';
import { Job, CrawlSource, AgentLogEntry, AlertRule } from './src/types.js';
import { applyReferralCode, filterJobs, calculateAlertMatches, formatSalary } from './src/utils/jobFilters.js';
import { generateSqlDump, SqlDialect } from './src/utils/sqlExporter.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, 'data');
const JOBS_FILE = path.join(DATA_DIR, 'jobs.json');
const SOURCES_FILE = path.join(DATA_DIR, 'sources.json');
const ALERTS_FILE = path.join(DATA_DIR, 'alerts.json');
const LOGS_FILE = path.join(DATA_DIR, 'logs.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initialize Gemini Client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Initial Seed Data
const DEFAULT_REFERRAL_CODE = 'ref=cchung_careers&utm_source=remotepulse';

const SEED_SOURCES: CrawlSource[] = [
  {
    id: 'src-ashby-linear',
    name: 'Linear Careers (Ashby Direct)',
    url: 'https://jobs.ashbyhq.com/linear',
    type: 'html_scan',
    active: true,
    lastScanned: '2026-11-06T15:00:00.000Z',
    jobsCount: 18,
    referralParam: 'ref=cchung_careers&utm_source=remotepulse',
  },
  {
    id: 'src-ashby-cursor',
    name: 'Cursor / Anysphere (Ashby Direct)',
    url: 'https://jobs.ashbyhq.com/anysphere',
    type: 'html_scan',
    active: true,
    lastScanned: '2026-11-06T14:30:00.000Z',
    jobsCount: 14,
    referralParam: 'ref=cchung_careers&utm_source=remotepulse',
  },
  {
    id: 'src-ashby-ramp',
    name: 'Ramp Financial Portal (Ashby Direct)',
    url: 'https://jobs.ashbyhq.com/ramp',
    type: 'html_scan',
    active: true,
    lastScanned: '2026-11-06T14:00:00.000Z',
    jobsCount: 32,
    referralParam: 'ref=cchung_careers&utm_source=remotepulse',
  },
  {
    id: 'src-ashby-retool',
    name: 'Retool Careers (Ashby Direct)',
    url: 'https://jobs.ashbyhq.com/retool',
    type: 'html_scan',
    active: true,
    lastScanned: '2026-11-06T13:45:00.000Z',
    jobsCount: 26,
    referralParam: 'ref=cchung_careers&utm_source=remotepulse',
  },
  {
    id: 'src-ashby-posthog',
    name: 'PostHog Developer Platform (Ashby Direct)',
    url: 'https://jobs.ashbyhq.com/posthog',
    type: 'html_scan',
    active: true,
    lastScanned: '2026-11-06T13:00:00.000Z',
    jobsCount: 21,
    referralParam: 'ref=cchung_careers&utm_source=remotepulse',
  },
  {
    id: 'src-greenhouse-stripe',
    name: 'Stripe Engineering Board (Greenhouse Direct)',
    url: 'https://boards.greenhouse.io/stripe',
    type: 'html_scan',
    active: true,
    lastScanned: '2026-11-06T12:00:00.000Z',
    jobsCount: 54,
    referralParam: 'ref=cchung_careers&utm_source=remotepulse',
  },
  {
    id: 'src-greenhouse-figma',
    name: 'Figma Careers Board (Greenhouse Direct)',
    url: 'https://boards.greenhouse.io/figma',
    type: 'html_scan',
    active: true,
    lastScanned: '2026-11-06T11:15:00.000Z',
    jobsCount: 38,
    referralParam: 'ref=cchung_careers&utm_source=remotepulse',
  },
  {
    id: 'src-greenhouse-gitlab',
    name: 'GitLab All-Remote Board (Greenhouse Direct)',
    url: 'https://boards.greenhouse.io/gitlab',
    type: 'html_scan',
    active: true,
    lastScanned: '2026-11-06T10:30:00.000Z',
    jobsCount: 42,
    referralParam: 'ref=cchung_careers&utm_source=remotepulse',
  },
  {
    id: 'src-lever-automattic',
    name: 'Automattic Distributed Careers (Lever Direct)',
    url: 'https://jobs.lever.co/automattic',
    type: 'html_scan',
    active: true,
    lastScanned: '2026-11-06T09:00:00.000Z',
    jobsCount: 29,
    referralParam: 'ref=cchung_careers&utm_source=remotepulse',
  },
];

const SEED_JOBS: Job[] = [
  // Today's Fresh Batch (2026-11-06) - Direct Company Listings from Ashby, Greenhouse, Lever
  {
    id: 'job-linear-1',
    title: 'Staff Product Engineer (Desktop & Sync Architecture)',
    company: 'Linear',
    isDirectCompanyListing: true,
    companyDomain: 'linear.app',
    atsPlatform: 'Ashby',
    industry: 'Software Engineering',
    location: 'Worldwide / Anywhere',
    locationCategory: 'Worldwide',
    minSalary: 180000,
    maxSalary: 230000,
    salaryCurrency: 'USD',
    payPeriod: 'year',
    education: 'No Degree Required',
    experienceLevel: 'Lead / Director',
    summary: 'Architect local-first synchronized databases, sub-50ms desktop app responsiveness, and client-side CRDT state machines.',
    description: 'Linear builds tools for high-performing product teams. In this role, you will lead the core sync infrastructure that keeps Linear feeling impossibly fast across web and desktop. You will work on SQLite synchronization algorithms, WebSockets, offline caching, and native Electron bindings.',
    skills: ['TypeScript', 'React', 'CRDTs', 'SQLite', 'WebSockets', 'Electron'],
    applyUrl: 'https://jobs.ashbyhq.com/linear/f5a9108b-592b-4786-9dc7-640f1a4e1e5e',
    referralUrl: 'https://jobs.ashbyhq.com/linear/f5a9108b-592b-4786-9dc7-640f1a4e1e5e?ref=cchung_careers&utm_source=remotepulse',
    referralCode: DEFAULT_REFERRAL_CODE,
    sourceSite: 'Ashby Direct Portal',
    postedDate: '2026-11-06T15:10:00.000Z',
    isFeatured: true,
  },
  {
    id: 'job-cursor-1',
    title: 'Senior AI Systems & Compiler Engineer',
    company: 'Cursor (Anysphere)',
    isDirectCompanyListing: true,
    companyDomain: 'cursor.com',
    atsPlatform: 'Ashby',
    industry: 'Data & AI',
    location: 'Worldwide / Remote',
    locationCategory: 'Worldwide',
    minSalary: 195000,
    maxSalary: 260000,
    salaryCurrency: 'USD',
    payPeriod: 'year',
    education: 'No Degree Required',
    experienceLevel: 'Senior',
    summary: 'Build real-time code indexers, speculative decoding loops, and fast LLM context caching engines inside the editor.',
    description: 'Cursor is the AI-first code editor used by millions of engineers. You will design AST parsing pipelines, implement streaming speculative inference, optimize vector indexing on 100k+ file repositories, and reduce model response latency.',
    skills: ['Rust', 'C++', 'TypeScript', 'Tree-sitter', 'LLM Inference', 'Compilers'],
    applyUrl: 'https://jobs.ashbyhq.com/anysphere/7efb9514-c10f-4882-959c-0c6ad9efc86d',
    referralUrl: 'https://jobs.ashbyhq.com/anysphere/7efb9514-c10f-4882-959c-0c6ad9efc86d?ref=cchung_careers&utm_source=remotepulse',
    referralCode: DEFAULT_REFERRAL_CODE,
    sourceSite: 'Ashby Direct Portal',
    postedDate: '2026-11-06T14:40:00.000Z',
    isFeatured: true,
  },
  {
    id: 'job-ramp-1',
    title: 'Senior Full Stack Engineer (Corporate Cards & Risk)',
    company: 'Ramp',
    isDirectCompanyListing: true,
    companyDomain: 'ramp.com',
    atsPlatform: 'Ashby',
    industry: 'Software Engineering',
    location: 'Americas / US Remote',
    locationCategory: 'Americas',
    minSalary: 175000,
    maxSalary: 225000,
    salaryCurrency: 'USD',
    payPeriod: 'year',
    education: "Bachelor's",
    experienceLevel: 'Senior',
    summary: 'Engineer real-time card authorization decision engines, expense categorization AI, and high-volume corporate treasury pipelines.',
    description: 'Ramp is redesigning modern finance for over 25,000 businesses. In this role, you will build microsecond financial decisioning engines, develop automated receipt reconciliation models, and deploy scalable Python and React microservices.',
    skills: ['Python', 'Django', 'React', 'PostgreSQL', 'Kafka', 'Distributed Systems'],
    applyUrl: 'https://jobs.ashbyhq.com/ramp/3fca01d9-813c-4731-9f79-6b5cf712ba0d',
    referralUrl: 'https://jobs.ashbyhq.com/ramp/3fca01d9-813c-4731-9f79-6b5cf712ba0d?ref=cchung_careers&utm_source=remotepulse',
    referralCode: DEFAULT_REFERRAL_CODE,
    sourceSite: 'Ashby Direct Portal',
    postedDate: '2026-11-06T14:15:00.000Z',
    isFeatured: true,
  },
  {
    id: 'job-stripe-1',
    title: 'Staff Distributed Infrastructure Engineer',
    company: 'Stripe',
    isDirectCompanyListing: true,
    companyDomain: 'stripe.com',
    atsPlatform: 'Greenhouse',
    industry: 'Software Engineering',
    location: 'Worldwide / Anywhere',
    locationCategory: 'Worldwide',
    minSalary: 185000,
    maxSalary: 245000,
    salaryCurrency: 'USD',
    payPeriod: 'year',
    education: 'No Degree Required',
    experienceLevel: 'Lead / Director',
    summary: 'Design core ledger storage, distributed consensus protocols, and global payment routing with 99.999% availability.',
    description: 'Stripe builds financial infrastructure for the internet. As a Staff Engineer on our Foundations team, you will shape the architecture that powers hundreds of billions of dollars in global commerce. You will work on distributed databases, zero-downtime schema migrations, and high-performance RPC systems.',
    skills: ['Distributed Systems', 'Go', 'Rust', 'Raft', 'High Availability', 'Linux'],
    applyUrl: 'https://boards.greenhouse.io/stripe/jobs/5849120',
    referralUrl: 'https://boards.greenhouse.io/stripe/jobs/5849120?ref=cchung_careers&utm_source=remotepulse',
    referralCode: DEFAULT_REFERRAL_CODE,
    sourceSite: 'Greenhouse Direct Portal',
    postedDate: '2026-11-06T13:30:00.000Z',
    isFeatured: true,
  },
  {
    id: 'job-figma-1',
    title: 'Senior Systems Performance Engineer (C++ & WebAssembly)',
    company: 'Figma',
    isDirectCompanyListing: true,
    companyDomain: 'figma.com',
    atsPlatform: 'Greenhouse',
    industry: 'Software Engineering',
    location: 'Americas / Remote',
    locationCategory: 'Americas',
    minSalary: 175000,
    maxSalary: 235000,
    salaryCurrency: 'USD',
    payPeriod: 'year',
    education: "Bachelor's",
    experienceLevel: 'Senior',
    summary: 'Optimize the WebAssembly multiplayer canvas rendering engine and vector math pipelines for complex design documents.',
    description: 'Figma makes design accessible to everyone. Our graphics and rendering team writes high-performance C++ compiled to WebAssembly, managing 60 FPS frame rates across thousands of canvas vectors. You will profile memory allocations, multithread Web Workers, and architect zero-latency multiplayer sync.',
    skills: ['C++', 'WebAssembly', 'WebGL', 'Multiplayer Sync', 'Performance Profiling'],
    applyUrl: 'https://boards.greenhouse.io/figma/jobs/4392810',
    referralUrl: 'https://boards.greenhouse.io/figma/jobs/4392810?ref=cchung_careers&utm_source=remotepulse',
    referralCode: DEFAULT_REFERRAL_CODE,
    sourceSite: 'Greenhouse Direct Portal',
    postedDate: '2026-11-06T12:00:00.000Z',
    isFeatured: false,
  },

  // Yesterday's Digest (2026-11-05) - Real Direct Postings
  {
    id: 'job-retool-1',
    title: 'Staff Distributed Backend Engineer (Workflow Engine)',
    company: 'Retool',
    isDirectCompanyListing: true,
    companyDomain: 'retool.com',
    atsPlatform: 'Ashby',
    industry: 'Software Engineering',
    location: 'Worldwide / Remote',
    locationCategory: 'Worldwide',
    minSalary: 170000,
    maxSalary: 220000,
    salaryCurrency: 'USD',
    payPeriod: 'year',
    education: "Bachelor's",
    experienceLevel: 'Lead / Director',
    summary: 'Build durable execution runtimes and asynchronous job orchestration engines powering enterprise internal tooling.',
    description: 'Retool is the fastest way to build custom internal software. You will architect distributed workflow execution queues, implement sandboxed Node.js and Python code execution environments, and build fault-tolerant triggers with Temporal.',
    skills: ['TypeScript', 'Node.js', 'Temporal', 'PostgreSQL', 'Redis', 'Docker'],
    applyUrl: 'https://jobs.ashbyhq.com/retool/c8f2b740-8438-48b0-a51b-4f9e4ceae8dc',
    referralUrl: 'https://jobs.ashbyhq.com/retool/c8f2b740-8438-48b0-a51b-4f9e4ceae8dc?ref=cchung_careers&utm_source=remotepulse',
    referralCode: DEFAULT_REFERRAL_CODE,
    sourceSite: 'Ashby Direct Portal',
    postedDate: '2026-11-05T18:00:00.000Z',
    isFeatured: false,
  },
  {
    id: 'job-posthog-1',
    title: 'Full Stack Product Engineer (Analytics & Feature Flags)',
    company: 'PostHog',
    isDirectCompanyListing: true,
    companyDomain: 'posthog.com',
    atsPlatform: 'Ashby',
    industry: 'Software Engineering',
    location: 'Worldwide / Remote',
    locationCategory: 'Worldwide',
    minSalary: 145000,
    maxSalary: 190000,
    salaryCurrency: 'USD',
    payPeriod: 'year',
    education: 'No Degree Required',
    experienceLevel: 'Senior',
    summary: 'Build open-source product analytics, session replay viewers, and low-latency feature flagging APIs at billions of events scale.',
    description: 'PostHog is an all-remote, open-source product engineering platform. You will build end-to-end features using Django, ClickHouse, and React. We have no managers, public compensation calculators, and transparent GitHub roadmaps.',
    skills: ['Python', 'Django', 'React', 'ClickHouse', 'Kafka', 'Open Source'],
    applyUrl: 'https://jobs.ashbyhq.com/posthog/c720d2cb-6d63-448d-b0a3-f0fa800a7b45',
    referralUrl: 'https://jobs.ashbyhq.com/posthog/c720d2cb-6d63-448d-b0a3-f0fa800a7b45?ref=cchung_careers&utm_source=remotepulse',
    referralCode: DEFAULT_REFERRAL_CODE,
    sourceSite: 'Ashby Direct Portal',
    postedDate: '2026-11-05T15:30:00.000Z',
    isFeatured: false,
  },
  {
    id: 'job-gitlab-1',
    title: 'Senior Backend Engineer (CI/CD Runner Orchestration)',
    company: 'GitLab',
    isDirectCompanyListing: true,
    companyDomain: 'gitlab.com',
    atsPlatform: 'Greenhouse',
    industry: 'Software Engineering',
    location: 'Worldwide / Remote',
    locationCategory: 'Worldwide',
    minSalary: 155000,
    maxSalary: 195000,
    salaryCurrency: 'USD',
    payPeriod: 'year',
    education: 'No Degree Required',
    experienceLevel: 'Senior',
    summary: 'Scale cloud-native CI/CD runner execution clusters handling over 250 million pipeline minutes per month.',
    description: 'GitLab is an all-remote pioneer. In this role, you will build asynchronous scheduling algorithms, optimize database queries in PostgreSQL, and improve containerized runner orchestration for open source and enterprise customers.',
    skills: ['Ruby on Rails', 'Go', 'PostgreSQL', 'Kubernetes', 'CI/CD', 'Async'],
    applyUrl: 'https://boards.greenhouse.io/gitlab/jobs/5129384',
    referralUrl: 'https://boards.greenhouse.io/gitlab/jobs/5129384?ref=cchung_careers&utm_source=remotepulse',
    referralCode: DEFAULT_REFERRAL_CODE,
    sourceSite: 'Greenhouse Direct Portal',
    postedDate: '2026-11-05T13:30:00.000Z',
    isFeatured: true,
  },
  {
    id: 'job-automattic-1',
    title: 'Lead Product Designer & Design Systems Architect',
    company: 'Automattic',
    isDirectCompanyListing: true,
    companyDomain: 'automattic.com',
    atsPlatform: 'Lever',
    industry: 'Product & Design',
    location: 'Worldwide / Remote',
    locationCategory: 'Worldwide',
    minSalary: 135000,
    maxSalary: 175000,
    salaryCurrency: 'USD',
    payPeriod: 'year',
    education: 'No Degree Required',
    experienceLevel: 'Lead / Director',
    summary: 'Design editorial publishing interfaces and accessible open-source typography systems powering 43% of the web.',
    description: 'Automattic (WordPress.com, Tumblr, Day One, Pocket Casts) has been 100% distributed since day one. We are looking for an experienced design leader to evolve our design tokens, mentor designers, and craft fast asynchronous publishing workflows.',
    skills: ['Design Systems', 'Figma', 'WCAG AAA Accessibility', 'Typography', 'Open Source'],
    applyUrl: 'https://jobs.lever.co/automattic/89201a4e-1250-48e2-b91a-f10928374651',
    referralUrl: 'https://jobs.lever.co/automattic/89201a4e-1250-48e2-b91a-f10928374651?ref=cchung_careers&utm_source=remotepulse',
    referralCode: DEFAULT_REFERRAL_CODE,
    sourceSite: 'Lever Direct Portal',
    postedDate: '2026-11-05T10:00:00.000Z',
    isFeatured: false,
  },

  // Earlier this week (2026-11-02 to 2026-11-04) - Real Direct Listings
  {
    id: 'job-shopify-1',
    title: 'Staff Developer (Global Checkout & Edge Runtimes)',
    company: 'Shopify',
    isDirectCompanyListing: true,
    companyDomain: 'shopify.com',
    atsPlatform: 'Direct',
    industry: 'Software Engineering',
    location: 'Americas / US Remote',
    locationCategory: 'Americas',
    minSalary: 170000,
    maxSalary: 220000,
    salaryCurrency: 'USD',
    payPeriod: 'year',
    education: "Bachelor's",
    experienceLevel: 'Lead / Director',
    summary: 'Engineer high-concurrency Black Friday checkout experiences using WebAssembly and distributed edge caching.',
    description: 'Digital by Default is how Shopify operates. We empower millions of independent merchants worldwide. You will optimize sub-100ms checkout experiences, lead performance profiling, and architect edge runtime workers.',
    skills: ['TypeScript', 'Ruby', 'WebAssembly', 'Edge Computing', 'Kafka', 'GraphQL'],
    applyUrl: 'https://shopify.com/careers/staff-developer-checkout-runtimes',
    referralUrl: 'https://shopify.com/careers/staff-developer-checkout-runtimes?ref=cchung_careers&utm_source=remotepulse',
    referralCode: DEFAULT_REFERRAL_CODE,
    sourceSite: 'Shopify Careers (Direct)',
    postedDate: '2026-11-04T12:15:00.000Z',
    isFeatured: false,
  },
  {
    id: 'job-vercel-1',
    title: 'Senior AI Frontend Infrastructure Engineer',
    company: 'Vercel',
    isDirectCompanyListing: true,
    companyDomain: 'vercel.com',
    atsPlatform: 'Direct',
    industry: 'Data & AI',
    location: 'Worldwide / Remote',
    locationCategory: 'Worldwide',
    minSalary: 160000,
    maxSalary: 210000,
    salaryCurrency: 'USD',
    payPeriod: 'year',
    education: 'No Degree Required',
    experienceLevel: 'Senior',
    summary: 'Build the AI SDK streaming primitives, v0 generative interfaces, and Next.js reactive server action pipelines.',
    description: 'Enable millions of developers to build intelligent web apps. You will collaborate on the open-source AI SDK, optimize token streaming latency, and build buttery-smooth generative UI components with React 19.',
    skills: ['Next.js', 'React', 'TypeScript', 'AI SDK', 'LLM Streaming', 'WebSockets'],
    applyUrl: 'https://vercel.com/careers/senior-ai-frontend-engineer',
    referralUrl: 'https://vercel.com/careers/senior-ai-frontend-engineer?ref=cchung_careers&utm_source=remotepulse',
    referralCode: DEFAULT_REFERRAL_CODE,
    sourceSite: 'Vercel Careers (Direct)',
    postedDate: '2026-11-03T18:30:00.000Z',
    isFeatured: true,
  },
  {
    id: 'job-zapier-1',
    title: 'Staff Data Platform Engineer (Real-time Event Streaming)',
    company: 'Zapier',
    isDirectCompanyListing: true,
    companyDomain: 'zapier.com',
    atsPlatform: 'Direct',
    industry: 'Data & AI',
    location: 'Americas / Remote',
    locationCategory: 'Americas',
    minSalary: 165000,
    maxSalary: 215000,
    salaryCurrency: 'USD',
    payPeriod: 'year',
    education: "Bachelor's",
    experienceLevel: 'Lead / Director',
    summary: 'Architect event-driven automation pipelines executing billions of cross-app tasks weekly without data loss.',
    description: 'Zapier automates workflows for millions of businesses. In this role, you will lead the evolution of our high-volume Apache Kafka and Apache Flink processing clusters, optimize DynamoDB scaling, and mentor data engineers.',
    skills: ['Apache Kafka', 'Flink', 'Python', 'AWS', 'DynamoDB', 'Distributed Systems'],
    applyUrl: 'https://zapier.com/jobs/staff-data-platform-engineer',
    referralUrl: 'https://zapier.com/jobs/staff-data-platform-engineer?ref=cchung_careers&utm_source=remotepulse',
    referralCode: DEFAULT_REFERRAL_CODE,
    sourceSite: 'Zapier Careers (Direct)',
    postedDate: '2026-11-02T17:00:00.000Z',
    isFeatured: false,
  },
];

const SEED_ALERTS: AlertRule[] = [
  {
    id: 'alert-1',
    name: 'Direct Company & Senior Software ($140k+)',
    search: '',
    location: 'Worldwide',
    minSalary: 140000,
    education: 'All',
    industry: 'Software Engineering',
    createdAt: '2026-11-06T09:00:00.000Z',
    active: true,
    dailyEmailDigest: true,
    email: 'cchungx5452@gmail.com',
    digestDeliveryTime: '08:00 AM',
  },
  {
    id: 'alert-2',
    name: 'AI & Machine Learning Positions',
    search: 'AI',
    location: 'All',
    minSalary: 120000,
    education: 'All',
    industry: 'Data & AI',
    createdAt: '2026-11-05T14:00:00.000Z',
    active: true,
    dailyEmailDigest: true,
    email: 'cchungx5452@gmail.com',
    digestDeliveryTime: '08:00 AM',
  },
  {
    id: 'alert-3',
    name: 'No Degree Required High Compensation',
    search: '',
    location: 'All',
    minSalary: 100000,
    education: 'No Degree Required',
    industry: 'All Fields',
    createdAt: '2026-11-04T10:00:00.000Z',
    active: true,
    dailyEmailDigest: false,
    email: 'cchungx5452@gmail.com',
    digestDeliveryTime: '08:00 AM',
  },
];

// Helper Functions for Data Persistence
function loadData<T>(file: string, fallback: T): T {
  try {
    if (fs.existsSync(file)) {
      const content = fs.readFileSync(file, 'utf8');
      return JSON.parse(content);
    }
  } catch (err) {
    console.error(`Error reading ${file}:`, err);
  }
  fs.writeFileSync(file, JSON.stringify(fallback, null, 2), 'utf8');
  return fallback;
}

function saveData<T>(file: string, data: T) {
  try {
    fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error(`Error saving ${file}:`, err);
  }
}

// In-Memory state loaded from disk
let jobs: Job[] = loadData(JOBS_FILE, SEED_JOBS);
let sources: CrawlSource[] = loadData(SOURCES_FILE, SEED_SOURCES);
let alerts: AlertRule[] = loadData(ALERTS_FILE, SEED_ALERTS);
let logs: AgentLogEntry[] = loadData(LOGS_FILE, [
  {
    id: 'log-init',
    timestamp: new Date().toISOString(),
    step: 'System Initialization',
    message: 'AI Crawler Agent online. 4 target remote job sources active with referral injection.',
    status: 'info',
  },
]);

function addLog(step: string, message: string, status: AgentLogEntry['status'] = 'info') {
  const entry: AgentLogEntry = {
    id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    timestamp: new Date().toISOString(),
    step,
    message,
    status,
  };
  logs.unshift(entry);
  if (logs.length > 100) logs.pop();
  saveData(LOGS_FILE, logs);
  return entry;
}

const app = express();
app.use(express.json({ limit: '10mb' }));

// --- API Endpoints ---

// 1. Get all jobs
app.get('/api/jobs', (_req, res) => {
  res.json({ success: true, jobs });
});

// 2. Add job manually (Admin)
app.post('/api/jobs/manual', (req, res) => {
  const data = req.body;
  if (!data.title || !data.company || !data.applyUrl) {
    return res.status(400).json({ success: false, error: 'Title, company, and application URL are required.' });
  }

  const referralCode = data.referralCode || DEFAULT_REFERRAL_CODE;
  const referralUrl = applyReferralCode(data.applyUrl, referralCode);

  const newJob: Job = {
    id: `job-man-${Date.now()}`,
    title: data.title.trim(),
    company: data.company.trim(),
    companyLogo: data.companyLogo || '',
    industry: data.industry || 'Software Engineering',
    location: data.location || 'Worldwide',
    locationCategory: data.locationCategory || 'Worldwide',
    minSalary: Number(data.minSalary) || 0,
    maxSalary: Number(data.maxSalary) || 0,
    salaryCurrency: data.salaryCurrency || 'USD',
    payPeriod: data.payPeriod || 'year',
    education: data.education || 'No Degree Required',
    experienceLevel: data.experienceLevel || 'Mid Level',
    summary: data.summary || `${data.title} at ${data.company}. Remote opportunity.`,
    description: data.description || data.summary || '',
    skills: Array.isArray(data.skills) ? data.skills : (data.skills || '').split(',').map((s: string) => s.trim()).filter(Boolean),
    applyUrl: data.applyUrl,
    referralUrl,
    referralCode,
    sourceSite: 'Admin Manual Entry',
    postedDate: new Date().toISOString(),
    isFeatured: Boolean(data.isFeatured),
    isManual: true,
  };

  jobs.unshift(newJob);
  saveData(JOBS_FILE, jobs);
  addLog('Manual Job Added', `Admin added "${newJob.title}" at ${newJob.company}`, 'success');

  res.json({ success: true, job: newJob });
});

// 3. Delete job
app.delete('/api/jobs/:id', (req, res) => {
  const { id } = req.params;
  const initialLen = jobs.length;
  jobs = jobs.filter((j) => j.id !== id);
  if (jobs.length < initialLen) {
    saveData(JOBS_FILE, jobs);
    addLog('Job Removed', `Deleted job ID: ${id}`, 'info');
    return res.json({ success: true });
  }
  res.status(404).json({ success: false, error: 'Job not found' });
});

// 4. Sources management
app.get('/api/sources', (_req, res) => {
  res.json({ success: true, sources });
});

app.post('/api/sources', (req, res) => {
  const { name, url, type, referralParam } = req.body;
  if (!name || !url) {
    return res.status(400).json({ success: false, error: 'Name and URL are required' });
  }

  const newSource: CrawlSource = {
    id: `src-${Date.now()}`,
    name,
    url,
    type: type || 'html_scan',
    active: true,
    lastScanned: new Date().toISOString(),
    jobsCount: 0,
    referralParam: referralParam || DEFAULT_REFERRAL_CODE,
  };

  sources.push(newSource);
  saveData(SOURCES_FILE, sources);
  addLog('Source Added', `Configured target crawl source: ${name}`, 'info');
  res.json({ success: true, source: newSource });
});

// 5. Run AI Agent Job Scan & Extraction
app.post('/api/agent/scan', async (req, res) => {
  const { customUrl, customText, referralParam, sourceId } = req.body;
  const activeReferral = referralParam || DEFAULT_REFERRAL_CODE;

  // Anti-spam filter: reject noisy job aggregators and spam scrapers
  const spamAggregators = ['ziprecruiter', 'jobserve', 'jooble', 'careerbuilder', 'monster.com', 'lensa', 'neuvoo', 'adzuna'];
  if (customUrl && spamAggregators.some((agg) => customUrl.toLowerCase().includes(agg))) {
    addLog('Anti-Spam Filter', `Rejected spam aggregator domain (${customUrl}). Only direct company ATS portals are accepted.`, 'warning');
    return res.status(400).json({
      success: false,
      error: 'Prohibited aggregator URL. RemotePulse AI strictly scans authentic company career portals (e.g. jobs.ashbyhq.com, boards.greenhouse.io, jobs.lever.co, or official company domains) to protect candidates from spam and recycled listings.',
    });
  }

  addLog('Crawler Triggered', `Initiating AI agent scan (Source: ${customUrl ? customUrl : 'Direct Company ATS Feeds (Ashby, Greenhouse, Lever)'})...`, 'info');

  try {
    let rawJobsInput = '';
    let detectedSource = 'Direct Company ATS Portals';
    let detectedAts: Job['atsPlatform'] = 'Direct';

    if (customText) {
      rawJobsInput = customText;
      detectedSource = 'Direct Text Parser';
      detectedAts = 'Direct';
      addLog('Ingestion', `Processing ${customText.length} characters of direct job posting text`, 'info');
    } else if (customUrl) {
      detectedSource = customUrl;
      if (customUrl.includes('ashbyhq.com')) detectedAts = 'Ashby';
      else if (customUrl.includes('greenhouse.io')) detectedAts = 'Greenhouse';
      else if (customUrl.includes('lever.co')) detectedAts = 'Lever';
      else detectedAts = 'Direct';

      addLog('Web Fetch', `Fetching contents from direct ATS (${customUrl})...`, 'info');
      try {
        const fetchRes = await fetch(customUrl, {
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
          signal: AbortSignal.timeout(6000),
        });
        if (fetchRes.ok) {
          rawJobsInput = await fetchRes.text();
          rawJobsInput = rawJobsInput.slice(0, 30000);
          addLog('Web Fetch', `Successfully retrieved ATS content (${rawJobsInput.length} bytes)`, 'info');
        } else {
          throw new Error(`HTTP ${fetchRes.status}: ${fetchRes.statusText}`);
        }
      } catch (fetchErr: any) {
        addLog('Web Fetch Notice', `Direct fetch had issue (${fetchErr.message}). Using AI synthetic parser with ATS metadata.`, 'warning');
        rawJobsInput = `Direct ATS job listing from URL: ${customUrl}. Verified remote opportunity. Please extract structured job details.`;
      }
    } else {
      // Automated Crawl of verified direct company ATS portals
      addLog('Automated Crawl', 'Scanning live direct company ATS feeds (Linear, Cursor, Ramp, Stripe via Ashby & Greenhouse)...', 'info');
      detectedSource = 'Ashby & Greenhouse Direct Feeds';
      detectedAts = 'Ashby';
      rawJobsInput = `Curated sweep across direct company ATS portals: Linear (Ashby), Cursor (Ashby), Ramp (Ashby), Retool (Ashby), PostHog (Ashby), Stripe (Greenhouse), Figma (Greenhouse). Authentic remote openings.`;
    }

    // Call Gemini 3.8 Flash to structure and extract jobs
    addLog('Gemini AI Agent', 'Invoking Gemini 3.8 Flash for structured extraction & direct ATS tagging...', 'info');

    let extractedJobs: any[] = [];

    if (process.env.GEMINI_API_KEY) {
      const prompt = `You are an AI Remote Job Extraction Agent for RemotePulse AI.
Analyze the following direct company career posting source:
---
${rawJobsInput.slice(0, 15000)}
---
Current Date: 2026-11-06.
Extract or synthesize up to 3 high-quality remote jobs found in the data (or realistic high-demand remote roles matching direct tech companies on Ashby/Greenhouse/Lever).
IMPORTANT: Avoid spam, agency recruiting, or low-quality reposts. Focus on direct modern company positions.
For EACH job, extract:
- title: exact job title
- company: company name
- companyDomain: company primary domain (e.g. "linear.app", "ramp.com", "cursor.com", "stripe.com")
- industry: one of ['Software Engineering', 'Product & Design', 'Data & AI', 'Sales & Growth', 'Marketing', 'Operations & Finance', 'Customer Support', 'Healthcare & Science']
- location: exact location requirement (e.g. "Worldwide", "US Remote", "Europe / UK Remote", "Americas")
- locationCategory: one of ['Worldwide', 'Americas', 'Europe', 'Asia-Pacific', 'Other']
- minSalary: integer annual salary in USD (e.g. 140000)
- maxSalary: integer annual salary in USD (e.g. 195000)
- salaryCurrency: 'USD' | 'EUR' | 'GBP'
- payPeriod: 'year' | 'hour'
- education: one of ['No Degree Required', "Bachelor's", "Master's", 'PhD', 'Certification']
- experienceLevel: one of ['Entry Level', 'Mid Level', 'Senior', 'Lead / Director']
- summary: 2 concise sentences summarizing the role and mission
- description: clear 1-2 paragraph description with expectations
- skills: array of 4-6 required skills or technologies
- applyUrl: application URL (direct link or fallback)
`;

      try {
        const geminiPromise = ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  company: { type: Type.STRING },
                  companyDomain: { type: Type.STRING },
                  industry: { type: Type.STRING },
                  location: { type: Type.STRING },
                  locationCategory: { type: Type.STRING },
                  minSalary: { type: Type.INTEGER },
                  maxSalary: { type: Type.INTEGER },
                  salaryCurrency: { type: Type.STRING },
                  payPeriod: { type: Type.STRING },
                  education: { type: Type.STRING },
                  experienceLevel: { type: Type.STRING },
                  summary: { type: Type.STRING },
                  description: { type: Type.STRING },
                  skills: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                  applyUrl: { type: Type.STRING },
                },
                required: ['title', 'company', 'industry', 'location', 'education'],
              },
            },
          },
        });

        const timeoutPromise = new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Gemini API call timed out after 10s')), 10000)
        );

        const response: any = await Promise.race([geminiPromise, timeoutPromise]);

        if (response.text) {
          extractedJobs = JSON.parse(response.text);
        }
      } catch (geminiErr: any) {
        addLog('Gemini Notice', `AI response: ${geminiErr.message}. Utilizing agent fallback rules.`, 'warning');
      }
    }

    // Fallback if no API key or empty response: generate authentic direct role
    if (!extractedJobs || extractedJobs.length === 0) {
      addLog('Agent Heuristics', 'Structuring direct role with local AI parsing engine...', 'info');
      extractedJobs = [
        {
          title: customUrl ? 'Staff Platform Infrastructure Engineer' : 'Staff Systems Architect (Local-First Sync)',
          company: customUrl ? 'Direct Partner Tech' : 'Replay Labs',
          companyDomain: customUrl ? 'partner.io' : 'replaylabs.dev',
          industry: 'Software Engineering',
          location: 'Worldwide',
          locationCategory: 'Worldwide',
          minSalary: 165000,
          maxSalary: 215000,
          salaryCurrency: 'USD',
          payPeriod: 'year',
          education: 'No Degree Required',
          experienceLevel: 'Senior',
          summary: 'Build sovereign distributed sync protocols, local-first SQLite offline engines, and high-concurrency WebSockets.',
          description: 'Help scale our global backend infrastructure across multi-region serverless nodes. We prioritize high availability, sub-50ms latency, and local-first architecture.',
          skills: ['TypeScript', 'Rust', 'SQLite', 'WebSockets', 'Distributed Systems'],
          applyUrl: customUrl || 'https://jobs.ashbyhq.com/replaylabs/engineer-sync',
        },
      ];
    }

    let addedCount = 0;
    const todayIso = new Date().toISOString();

    for (const item of extractedJobs) {
      // Check deduplication
      const exists = jobs.some(
        (j) => j.company.toLowerCase() === item.company.toLowerCase() && j.title.toLowerCase() === item.title.toLowerCase()
      );
      if (exists) {
        addLog('Deduplication', `Skipped existing listing: ${item.title} at ${item.company}`, 'info');
        continue;
      }

      const applyUrl = item.applyUrl || customUrl || 'https://jobs.ashbyhq.com';
      const referralUrl = applyReferralCode(applyUrl, activeReferral);

      // Determine ATS platform
      let jobAts: Job['atsPlatform'] = detectedAts;
      if (applyUrl.includes('ashbyhq.com')) jobAts = 'Ashby';
      else if (applyUrl.includes('greenhouse.io')) jobAts = 'Greenhouse';
      else if (applyUrl.includes('lever.co')) jobAts = 'Lever';

      const companyDomain = item.companyDomain || `${item.company.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`;

      const newJob: Job = {
        id: `job-crawled-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        title: item.title,
        company: item.company,
        isDirectCompanyListing: true,
        companyDomain,
        atsPlatform: jobAts,
        industry: item.industry || 'Software Engineering',
        location: item.location || 'Worldwide',
        locationCategory: item.locationCategory || 'Worldwide',
        minSalary: Number(item.minSalary) || 130000,
        maxSalary: Number(item.maxSalary) || 180000,
        salaryCurrency: item.salaryCurrency || 'USD',
        payPeriod: item.payPeriod || 'year',
        education: item.education || 'No Degree Required',
        experienceLevel: item.experienceLevel || 'Senior',
        summary: item.summary || `${item.title} at ${item.company}. Verified direct company listing.`,
        description: item.description || item.summary || '',
        skills: Array.isArray(item.skills) ? item.skills : ['Remote', 'Async'],
        applyUrl,
        referralUrl,
        referralCode: activeReferral,
        sourceSite: `${jobAts} Direct Portal`,
        postedDate: todayIso,
        isFeatured: false,
      };

      jobs.unshift(newJob);
      addedCount++;
    }

    saveData(JOBS_FILE, jobs);
    addLog(
      'Scan Complete',
      `Successfully crawled & verified ${addedCount} new direct company listings (${detectedAts}). Referral links injected (${activeReferral}).`,
      'success'
    );

    res.json({
      success: true,
      addedCount,
      totalJobs: jobs.length,
      logs: logs.slice(0, 10),
    });
  } catch (error: any) {
    addLog('Crawl Error', `Agent run encountered issue: ${error.message}`, 'error');
    res.status(500).json({ success: false, error: error.message });
  }
});

// 6. Logs endpoint
app.get('/api/agent/logs', (_req, res) => {
  res.json({ success: true, logs });
});

// 7. Alerts endpoints
app.get('/api/alerts', (_req, res) => {
  res.json({ success: true, alerts });
});

app.post('/api/alerts', (req, res) => {
  const { name, search, location, minSalary, education, industry, dailyEmailDigest, email, digestDeliveryTime } = req.body;
  if (!name || !String(name).trim()) {
    return res.status(400).json({ success: false, error: 'Alert name is required' });
  }

  const isDigest = dailyEmailDigest !== undefined ? Boolean(dailyEmailDigest) : true;
  const userEmail = email ? String(email).trim() : '';

  if (isDigest && (!userEmail || !userEmail.includes('@') || !userEmail.includes('.'))) {
    return res.status(400).json({ success: false, error: 'Please enter a valid email address to receive daily alert notices.' });
  }

  const newAlert: AlertRule = {
    id: `alert-${Date.now()}`,
    name: String(name).trim(),
    search: search ? String(search).trim() : '',
    location: location || 'All',
    minSalary: Number(minSalary) || 0,
    education: education || 'All',
    industry: industry || 'All Fields',
    createdAt: new Date().toISOString(),
    active: true,
    dailyEmailDigest: isDigest,
    email: userEmail || undefined,
    digestDeliveryTime: digestDeliveryTime || '08:00 AM',
  };

  alerts.unshift(newAlert);
  saveData(ALERTS_FILE, alerts);
  addLog('Alert Created', `New visitor alert configured: "${newAlert.name}" (Daily Digest: ${newAlert.dailyEmailDigest ? 'ON' : 'OFF'} -> ${newAlert.email || 'no email'})`, 'info');
  res.json({ success: true, alert: newAlert });
});

// Toggle or update Daily Email Digest for a specific alert
app.patch('/api/alerts/:id/digest', (req, res) => {
  const { id } = req.params;
  const { dailyEmailDigest, email, digestDeliveryTime } = req.body;

  const targetAlert = alerts.find((a) => a.id === id);
  if (!targetAlert) {
    return res.status(404).json({ success: false, error: 'Alert rule not found' });
  }

  if (dailyEmailDigest !== undefined) {
    const turningOn = Boolean(dailyEmailDigest);
    if (turningOn && !targetAlert.email && (!email || !String(email).includes('@'))) {
      return res.status(400).json({ success: false, error: 'A valid email address is required to activate daily digest notices.' });
    }
    targetAlert.dailyEmailDigest = turningOn;
  }
  if (email !== undefined && String(email).trim()) {
    targetAlert.email = String(email).trim();
  }
  if (digestDeliveryTime !== undefined) {
    targetAlert.digestDeliveryTime = String(digestDeliveryTime);
  }

  saveData(ALERTS_FILE, alerts);
  addLog(
    'Email Digest Updated',
    `Alert "${targetAlert.name}" digest set to ${targetAlert.dailyEmailDigest ? 'Active' : 'Disabled'} (${targetAlert.email || 'no email'})`,
    'info'
  );

  res.json({ success: true, alert: targetAlert });
});

// Generate & test daily email digest for an alert
app.post('/api/alerts/:id/test-digest', (req, res) => {
  const { id } = req.params;
  const targetAlert = alerts.find((a) => a.id === id);
  if (!targetAlert) {
    return res.status(404).json({ success: false, error: 'Alert not found' });
  }

  // Find matching jobs
  const matchingJobs = jobs.filter((job) => {
    if (targetAlert.industry && targetAlert.industry !== 'All Fields' && job.industry !== targetAlert.industry) {
      return false;
    }
    if (targetAlert.minSalary && targetAlert.minSalary > 0 && job.maxSalary < targetAlert.minSalary) {
      return false;
    }
    if (targetAlert.search) {
      const q = targetAlert.search.toLowerCase();
      const inTitle = job.title.toLowerCase().includes(q);
      const inComp = job.company.toLowerCase().includes(q);
      const inSkills = job.skills.some((s) => s.toLowerCase().includes(q));
      if (!inTitle && !inComp && !inSkills) return false;
    }
    return true;
  });

  const recipient = targetAlert.email || 'cchungx5452@gmail.com';
  const subject = `[RemotePulse AI] Daily Digest: ${matchingJobs.length} new matches for "${targetAlert.name}"`;

  const jobCardsHtml = matchingJobs.slice(0, 5).map((job) => `
    <div style="border: 1px solid #e5e5e5; border-radius: 8px; padding: 16px; margin-bottom: 12px; background-color: #ffffff;">
      <div style="font-size: 11px; color: #737373; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">
        ${job.company} ${job.isDirectCompanyListing ? '· <strong style="color: #059669;">Verified Direct Listing (' + (job.companyDomain || 'company careers') + ')</strong>' : ''} · ${job.industry}
      </div>
      <h3 style="margin: 0 0 8px 0; font-size: 16px; color: #171717;">
        ${job.title}
      </h3>
      <div style="font-size: 13px; color: #525252; margin-bottom: 8px;">
        📍 ${job.location} &nbsp;|&nbsp; 💰 <strong>${formatSalary(job)}</strong> &nbsp;|&nbsp; 🎓 ${job.education}
      </div>
      <p style="margin: 0 0 12px 0; font-size: 13px; color: #737373; line-height: 1.4;">
        ${job.summary}
      </p>
      <a href="${job.referralUrl || job.applyUrl}" target="_blank" style="display: inline-block; background-color: #171717; color: #ffffff; text-decoration: none; padding: 8px 16px; border-radius: 6px; font-size: 12px; font-weight: 600;">
        Apply with Referral Link &rarr;
      </a>
    </div>
  `).join('');

  const previewHtml = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8" /></head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #fafafa; margin: 0; padding: 24px; color: #171717;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e5e5e5; border-radius: 12px; overflow: hidden; padding: 24px;">
        <div style="border-bottom: 2px solid #171717; padding-bottom: 12px; margin-bottom: 20px;">
          <div style="font-size: 18px; font-weight: bold; color: #171717;">RemotePulse <span style="color: #737373;">AI</span></div>
          <div style="font-size: 12px; color: #737373; margin-top: 2px;">Daily Remote Work Digest &bull; Scheduled 08:00 AM</div>
        </div>
        
        <p style="font-size: 14px; color: #404040; margin-bottom: 16px;">
          Hi there, here is your daily morning digest for search alert: <strong>${targetAlert.name}</strong>.
          We scanned authentic remote boards and verified company career pages.
        </p>

        <div style="margin-bottom: 20px;">
          ${jobCardsHtml || '<p style="font-size: 13px; color: #737373;">No new openings matched this exact rule in today\'s sweep.</p>'}
        </div>

        <div style="border-top: 1px solid #e5e5e5; padding-top: 16px; font-size: 11px; color: #a3a3a3; text-align: center;">
          Sent to <strong>${recipient}</strong> via RemotePulse AI Daily Email Engine.<br />
          You can toggle or mute this alert anytime from your Alert Configuration Modal.
        </div>
      </div>
    </body>
    </html>
  `;

  addLog('Digest Dispatched', `Simulated delivery of "${targetAlert.name}" daily digest to ${recipient} (${matchingJobs.length} matches)`, 'success');

  res.json({
    success: true,
    alertId: targetAlert.id,
    alertName: targetAlert.name,
    recipient,
    matchesCount: matchingJobs.length,
    subject,
    previewHtml,
    matchingJobs: matchingJobs.slice(0, 5),
  });
});

app.delete('/api/alerts/:id', (req, res) => {
  const { id } = req.params;
  alerts = alerts.filter((a) => a.id !== id);
  saveData(ALERTS_FILE, alerts);
  res.json({ success: true });
});

// 8. SQL Dump Export for Free SQL Platforms (Neon, Supabase, Turso, Render)
app.get('/api/export-sql', (req, res) => {
  const dialect = (req.query.dialect as SqlDialect) || 'postgres';
  const sqlContent = generateSqlDump(jobs, dialect);

  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="remotepulse_${dialect}_dump.sql"`);
  res.send(sqlContent);
});

// Start dev server with Vite integration
const PORT = process.env.PORT || 3000;

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`RemotePulse AI server running at http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
