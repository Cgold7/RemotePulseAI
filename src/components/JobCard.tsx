import React from 'react';
import { ExternalLink, Bookmark, Sparkles, Check, Building2, MapPin } from 'lucide-react';
import { Job } from '../types';
import { formatSalary } from '../utils/jobFilters';

interface JobCardProps {
  job: Job;
  onSelect: (job: Job) => void;
  isSaved: boolean;
  onToggleSave: (jobId: string) => void;
}

export const JobCard: React.FC<JobCardProps> = ({
  job,
  onSelect,
  isSaved,
  onToggleSave,
}) => {
  const salaryText = formatSalary(job);

  return (
    <div className="group relative border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 rounded-xl p-5 hover:border-neutral-400 dark:hover:border-neutral-600 transition-all shadow-xs hover:shadow-md">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {/* Header row: Company and Source */}
          <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400 mb-1.5 flex-wrap">
            <span className="font-semibold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-neutral-400" />
              {job.company}
            </span>
            {(job.atsPlatform || job.isDirectCompanyListing) && (
              <>
                <span aria-hidden="true">·</span>
                <span className="text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1">
                  <Check className="w-3 h-3 text-emerald-500" />
                  <span>
                    {job.atsPlatform && job.atsPlatform !== 'Direct'
                      ? `${job.atsPlatform} Direct`
                      : 'Direct Company'}
                  </span>
                  {job.companyDomain && (
                    <span className="font-mono text-[11px] text-emerald-600 dark:text-emerald-300">
                      ({job.companyDomain})
                    </span>
                  )}
                </span>
              </>
            )}
            <span aria-hidden="true">·</span>
            <span>{job.industry}</span>
            <span aria-hidden="true">·</span>
            <span className="text-neutral-400 dark:text-neutral-500">via {job.sourceSite}</span>
            {job.isFeatured && (
              <>
                <span aria-hidden="true">·</span>
                <span className="text-amber-600 dark:text-amber-400 font-medium">Featured</span>
              </>
            )}
          </div>

          {/* Job Title */}
          <h3
            onClick={() => onSelect(job)}
            className="text-base sm:text-lg font-bold text-neutral-900 dark:text-white group-hover:text-neutral-700 dark:group-hover:text-neutral-200 cursor-pointer transition-colors leading-snug line-clamp-1"
          >
            {job.title}
          </h3>

          {/* Unboxed Metadata Line with typographic separators (Zero-pill discipline) */}
          <div className="flex items-center gap-2 text-xs text-neutral-600 dark:text-neutral-400 mt-2 flex-wrap">
            <span className="flex items-center gap-1 font-medium text-neutral-700 dark:text-neutral-300">
              <MapPin className="w-3.5 h-3.5 text-neutral-400" />
              {job.location}
            </span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums font-semibold text-neutral-900 dark:text-neutral-100">
              {salaryText}
            </span>
            <span aria-hidden="true">·</span>
            <span className="text-neutral-600 dark:text-neutral-300">
              Education: <strong className="font-medium text-neutral-900 dark:text-neutral-200">{job.education}</strong>
            </span>
            <span aria-hidden="true">·</span>
            <span className="text-neutral-500">{job.experienceLevel}</span>
          </div>

          {/* Summary */}
          <p className="mt-3 text-sm text-neutral-600 dark:text-neutral-400 line-clamp-2 leading-relaxed">
            {job.summary}
          </p>

          {/* Key Skills */}
          {job.skills && job.skills.length > 0 && (
            <div className="mt-3.5 flex items-center gap-2 flex-wrap text-xs text-neutral-500 dark:text-neutral-400">
              <span className="font-medium text-neutral-400 dark:text-neutral-500">Skills:</span>
              {job.skills.slice(0, 5).map((skill, index) => (
                <span key={index} className="inline-flex items-center text-neutral-700 dark:text-neutral-300">
                  {skill}
                  {index < Math.min(job.skills.length, 5) - 1 && <span className="ml-2 text-neutral-300 dark:text-neutral-700">/</span>}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Right actions */}
        <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-neutral-100 dark:border-neutral-800 shrink-0">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onToggleSave(job.id)}
              aria-label={isSaved ? `Remove ${job.title} from saved jobs` : `Save ${job.title}`}
              className={`p-2 rounded-lg border transition-colors ${
                isSaved
                  ? 'border-neutral-900 bg-neutral-900 text-white dark:border-white dark:bg-white dark:text-neutral-900'
                  : 'border-neutral-200 dark:border-neutral-800 text-neutral-500 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-50 dark:hover:bg-neutral-800'
              }`}
            >
              <Bookmark className="w-4 h-4" />
            </button>

            <button
              onClick={() => onSelect(job)}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors whitespace-nowrap"
            >
              Details
            </button>
          </div>

          <a
            href={job.referralUrl || job.applyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 px-4 py-2 text-xs font-semibold text-white bg-neutral-900 dark:bg-neutral-100 dark:text-neutral-900 rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors whitespace-nowrap shadow-xs"
          >
            <span>Apply Now</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          {job.referralCode && (
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
              Referral Link Active
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
