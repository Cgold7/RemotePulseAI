import { Job } from '../types';

export type SqlDialect = 'postgres' | 'sqlite' | 'mysql';

/**
 * Generates SQL DDL and DML statements to deploy this database on any free SQL host
 * (such as Neon, Supabase, Turso, Render, Railway, PlanetScale).
 */
export function generateSqlDump(jobs: Job[], dialect: SqlDialect = 'postgres'): string {
  const timestamp = new Date().toISOString();
  let ddl = '';
  
  if (dialect === 'postgres') {
    ddl = `-- RemotePulse AI Database Schema (PostgreSQL)
-- Compatible with Neon.tech, Supabase.com, Render.com, Railway.app (Free Tiers)
-- Generated: ${timestamp}

CREATE TABLE IF NOT EXISTS jobs (
    id VARCHAR(64) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    company VARCHAR(255) NOT NULL,
    company_logo TEXT,
    industry VARCHAR(64) NOT NULL,
    location VARCHAR(255) NOT NULL,
    location_category VARCHAR(64) NOT NULL,
    min_salary INTEGER DEFAULT 0,
    max_salary INTEGER DEFAULT 0,
    salary_currency VARCHAR(8) DEFAULT 'USD',
    pay_period VARCHAR(16) DEFAULT 'year',
    education VARCHAR(64) NOT NULL,
    experience_level VARCHAR(64) NOT NULL,
    summary TEXT,
    description TEXT,
    skills TEXT, -- Comma-separated or JSON array
    apply_url TEXT NOT NULL,
    referral_url TEXT NOT NULL,
    referral_code VARCHAR(128),
    source_site VARCHAR(128),
    posted_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_featured BOOLEAN DEFAULT FALSE,
    is_manual BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_jobs_industry ON jobs (industry);
CREATE INDEX IF NOT EXISTS idx_jobs_location ON jobs (location_category);
CREATE INDEX IF NOT EXISTS idx_jobs_salary ON jobs (min_salary, max_salary);
CREATE INDEX IF NOT EXISTS idx_jobs_education ON jobs (education);
CREATE INDEX IF NOT EXISTS idx_jobs_posted ON jobs (posted_date DESC);
`;
  } else if (dialect === 'sqlite') {
    ddl = `-- RemotePulse AI Database Schema (SQLite)
-- Compatible with Turso (libSQL), Cloudflare D1, or local file storage
-- Generated: ${timestamp}

CREATE TABLE IF NOT EXISTS jobs (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    company TEXT NOT NULL,
    company_logo TEXT,
    industry TEXT NOT NULL,
    location TEXT NOT NULL,
    location_category TEXT NOT NULL,
    min_salary INTEGER DEFAULT 0,
    max_salary INTEGER DEFAULT 0,
    salary_currency TEXT DEFAULT 'USD',
    pay_period TEXT DEFAULT 'year',
    education TEXT NOT NULL,
    experience_level TEXT NOT NULL,
    summary TEXT,
    description TEXT,
    skills TEXT,
    apply_url TEXT NOT NULL,
    referral_url TEXT NOT NULL,
    referral_code TEXT,
    source_site TEXT,
    posted_date TEXT DEFAULT (datetime('now')),
    is_featured INTEGER DEFAULT 0,
    is_manual INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_jobs_industry ON jobs (industry);
CREATE INDEX IF NOT EXISTS idx_jobs_posted ON jobs (posted_date DESC);
`;
  } else {
    ddl = `-- RemotePulse AI Database Schema (MySQL)
-- Compatible with PlanetScale, Aiven, or standard MySQL
-- Generated: ${timestamp}

CREATE TABLE IF NOT EXISTS jobs (
    id VARCHAR(64) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    company VARCHAR(255) NOT NULL,
    company_logo TEXT,
    industry VARCHAR(64) NOT NULL,
    location VARCHAR(255) NOT NULL,
    location_category VARCHAR(64) NOT NULL,
    min_salary INT DEFAULT 0,
    max_salary INT DEFAULT 0,
    salary_currency VARCHAR(8) DEFAULT 'USD',
    pay_period VARCHAR(16) DEFAULT 'year',
    education VARCHAR(64) NOT NULL,
    experience_level VARCHAR(64) NOT NULL,
    summary TEXT,
    description TEXT,
    skills TEXT,
    apply_url TEXT NOT NULL,
    referral_url TEXT NOT NULL,
    referral_code VARCHAR(128),
    source_site VARCHAR(128),
    posted_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_featured TINYINT(1) DEFAULT 0,
    is_manual TINYINT(1) DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
`;
  }

  // DML: Seed rows
  const escapeSql = (str: string = '') => str.replace(/'/g, "''");
  const inserts = jobs.map((job) => {
    const skillsStr = escapeSql(job.skills.join(', '));
    const isFeatured = job.isFeatured ? 1 : 0;
    const isManual = job.isManual ? 1 : 0;
    return `INSERT INTO jobs (id, title, company, industry, location, location_category, min_salary, max_salary, salary_currency, pay_period, education, experience_level, summary, description, skills, apply_url, referral_url, referral_code, source_site, posted_date, is_featured, is_manual)
VALUES ('${escapeSql(job.id)}', '${escapeSql(job.title)}', '${escapeSql(job.company)}', '${escapeSql(job.industry)}', '${escapeSql(job.location)}', '${escapeSql(job.locationCategory)}', ${job.minSalary || 0}, ${job.maxSalary || 0}, '${escapeSql(job.salaryCurrency || 'USD')}', '${escapeSql(job.payPeriod || 'year')}', '${escapeSql(job.education)}', '${escapeSql(job.experienceLevel)}', '${escapeSql(job.summary)}', '${escapeSql(job.description)}', '${skillsStr}', '${escapeSql(job.applyUrl)}', '${escapeSql(job.referralUrl)}', '${escapeSql(job.referralCode || '')}', '${escapeSql(job.sourceSite)}', '${escapeSql(job.postedDate)}', ${isFeatured}, ${isManual});`;
  }).join('\n');

  return `${ddl}\n-- Initial Seed Listings (${jobs.length} Remote Jobs)\n${inserts}\n`;
}
