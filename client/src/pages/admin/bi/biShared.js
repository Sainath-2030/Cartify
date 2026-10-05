// Shared formatters, grain labels, and cluster styling for the BI dashboard panels.
// Extracted from AdminBIDashboard.jsx to avoid duplication across panel components.

export const grainLabels = {
  day: 'Daily',
  week: 'Weekly',
  month: 'Monthly',
  quarter: 'Quarterly',
  year: 'Yearly'
};

export const formatCurrency = (val) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val || 0);

export const formatNumber = (val) =>
  new Intl.NumberFormat('en-US').format(val || 0);

export const CLUSTER_CONFIG = {
  champions: {
    label: 'Champions / High-Value',
    color: '#10b981',
    bg: 'bg-emerald-500/15',
    border: 'border-emerald-500/30',
    text: 'text-emerald-400',
    dot: 'bg-emerald-400',
    badge: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
  },
  loyal: {
    label: 'Loyal Customers',
    color: '#0ea5e9',
    bg: 'bg-sky-500/15',
    border: 'border-sky-500/30',
    text: 'text-sky-400',
    dot: 'bg-sky-400',
    badge: 'bg-sky-500/15 text-sky-400 border-sky-500/30'
  },
  at_risk: {
    label: 'At-Risk / Potential Churn',
    color: '#f59e0b',
    bg: 'bg-amber-500/15',
    border: 'border-amber-500/30',
    text: 'text-amber-400',
    dot: 'bg-amber-400',
    badge: 'bg-amber-500/15 text-amber-400 border-amber-500/30'
  },
  new_inactive: {
    label: 'New / Inactive Explorers',
    color: '#8b5cf6',
    bg: 'bg-violet-500/15',
    border: 'border-violet-500/30',
    text: 'text-violet-400',
    dot: 'bg-violet-400',
    badge: 'bg-violet-500/15 text-violet-400 border-violet-500/30'
  }
};
