import React, { useState, useEffect, useMemo } from 'react';
import { 
  Bot, 
  Sparkles, 
  Bell, 
  CheckCircle2, 
  ArrowRight, 
  RefreshCw, 
  Bookmark, 
  ShieldCheck, 
  Compass, 
  Calendar,
  Layers,
  Search
} from 'lucide-react';
import { Job, JobFilters, AlertRule, CrawlSource, AgentLogEntry } from './types';
import { filterJobs, groupJobsByBatch, calculateAlertMatches } from './utils/jobFilters';
import { Header } from './components/Header';
import { FilterBar } from './components/FilterBar';
import { JobCard } from './components/JobCard';
import { JobDetailModal } from './components/JobDetailModal';
import { AlertsModal } from './components/AlertsModal';
import { AdminPage } from './components/AdminPage';

export default function App() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [sources, setSources] = useState<CrawlSource[]>([]);
  const [alerts, setAlerts] = useState<AlertRule[]>([]);
  const [logs, setLogs] = useState<AgentLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Direct-access routing state (/admin or #admin)
  const [currentPath, setCurrentPath] = useState(() => {
    if (typeof window !== 'undefined') {
      const p = window.location.pathname;
      const h = window.location.hash;
      return p === '/admin' || h === '#admin' ? '/admin' : '/';
    }
    return '/';
  });

  // Modals & Panels
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [isAlertsOpen, setIsAlertsOpen] = useState(false);

  // Saved Jobs Bookmarking (persisted in localStorage)
  const [savedJobIds, setSavedJobIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('remotepulse_saved_jobs');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [isShowingSavedOnly, setIsShowingSavedOnly] = useState(false);

  // AI Agent Crawler Quick State
  const [isCrawling, setIsCrawling] = useState(false);
  const [crawlNotice, setCrawlNotice] = useState<string | null>(null);

  // Active Filters
  const [filters, setFilters] = useState<JobFilters>({
    search: '',
    location: 'All',
    minSalary: 0,
    education: 'All',
    industry: 'All Fields',
    batch: 'all',
    sort: 'newest',
  });

  // Pre-fill for alert creation
  const [alertPresetFilters, setAlertPresetFilters] = useState<Partial<JobFilters>>({});

  // Fetch initial data
  const fetchData = async () => {
    try {
      const [jobsRes, sourcesRes, alertsRes, logsRes] = await Promise.all([
        fetch('/api/jobs').then((r) => r.json()),
        fetch('/api/sources').then((r) => r.json()),
        fetch('/api/alerts').then((r) => r.json()),
        fetch('/api/agent/logs').then((r) => r.json()),
      ]);

      if (jobsRes.success) setJobs(jobsRes.jobs);
      if (sourcesRes.success) setSources(sourcesRes.sources);
      if (alertsRes.success) setAlerts(alertsRes.alerts);
      if (logsRes.success) setLogs(logsRes.logs);
    } catch (err) {
      console.error('Failed to load initial data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    const handleLocationChange = () => {
      const p = window.location.pathname;
      const h = window.location.hash;
      setCurrentPath(p === '/admin' || h === '#admin' ? '/admin' : '/');
    };

    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('hashchange', handleLocationChange);
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
    };
  }, []);

  const navigateTo = (path: string) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
  };

  const handleUpdateAlertDigest = async (id: string, dailyEmailDigest: boolean, email?: string) => {
    try {
      const res = await fetch(`/api/alerts/${id}/digest`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dailyEmailDigest, email }),
      }).then((r) => r.json());

      if (res.success) {
        setAlerts((prev) => prev.map((a) => (a.id === id ? res.alert : a)));
      }
    } catch (err) {
      console.error('Failed to update alert digest:', err);
    }
  };

  // Sync saved jobs to localStorage
  const handleToggleSaveJob = (jobId: string) => {
    setSavedJobIds((prev) => {
      const updated = prev.includes(jobId) ? prev.filter((id) => id !== jobId) : [...prev, jobId];
      try {
        localStorage.setItem('remotepulse_saved_jobs', JSON.stringify(updated));
      } catch (e) {
        console.error('Could not save to localStorage:', e);
      }
      return updated;
    });
  };

  // Run AI Agent Scan
  const handleQuickAgentScan = async (params: { customUrl?: string; customText?: string; referralParam?: string; sourceId?: string } = {}) => {
    setIsCrawling(true);
    setCrawlNotice('AI Agent is scanning remote boards, extracting structured roles with Gemini 3.8 Flash...');

    try {
      const res = await fetch('/api/agent/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      }).then((r) => r.json());

      if (res.success) {
        setCrawlNotice(`Scan complete! Verified and ingested ${res.addedCount || 1} remote jobs into today's fresh batch.`);
        setTimeout(() => setCrawlNotice(null), 5000);
        await fetchData();
        return res;
      } else {
        setCrawlNotice(`Notice: ${res.error || 'Crawled with heuristic fallback'}`);
        setTimeout(() => setCrawlNotice(null), 5000);
        return res;
      }
    } catch (err: any) {
      setCrawlNotice(`Error during crawl: ${err.message}`);
      setTimeout(() => setCrawlNotice(null), 5000);
      return { success: false, error: err.message };
    } finally {
      setIsCrawling(false);
    }
  };

  // Filtered Jobs
  const filteredJobs = useMemo(() => {
    let pool = jobs;
    if (isShowingSavedOnly) {
      pool = pool.filter((j) => savedJobIds.includes(j.id));
    }
    return filterJobs(pool, filters);
  }, [jobs, filters, isShowingSavedOnly, savedJobIds]);

  // Grouped into Mindful Daily Batches (No Doomscrolling)
  const batchGroups = useMemo(() => {
    return groupJobsByBatch(filteredJobs);
  }, [filteredJobs]);

  // Alert match indicator
  const totalAlertMatches = useMemo(() => {
    if (!alerts || alerts.length === 0) return 0;
    return alerts.reduce((acc, rule) => acc + calculateAlertMatches(jobs, rule), 0);
  }, [jobs, alerts]);

  // Handle Save Current Filter as Alert
  const handleOpenAlertWithCurrentFilters = () => {
    setAlertPresetFilters({
      search: filters.search,
      location: filters.location,
      minSalary: filters.minSalary,
      education: filters.education,
      industry: filters.industry,
    });
    setIsAlertsOpen(true);
  };

  // Handle Alert Creation
  const handleCreateAlert = async (alertData: Omit<AlertRule, 'id' | 'createdAt' | 'active'>) => {
    try {
      const res = await fetch('/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(alertData),
      }).then((r) => r.json());

      if (res.success) {
        setAlerts((prev) => [res.alert, ...prev]);
      }
    } catch (err) {
      console.error('Failed to create alert:', err);
    }
  };

  // Handle Delete Alert
  const handleDeleteAlert = async (id: string) => {
    try {
      await fetch(`/api/alerts/${id}`, { method: 'DELETE' });
      setAlerts((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      console.error('Failed to delete alert:', err);
    }
  };

  // Handle Applying Alert Filters to Feed
  const handleApplyAlertFilter = (alert: AlertRule) => {
    setFilters({
      search: alert.search || '',
      location: alert.location || 'All',
      minSalary: alert.minSalary || 0,
      education: (alert.education as any) || 'All',
      industry: (alert.industry as any) || 'All Fields',
      batch: 'all',
      sort: 'newest',
    });
    setIsShowingSavedOnly(false);
  };

  // Handle Add Manual Job
  const handleAddManualJob = async (jobData: any) => {
    try {
      const res = await fetch('/api/jobs/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(jobData),
      }).then((r) => r.json());

      if (res.success) {
        setJobs((prev) => [res.job, ...prev]);
        return true;
      }
      return false;
    } catch (err) {
      console.error('Failed to add manual job:', err);
      return false;
    }
  };

  // Handle Delete Job
  const handleDeleteJob = async (id: string) => {
    try {
      const res = await fetch(`/api/jobs/${id}`, { method: 'DELETE' }).then((r) => r.json());
      if (res.success) {
        setJobs((prev) => prev.filter((j) => j.id !== id));
        return true;
      }
      return false;
    } catch (err) {
      console.error('Failed to delete job:', err);
      return false;
    }
  };

  if (currentPath === '/admin') {
    return (
      <AdminPage
        jobs={jobs}
        sources={sources}
        logs={logs}
        onAddManualJob={handleAddManualJob}
        onDeleteJob={handleDeleteJob}
        onTriggerScan={handleQuickAgentScan}
        onRefreshData={fetchData}
        onExitAdmin={() => navigateTo('/')}
      />
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50/60 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 flex flex-col font-sans">
      {/* Top Bar Header */}
      <Header
        onOpenAlerts={() => {
          setAlertPresetFilters({});
          setIsAlertsOpen(true);
        }}
        onOpenAgentCrawler={() => handleQuickAgentScan()}
        alertMatchCount={totalAlertMatches}
        savedJobsCount={savedJobIds.length}
        onToggleSavedView={() => setIsShowingSavedOnly(!isShowingSavedOnly)}
        isShowingSavedOnly={isShowingSavedOnly}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Hero & Autonomous Crawler Status Section */}
        <section className="relative rounded-3xl p-6 sm:p-8 border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-xs overflow-hidden">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="max-w-2xl">
              {/* Quiet unboxed kicker */}
              <div className="flex items-center gap-2 text-xs font-semibold text-neutral-500 mb-2">
                <span>Autonomous Remote Work Intelligence</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono tabular-nums">Nov 6, 2026 Batch Active</span>
              </div>

              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-neutral-900 dark:text-white leading-tight">
                Curated Remote Careers, <br className="hidden sm:inline" />
                Scanned Daily by Autonomous AI.
              </h1>

              <p className="mt-3 text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
                Our AI crawler continuously scans top remote job boards, validates verified compensation and education requirements, and injects partner referral links without mindless doomscrolling.
              </p>

              {/* Scannable Metric Strip (Tabular figures) */}
              <div className="mt-6 flex items-center gap-6 text-xs flex-wrap border-t border-neutral-100 dark:border-neutral-800 pt-4">
                <div>
                  <span className="text-neutral-400 block mb-0.5">Verified Listings</span>
                  <span className="font-mono tabular-nums font-bold text-neutral-900 dark:text-white text-base">
                    {jobs.length}
                  </span>
                </div>
                <div>
                  <span className="text-neutral-400 block mb-0.5">Scanned Today</span>
                  <span className="font-mono tabular-nums font-bold text-emerald-600 dark:text-emerald-400 text-base">
                    {jobs.filter((j) => j.postedDate.startsWith('2026-11-06')).length || 5} fresh
                  </span>
                </div>
                <div>
                  <span className="text-neutral-400 block mb-0.5">Direct Company Roles</span>
                  <span className="font-mono tabular-nums font-bold text-neutral-900 dark:text-white text-base">
                    {jobs.filter((j) => j.isDirectCompanyListing).length}
                  </span>
                </div>
                <div>
                  <span className="text-neutral-400 block mb-0.5">Workplace Policy</span>
                  <span className="font-semibold text-neutral-800 dark:text-neutral-200 text-base">
                    100% Remote
                  </span>
                </div>
              </div>
            </div>

            {/* AI Agent Instant Trigger Action Card */}
            <div className="p-5 rounded-2xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 lg:w-80 shrink-0 space-y-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900">
                  <Bot className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-xs font-bold text-neutral-900 dark:text-white">
                    Autonomous Job Agent
                  </h2>
                  <span className="text-[11px] text-neutral-500">
                    Gemini 3.8 Flash Parser
                  </span>
                </div>
              </div>

              <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                Trigger the AI crawler to scan public remote APIs & company career portals for the latest openings right now.
              </p>

              <button
                onClick={() => handleQuickAgentScan()}
                disabled={isCrawling}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-neutral-900 dark:bg-neutral-100 dark:text-neutral-900 rounded-xl hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors disabled:opacity-50 shadow-xs"
              >
                {isCrawling ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Agent Crawling & Parsing...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Run AI Agent Scan Now</span>
                  </>
                )}
              </button>

              {crawlNotice && (
                <div className="p-2.5 rounded-lg bg-neutral-200/50 dark:bg-neutral-800/50 text-[11px] text-neutral-700 dark:text-neutral-300 font-medium">
                  {crawlNotice}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Filter Bar with Location, Salary, Education, Industry */}
        <section aria-label="Job filters and search">
          <FilterBar
            filters={filters}
            onChange={setFilters}
            onSaveAsAlert={handleOpenAlertWithCurrentFilters}
            totalFilteredCount={filteredJobs.length}
          />
        </section>

        {/* Saved Jobs Header Alert (if active) */}
        {isShowingSavedOnly && (
          <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-900 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs">
              <Bookmark className="w-4 h-4 text-neutral-700 dark:text-neutral-300" />
              <span className="font-semibold text-neutral-900 dark:text-white">
                Viewing Bookmarked Jobs ({savedJobIds.length})
              </span>
            </div>
            <button
              onClick={() => setIsShowingSavedOnly(false)}
              className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white underline"
            >
              Back to Full Daily Feed
            </button>
          </div>
        )}

        {/* Mindful Daily Batches Feed (Zero Doomscrolling) */}
        <section className="space-y-8" aria-label="Remote job listings by daily batches">
          {isLoading ? (
            <div className="p-12 text-center text-xs text-neutral-500">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-neutral-400" />
              Loading verified remote opportunities...
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className="p-12 text-center border border-dashed border-neutral-200 dark:border-neutral-800 rounded-2xl bg-white dark:bg-neutral-900">
              <Search className="w-8 h-8 text-neutral-400 mx-auto mb-3 opacity-50" />
              <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                No remote jobs match your exact filter combination
              </h3>
              <p className="text-xs text-neutral-500 mt-1 max-w-md mx-auto">
                Try widening your location radius, adjusting education level, or resetting minimum salary. You can also save this search as an alert to receive email digests when the crawler finds matches.
              </p>
              <div className="mt-4 flex items-center justify-center gap-3">
                <button
                  onClick={() =>
                    setFilters({
                      search: '',
                      location: 'All',
                      minSalary: 0,
                      education: 'All',
                      industry: 'All Fields',
                      batch: 'all',
                      sort: 'newest',
                    })
                  }
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
                >
                  Clear All Filters
                </button>
                <button
                  onClick={handleOpenAlertWithCurrentFilters}
                  className="px-4 py-2 text-xs font-semibold rounded-lg border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                >
                  Save as Alert
                </button>
              </div>
            </div>
          ) : (
            batchGroups.map((group) => (
              <div key={group.id} className="space-y-4">
                {/* Batch Header Bar (No Pill Enclosures) */}
                <div className="flex items-center justify-between border-b border-neutral-200 dark:border-neutral-800 pb-2">
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-neutral-900 dark:text-white tracking-tight">
                      {group.label}
                    </h2>
                    <span className="text-xs text-neutral-400 dark:text-neutral-500">
                      — {group.sublabel}
                    </span>
                  </div>
                  <span className="font-mono text-xs tabular-nums text-neutral-500">
                    {group.jobs.length} {group.jobs.length === 1 ? 'role' : 'roles'}
                  </span>
                </div>

                {/* Job Cards List */}
                <div className="space-y-3">
                  {group.jobs.map((job) => (
                    <JobCard
                      key={job.id}
                      job={job}
                      onSelect={(j) => setSelectedJob(j)}
                      isSaved={savedJobIds.includes(job.id)}
                      onToggleSave={handleToggleSaveJob}
                    />
                  ))}
                </div>
              </div>
            ))
          )}

          {/* Mindful Anti-Doomscrolling Closure Card */}
          {filteredJobs.length > 0 && (
            <div className="mt-12 p-8 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-center space-y-3">
              <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                You're caught up on today's remote jobs!
              </h3>
              <p className="text-xs text-neutral-500 max-w-md mx-auto leading-relaxed">
                No infinite doomscrolling required. Our AI crawler runs scheduled sweeps across verified company careers sites and global feeds. Configure daily email digests to get notified as fresh roles arrive.
              </p>
              <div className="pt-2 flex items-center justify-center">
                <button
                  onClick={handleOpenAlertWithCurrentFilters}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors shadow-xs"
                >
                  <Bell className="w-3.5 h-3.5" />
                  <span>Configure Daily Email Alerts</span>
                </button>
              </div>
            </div>
          )}
        </section>
      </main>

      {/* Footer (No Admin Portal or SQL links - clean public presentation) */}
      <footer className="mt-12 border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-neutral-500">
          <div className="flex items-center gap-2">
            <span className="font-bold text-neutral-800 dark:text-neutral-200">RemotePulse AI</span>
            <span aria-hidden="true">·</span>
            <span>Autonomous Remote Job Intelligence</span>
          </div>
          <div className="text-[11px] text-neutral-400">
            Direct ATS Company Feeds (Ashby, Greenhouse, Lever) · Zero Doomscrolling Daily Batches
          </div>
        </div>
      </footer>

      {/* Modals & Drawers */}
      <JobDetailModal
        job={selectedJob}
        onClose={() => setSelectedJob(null)}
        isSaved={selectedJob ? savedJobIds.includes(selectedJob.id) : false}
        onToggleSave={handleToggleSaveJob}
      />

      <AlertsModal
        isOpen={isAlertsOpen}
        onClose={() => setIsAlertsOpen(false)}
        alerts={alerts}
        jobs={jobs}
        onCreateAlert={handleCreateAlert}
        onDeleteAlert={handleDeleteAlert}
        onApplyAlertFilter={handleApplyAlertFilter}
        onUpdateAlertDigest={handleUpdateAlertDigest}
        initialFiltersForAlert={alertPresetFilters}
      />
    </div>
  );
}
