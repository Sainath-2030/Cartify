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
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val || 0);

export const formatNumber = (val) =>
  new Intl.NumberFormat('en-US').format(val || 0);

/**
 * Recharts cannot consume Tailwind/CSS-variable color strings for SVG fills in a
 * predictable way across browsers, so chart chrome needs concrete hex values that
 * swap with the theme. These mirror the CSS custom properties in index.css.
 */
export const getChartTheme = (isDark) =>
  isDark
    ? {
        grid: '#2A2A2E',
        axis: '#3A3A40',
        tick: '#9A9AA1',
        tooltipBg: '#202024',
        tooltipBorder: '#3A3A40',
        tooltipText: '#F5F5F7',
        labelText: '#E4E4E7',
        emptyText: '#9A9AA1'
      }
    : {
        grid: '#E2E8F0',
        axis: '#CBD5E1',
        tick: '#64748B',
        tooltipBg: '#FFFFFF',
        tooltipBorder: '#CBD5E1',
        tooltipText: '#0F172A',
        labelText: '#334155',
        emptyText: '#64748B'
      };

/** Shared Recharts Tooltip styling that stays readable in both themes. */
export const tooltipStyle = (isDark) => {
  const t = getChartTheme(isDark);
  return {
    backgroundColor: t.tooltipBg,
    border: `1px solid ${t.tooltipBorder}`,
    borderRadius: '8px',
    color: t.tooltipText,
    fontSize: '12px',
    boxShadow: '0 8px 24px rgba(0,0,0,0.18)'
  };
};

export const axisTick = (isDark) => ({ fontSize: 11, fill: getChartTheme(isDark).tick });

/** Palette shared by the warehouse category donut and legend swatches. */
export const CATEGORY_COLORS = ['#22d3ee', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#ef4444'];

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
