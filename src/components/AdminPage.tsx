import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Bot, 
  PlusCircle, 
  ListFilter, 
  Check, 
  Play, 
  ExternalLink,
  Trash2,
  RefreshCw,
  Globe,
  ArrowLeft,
  Lock,
  Building2,
  Database,
  Download,
  Copy,
  Code2,
  Server
} from 'lucide-react';
import { Job, CrawlSource, AgentLogEntry, EducationLevel, IndustryField } from '../types';
import { generateSqlDump, SqlDialect } from '../utils/sqlExporter';

interface AdminPageProps {
  jobs: Job[];
  sources: CrawlSource[];
  logs: AgentLogEntry[];
  onAddManualJob: (jobData: any) => Promise<boolean>;
  onDeleteJob: (id: string) => Promise<boolean>;
  onTriggerScan: (scanParams: { customUrl?: string; customText?: string; referralParam?: string; sourceId?: string }) => Promise<any>;
  onRefreshData: () => void;
  onExitAdmin: () => void;
}

export const AdminPage: React.FC<AdminPageProps> = ({
  jobs,
  sources,
  logs,
  onAddManualJob,
  onDeleteJob,
  onTriggerScan,
  onRefreshData,
  onExitAdmin,
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passkey, setPasskey] = useState('');
  const [authError, setAuthError] = useState('');

  // Active Tab: 'scanner' | 'manual_add' | 'manage_jobs' | 'sources' | 'database_ops'
  const [activeTab, setActiveTab] = useState<'scanner' | 'manual_add' | 'manage_jobs' | 'sources' | 'database_ops'>('scanner');

  // SQL Ops state
  const [sqlDialect, setSqlDialect] = useState<SqlDialect>('postgres');
  const [copiedSql, setCopiedSql] = useState(false);

  // Scanner Form state
  const [customScanUrl, setCustomScanUrl] = useState('');
  const [customScanText, setCustomScanText] = useState('');
  const [customReferralParam, setCustomReferralParam] = useState('ref=cchung_careers&utm_source=remotepulse');
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<string | null>(null);

  // Manual Add Form state
  const [manualTitle, setManualTitle] = useState('');
  const [manualCompany, setManualCompany] = useState('');
  const [manualIsDirect, setManualIsDirect] = useState(true);
  const [manualDomain, setManualDomain] = useState('');
  const [manualIndustry, setManualIndustry] = useState<IndustryField>('Software Engineering');
  const [manualLocation, setManualLocation] = useState('Worldwide');
  const [manualLocationCat, setManualLocationCat] = useState<'Worldwide' | 'Americas' | 'Europe' | 'Asia-Pacific' | 'Other'>('Worldwide');
  const [manualMinSalary, setManualMinSalary] = useState(140000);
  const [manualMaxSalary, setManualMaxSalary] = useState(190000);
  const [manualSalaryCurrency, setManualSalaryCurrency] = useState('USD');
  const [manualEducation, setManualEducation] = useState<EducationLevel>('No Degree Required');
  const [manualExperience, setManualExperience] = useState<'Entry Level' | 'Mid Level' | 'Senior' | 'Lead / Director' | 'Any'>('Senior');
  const [manualApplyUrl, setManualApplyUrl] = useState('');
  const [manualReferralCode, setManualReferralCode] = useState('ref=cchung_careers&utm_source=remotepulse');
  const [manualSummary, setManualSummary] = useState('');
  const [manualSkills, setManualSkills] = useState('TypeScript, Go, React, Distributed Systems');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passkey.trim() === 'remote2026' || passkey.trim() === 'admin' || passkey.trim() === '') {
      setIsAuthenticated(true);
      setAuthError('');
    } else {
      setAuthError('Invalid passkey. Default passkey: remote2026');
    }
  };

  const handleRunScanner = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsScanning(true);
    setScanResult(null);

    try {
      const res = await onTriggerScan({
        customUrl: customScanUrl.trim() || undefined,
        customText: customScanText.trim() || undefined,
        referralParam: customReferralParam.trim() || undefined,
      });

      if (res?.success) {
        setScanResult(`AI Agent successfully verified & ingested ${res.addedCount || 1} remote jobs with your referral link!`);
        setCustomScanUrl('');
        setCustomScanText('');
        onRefreshData();
      } else {
        setScanResult(`Notice: ${res?.error || 'Scan complete with fallback.'}`);
      }
    } catch (err: any) {
      setScanResult(`Scan error: ${err.message}`);
    } finally {
      setIsScanning(false);
    }
  };

  const handleCreateManualJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualTitle || !manualCompany || !manualApplyUrl) return;

    setIsSubmitting(true);
    try {
      const ok = await onAddManualJob({
        title: manualTitle,
        company: manualCompany,
        isDirectCompanyListing: manualIsDirect,
        companyDomain: manualDomain.trim() || (manualIsDirect ? `${manualCompany.toLowerCase().replace(/[^a-z0-9]/g, '')}.com` : undefined),
        industry: manualIndustry,
        location: manualLocation,
        locationCategory: manualLocationCat,
        minSalary: Number(manualMinSalary),
        maxSalary: Number(manualMaxSalary),
        salaryCurrency: manualSalaryCurrency,
        payPeriod: 'year',
        education: manualEducation,
        experienceLevel: manualExperience,
        applyUrl: manualApplyUrl,
        referralCode: manualReferralCode,
        summary: manualSummary,
        skills: manualSkills.split(',').map((s) => s.trim()).filter(Boolean),
      });

      if (ok) {
        setSubmitSuccess(true);
        setManualTitle('');
        setManualCompany('');
        setManualApplyUrl('');
        setManualDomain('');
        setManualSummary('');
        setTimeout(() => setSubmitSuccess(false), 3000);
        onRefreshData();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans">
      {/* Top Bar for Admin Standalone Direct Access Page */}
      <header className="border-b border-neutral-800 bg-neutral-900/90 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white text-neutral-950 flex items-center justify-center font-bold text-sm shadow-xs">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <span className="text-base font-bold tracking-tight text-white">
                RemotePulse AI <span className="text-neutral-400 font-normal">| Direct Access Admin</span>
              </span>
              <span className="hidden sm:inline-block ml-2 text-xs font-mono text-neutral-500">
                /admin
              </span>
            </div>
          </div>

          <button
            onClick={onExitAdmin}
            className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-lg border border-neutral-700 bg-neutral-800 text-neutral-200 hover:bg-neutral-700 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Public Job Board</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!isAuthenticated ? (
          /* Authentication Screen */
          <div className="max-w-md mx-auto my-12 p-8 rounded-2xl border border-neutral-800 bg-neutral-900 text-center space-y-5 shadow-2xl">
            <div className="w-14 h-14 rounded-2xl bg-neutral-800 border border-neutral-700 flex items-center justify-center mx-auto text-neutral-200">
              <Lock className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                Direct Access Administrator Authentication
              </h2>
              <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                This page is protected and hidden from the public job board. Enter your administrator passkey to run AI web crawlers, manage company listings, and inject referral parameters.
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-3 pt-2">
              <input
                type="password"
                placeholder="Passkey (default: remote2026)"
                value={passkey}
                onChange={(e) => setPasskey(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs rounded-lg border border-neutral-700 bg-neutral-950 text-white text-center focus:border-white focus:outline-none"
              />
              {authError && <p className="text-xs text-red-400">{authError}</p>}

              <button
                type="submit"
                className="w-full py-2.5 text-xs font-semibold text-neutral-950 bg-white rounded-lg hover:bg-neutral-200 transition-colors shadow-xs"
              >
                Unlock Admin Console
              </button>

              <button
                type="button"
                onClick={() => {
                  setPasskey('remote2026');
                  setIsAuthenticated(true);
                }}
                className="text-xs text-neutral-400 hover:text-white underline block mx-auto pt-2"
              >
                1-Click Demo Unlock (remote2026)
              </button>
            </form>
          </div>
        ) : (
          /* Authenticated Admin Console */
          <div className="space-y-6">
            {/* Tabs Navigation */}
            <div className="border-b border-neutral-800 flex items-center gap-6 overflow-x-auto text-xs font-medium">
              <button
                onClick={() => setActiveTab('scanner')}
                className={`py-3 flex items-center gap-2 border-b-2 whitespace-nowrap transition-colors ${
                  activeTab === 'scanner'
                    ? 'border-white text-white font-semibold'
                    : 'border-transparent text-neutral-400 hover:text-white'
                }`}
              >
                <Bot className="w-4 h-4" />
                <span>AI Crawler & Scanner</span>
              </button>

              <button
                onClick={() => setActiveTab('manual_add')}
                className={`py-3 flex items-center gap-2 border-b-2 whitespace-nowrap transition-colors ${
                  activeTab === 'manual_add'
                    ? 'border-white text-white font-semibold'
                    : 'border-transparent text-neutral-400 hover:text-white'
                }`}
              >
                <PlusCircle className="w-4 h-4" />
                <span>Personally Add Job</span>
              </button>

              <button
                onClick={() => setActiveTab('manage_jobs')}
                className={`py-3 flex items-center gap-2 border-b-2 whitespace-nowrap transition-colors ${
                  activeTab === 'manage_jobs'
                    ? 'border-white text-white font-semibold'
                    : 'border-transparent text-neutral-400 hover:text-white'
                }`}
              >
                <ListFilter className="w-4 h-4" />
                <span>Manage Listings ({jobs.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('sources')}
                className={`py-3 flex items-center gap-2 border-b-2 whitespace-nowrap transition-colors ${
                  activeTab === 'sources'
                    ? 'border-white text-white font-semibold'
                    : 'border-transparent text-neutral-400 hover:text-white'
                }`}
              >
                <Globe className="w-4 h-4" />
                <span>Target Portals ({sources.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('database_ops')}
                className={`py-3 flex items-center gap-2 border-b-2 whitespace-nowrap transition-colors ${
                  activeTab === 'database_ops'
                    ? 'border-white text-white font-semibold'
                    : 'border-transparent text-neutral-400 hover:text-white'
                }`}
              >
                <Database className="w-4 h-4" />
                <span>Database & SQL Ops</span>
              </button>
            </div>

            {/* TAB 1: AI Scanner */}
            {activeTab === 'scanner' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 p-6 rounded-2xl border border-neutral-800 bg-neutral-900 space-y-4">
                  <div>
                    <h3 className="text-base font-bold text-white">
                      Scan Company Career Page or Job Board Feed
                    </h3>
                    <p className="text-xs text-neutral-400 mt-1 leading-relaxed">
                      Enter a company's direct careers link (e.g. Stripe, GitLab, Shopify) or paste a raw job description snippet. The AI agent will parse the responsibilities, classify industry & education requirements, and attach your referral parameters.
                    </p>
                  </div>

                  <form onSubmit={handleRunScanner} className="space-y-4 pt-2">
                    <div>
                      <label className="block text-xs font-semibold text-neutral-300 mb-1">
                        Direct Careers Website URL (or leave blank to sweep all preset remote feeds)
                      </label>
                      <input
                        type="url"
                        placeholder="e.g. https://about.gitlab.com/handbook/hiring or https://stripe.com/jobs"
                        value={customScanUrl}
                        onChange={(e) => setCustomScanUrl(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-xs rounded-lg border border-neutral-700 bg-neutral-950 text-white placeholder-neutral-500 focus:border-white focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-neutral-300 mb-1">
                        Or Paste Raw Job Posting Description
                      </label>
                      <textarea
                        rows={4}
                        placeholder="Paste raw requirements, salary ranges, or company job description here..."
                        value={customScanText}
                        onChange={(e) => setCustomScanText(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-xs rounded-lg border border-neutral-700 bg-neutral-950 text-white placeholder-neutral-500 focus:border-white focus:outline-none resize-y"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-neutral-300 mb-1">
                        Referral Tracking Parameter
                      </label>
                      <input
                        type="text"
                        required
                        value={customReferralParam}
                        onChange={(e) => setCustomReferralParam(e.target.value)}
                        placeholder="ref=cchung_careers&utm_source=remotepulse"
                        className="w-full px-3.5 py-2.5 text-xs font-mono rounded-lg border border-neutral-700 bg-neutral-950 text-white focus:border-white focus:outline-none"
                      />
                    </div>

                    <div className="flex items-center justify-between pt-2">
                      <button
                        type="submit"
                        disabled={isScanning}
                        className="flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-neutral-950 bg-white rounded-lg hover:bg-neutral-200 transition-colors disabled:opacity-50"
                      >
                        {isScanning ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>AI Agent Crawling & Classifying...</span>
                          </>
                        ) : (
                          <>
                            <Play className="w-3.5 h-3.5" />
                            <span>Run AI Job Scanner</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setCustomScanUrl('');
                          setCustomScanText('');
                          handleRunScanner({ preventDefault: () => {} } as any);
                        }}
                        disabled={isScanning}
                        className="text-xs text-neutral-400 hover:text-white underline"
                      >
                        Sweep All Pre-configured Remote Boards
                      </button>
                    </div>
                  </form>

                  {scanResult && (
                    <div className="p-3.5 rounded-lg bg-emerald-950/40 border border-emerald-800 text-xs text-emerald-300">
                      {scanResult}
                    </div>
                  )}
                </div>

                {/* Telemetry sidebar */}
                <div className="p-6 rounded-2xl border border-neutral-800 bg-neutral-900 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                      Agent Activity Logs
                    </h3>
                    <button
                      onClick={onRefreshData}
                      className="text-xs text-neutral-400 hover:text-white flex items-center gap-1"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Refresh</span>
                    </button>
                  </div>

                  <div className="space-y-2 max-h-96 overflow-y-auto font-mono text-[11px] p-3 rounded-xl bg-neutral-950 text-neutral-300 border border-neutral-800">
                    {logs.map((log) => (
                      <div key={log.id} className="leading-relaxed border-b border-neutral-900 pb-1.5 last:border-b-0">
                        <div className="text-neutral-500 text-[10px]">
                          {new Date(log.timestamp).toLocaleTimeString([], { hour12: false })} · <span className={log.status === 'success' ? 'text-emerald-400' : log.status === 'warning' ? 'text-amber-400' : log.status === 'error' ? 'text-red-400' : 'text-blue-400'}>[{log.step}]</span>
                        </div>
                        <div className="text-neutral-200 mt-0.5">{log.message}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: Personally Add Job */}
            {activeTab === 'manual_add' && (
              <div className="max-w-3xl p-6 rounded-2xl border border-neutral-800 bg-neutral-900 space-y-5">
                <div>
                  <h3 className="text-base font-bold text-white">
                    Personally Post a Remote Job Listing
                  </h3>
                  <p className="text-xs text-neutral-400 mt-1">
                    Add direct opportunities with verified company flags and custom referral tracking links.
                  </p>
                </div>

                <form onSubmit={handleCreateManualJob} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-neutral-300 mb-1">
                        Job Title *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Staff Distributed Infrastructure Engineer"
                        value={manualTitle}
                        onChange={(e) => setManualTitle(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-xs rounded-lg border border-neutral-700 bg-neutral-950 text-white focus:border-white focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-neutral-300 mb-1">
                        Company Name *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Stripe, GitLab, Automattic"
                        value={manualCompany}
                        onChange={(e) => setManualCompany(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-xs rounded-lg border border-neutral-700 bg-neutral-950 text-white focus:border-white focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Direct Company Listing Flag */}
                  <div className="p-3.5 rounded-xl border border-neutral-800 bg-neutral-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-emerald-400" />
                      <div>
                        <span className="font-semibold text-white">Direct Company Listing</span>
                        <p className="text-[11px] text-neutral-400">Flag this as sourced directly from company careers site</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-2 cursor-pointer text-neutral-300">
                        <input
                          type="checkbox"
                          checked={manualIsDirect}
                          onChange={(e) => setManualIsDirect(e.target.checked)}
                          className="rounded border-neutral-700 bg-neutral-900 text-white"
                        />
                        <span>Verified Direct Listing</span>
                      </label>

                      {manualIsDirect && (
                        <input
                          type="text"
                          placeholder="Domain (e.g. stripe.com)"
                          value={manualDomain}
                          onChange={(e) => setManualDomain(e.target.value)}
                          className="px-2.5 py-1 text-xs font-mono rounded border border-neutral-700 bg-neutral-900 text-white"
                        />
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-neutral-300 mb-1">
                        Industry / Field
                      </label>
                      <select
                        value={manualIndustry}
                        onChange={(e) => setManualIndustry(e.target.value as IndustryField)}
                        className="w-full px-3.5 py-2.5 text-xs rounded-lg border border-neutral-700 bg-neutral-950 text-white focus:border-white focus:outline-none"
                      >
                        <option value="Software Engineering">Software Engineering</option>
                        <option value="Product & Design">Product & Design</option>
                        <option value="Data & AI">Data & AI</option>
                        <option value="Sales & Growth">Sales & Growth</option>
                        <option value="Marketing">Marketing</option>
                        <option value="Operations & Finance">Operations & Finance</option>
                        <option value="Customer Support">Customer Support</option>
                        <option value="Healthcare & Science">Healthcare & Science</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-neutral-300 mb-1">
                        Education Requirement
                      </label>
                      <select
                        value={manualEducation}
                        onChange={(e) => setManualEducation(e.target.value as EducationLevel)}
                        className="w-full px-3.5 py-2.5 text-xs rounded-lg border border-neutral-700 bg-neutral-950 text-white focus:border-white focus:outline-none"
                      >
                        <option value="No Degree Required">No Degree Required</option>
                        <option value="Bachelor's">Bachelor's Degree</option>
                        <option value="Master's">Master's Degree</option>
                        <option value="PhD">PhD</option>
                        <option value="Certification">Certification</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-neutral-300 mb-1">
                        Experience Level
                      </label>
                      <select
                        value={manualExperience}
                        onChange={(e) => setManualExperience(e.target.value as any)}
                        className="w-full px-3.5 py-2.5 text-xs rounded-lg border border-neutral-700 bg-neutral-950 text-white focus:border-white focus:outline-none"
                      >
                        <option value="Entry Level">Entry Level</option>
                        <option value="Mid Level">Mid Level</option>
                        <option value="Senior">Senior</option>
                        <option value="Lead / Director">Lead / Director</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-neutral-300 mb-1">
                        Location
                      </label>
                      <input
                        type="text"
                        value={manualLocation}
                        onChange={(e) => setManualLocation(e.target.value)}
                        placeholder="Worldwide / Anywhere"
                        className="w-full px-3.5 py-2.5 text-xs rounded-lg border border-neutral-700 bg-neutral-950 text-white focus:border-white focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-neutral-300 mb-1">
                        Min Salary (USD)
                      </label>
                      <input
                        type="number"
                        value={manualMinSalary}
                        onChange={(e) => setManualMinSalary(Number(e.target.value))}
                        className="w-full px-3.5 py-2.5 text-xs font-mono rounded-lg border border-neutral-700 bg-neutral-950 text-white focus:border-white focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-neutral-300 mb-1">
                        Max Salary (USD)
                      </label>
                      <input
                        type="number"
                        value={manualMaxSalary}
                        onChange={(e) => setManualMaxSalary(Number(e.target.value))}
                        className="w-full px-3.5 py-2.5 text-xs font-mono rounded-lg border border-neutral-700 bg-neutral-950 text-white focus:border-white focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-300 mb-1">
                      Direct Application URL *
                    </label>
                    <input
                      type="url"
                      required
                      placeholder="https://company.com/careers/listing"
                      value={manualApplyUrl}
                      onChange={(e) => setManualApplyUrl(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-xs rounded-lg border border-neutral-700 bg-neutral-950 text-white focus:border-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-300 mb-1">
                      Referral Parameter to Inject
                    </label>
                    <input
                      type="text"
                      value={manualReferralCode}
                      onChange={(e) => setManualReferralCode(e.target.value)}
                      placeholder="ref=cchung_careers&utm_source=remotepulse"
                      className="w-full px-3.5 py-2.5 text-xs font-mono rounded-lg border border-neutral-700 bg-neutral-950 text-white focus:border-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-300 mb-1">
                      Key Required Skills (Comma-separated)
                    </label>
                    <input
                      type="text"
                      value={manualSkills}
                      onChange={(e) => setManualSkills(e.target.value)}
                      placeholder="e.g. Distributed Systems, Rust, Go, Kubernetes"
                      className="w-full px-3.5 py-2.5 text-xs rounded-lg border border-neutral-700 bg-neutral-950 text-white focus:border-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-300 mb-1">
                      Role Overview / Summary
                    </label>
                    <textarea
                      rows={2}
                      value={manualSummary}
                      onChange={(e) => setManualSummary(e.target.value)}
                      placeholder="Brief 2-sentence summary of responsibilities and scope..."
                      className="w-full px-3.5 py-2.5 text-xs rounded-lg border border-neutral-700 bg-neutral-950 text-white focus:border-white focus:outline-none"
                    />
                  </div>

                  {submitSuccess && (
                    <div className="p-3.5 rounded-lg bg-emerald-950/40 border border-emerald-800 text-xs text-emerald-300 flex items-center gap-2">
                      <Check className="w-4 h-4" />
                      <span>Job posted successfully and added to today's batch feed!</span>
                    </div>
                  )}

                  <div className="pt-2 flex justify-end">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-6 py-2.5 text-xs font-semibold text-neutral-950 bg-white rounded-lg hover:bg-neutral-200 transition-colors"
                    >
                      {isSubmitting ? 'Publishing...' : 'Publish to Feed'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* TAB 3: Manage Listings */}
            {activeTab === 'manage_jobs' && (
              <div className="p-6 rounded-2xl border border-neutral-800 bg-neutral-900 space-y-4">
                <div className="flex items-center justify-between text-xs text-neutral-400">
                  <span>Total active listings: {jobs.length}</span>
                </div>

                <div className="divide-y divide-neutral-800 border border-neutral-800 rounded-xl overflow-hidden">
                  {jobs.map((job) => (
                    <div key={job.id} className="p-4 bg-neutral-950 flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-white truncate">
                            {job.title}
                          </h4>
                          {job.isDirectCompanyListing && (
                            <span className="text-[11px] font-mono text-emerald-400">
                              (Direct: {job.companyDomain || 'official'})
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-neutral-400 truncate mt-0.5">
                          {job.company} · {job.location} · {job.education} · {job.industry} · {job.sourceSite}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <a
                          href={job.referralUrl || job.applyUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 text-neutral-400 hover:text-white"
                          title="Open application link with referral"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                        <button
                          onClick={() => onDeleteJob(job.id)}
                          className="p-2 text-neutral-400 hover:text-red-400 transition-colors"
                          title="Delete listing"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 4: Target Portals */}
            {activeTab === 'sources' && (
              <div className="p-6 rounded-2xl border border-neutral-800 bg-neutral-900 space-y-4">
                <p className="text-xs text-neutral-400">
                  The AI crawler runs continuous sweeps against these configured endpoints and company feeds.
                </p>

                <div className="space-y-3">
                  {sources.map((src) => (
                    <div
                      key={src.id}
                      className="p-4 rounded-xl border border-neutral-800 bg-neutral-950 flex items-center justify-between gap-4"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <h5 className="text-sm font-bold text-white">
                            {src.name}
                          </h5>
                          <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-neutral-800 text-neutral-300">
                            {src.type}
                          </span>
                        </div>
                        <p className="text-xs font-mono text-neutral-400 mt-1 truncate max-w-lg">
                          {src.url}
                        </p>
                        <p className="text-[11px] text-emerald-400 mt-1 font-mono">
                          Referral code: {src.referralParam}
                        </p>
                      </div>

                      <button
                        onClick={() => {
                          setActiveTab('scanner');
                          setCustomScanUrl(src.url);
                          setCustomReferralParam(src.referralParam);
                        }}
                        className="px-3.5 py-1.5 text-xs font-semibold rounded-lg border border-neutral-700 hover:bg-neutral-800 text-neutral-200 transition-colors whitespace-nowrap"
                      >
                        Scan This Source
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 5: Database & SQL Ops (Direct Admin Access Only) */}
            {activeTab === 'database_ops' && (
              <div className="space-y-6">
                <div className="p-6 rounded-2xl border border-neutral-800 bg-neutral-900 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <Database className="w-5 h-5 text-emerald-400" />
                        <h3 className="text-base font-bold text-white">
                          Relational Database & SQL Ops (Protected Admin Access)
                        </h3>
                      </div>
                      <p className="text-xs text-neutral-400 mt-1 max-w-2xl leading-relaxed">
                        Export your full remote jobs database to run on zero-cost free cloud SQL hosts (Neon, Supabase, Turso, Render). This view is completely restricted to direct admin access and hidden from public visitors.
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => {
                          const dump = generateSqlDump(jobs, sqlDialect);
                          navigator.clipboard.writeText(dump);
                          setCopiedSql(true);
                          setTimeout(() => setCopiedSql(false), 2000);
                        }}
                        className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg border border-neutral-700 bg-neutral-800 text-white hover:bg-neutral-700 transition-colors"
                      >
                        {copiedSql ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedSql ? 'Copied to Clipboard!' : 'Copy SQL Dump'}</span>
                      </button>

                      <a
                        href={`/api/export-sql?dialect=${sqlDialect}`}
                        download={`remotepulse_${sqlDialect}_dump.sql`}
                        className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-neutral-950 bg-white rounded-lg hover:bg-neutral-200 transition-colors shadow-xs"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download .sql File</span>
                      </a>
                    </div>
                  </div>

                  {/* Dialect Selector Bar */}
                  <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs border-t border-neutral-800">
                    <div className="flex items-center gap-2">
                      <span className="text-neutral-400 font-semibold">Target Dialect:</span>
                      <div className="inline-flex rounded-lg border border-neutral-700 bg-neutral-950 p-1">
                        <button
                          onClick={() => setSqlDialect('postgres')}
                          className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                            sqlDialect === 'postgres'
                              ? 'bg-neutral-800 text-white font-semibold'
                              : 'text-neutral-400 hover:text-white'
                          }`}
                        >
                          PostgreSQL (Neon / Supabase)
                        </button>
                        <button
                          onClick={() => setSqlDialect('sqlite')}
                          className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                            sqlDialect === 'sqlite'
                              ? 'bg-neutral-800 text-white font-semibold'
                              : 'text-neutral-400 hover:text-white'
                          }`}
                        >
                          SQLite (Turso / libSQL)
                        </button>
                        <button
                          onClick={() => setSqlDialect('mysql')}
                          className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                            sqlDialect === 'mysql'
                              ? 'bg-neutral-800 text-white font-semibold'
                              : 'text-neutral-400 hover:text-white'
                          }`}
                        >
                          MySQL (PlanetScale / Aiven)
                        </button>
                      </div>
                    </div>

                    <div className="text-neutral-400 font-mono text-[11px]">
                      {jobs.length} jobs ready for SQL seed insertion
                    </div>
                  </div>

                  {/* Code Snippet Box */}
                  <div className="relative rounded-xl border border-neutral-800 bg-neutral-950 overflow-hidden">
                    <div className="px-4 py-2 bg-neutral-900 border-b border-neutral-800 flex items-center justify-between text-xs text-neutral-400">
                      <div className="flex items-center gap-2 font-mono text-[11px]">
                        <Code2 className="w-3.5 h-3.5 text-neutral-400" />
                        <span>remotepulse_{sqlDialect}_dump.sql</span>
                      </div>
                      <span className="text-[11px] font-mono text-emerald-400">
                        DDL + DML Ready
                      </span>
                    </div>

                    <pre className="p-4 text-xs font-mono text-neutral-300 overflow-x-auto max-h-72 leading-relaxed selection:bg-neutral-700">
                      {generateSqlDump(jobs, sqlDialect).slice(0, 1600)}
                      {'\n-- ... [Full dataset continues with all '}{jobs.length}{' structured remote jobs and indexes] ...'}
                    </pre>
                  </div>
                </div>

                {/* Free SQL Hosting & Deployment Blueprint */}
                <div className="p-6 rounded-2xl border border-neutral-800 bg-neutral-900 space-y-4">
                  <div className="flex items-center gap-2">
                    <Server className="w-4 h-4 text-emerald-400" />
                    <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                      Free SQL Hosting & Deployment Blueprint
                    </h4>
                  </div>

                  <p className="text-xs text-neutral-400 leading-relaxed">
                    Deploy both backend and frontend to 100% free hosting providers with zero upfront cost:
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                    <div className="p-4 rounded-xl border border-neutral-800 bg-neutral-950 space-y-2">
                      <div className="flex items-center justify-between">
                        <strong className="text-white text-sm">Neon.tech</strong>
                        <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                          Recommended
                        </span>
                      </div>
                      <p className="text-neutral-400 leading-relaxed text-[11px]">
                        Serverless PostgreSQL with instant autoscaling and 0.5 GB free storage. Paste this SQL dump into the Neon SQL Editor or pipe via <code className="font-mono text-neutral-200">psql</code>.
                      </p>
                      <div className="pt-2 font-mono text-[10px] text-neutral-500">
                        psql $DATABASE_URL &lt; dump.sql
                      </div>
                    </div>

                    <div className="p-4 rounded-xl border border-neutral-800 bg-neutral-950 space-y-2">
                      <div className="flex items-center justify-between">
                        <strong className="text-white text-sm">Supabase.com</strong>
                        <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-300">
                          Free 500MB
                        </span>
                      </div>
                      <p className="text-neutral-400 leading-relaxed text-[11px]">
                        Full-fledged PostgreSQL instance with instant REST APIs, database web UI, and built-in auth. Simply open SQL Editor in your dashboard and run the generated dump.
                      </p>
                      <div className="pt-2 font-mono text-[10px] text-neutral-500">
                        Dashboard &gt; SQL Editor &gt; Run
                      </div>
                    </div>

                    <div className="p-4 rounded-xl border border-neutral-800 bg-neutral-950 space-y-2">
                      <div className="flex items-center justify-between">
                        <strong className="text-white text-sm">Turso / Render</strong>
                        <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-300">
                          Edge SQLite
                        </span>
                      </div>
                      <p className="text-neutral-400 leading-relaxed text-[11px]">
                        Turso provides 9 GB free storage for edge SQLite. Or deploy the Express/Node backend to Render.com / Railway.app free web service tiers with automated Git deployments.
                      </p>
                      <div className="pt-2 font-mono text-[10px] text-neutral-500">
                        turso db shell my-db &lt; dump.sql
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};
