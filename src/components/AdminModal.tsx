import React, { useState } from 'react';
import { 
  X, 
  ShieldCheck, 
  Bot, 
  PlusCircle, 
  ListFilter, 
  Link as LinkIcon, 
  Check, 
  Play, 
  AlertCircle, 
  ExternalLink,
  Trash2,
  RefreshCw,
  Globe
} from 'lucide-react';
import { Job, CrawlSource, AgentLogEntry, EducationLevel, IndustryField } from '../types';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobs: Job[];
  sources: CrawlSource[];
  logs: AgentLogEntry[];
  onAddManualJob: (jobData: any) => Promise<boolean>;
  onDeleteJob: (id: string) => Promise<boolean>;
  onTriggerScan: (scanParams: { customUrl?: string; customText?: string; referralParam?: string; sourceId?: string }) => Promise<any>;
  onRefreshData: () => void;
}

export const AdminModal: React.FC<AdminModalProps> = ({
  isOpen,
  onClose,
  jobs,
  sources,
  logs,
  onAddManualJob,
  onDeleteJob,
  onTriggerScan,
  onRefreshData,
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passkey, setPasskey] = useState('');
  const [authError, setAuthError] = useState('');

  // Active Tab: 'scanner' | 'manual_add' | 'manage_jobs' | 'sources'
  const [activeTab, setActiveTab] = useState<'scanner' | 'manual_add' | 'manage_jobs' | 'sources'>('scanner');

  // Scanner Form state
  const [customScanUrl, setCustomScanUrl] = useState('');
  const [customScanText, setCustomScanText] = useState('');
  const [customReferralParam, setCustomReferralParam] = useState('ref=cchung_careers&utm_source=remotepulse');
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<string | null>(null);

  // Manual Add Form state
  const [manualTitle, setManualTitle] = useState('');
  const [manualCompany, setManualCompany] = useState('');
  const [manualIndustry, setManualIndustry] = useState<IndustryField>('Software Engineering');
  const [manualLocation, setManualLocation] = useState('Worldwide');
  const [manualLocationCat, setManualLocationCat] = useState<'Worldwide' | 'Americas' | 'Europe' | 'Asia-Pacific' | 'Other'>('Worldwide');
  const [manualMinSalary, setManualMinSalary] = useState(130000);
  const [manualMaxSalary, setManualMaxSalary] = useState(170000);
  const [manualSalaryCurrency, setManualSalaryCurrency] = useState('USD');
  const [manualEducation, setManualEducation] = useState<EducationLevel>('No Degree Required');
  const [manualExperience, setManualExperience] = useState<'Entry Level' | 'Mid Level' | 'Senior' | 'Lead / Director' | 'Any'>('Senior');
  const [manualApplyUrl, setManualApplyUrl] = useState('');
  const [manualReferralCode, setManualReferralCode] = useState('ref=cchung_careers&utm_source=remotepulse');
  const [manualSummary, setManualSummary] = useState('');
  const [manualSkills, setManualSkills] = useState('TypeScript, React, Node.js, Remote');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  if (!isOpen) return null;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passkey.trim() === 'remote2026' || passkey.trim() === 'admin' || passkey.trim() === '') {
      setIsAuthenticated(true);
      setAuthError('');
    } else {
      setAuthError('Invalid passkey. Use default passkey: remote2026');
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
        setScanResult(`AI Agent successfully verified and ingested ${res.addedCount || 1} remote jobs with your referral link!`);
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
        setManualSummary('');
        setTimeout(() => setSubmitSuccess(false), 3000);
        onRefreshData();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div 
        className="relative w-full max-w-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-xl overflow-hidden my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Bar */}
        <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-bold">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                Admin Intelligence Portal
              </h3>
              <p className="text-xs text-neutral-500">
                Manage AI crawler scans, referral parameters, and custom job entries
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Auth Barrier or Portal Body */}
        {!isAuthenticated ? (
          <div className="p-8 max-w-sm mx-auto text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mx-auto text-neutral-700 dark:text-neutral-300">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-neutral-900 dark:text-white">
              Admin Authentication
            </h4>
            <p className="text-xs text-neutral-500">
              Enter your admin passkey to configure crawler targets, referral tags, and add listings.
            </p>

            <form onSubmit={handleLogin} className="space-y-3">
              <input
                type="password"
                placeholder="Passkey (default: remote2026)"
                value={passkey}
                onChange={(e) => setPasskey(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-white text-center"
              />
              {authError && <p className="text-xs text-red-500">{authError}</p>}

              <button
                type="submit"
                className="w-full py-2 text-xs font-semibold text-white bg-neutral-900 dark:bg-neutral-100 dark:text-neutral-900 rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors"
              >
                Log In as Admin
              </button>

              <button
                type="button"
                onClick={() => {
                  setPasskey('remote2026');
                  setIsAuthenticated(true);
                }}
                className="text-xs text-neutral-500 hover:text-neutral-900 dark:hover:text-white underline"
              >
                1-Click Demo Unlock
              </button>
            </form>
          </div>
        ) : (
          <div>
            {/* Tabs Bar */}
            <div className="px-6 border-b border-neutral-200 dark:border-neutral-800 flex items-center gap-4 bg-neutral-50/50 dark:bg-neutral-950/50 overflow-x-auto text-xs font-medium">
              <button
                onClick={() => setActiveTab('scanner')}
                className={`py-3 flex items-center gap-1.5 border-b-2 whitespace-nowrap transition-colors ${
                  activeTab === 'scanner'
                    ? 'border-neutral-900 dark:border-white text-neutral-900 dark:text-white font-semibold'
                    : 'border-transparent text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                <Bot className="w-3.5 h-3.5" />
                <span>AI Agent Crawler & Scanner</span>
              </button>

              <button
                onClick={() => setActiveTab('manual_add')}
                className={`py-3 flex items-center gap-1.5 border-b-2 whitespace-nowrap transition-colors ${
                  activeTab === 'manual_add'
                    ? 'border-neutral-900 dark:border-white text-neutral-900 dark:text-white font-semibold'
                    : 'border-transparent text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Personally Add Job</span>
              </button>

              <button
                onClick={() => setActiveTab('manage_jobs')}
                className={`py-3 flex items-center gap-1.5 border-b-2 whitespace-nowrap transition-colors ${
                  activeTab === 'manage_jobs'
                    ? 'border-neutral-900 dark:border-white text-neutral-900 dark:text-white font-semibold'
                    : 'border-transparent text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                <ListFilter className="w-3.5 h-3.5" />
                <span>Manage Listings ({jobs.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('sources')}
                className={`py-3 flex items-center gap-1.5 border-b-2 whitespace-nowrap transition-colors ${
                  activeTab === 'sources'
                    ? 'border-neutral-900 dark:border-white text-neutral-900 dark:text-white font-semibold'
                    : 'border-transparent text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                <Globe className="w-3.5 h-3.5" />
                <span>Target Portals & Feeds ({sources.length})</span>
              </button>
            </div>

            {/* Tab Contents */}
            <div className="p-6 max-h-[68vh] overflow-y-auto space-y-5">
              {/* TAB 1: AI Scanner */}
              {activeTab === 'scanner' && (
                <div className="space-y-6">
                  <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-950/50">
                    <h4 className="text-sm font-bold text-neutral-900 dark:text-white mb-1">
                      Scan Custom Website / Job Description
                    </h4>
                    <p className="text-xs text-neutral-500 mb-4 leading-relaxed">
                      Provide a careers page URL or paste raw job posting text. The AI Agent will scrape or parse the details, determine education & salary thresholds, and append your referral parameter.
                    </p>

                    <form onSubmit={handleRunScanner} className="space-y-3">
                      <div>
                        <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                          Target Website URL (or leave empty to scan automated feeds)
                        </label>
                        <input
                          type="url"
                          placeholder="e.g. https://company.com/careers/lead-engineer or https://remoteok.com"
                          value={customScanUrl}
                          onChange={(e) => setCustomScanUrl(e.target.value)}
                          className="w-full px-3 py-2 text-xs rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-white"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                          Or Paste Raw Job Description Text / HTML
                        </label>
                        <textarea
                          rows={3}
                          placeholder="Paste full job description or raw career snippet here..."
                          value={customScanText}
                          onChange={(e) => setCustomScanText(e.target.value)}
                          className="w-full px-3 py-2 text-xs rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-white resize-y"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                          Your Referral Tracking Parameter (Appended to destination application links)
                        </label>
                        <input
                          type="text"
                          required
                          value={customReferralParam}
                          onChange={(e) => setCustomReferralParam(e.target.value)}
                          placeholder="ref=cchung_careers&utm_source=remotepulse"
                          className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-white"
                        />
                      </div>

                      <div className="flex items-center justify-between pt-2">
                        <button
                          type="submit"
                          disabled={isScanning}
                          className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-neutral-900 dark:bg-neutral-100 dark:text-neutral-900 rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors disabled:opacity-50"
                        >
                          {isScanning ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              <span>AI Agent Scanning & Extracting...</span>
                            </>
                          ) : (
                            <>
                              <Play className="w-3.5 h-3.5" />
                              <span>Run AI Agent Job Scan</span>
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
                          className="text-xs text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white underline"
                        >
                          Quick Scan All Preset Remote Feeds
                        </button>
                      </div>
                    </form>

                    {scanResult && (
                      <div className="mt-3 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300">
                        {scanResult}
                      </div>
                    )}
                  </div>

                  {/* Live Crawler Logs */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-wider">
                        Live Agent Telemetry & Crawler Logs
                      </h4>
                      <button
                        onClick={onRefreshData}
                        className="text-xs text-neutral-500 hover:text-neutral-900 dark:hover:text-white flex items-center gap-1"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>Refresh</span>
                      </button>
                    </div>

                    <div className="space-y-2 max-h-48 overflow-y-auto font-mono text-xs p-3 rounded-xl bg-neutral-950 text-neutral-300 border border-neutral-800">
                      {logs.slice(0, 8).map((log) => (
                        <div key={log.id} className="flex items-start gap-2 leading-relaxed">
                          <span className="text-neutral-500 tabular-nums">
                            {new Date(log.timestamp).toLocaleTimeString([], { hour12: false })}
                          </span>
                          <span className={log.status === 'success' ? 'text-emerald-400' : log.status === 'warning' ? 'text-amber-400' : log.status === 'error' ? 'text-red-400' : 'text-blue-400'}>
                            [{log.step}]
                          </span>
                          <span className="text-neutral-200">{log.message}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: Personally Add Job Manually */}
              {activeTab === 'manual_add' && (
                <form onSubmit={handleCreateManualJob} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                        Job Title *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Lead Staff Backend Engineer"
                        value={manualTitle}
                        onChange={(e) => setManualTitle(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                        Company Name *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Stripe, OpenAI, RemoteOps"
                        value={manualCompany}
                        onChange={(e) => setManualCompany(e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                        Industry / Field
                      </label>
                      <select
                        value={manualIndustry}
                        onChange={(e) => setManualIndustry(e.target.value as IndustryField)}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-white"
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
                      <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                        Education Level Requirement
                      </label>
                      <select
                        value={manualEducation}
                        onChange={(e) => setManualEducation(e.target.value as EducationLevel)}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-white"
                      >
                        <option value="No Degree Required">No Degree Required</option>
                        <option value="Bachelor's">Bachelor's Degree</option>
                        <option value="Master's">Master's Degree</option>
                        <option value="PhD">PhD</option>
                        <option value="Certification">Certification / Equivalent</option>
                        <option value="Any">Any Education</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                        Experience Level
                      </label>
                      <select
                        value={manualExperience}
                        onChange={(e) => setManualExperience(e.target.value as any)}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-white"
                      >
                        <option value="Entry Level">Entry Level</option>
                        <option value="Mid Level">Mid Level</option>
                        <option value="Senior">Senior</option>
                        <option value="Lead / Director">Lead / Director</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                        Location String
                      </label>
                      <input
                        type="text"
                        value={manualLocation}
                        onChange={(e) => setManualLocation(e.target.value)}
                        placeholder="e.g. Worldwide or US Remote"
                        className="w-full px-3 py-2 text-xs rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                        Min Salary (USD)
                      </label>
                      <input
                        type="number"
                        value={manualMinSalary}
                        onChange={(e) => setManualMinSalary(Number(e.target.value))}
                        className="w-full px-3 py-2 text-xs font-mono tabular-nums rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                        Max Salary (USD)
                      </label>
                      <input
                        type="number"
                        value={manualMaxSalary}
                        onChange={(e) => setManualMaxSalary(Number(e.target.value))}
                        className="w-full px-3 py-2 text-xs font-mono tabular-nums rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                      Direct Application URL *
                    </label>
                    <input
                      type="url"
                      required
                      placeholder="https://company.com/apply/job-123"
                      value={manualApplyUrl}
                      onChange={(e) => setManualApplyUrl(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                      Your Referral / Affiliate Query Parameter (Will be attached automatically)
                    </label>
                    <input
                      type="text"
                      value={manualReferralCode}
                      onChange={(e) => setManualReferralCode(e.target.value)}
                      placeholder="ref=cchung_careers&utm_source=remotepulse"
                      className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                      Key Required Skills (Comma-separated)
                    </label>
                    <input
                      type="text"
                      value={manualSkills}
                      onChange={(e) => setManualSkills(e.target.value)}
                      placeholder="e.g. Python, Distributed Systems, Docker, AWS"
                      className="w-full px-3 py-2 text-xs rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                      Role Summary / Overview
                    </label>
                    <textarea
                      rows={2}
                      value={manualSummary}
                      onChange={(e) => setManualSummary(e.target.value)}
                      placeholder="Brief 2-sentence summary of responsibilities and scope..."
                      className="w-full px-3 py-2 text-xs rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-white"
                    />
                  </div>

                  {submitSuccess && (
                    <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                      <Check className="w-4 h-4" />
                      <span>Job posted successfully and added to today's fresh batch!</span>
                    </div>
                  )}

                  <div className="pt-2 flex justify-end">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-5 py-2 text-xs font-semibold text-white bg-neutral-900 dark:bg-neutral-100 dark:text-neutral-900 rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors"
                    >
                      {isSubmitting ? 'Publishing...' : 'Publish Job Listing'}
                    </button>
                  </div>
                </form>
              )}

              {/* TAB 3: Manage Listings */}
              {activeTab === 'manage_jobs' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-neutral-500 mb-1">
                    <span>Showing all {jobs.length} remote listings</span>
                  </div>

                  <div className="divide-y divide-neutral-200 dark:divide-neutral-800 border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden">
                    {jobs.map((job) => (
                      <div key={job.id} className="p-3.5 bg-white dark:bg-neutral-950 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <h5 className="text-xs font-bold text-neutral-900 dark:text-white truncate">
                            {job.title}
                          </h5>
                          <p className="text-[11px] text-neutral-500 truncate">
                            {job.company} · {job.location} · {job.education} · {job.industry}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <a
                            href={job.referralUrl || job.applyUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
                            title="Visit referral link"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                          <button
                            onClick={() => onDeleteJob(job.id)}
                            className="p-1.5 text-neutral-400 hover:text-red-500 transition-colors"
                            title="Delete listing"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 4: Target Portals & Feeds */}
              {activeTab === 'sources' && (
                <div className="space-y-4">
                  <p className="text-xs text-neutral-500">
                    These active feeds and partner platforms are scanned periodically by the AI Agent. Each has a customized referral tracking parameter configured.
                  </p>

                  <div className="space-y-3">
                    {sources.map((src) => (
                      <div
                        key={src.id}
                        className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-950/50 flex items-center justify-between gap-4"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <h5 className="text-xs font-bold text-neutral-900 dark:text-white">
                              {src.name}
                            </h5>
                            <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300">
                              {src.type}
                            </span>
                          </div>
                          <p className="text-xs font-mono text-neutral-400 mt-0.5 truncate max-w-md">
                            {src.url}
                          </p>
                          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 font-mono">
                            Referral parameter: {src.referralParam}
                          </p>
                        </div>

                        <button
                          onClick={() => {
                            setActiveTab('scanner');
                            setCustomScanUrl(src.url);
                            setCustomReferralParam(src.referralParam);
                          }}
                          className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors whitespace-nowrap"
                        >
                          Scan This Source
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
