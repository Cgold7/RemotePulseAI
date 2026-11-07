export type EducationLevel = 
  | 'Any'
  | 'No Degree Required'
  | "Bachelor's"
  | "Master's"
  | 'PhD'
  | 'Certification';

export type IndustryField = 
  | 'All Fields'
  | 'Software Engineering'
  | 'Product & Design'
  | 'Data & AI'
  | 'Sales & Growth'
  | 'Marketing'
  | 'Operations & Finance'
  | 'Customer Support'
  | 'Healthcare & Science';

export type LocationCategory = 
  | 'Worldwide'
  | 'Americas'
  | 'Europe'
  | 'Asia-Pacific'
  | 'Other';

export interface Job {
  id: string;
  title: string;
  company: string;
  companyLogo?: string;
  industry: IndustryField;
  location: string;
  locationCategory: LocationCategory;
  minSalary: number;
  maxSalary: number;
  salaryCurrency: string;
  payPeriod: 'year' | 'hour';
  education: EducationLevel;
  experienceLevel: 'Entry Level' | 'Mid Level' | 'Senior' | 'Lead / Director' | 'Any';
  summary: string;
  description: string;
  skills: string[];
  applyUrl: string;
  referralUrl: string;
  referralCode?: string;
  sourceSite: string;
  postedDate: string; // ISO date format YYYY-MM-DD
  isFeatured?: boolean;
  isManual?: boolean;
  isDirectCompanyListing?: boolean;
  companyDomain?: string;
  atsPlatform?: 'Ashby' | 'Greenhouse' | 'Lever' | 'Direct' | 'Other';
}

export interface JobFilters {
  search: string;
  location: string;
  minSalary: number;
  education: EducationLevel | 'All';
  industry: IndustryField;
  batch: 'all' | 'today' | 'yesterday' | 'week';
  sort: 'newest' | 'salary_high' | 'company';
}

export interface AlertRule {
  id: string;
  name: string;
  search?: string;
  location?: string;
  minSalary?: number;
  education?: string;
  industry?: string;
  createdAt: string;
  active: boolean;
  dailyEmailDigest: boolean;
  email?: string;
  digestDeliveryTime?: string;
}

export interface CrawlSource {
  id: string;
  name: string;
  url: string;
  type: 'api' | 'html_scan' | 'rss';
  active: boolean;
  lastScanned?: string;
  jobsCount: number;
  referralParam: string;
}

export interface AgentLogEntry {
  id: string;
  timestamp: string;
  step: string;
  message: string;
  status: 'info' | 'success' | 'warning' | 'error';
}
