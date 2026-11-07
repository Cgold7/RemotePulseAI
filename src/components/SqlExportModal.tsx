import React, { useState } from 'react';
import { X, Database, Copy, Check, Download, Server, Cloud, ExternalLink } from 'lucide-react';
import { Job } from '../types';
import { generateSqlDump, SqlDialect } from '../utils/sqlExporter';

interface SqlExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobs: Job[];
}

export const SqlExportModal: React.FC<SqlExportModalProps> = ({
  isOpen,
  onClose,
  jobs,
}) => {
  const [dialect, setDialect] = useState<SqlDialect>('postgres');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const sqlDump = generateSqlDump(jobs, dialect);

  const handleCopy = () => {
    navigator.clipboard.writeText(sqlDump);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([sqlDump], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `remotepulse_${dialect}_schema.sql`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div 
        className="relative w-full max-w-3xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-xl overflow-hidden my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-neutral-900 dark:text-white">
                Free SQL Database & Cloud Deployment
              </h3>
              <p className="text-xs text-neutral-500">
                Export ready-to-run SQL schema & seeds for free SQL hosting
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

        {/* Body */}
        <div className="p-6 space-y-6 max-h-[72vh] overflow-y-auto">
          {/* Dialect Selector & Actions */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-neutral-500">SQL Engine:</span>
              <div className="flex items-center gap-1 p-1 bg-neutral-100 dark:bg-neutral-800 rounded-lg">
                <button
                  onClick={() => setDialect('postgres')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    dialect === 'postgres'
                      ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-xs'
                      : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                  }`}
                >
                  PostgreSQL (Neon / Supabase)
                </button>
                <button
                  onClick={() => setDialect('sqlite')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    dialect === 'sqlite'
                      ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-xs'
                      : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                  }`}
                >
                  SQLite (Turso / D1)
                </button>
                <button
                  onClick={() => setDialect('mysql')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    dialect === 'mysql'
                      ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-xs'
                      : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                  }`}
                >
                  MySQL (PlanetScale)
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied SQL!' : 'Copy Script'}</span>
              </button>
              <button
                onClick={handleDownload}
                className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-neutral-900 dark:bg-neutral-100 dark:text-neutral-900 rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download .sql</span>
              </button>
            </div>
          </div>

          {/* SQL Code Box */}
          <div className="relative rounded-xl bg-neutral-950 p-4 border border-neutral-800 text-neutral-300 font-mono text-xs max-h-64 overflow-y-auto">
            <pre className="whitespace-pre">{sqlDump}</pre>
          </div>

          {/* Free Web Hosting & Database Blueprint Guide */}
          <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 space-y-3">
            <h4 className="text-xs font-bold text-neutral-900 dark:text-white flex items-center gap-2">
              <Cloud className="w-4 h-4 text-neutral-500" />
              <span>Recommended Free Deployment Blueprint ($0/month)</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
                <span className="font-bold text-neutral-800 dark:text-neutral-200 block mb-1">
                  1. Free SQL Database
                </span>
                <p className="text-neutral-500 leading-relaxed mb-2">
                  Create a free serverless PostgreSQL database on <strong className="text-neutral-700 dark:text-neutral-300">Neon.tech</strong> or <strong className="text-neutral-700 dark:text-neutral-300">Supabase.com</strong> (or SQLite on <strong className="text-neutral-700 dark:text-neutral-300">Turso.tech</strong>). Paste this SQL script into the SQL editor tab to create tables and seed jobs.
                </p>
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">Free Tier: 0.5 GB included</span>
              </div>

              <div className="p-3 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
                <span className="font-bold text-neutral-800 dark:text-neutral-200 block mb-1">
                  2. Free Backend Host
                </span>
                <p className="text-neutral-500 leading-relaxed mb-2">
                  Deploy the Node.js Express server to <strong className="text-neutral-700 dark:text-neutral-300">Render.com</strong>, <strong className="text-neutral-700 dark:text-neutral-300">Railway.app</strong>, or <strong className="text-neutral-700 dark:text-neutral-300">Fly.io</strong>. Set <code className="font-mono text-[10px]">GEMINI_API_KEY</code> in your environment secrets.
                </p>
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">Free Web Service tier</span>
              </div>

              <div className="p-3 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800">
                <span className="font-bold text-neutral-800 dark:text-neutral-200 block mb-1">
                  3. Free Frontend Host
                </span>
                <p className="text-neutral-500 leading-relaxed mb-2">
                  Deploy the Vite React build to <strong className="text-neutral-700 dark:text-neutral-300">Vercel</strong>, <strong className="text-neutral-700 dark:text-neutral-300">Cloudflare Pages</strong>, or serve directly through Express on Render with automated SSL.
                </p>
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">Unlimited free bandwidth</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
