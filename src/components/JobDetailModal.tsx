import React, { useState } from 'react';
import { X, ExternalLink, Bookmark, Check, Building2, MapPin, GraduationCap, DollarSign, Calendar, ShieldCheck, Share2 } from 'lucide-react';
import { Job } from '../types';
import { formatSalary } from '../utils/jobFilters';

interface JobDetailModalProps {
  job: Job | null;
  onClose: () => void;
  isSaved: boolean;
  onToggleSave: (jobId: string) => void;
}

export const JobDetailModal: React.FC<JobDetailModalProps> = ({
  job,
  onClose,
  isSaved,
  onToggleSave,
}) => {
  const [copied, setCopied] = useState(false);

  if (!job) return null;

  const salaryDisplay = formatSalary(job);
  const formattedDate = new Date(job.postedDate).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const handleCopyLink = () => {
    navigator.clipboard.writeText(job.referralUrl || job.applyUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div 
        className="relative w-full max-w-2xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-xl overflow-hidden my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400 flex-wrap">
            <span className="font-semibold text-neutral-800 dark:text-neutral-200">{job.company}</span>
            {(job.atsPlatform || job.isDirectCompanyListing) && (
              <>
                <span aria-hidden="true">·</span>
                <span className="text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1">
                  <Check className="w-3 h-3 text-emerald-500" />
                  <span>
                    {job.atsPlatform && job.atsPlatform !== 'Direct'
                      ? `${job.atsPlatform} Direct Posting`
                      : 'Direct Company Listing'}
                  </span>
                  {job.companyDomain && <span>({job.companyDomain})</span>}
                </span>
              </>
            )}
            <span aria-hidden="true">·</span>
            <span>{job.industry}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onToggleSave(job.id)}
              aria-label={isSaved ? 'Remove from saved jobs' : 'Save job'}
              className={`p-2 rounded-lg border transition-colors ${
                isSaved
                  ? 'border-neutral-900 bg-neutral-900 text-white dark:border-white dark:bg-white dark:text-neutral-900'
                  : 'border-neutral-200 dark:border-neutral-800 text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              <Bookmark className="w-4 h-4" />
            </button>

            <button
              onClick={handleCopyLink}
              title="Copy referral link"
              className="p-2 rounded-lg border border-neutral-200 dark:border-neutral-800 text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Share2 className="w-4 h-4" />}
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-lg text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Job Title & Key Metrics */}
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white leading-tight">
              {job.title}
            </h2>

            {/* Structured Specifications Grid */}
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 text-xs">
              <div>
                <span className="text-neutral-400 block mb-0.5">Compensation</span>
                <span className="font-mono tabular-nums font-bold text-neutral-900 dark:text-white text-sm">
                  {salaryDisplay}
                </span>
              </div>
              <div>
                <span className="text-neutral-400 block mb-0.5">Education</span>
                <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                  {job.education}
                </span>
              </div>
              <div>
                <span className="text-neutral-400 block mb-0.5">Location</span>
                <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                  {job.location}
                </span>
              </div>
              <div>
                <span className="text-neutral-400 block mb-0.5">Verified Date</span>
                <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                  {formattedDate}
                </span>
              </div>
            </div>
          </div>

          {/* Referral Link Verification Notice */}
          {job.referralCode && (
            <div className="p-3.5 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div className="text-xs">
                <p className="font-semibold text-emerald-900 dark:text-emerald-300">
                  Verified Referral Link Active
                </p>
                <p className="text-emerald-700 dark:text-emerald-400/90 mt-0.5">
                  Application destination carries your affiliate referral query parameter (<code className="font-mono">{job.referralCode}</code>).
                </p>
              </div>
            </div>
          )}

          {/* Summary */}
          <div>
            <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">Role Overview</h4>
            <p className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">
              {job.summary}
            </p>
          </div>

          {/* Detailed Description */}
          {job.description && (
            <div>
              <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">Detailed Specifications</h4>
              <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed whitespace-pre-line">
                {job.description}
              </p>
            </div>
          )}

          {/* Required Skills & Technologies */}
          {job.skills && job.skills.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2">Required Skills & Tooling</h4>
              <div className="flex flex-wrap gap-2">
                {job.skills.map((skill, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 text-xs rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 font-medium"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-neutral-400 text-center sm:text-left">
            Source: <span className="font-medium text-neutral-700 dark:text-neutral-300">{job.sourceSite}</span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-lg border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            >
              Close
            </button>
            <a
              href={job.referralUrl || job.applyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-neutral-900 dark:bg-neutral-100 dark:text-neutral-900 rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors shadow-xs"
            >
              <span>Apply Directly on Company Site</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
