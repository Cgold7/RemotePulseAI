import React from 'react';
import { Bell, ShieldCheck, Bot, Bookmark, Sparkles } from 'lucide-react';

interface HeaderProps {
  onOpenAlerts: () => void;
  onOpenAgentCrawler: () => void;
  alertMatchCount: number;
  savedJobsCount: number;
  onToggleSavedView: () => void;
  isShowingSavedOnly: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenAlerts,
  onOpenAgentCrawler,
  alertMatchCount,
  savedJobsCount,
  onToggleSavedView,
  isShowingSavedOnly,
}) => {
  return (
    <header className="border-b border-neutral-200 dark:border-neutral-800 bg-white/95 dark:bg-neutral-900/95 sticky top-0 z-40 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Zone 1: Single text element wordmark */}
        <div className="flex items-center gap-2 shrink-0">
          <a href="#" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-neutral-900 dark:bg-neutral-100 flex items-center justify-center text-white dark:text-neutral-900 font-bold text-sm shadow-xs transition-transform group-hover:scale-105">
              RP
            </div>
            <span className="text-lg font-bold tracking-tight text-neutral-900 dark:text-white whitespace-nowrap">
              RemotePulse <span className="text-neutral-500 font-medium">AI</span>
            </span>
          </a>
        </div>

        {/* Zone 2: Clean single-line text navigation links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-neutral-600 dark:text-neutral-400">
          <button
            onClick={() => {
              if (isShowingSavedOnly) onToggleSavedView();
            }}
            className={`transition-colors whitespace-nowrap ${
              !isShowingSavedOnly
                ? 'text-neutral-900 dark:text-white font-semibold'
                : 'hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            Daily Feed
          </button>
          <button
            onClick={onToggleSavedView}
            className={`flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              isShowingSavedOnly
                ? 'text-neutral-900 dark:text-white font-semibold'
                : 'hover:text-neutral-900 dark:hover:text-white'
            }`}
          >
            <Bookmark className="w-4 h-4" />
            <span>Saved Jobs</span>
            {savedJobsCount > 0 && (
              <span className="font-mono text-xs tabular-nums text-neutral-500 dark:text-neutral-400">
                ({savedJobsCount})
              </span>
            )}
          </button>
          <button
            onClick={onOpenAgentCrawler}
            className="flex items-center gap-1.5 hover:text-neutral-900 dark:hover:text-white transition-colors whitespace-nowrap"
          >
            <Bot className="w-4 h-4" />
            <span>AI Crawler</span>
          </button>
          <button
            onClick={onOpenAlerts}
            className="flex items-center gap-1.5 hover:text-neutral-900 dark:hover:text-white transition-colors whitespace-nowrap"
          >
            <Bell className="w-4 h-4" />
            <span>Alerts</span>
          </button>
        </nav>

        {/* Zone 3: Alert bell + Create Alert action button */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={onOpenAlerts}
            aria-label="View notifications and alerts"
            className="relative p-2 rounded-lg text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <Bell className="w-5 h-5" />
            {alertMatchCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500" />
            )}
          </button>

          <button
            onClick={onOpenAlerts}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-neutral-900 dark:bg-neutral-100 dark:text-neutral-900 rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors whitespace-nowrap shadow-xs"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Create Alert</span>
          </button>
        </div>
      </div>
    </header>
  );
};
