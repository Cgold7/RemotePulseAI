import test from 'node:test';
import assert from 'node:assert/strict';
import { 
  applyReferralCode, 
  matchesEducation, 
  matchesLocation, 
  formatSalary, 
  filterJobs, 
  groupJobsByBatch, 
  calculateAlertMatches 
} from './jobFilters';
import { Job, JobFilters, AlertRule } from '../types';

const mockJobs: Job[] = [
  {
    id: 'job-1',
    title: 'Senior Full Stack Engineer',
    company: 'CloudScale Technologies',
    industry: 'Software Engineering',
    location: 'Worldwide',
    locationCategory: 'Worldwide',
    minSalary: 140000,
    maxSalary: 180000,
    salaryCurrency: 'USD',
    payPeriod: 'year',
    education: 'No Degree Required',
    experienceLevel: 'Senior',
    summary: 'Build scalable distributed systems with TypeScript, Node.js, and React.',
    description: 'Detailed description here.',
    skills: ['TypeScript', 'Node.js', 'React', 'PostgreSQL'],
    applyUrl: 'https://careers.cloudscale.io/jobs/123',
    referralUrl: 'https://careers.cloudscale.io/jobs/123?ref=remotepulse',
    sourceSite: 'RemoteOK',
    postedDate: '2026-11-06T10:00:00.000Z',
  },
  {
    id: 'job-2',
    title: 'AI Research Scientist',
    company: 'Nexus Intelligence',
    industry: 'Data & AI',
    location: 'US / Americas Remote',
    locationCategory: 'Americas',
    minSalary: 190000,
    maxSalary: 240000,
    salaryCurrency: 'USD',
    payPeriod: 'year',
    education: "Master's",
    experienceLevel: 'Senior',
    summary: 'Develop agentic workflows and fine-tune multimodal LLMs.',
    description: 'Detailed description here.',
    skills: ['Python', 'PyTorch', 'Gemini', 'LLMs'],
    applyUrl: 'https://nexusai.com/careers/ai-sci?tracking=source',
    referralUrl: 'https://nexusai.com/careers/ai-sci?tracking=source&ref=cchung',
    sourceSite: 'Custom Scan',
    postedDate: '2026-11-05T14:30:00.000Z',
  },
  {
    id: 'job-3',
    title: 'Product Design Lead',
    company: 'Velox Studio',
    industry: 'Product & Design',
    location: 'Europe / UK Remote',
    locationCategory: 'Europe',
    minSalary: 95000,
    maxSalary: 120000,
    salaryCurrency: 'EUR',
    payPeriod: 'year',
    education: "Bachelor's",
    experienceLevel: 'Lead / Director',
    summary: 'Design high-converting SaaS workflows with refined typography and micro-interactions.',
    description: 'Detailed description here.',
    skills: ['Figma', 'Design Systems', 'User Research'],
    applyUrl: 'https://velox.design/jobs/lead',
    referralUrl: 'https://velox.design/jobs/lead?ref=remotepulse',
    sourceSite: 'WeWorkRemotely',
    postedDate: '2026-11-02T09:00:00.000Z',
  },
];

test('applyReferralCode appends referral code to clean URLs', () => {
  const result = applyReferralCode('https://example.com/jobs/42', 'ref=mycode&aff=true');
  assert.ok(result.includes('ref=mycode'));
  assert.ok(result.includes('aff=true'));
});

test('applyReferralCode preserves existing parameters and avoids duplicates', () => {
  const result = applyReferralCode('https://example.com/apply?source=linkedin', 'ref=partner123');
  assert.ok(result.includes('source=linkedin'));
  assert.ok(result.includes('ref=partner123'));
});

test('matchesEducation handles education levels properly', () => {
  assert.equal(matchesEducation('No Degree Required', 'No Degree Required'), true);
  assert.equal(matchesEducation("Bachelor's", 'No Degree Required'), false);
  assert.equal(matchesEducation('No Degree Required', "Bachelor's"), true);
  assert.equal(matchesEducation("Master's", "Bachelor's"), false);
  assert.equal(matchesEducation("Bachelor's", 'All'), true);
});

test('matchesLocation handles worldwide and regional filtering', () => {
  assert.equal(matchesLocation(mockJobs[0], 'Worldwide'), true);
  assert.equal(matchesLocation(mockJobs[1], 'Americas / US'), true);
  assert.equal(matchesLocation(mockJobs[2], 'Europe / EMEA'), true);
  assert.equal(matchesLocation(mockJobs[2], 'Americas / US'), false);
});

test('formatSalary formats ranges and currencies cleanly', () => {
  assert.equal(formatSalary(mockJobs[0]), '$140k – $180k/yr');
  assert.equal(formatSalary(mockJobs[2]), '€95k – €120k/yr');
  assert.equal(formatSalary({ minSalary: 65, maxSalary: 65, salaryCurrency: 'USD', payPeriod: 'hour' }), '$65/hr');
});

test('filterJobs filters by search keyword and salary threshold', () => {
  const filters: JobFilters = {
    search: 'distributed',
    location: 'All',
    minSalary: 100000,
    education: 'All',
    industry: 'All Fields',
    batch: 'all',
    sort: 'newest',
  };

  const results = filterJobs(mockJobs, filters);
  assert.equal(results.length, 1);
  assert.equal(results[0].id, 'job-1');
});

test('groupJobsByBatch groups jobs into daily batches', () => {
  const groups = groupJobsByBatch(mockJobs, '2026-11-06T15:00:00.000Z');
  assert.ok(groups.length >= 2);
  const todayGroup = groups.find((g) => g.id === 'today');
  assert.ok(todayGroup);
  assert.equal(todayGroup.jobs.length, 1);
  assert.equal(todayGroup.jobs[0].id, 'job-1');

  const yesterdayGroup = groups.find((g) => g.id === 'yesterday');
  assert.ok(yesterdayGroup);
  assert.equal(yesterdayGroup.jobs[0].id, 'job-2');
});

test('calculateAlertMatches accurately returns count for active rule', () => {
  const alert: AlertRule = {
    id: 'a1',
    name: 'Senior AI Jobs',
    search: 'AI',
    minSalary: 150000,
    createdAt: '2026-11-06',
    active: true,
    dailyEmailDigest: true,
    email: 'cchungx5452@gmail.com',
  };

  const count = calculateAlertMatches(mockJobs, alert);
  assert.equal(count, 1);
  assert.equal(alert.dailyEmailDigest, true);
});

