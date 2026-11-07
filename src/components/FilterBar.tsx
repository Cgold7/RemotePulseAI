import React from 'react';
import { Search, MapPin, DollarSign, GraduationCap, Briefcase, BellPlus, RotateCcw } from 'lucide-react';
import { JobFilters, EducationLevel, IndustryField } from '../types';

interface FilterBarProps {
  filters: JobFilters;
  onChange: (filters: JobFilters) => void;
  onSaveAsAlert: () => void;
  totalFilteredCount: number;
}

const EDUCATION_OPTIONS: { label: string; value: EducationLevel | 'All' }[] = [
  { label: 'Any Education', value: 'All' },
  { label: 'No Degree Required', value: 'No Degree Required' },
  { label: "Bachelor's Degree", value: "Bachelor's" },
  { label: "Master's Degree", value: "Master's" },
  { label: 'PhD', value: 'PhD' },
  { label: 'Certification / Specialized', value: 'Certification' },
];

const INDUSTRY_OPTIONS: IndustryField[] = [
  'All Fields',
  'Software Engineering',
  'Product & Design',
  'Data & AI',
  'Sales & Growth',
  'Marketing',
  'Operations & Finance',
  'Customer Support',
  'Healthcare & Science',
];

const LOCATION_OPTIONS = [
  { label: 'All Remote Locations', value: 'All' },
  { label: 'Worldwide / Anywhere', value: 'Worldwide' },
  { label: 'Americas / US Remote', value: 'Americas / US' },
  { label: 'Europe / EMEA Remote', value: 'Europe / EMEA' },
  { label: 'Asia-Pacific / APAC Remote', value: 'Asia-Pacific / APAC' },
];

const SALARY_PRESETS = [
  { label: 'Any Salary', value: 0 },
  { label: '$60k+', value: 60000 },
  { label: '$90k+', value: 90000 },
  { label: '$120k+', value: 120000 },
  { label: '$150k+', value: 150000 },
  { label: '$180k+', value: 180000 },
];

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  onChange,
  onSaveAsAlert,
  totalFilteredCount,
}) => {
  const handleReset = () => {
    onChange({
      search: '',
      location: 'All',
      minSalary: 0,
      education: 'All',
      industry: 'All Fields',
      batch: 'all',
      sort: 'newest',
    });
  };

  const hasActiveFilters =
    Boolean(filters.search) ||
    filters.location !== 'All' ||
    filters.minSalary > 0 ||
    filters.education !== 'All' ||
    filters.industry !== 'All Fields';

  return (
    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl p-5 shadow-xs">
      {/* Search Input Row */}
      <div className="relative mb-4">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-neutral-400">
          <Search className="w-4 h-4" />
        </div>
        <input
          type="text"
          value={filters.search}
          onChange={(e) => onChange({ ...filters, search: e.target.value })}
          placeholder="Search by job title, company, skills (e.g., React, AI, Systems Architect)..."
          className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white transition-all"
        />
        {filters.search && (
          <button
            onClick={() => onChange({ ...filters, search: '' })}
            className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-xs text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
          >
            Clear
          </button>
        )}
      </div>

      {/* Structured Filters Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* 1. Location Requirements */}
        <div>
          <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-neutral-400" />
            <span>Location Requirements</span>
          </label>
          <select
            value={filters.location}
            onChange={(e) => onChange({ ...filters, location: e.target.value })}
            className="w-full px-3 py-2 text-xs rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white"
          >
            {LOCATION_OPTIONS.map((loc) => (
              <option key={loc.value} value={loc.value}>
                {loc.label}
              </option>
            ))}
          </select>
        </div>

        {/* 2. Salary / Pay Rate */}
        <div>
          <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5 flex items-center gap-1.5">
            <DollarSign className="w-3.5 h-3.5 text-neutral-400" />
            <span>Min Salary / Pay Rate</span>
          </label>
          <select
            value={filters.minSalary}
            onChange={(e) => onChange({ ...filters, minSalary: Number(e.target.value) })}
            className="w-full px-3 py-2 text-xs font-mono tabular-nums rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white"
          >
            {SALARY_PRESETS.map((sal) => (
              <option key={sal.value} value={sal.value}>
                {sal.label}
              </option>
            ))}
          </select>
        </div>

        {/* 3. Education Level */}
        <div>
          <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5 flex items-center gap-1.5">
            <GraduationCap className="w-3.5 h-3.5 text-neutral-400" />
            <span>Level of Education</span>
          </label>
          <select
            value={filters.education}
            onChange={(e) => onChange({ ...filters, education: e.target.value as EducationLevel | 'All' })}
            className="w-full px-3 py-2 text-xs rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white"
          >
            {EDUCATION_OPTIONS.map((edu) => (
              <option key={edu.value} value={edu.value}>
                {edu.label}
              </option>
            ))}
          </select>
        </div>

        {/* 4. Industry Fields */}
        <div>
          <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5 flex items-center gap-1.5">
            <Briefcase className="w-3.5 h-3.5 text-neutral-400" />
            <span>Industry / Field</span>
          </label>
          <select
            value={filters.industry}
            onChange={(e) => onChange({ ...filters, industry: e.target.value as IndustryField })}
            className="w-full px-3 py-2 text-xs rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-neutral-900 dark:focus:ring-white"
          >
            {INDUSTRY_OPTIONS.map((field) => (
              <option key={field} value={field}>
                {field}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Footer bar with Count, Alert creation, and Sort */}
      <div className="mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400">
          <span className="font-semibold text-neutral-900 dark:text-white font-mono tabular-nums">
            {totalFilteredCount}
          </span>
          <span>remote jobs match your criteria</span>
          {hasActiveFilters && (
            <button
              onClick={handleReset}
              className="ml-2 inline-flex items-center gap-1 text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          {/* Save active filters as alert */}
          <button
            onClick={onSaveAsAlert}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors whitespace-nowrap font-medium"
          >
            <BellPlus className="w-3.5 h-3.5 text-neutral-500" />
            <span>Save as Job Alert</span>
          </button>

          {/* Sort Selector */}
          <div className="flex items-center gap-1">
            <span className="text-neutral-400 dark:text-neutral-500">Sort:</span>
            <select
              value={filters.sort}
              onChange={(e) => onChange({ ...filters, sort: e.target.value as JobFilters['sort'] })}
              className="px-2 py-1.5 text-xs rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 text-neutral-800 dark:text-neutral-200 focus:outline-none"
            >
              <option value="newest">Freshness (Newest)</option>
              <option value="salary_high">Highest Salary</option>
              <option value="company">Company (A-Z)</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};
