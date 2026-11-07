import { Job, JobFilters, AlertRule } from '../types';

/**
 * Appends referral or affiliate query parameter to an existing application URL.
 */
export function applyReferralCode(rawUrl: string, referralParam: string = 'ref=remotepulse'): string {
  if (!rawUrl) return '';
  const cleanParam = referralParam.trim().replace(/^[?&]+/, '');
  if (!cleanParam) return rawUrl;

  try {
    const urlObj = new URL(rawUrl);
    const pairs = cleanParam.split('&');
    for (const pair of pairs) {
      const [key, value] = pair.split('=');
      if (key) {
        urlObj.searchParams.set(key, value || '1');
      }
    }
    return urlObj.toString();
  } catch {
    // If not a full URL (e.g. relative or invalid), safely append
    const separator = rawUrl.includes('?') ? '&' : '?';
    return `${rawUrl}${separator}${cleanParam}`;
  }
}

/**
 * Normalizes education level comparison.
 * If user selects 'No Degree Required', matches 'No Degree Required' or 'Any'.
 * If user selects "Bachelor's", matches "Bachelor's", 'No Degree Required', or 'Any'.
 */
export function matchesEducation(jobEdu: string, filterEdu: string): boolean {
  if (!filterEdu || filterEdu === 'All' || filterEdu === 'Any') return true;
  if (!jobEdu || jobEdu === 'Any') return true;

  if (filterEdu === 'No Degree Required') {
    return jobEdu === 'No Degree Required';
  }

  if (filterEdu === "Bachelor's") {
    return jobEdu === "Bachelor's" || jobEdu === 'No Degree Required' || jobEdu === 'Any';
  }

  if (filterEdu === "Master's") {
    return jobEdu === "Master's" || jobEdu === "Bachelor's" || jobEdu === 'No Degree Required' || jobEdu === 'Any';
  }

  if (filterEdu === 'PhD') {
    return true; // PhD holders qualify for any level
  }

  if (filterEdu === 'Certification') {
    return jobEdu === 'Certification' || jobEdu === 'No Degree Required' || jobEdu === 'Any';
  }

  return jobEdu.toLowerCase().includes(filterEdu.toLowerCase());
}

/**
 * Checks location match against filter (e.g. Worldwide, US, Europe, Americas).
 */
export function matchesLocation(job: Job, filterLoc: string): boolean {
  if (!filterLoc || filterLoc === 'All' || filterLoc === 'any') return true;
  const target = filterLoc.toLowerCase();
  const jobLoc = job.location.toLowerCase();
  const jobCat = (job.locationCategory || '').toLowerCase();

  if (target === 'worldwide' || target === 'anywhere') {
    return jobLoc.includes('world') || jobLoc.includes('anywhere') || jobLoc.includes('global') || jobCat === 'worldwide';
  }

  if (target.includes('us') || target.includes('americas')) {
    return jobLoc.includes('us') || jobLoc.includes('united states') || jobLoc.includes('usa') || jobLoc.includes('americas') || jobCat === 'americas' || jobCat === 'worldwide';
  }

  if (target.includes('europe') || target.includes('emea')) {
    return jobLoc.includes('europe') || jobLoc.includes('emea') || jobLoc.includes('uk') || jobCat === 'europe' || jobCat === 'worldwide';
  }

  if (target.includes('asia') || target.includes('apac')) {
    return jobLoc.includes('asia') || jobLoc.includes('apac') || jobCat === 'asia-pacific' || jobCat === 'worldwide';
  }

  return jobLoc.includes(target) || jobCat.includes(target);
}

/**
 * Formats salary display into human scannable string.
 */
export function formatSalary(job: Pick<Job, 'minSalary' | 'maxSalary' | 'salaryCurrency' | 'payPeriod'>): string {
  const currency = job.salaryCurrency === 'EUR' ? '€' : job.salaryCurrency === 'GBP' ? '£' : '$';
  const period = job.payPeriod === 'hour' ? '/hr' : '/yr';

  if (!job.minSalary && !job.maxSalary) {
    return 'Competitive Compensation';
  }

  const formatNum = (num: number) => {
    if (job.payPeriod === 'hour') return num.toString();
    if (num >= 1000) return `${Math.round(num / 1000)}k`;
    return num.toString();
  };

  if (job.minSalary && job.maxSalary && job.minSalary !== job.maxSalary) {
    return `${currency}${formatNum(job.minSalary)} – ${currency}${formatNum(job.maxSalary)}${period}`;
  }

  const value = job.maxSalary || job.minSalary;
  return `${currency}${formatNum(value)}${period}`;
}

/**
 * Decoupled job filter logic.
 */
export function filterJobs(jobs: Job[], filters: JobFilters): Job[] {
  const query = filters.search.trim().toLowerCase();

  return jobs.filter((job) => {
    // 1. Search Query
    if (query) {
      const inTitle = job.title.toLowerCase().includes(query);
      const inCompany = job.company.toLowerCase().includes(query);
      const inSkills = job.skills.some((s) => s.toLowerCase().includes(query));
      const inSummary = job.summary.toLowerCase().includes(query);
      if (!inTitle && !inCompany && !inSkills && !inSummary) return false;
    }

    // 2. Industry Field
    if (filters.industry && filters.industry !== 'All Fields') {
      if (job.industry !== filters.industry) return false;
    }

    // 3. Location Filter
    if (filters.location && filters.location !== 'All') {
      if (!matchesLocation(job, filters.location)) return false;
    }

    // 4. Min Salary
    if (filters.minSalary > 0) {
      // If hourly, convert 2000 hours/yr approx for comparison
      const normalizedSalary = job.payPeriod === 'hour' ? (job.maxSalary || job.minSalary) * 2000 : (job.maxSalary || job.minSalary);
      if (normalizedSalary < filters.minSalary) return false;
    }

    // 5. Education Level
    if (filters.education && filters.education !== 'All') {
      if (!matchesEducation(job.education, filters.education)) return false;
    }

    return true;
  }).sort((a, b) => {
    if (filters.sort === 'salary_high') {
      const aSal = a.payPeriod === 'hour' ? (a.maxSalary || a.minSalary) * 2000 : (a.maxSalary || a.minSalary);
      const bSal = b.payPeriod === 'hour' ? (b.maxSalary || b.minSalary) * 2000 : (b.maxSalary || b.minSalary);
      return bSal - aSal;
    }
    if (filters.sort === 'company') {
      return a.company.localeCompare(b.company);
    }
    // Default: 'newest'
    return new Date(b.postedDate).getTime() - new Date(a.postedDate).getTime();
  });
}

/**
 * Mindful batch groupings: groups jobs into meaningful daily batches instead of endless doomscrolling.
 */
export interface BatchGroup {
  id: string;
  label: string;
  sublabel: string;
  dateKey: string;
  jobs: Job[];
}

export function groupJobsByBatch(jobs: Job[], referenceDateStr?: string): BatchGroup[] {
  // Use current local time or reference
  const now = referenceDateStr ? new Date(referenceDateStr) : new Date();
  const todayStr = now.toISOString().split('T')[0];

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  const weekAgo = new Date(now);
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekAgoStr = weekAgo.toISOString().split('T')[0];

  const todayBatch: Job[] = [];
  const yesterdayBatch: Job[] = [];
  const weekBatch: Job[] = [];
  const olderBatch: Job[] = [];

  for (const job of jobs) {
    const jobDate = job.postedDate.split('T')[0];
    if (jobDate >= todayStr) {
      todayBatch.push(job);
    } else if (jobDate === yesterdayStr) {
      yesterdayBatch.push(job);
    } else if (jobDate >= weekAgoStr) {
      weekBatch.push(job);
    } else {
      olderBatch.push(job);
    }
  }

  const groups: BatchGroup[] = [];

  if (todayBatch.length > 0) {
    groups.push({
      id: 'today',
      label: "Today's Fresh Batch",
      sublabel: `${todayBatch.length} new remote listings verified today`,
      dateKey: todayStr,
      jobs: todayBatch,
    });
  }

  if (yesterdayBatch.length > 0) {
    groups.push({
      id: 'yesterday',
      label: "Yesterday's Digest",
      sublabel: `${yesterdayBatch.length} remote positions verified`,
      dateKey: yesterdayStr,
      jobs: yesterdayBatch,
    });
  }

  if (weekBatch.length > 0) {
    groups.push({
      id: 'week',
      label: 'Earlier This Week',
      sublabel: `${weekBatch.length} positions still actively hiring`,
      dateKey: 'week',
      jobs: weekBatch,
    });
  }

  if (olderBatch.length > 0) {
    groups.push({
      id: 'older',
      label: 'Verified Archive',
      sublabel: `${olderBatch.length} verified listings from previous weeks`,
      dateKey: 'older',
      jobs: olderBatch,
    });
  }

  return groups;
}

/**
 * Counts how many jobs match a given AlertRule.
 */
export function calculateAlertMatches(jobs: Job[], alert: AlertRule): number {
  return jobs.filter((job) => {
    if (alert.search) {
      const q = alert.search.toLowerCase();
      const inTitle = job.title.toLowerCase().includes(q);
      const inCompany = job.company.toLowerCase().includes(q);
      const inSkills = job.skills.some((s) => s.toLowerCase().includes(q));
      if (!inTitle && !inCompany && !inSkills) return false;
    }

    if (alert.industry && alert.industry !== 'All Fields') {
      if (job.industry !== alert.industry) return false;
    }

    if (alert.location && alert.location !== 'All') {
      if (!matchesLocation(job, alert.location)) return false;
    }

    if (alert.minSalary && alert.minSalary > 0) {
      const normalizedSalary = job.payPeriod === 'hour' ? (job.maxSalary || job.minSalary) * 2000 : (job.maxSalary || job.minSalary);
      if (normalizedSalary < alert.minSalary) return false;
    }

    if (alert.education && alert.education !== 'All') {
      if (!matchesEducation(job.education, alert.education)) return false;
    }

    return true;
  }).length;
}
