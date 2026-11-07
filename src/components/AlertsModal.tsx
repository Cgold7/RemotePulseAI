import React, { useState } from 'react';
import { 
  X, 
  Bell, 
  Trash2, 
  ArrowRight, 
  Plus, 
  Check, 
  Mail, 
  Clock, 
  Send, 
  Eye, 
  CheckCircle2, 
  ExternalLink,
  ChevronLeft
} from 'lucide-react';
import { AlertRule, Job, JobFilters, EducationLevel, IndustryField } from '../types';
import { calculateAlertMatches, formatSalary } from '../utils/jobFilters';

interface AlertsModalProps {
  isOpen: boolean;
  onClose: () => void;
  alerts: AlertRule[];
  jobs: Job[];
  onCreateAlert: (alertData: Omit<AlertRule, 'id' | 'createdAt' | 'active'>) => void;
  onDeleteAlert: (id: string) => void;
  onApplyAlertFilter: (alert: AlertRule) => void;
  onUpdateAlertDigest?: (id: string, dailyEmailDigest: boolean, email?: string) => Promise<void>;
  initialFiltersForAlert?: Partial<JobFilters>;
}

export const AlertsModal: React.FC<AlertsModalProps> = ({
  isOpen,
  onClose,
  alerts,
  jobs,
  onCreateAlert,
  onDeleteAlert,
  onApplyAlertFilter,
  onUpdateAlertDigest,
  initialFiltersForAlert,
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [name, setName] = useState(
    initialFiltersForAlert?.search
      ? `Alert: ${initialFiltersForAlert.search}`
      : initialFiltersForAlert?.industry && initialFiltersForAlert.industry !== 'All Fields'
      ? `Alert: ${initialFiltersForAlert.industry}`
      : 'My Remote Job Alert'
  );
  const [search, setSearch] = useState(initialFiltersForAlert?.search || '');
  const [location, setLocation] = useState(initialFiltersForAlert?.location || 'All');
  const [minSalary, setMinSalary] = useState(initialFiltersForAlert?.minSalary || 0);
  const [education, setEducation] = useState(initialFiltersForAlert?.education || 'All');
  const [industry, setIndustry] = useState(initialFiltersForAlert?.industry || 'All Fields');

  // Daily Email Digest form state
  const [dailyEmailDigest, setDailyEmailDigest] = useState(true);
  const [email, setEmail] = useState(() => {
    try {
      return localStorage.getItem('remotepulse_visitor_email') || '';
    } catch {
      return '';
    }
  });
  const [digestDeliveryTime, setDigestDeliveryTime] = useState('08:00 AM');
  const [formError, setFormError] = useState<string | null>(null);

  // Inline editing of email on existing alerts
  const [editingEmailAlertId, setEditingEmailAlertId] = useState<string | null>(null);
  const [tempEditEmail, setTempEditEmail] = useState('');

  // Preview Email Digest modal/view state
  const [previewAlert, setPreviewAlert] = useState<AlertRule | null>(null);
  const [testSentNotice, setTestSentNotice] = useState<string | null>(null);
  const [isSendingTest, setIsSendingTest] = useState(false);

  if (!isOpen) return null;

  const handleSubmitNew = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!name.trim()) {
      setFormError('Please provide an alert name.');
      return;
    }

    const trimmedEmail = email.trim();
    if (dailyEmailDigest) {
      if (!trimmedEmail || !trimmedEmail.includes('@') || !trimmedEmail.includes('.')) {
        setFormError('Please enter a valid email address to receive daily alert notices.');
        return;
      }
      try {
        localStorage.setItem('remotepulse_visitor_email', trimmedEmail);
      } catch (err) {
        console.error('Failed to save email to localStorage', err);
      }
    }

    onCreateAlert({
      name: name.trim(),
      search: search.trim(),
      location,
      minSalary: Number(minSalary),
      education,
      industry,
      dailyEmailDigest,
      email: trimmedEmail || undefined,
      digestDeliveryTime,
    });

    setIsCreating(false);
  };

  const handleSendTestDigest = async (alert: AlertRule) => {
    setIsSendingTest(true);
    setTestSentNotice(null);
    try {
      const res = await fetch(`/api/alerts/${alert.id}/test-digest`, {
        method: 'POST',
      }).then((r) => r.json());

      if (res.success) {
        setTestSentNotice(`Test daily digest dispatched to ${res.recipient} (${res.matchesCount} matches)`);
        setTimeout(() => setTestSentNotice(null), 4000);
      } else {
        setTestSentNotice(`Notice: ${res.error || 'Test digest triggered'}`);
        setTimeout(() => setTestSentNotice(null), 4000);
      }
    } catch (e: any) {
      setTestSentNotice(`Error sending test digest: ${e.message}`);
      setTimeout(() => setTestSentNotice(null), 4000);
    } finally {
      setIsSendingTest(false);
    }
  };

  // Matched jobs for preview
  const previewMatches = previewAlert
    ? jobs.filter((job) => {
        if (previewAlert.industry && previewAlert.industry !== 'All Fields' && job.industry !== previewAlert.industry) {
          return false;
        }
        if (previewAlert.minSalary && previewAlert.minSalary > 0 && job.maxSalary < previewAlert.minSalary) {
          return false;
        }
        if (previewAlert.search) {
          const q = previewAlert.search.toLowerCase();
          const inTitle = job.title.toLowerCase().includes(q);
          const inComp = job.company.toLowerCase().includes(q);
          const inSkills = job.skills.some((s) => s.toLowerCase().includes(q));
          if (!inTitle && !inComp && !inSkills) return false;
        }
        return true;
      })
    : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div 
        className="relative w-full max-w-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-xl overflow-hidden my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                {previewAlert ? 'Daily Email Digest Preview' : 'Job Search Alerts & Email Digests'}
              </h3>
              <p className="text-xs text-neutral-500">
                {previewAlert 
                  ? `Delivered daily to ${previewAlert.email || 'cchungx5452@gmail.com'} at ${previewAlert.digestDeliveryTime || '08:00 AM'}`
                  : 'Automated match notifications and daily email digests for remote careers'}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              if (previewAlert) {
                setPreviewAlert(null);
              } else {
                onClose();
              }
            }}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* VIEW 1: Email Digest Preview Mode */}
          {previewAlert ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setPreviewAlert(null)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Back to Alerts List</span>
                </button>

                <button
                  onClick={() => handleSendTestDigest(previewAlert)}
                  disabled={isSendingTest}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSendingTest ? 'Sending...' : 'Send Test Digest Now'}</span>
                </button>
              </div>

              {testSentNotice && (
                <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{testSentNotice}</span>
                </div>
              )}

              {/* Email Envelope Header */}
              <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 space-y-1.5 text-xs">
                <div className="flex items-center justify-between text-neutral-500">
                  <span>To: <strong className="text-neutral-900 dark:text-neutral-200 font-mono">{previewAlert.email || 'cchungx5452@gmail.com'}</strong></span>
                  <span className="flex items-center gap-1 text-[11px]">
                    <Clock className="w-3 h-3" />
                    <span>Daily at {previewAlert.digestDeliveryTime || '08:00 AM'}</span>
                  </span>
                </div>
                <div className="text-neutral-500">
                  <span>Subject: <strong className="text-neutral-900 dark:text-neutral-100">[RemotePulse AI] Daily Digest: {previewMatches.length} matches for "{previewAlert.name}"</strong></span>
                </div>
              </div>

              {/* Rendered Email Body Simulation */}
              <div className="p-5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 space-y-4">
                <div className="border-b border-neutral-200 dark:border-neutral-800 pb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 flex items-center justify-center font-bold text-xs">
                      RP
                    </div>
                    <span className="font-bold text-sm text-neutral-900 dark:text-white">
                      RemotePulse <span className="text-neutral-500">AI</span>
                    </span>
                  </div>
                  <span className="text-[11px] text-neutral-400 font-mono">
                    Scheduled Daily Briefing
                  </span>
                </div>

                <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                  Good morning! Here is today's curated remote opportunities digest for search alert <strong>{previewAlert.name}</strong>. Fresh listings pulled directly from company career sites and vetted boards with your referral tags attached.
                </p>

                {previewMatches.length === 0 ? (
                  <div className="p-6 text-center border border-dashed border-neutral-200 dark:border-neutral-800 rounded-lg text-xs text-neutral-500">
                    No active positions in the database currently match this rule. When our AI agent scans new roles matching this filter, they will be listed here.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {previewMatches.slice(0, 4).map((job) => (
                      <div
                        key={job.id}
                        className="p-3.5 rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-950/50 space-y-1.5"
                      >
                        <div className="flex items-center justify-between gap-2 text-xs flex-wrap">
                          <div className="flex items-center gap-1.5 font-semibold text-neutral-800 dark:text-neutral-200">
                            <span>{job.company}</span>
                            {job.isDirectCompanyListing && (
                              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                                · Direct on {job.companyDomain || 'official site'}
                              </span>
                            )}
                          </div>
                          <span className="font-mono tabular-nums font-semibold text-neutral-900 dark:text-white">
                            {formatSalary(job)}
                          </span>
                        </div>

                        <h4 className="text-sm font-bold text-neutral-900 dark:text-white">
                          {job.title}
                        </h4>

                        <div className="text-xs text-neutral-500 flex items-center gap-2 flex-wrap">
                          <span>{job.location}</span>
                          <span aria-hidden="true">·</span>
                          <span>Edu: {job.education}</span>
                          <span aria-hidden="true">·</span>
                          <span>{job.industry}</span>
                        </div>

                        <p className="text-xs text-neutral-600 dark:text-neutral-400 line-clamp-2">
                          {job.summary}
                        </p>

                        <div className="pt-1 flex items-center justify-between">
                          <a
                            href={job.referralUrl || job.applyUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs font-semibold text-neutral-900 dark:text-white underline hover:text-neutral-600"
                          >
                            <span>Apply with Referral Link</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                          {job.referralCode && (
                            <span className="text-[10px] text-neutral-400 font-mono">
                              Tag: {job.referralCode.split('&')[0]}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 text-[11px] text-neutral-400 text-center">
                  Delivered automatically to <strong>{previewAlert.email || 'cchungx5452@gmail.com'}</strong> · You can toggle or edit this alert anytime in RemotePulse AI.
                </div>
              </div>
            </div>
          ) : !isCreating ? (
            /* VIEW 2: Alert List */
            <>
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">
                  Active Alerts ({alerts.length})
                </span>
                <button
                  onClick={() => setIsCreating(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-neutral-900 dark:bg-neutral-100 dark:text-neutral-900 rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create New Alert</span>
                </button>
              </div>

              {testSentNotice && (
                <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{testSentNotice}</span>
                </div>
              )}

              {alerts.length === 0 ? (
                <div className="p-8 text-center border border-dashed border-neutral-200 dark:border-neutral-800 rounded-xl">
                  <Bell className="w-8 h-8 text-neutral-400 mx-auto mb-2 opacity-50" />
                  <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
                    No active job alerts yet
                  </p>
                  <p className="text-xs text-neutral-500 mt-1 max-w-sm mx-auto">
                    Create alert rules to track specific compensation, education, and industry requirements with optional daily email digests.
                  </p>
                  <button
                    onClick={() => setIsCreating(true)}
                    className="mt-4 px-4 py-2 text-xs font-semibold rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-neutral-900"
                  >
                    Create Your First Alert
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {alerts.map((alert) => {
                    const matchCount = calculateAlertMatches(jobs, alert);
                    const isDigestOn = alert.dailyEmailDigest ?? false;
                    const digestEmail = alert.email || 'cchungx5452@gmail.com';

                    return (
                      <div
                        key={alert.id}
                        className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-950/50 space-y-3"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="text-sm font-bold text-neutral-900 dark:text-white">
                                {alert.name}
                              </h4>
                              <span className="font-mono text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                                {matchCount} {matchCount === 1 ? 'match' : 'matches'}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 text-xs text-neutral-500 mt-1 flex-wrap">
                              {alert.industry && alert.industry !== 'All Fields' && (
                                <span>{alert.industry}</span>
                              )}
                              {alert.location && alert.location !== 'All' && (
                                <>
                                  <span aria-hidden="true">·</span>
                                  <span>{alert.location}</span>
                                </>
                              )}
                              {alert.minSalary && alert.minSalary > 0 ? (
                                <>
                                  <span aria-hidden="true">·</span>
                                  <span className="font-mono tabular-nums">${Math.round(alert.minSalary / 1000)}k+</span>
                                </>
                              ) : null}
                              {alert.education && alert.education !== 'All' && (
                                <>
                                  <span aria-hidden="true">·</span>
                                  <span>{alert.education}</span>
                                </>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 self-end sm:self-auto shrink-0">
                            <button
                              onClick={() => {
                                onApplyAlertFilter(alert);
                                onClose();
                              }}
                              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-neutral-200 dark:border-neutral-800 hover:bg-white dark:hover:bg-neutral-900 transition-colors"
                            >
                              <span>View Matches</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => onDeleteAlert(alert.id)}
                              aria-label={`Delete alert ${alert.name}`}
                              className="p-1.5 text-neutral-400 hover:text-red-500 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Daily Email Digest Feature Bar */}
                        <div className="pt-2 border-t border-neutral-200/70 dark:border-neutral-800/70 flex flex-col gap-2 text-xs">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  if (onUpdateAlertDigest) {
                                    onUpdateAlertDigest(alert.id, !isDigestOn, digestEmail);
                                  }
                                }}
                                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                  isDigestOn ? 'bg-neutral-900 dark:bg-white' : 'bg-neutral-300 dark:bg-neutral-700'
                                }`}
                                role="switch"
                                aria-checked={isDigestOn}
                                aria-label={`Toggle daily email digest for ${alert.name}`}
                              >
                                <span
                                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white dark:bg-neutral-900 shadow-sm ring-0 transition duration-200 ease-in-out ${
                                    isDigestOn ? 'translate-x-4' : 'translate-x-0'
                                  }`}
                                />
                              </button>

                              <div className="flex items-center gap-1.5 text-neutral-700 dark:text-neutral-300">
                                <Mail className="w-3.5 h-3.5 text-neutral-400" />
                                <span className="font-medium">
                                  Daily Email Digest: {isDigestOn ? 'Active' : 'Disabled'}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 self-end sm:self-auto">
                              <button
                                onClick={() => setPreviewAlert(alert)}
                                className="flex items-center gap-1 text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
                              >
                                <Eye className="w-3 h-3" />
                                <span>Preview Digest</span>
                              </button>

                              {isDigestOn && (
                                <button
                                  onClick={() => handleSendTestDigest(alert)}
                                  className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
                                >
                                  <Send className="w-3 h-3" />
                                  <span>Test Send</span>
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Email recipient bar & quick updater for any visitor */}
                          {isDigestOn && (
                            <div className="flex items-center justify-between bg-neutral-100 dark:bg-neutral-900 px-2.5 py-1.5 rounded-lg text-[11px] font-mono">
                              {editingEmailAlertId === alert.id ? (
                                <div className="flex items-center gap-2 w-full">
                                  <span className="text-neutral-500 text-[10px]">To:</span>
                                  <input
                                    type="email"
                                    value={tempEditEmail}
                                    onChange={(e) => setTempEditEmail(e.target.value)}
                                    placeholder="your-email@example.com"
                                    className="flex-1 px-2 py-0.5 text-xs bg-white dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 rounded text-neutral-900 dark:text-white"
                                  />
                                  <button
                                    onClick={async () => {
                                      if (tempEditEmail.trim() && tempEditEmail.includes('@') && onUpdateAlertDigest) {
                                        await onUpdateAlertDigest(alert.id, true, tempEditEmail.trim());
                                        try {
                                          localStorage.setItem('remotepulse_visitor_email', tempEditEmail.trim());
                                        } catch {}
                                        setEditingEmailAlertId(null);
                                      }
                                    }}
                                    className="px-2 py-0.5 bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 rounded font-sans text-[10px] font-semibold"
                                  >
                                    Save
                                  </button>
                                  <button
                                    onClick={() => setEditingEmailAlertId(null)}
                                    className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 font-sans text-[10px]"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center justify-between w-full">
                                  <span className="text-neutral-600 dark:text-neutral-400 truncate">
                                    Delivered to: <strong className="text-neutral-900 dark:text-neutral-200">{digestEmail}</strong>
                                  </span>
                                  <button
                                    onClick={() => {
                                      setEditingEmailAlertId(alert.id);
                                      setTempEditEmail(digestEmail);
                                    }}
                                    className="text-emerald-700 dark:text-emerald-400 font-sans hover:underline text-[10px] shrink-0 ml-2"
                                  >
                                    Change email
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          ) : (
            /* VIEW 3: Create Alert Form */
            <form onSubmit={handleSubmitNew} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                  Alert Rule Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Senior Remote US AI Roles"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                    Job Keyword / Search
                  </label>
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="e.g. Engineer, Python, Design"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                    Industry Field
                  </label>
                  <select
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value as IndustryField)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-white"
                  >
                    <option value="All Fields">All Fields</option>
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
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                    Location
                  </label>
                  <select
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-white"
                  >
                    <option value="All">All Locations</option>
                    <option value="Worldwide">Worldwide / Anywhere</option>
                    <option value="Americas / US">Americas / US</option>
                    <option value="Europe / EMEA">Europe / EMEA</option>
                    <option value="Asia-Pacific / APAC">Asia-Pacific</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                    Min Salary
                  </label>
                  <select
                    value={minSalary}
                    onChange={(e) => setMinSalary(Number(e.target.value))}
                    className="w-full px-3 py-2 text-xs font-mono tabular-nums rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-white"
                  >
                    <option value={0}>Any Salary</option>
                    <option value={60000}>$60k+</option>
                    <option value={100000}>$100k+</option>
                    <option value={140000}>$140k+</option>
                    <option value={180000}>$180k+</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                    Education Level
                  </label>
                  <select
                    value={education}
                    onChange={(e) => setEducation(e.target.value as EducationLevel | 'All')}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-white"
                  >
                    <option value="All">Any Education</option>
                    <option value="No Degree Required">No Degree Required</option>
                    <option value="Bachelor's">Bachelor's</option>
                    <option value="Master's">Master's</option>
                    <option value="PhD">PhD</option>
                    <option value="Certification">Certification</option>
                  </select>
                </div>
              </div>

              {/* Daily Email Digest Feature Section in Form */}
              <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-950/50 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-neutral-700 dark:text-neutral-300" />
                    <div>
                      <h4 className="text-xs font-bold text-neutral-900 dark:text-white">
                        Daily Email Digest
                      </h4>
                      <p className="text-[11px] text-neutral-500">
                        Receive a morning digest of fresh matching remote jobs directly to your inbox
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setDailyEmailDigest(!dailyEmailDigest)}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      dailyEmailDigest ? 'bg-neutral-900 dark:bg-white' : 'bg-neutral-300 dark:bg-neutral-700'
                    }`}
                    role="switch"
                    aria-checked={dailyEmailDigest}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white dark:bg-neutral-900 shadow-sm ring-0 transition duration-200 ease-in-out ${
                        dailyEmailDigest ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {dailyEmailDigest && (
                  <div className="space-y-3 pt-2 border-t border-neutral-200 dark:border-neutral-800">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                          Your Email Address (Any Visitor) *
                        </label>
                        <input
                          type="email"
                          required={dailyEmailDigest}
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="name@example.com"
                          className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:focus:ring-white"
                        />
                        <span className="text-[10px] text-neutral-500 mt-1 block">
                          Enter your email to receive daily digest notices. Saved for your alerts.
                        </span>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                          Delivery Schedule
                        </label>
                        <select
                          value={digestDeliveryTime}
                          onChange={(e) => setDigestDeliveryTime(e.target.value)}
                          className="w-full px-3 py-2 text-xs rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white"
                        >
                          <option value="08:00 AM">08:00 AM Daily (Morning)</option>
                          <option value="12:00 PM">12:00 PM Daily (Midday)</option>
                          <option value="06:00 PM">06:00 PM Daily (Evening)</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {formError && (
                <div className="p-2.5 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs text-red-700 dark:text-red-300">
                  {formError}
                </div>
              )}

              <div className="pt-3 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreating(false);
                    setFormError(null);
                  }}
                  className="px-3.5 py-2 text-xs font-semibold rounded-lg border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-neutral-900 dark:bg-neutral-100 dark:text-neutral-900 rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors"
                >
                  Save Alert Rule
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
