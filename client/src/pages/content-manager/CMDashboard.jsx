import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Package,
  PlusCircle,
  LayoutGrid,
  ArrowRight,
  Boxes,
  CheckCircle2,
  TrendingUp,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { contentManagerService } from '../../services/contentManagerService.js';

export default function CMDashboard() {
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalCategories: 0,
    loading: true,
  });

  useEffect(() => {
    async function loadStats() {
      try {
        const [prodRes, catRes] = await Promise.all([
          contentManagerService.listProducts({ limit: 1 }),
          contentManagerService.listCategories(),
        ]);
        setStats({
          totalProducts: prodRes?.pagination?.total || 0,
          totalCategories: catRes?.data?.length || 0,
          loading: false,
        });
      } catch (err) {
        console.error('Failed to load dashboard metrics:', err);
        setStats((prev) => ({ ...prev, loading: false }));
      }
    }
    loadStats();
  }, []);

  const CARDS = [
    {
      title: 'Products Catalogue',
      badge: stats.loading ? '...' : `${stats.totalProducts.toLocaleString()} items`,
      description: 'Filter, inspect, edit prices, update inventory stock, and toggle active visibility.',
      to: '/content-manager/products',
      icon: Package,
      action: 'Manage Products',
    },
    {
      title: 'Add New Product',
      badge: 'Interactive Studio',
      description: 'Create new items with automated slug generation, pricing calculators, and live card preview.',
      to: '/content-manager/products/new',
      icon: PlusCircle,
      action: 'Publish Product',
    },
    {
      title: 'Categories & Departments',
      badge: stats.loading ? '...' : `${stats.totalCategories} departments`,
      description: 'Organize storefront categories, update covers, and inspect product distribution.',
      to: '/content-manager/categories',
      icon: LayoutGrid,
      action: 'Manage Categories',
    },
  ];

  return (
    <div className="flex flex-col gap-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border-subtle pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-accent/10 text-accent border border-accent/20">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Content Studio Operational
            </span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-ink">Content Studio</h1>
          <p className="text-sm text-muted mt-1 max-w-2xl">
            Centralized hub for managing Cartify's product catalogue, publishing items, and organizing departments.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/content-manager/products/new"
            className="flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-xs font-semibold text-accent-ink hover:bg-accent-hover transition-colors shadow-xs"
          >
            <PlusCircle className="h-4 w-4" />
            Add Product
          </Link>
          <Link
            to="/"
            target="_blank"
            className="flex items-center gap-1.5 rounded-lg border border-border-subtle bg-card px-3.5 py-2 text-xs font-medium text-ink hover:bg-card-elevated transition-colors"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            View Storefront
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="card p-5 bg-card border border-border-subtle shadow-xs space-y-1">
          <div className="flex items-center justify-between text-muted text-xs">
            <span>Total Catalogue Products</span>
            <Package className="h-4 w-4 text-accent" />
          </div>
          <p className="text-2xl font-extrabold text-ink">
            {stats.loading ? '—' : stats.totalProducts.toLocaleString()}
          </p>
          <p className="text-[11px] text-muted">Indexed across all departments</p>
        </div>

        <div className="card p-5 bg-card border border-border-subtle shadow-xs space-y-1">
          <div className="flex items-center justify-between text-muted text-xs">
            <span>Storefront Categories</span>
            <LayoutGrid className="h-4 w-4 text-accent" />
          </div>
          <p className="text-2xl font-extrabold text-ink">
            {stats.loading ? '—' : stats.totalCategories}
          </p>
          <p className="text-[11px] text-muted">Active navigation hierarchies</p>
        </div>

        <div className="card p-5 bg-card border border-border-subtle shadow-xs space-y-1">
          <div className="flex items-center justify-between text-muted text-xs">
            <span>Catalog Status</span>
            <Sparkles className="h-4 w-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
            Live & Synchronized
          </p>
          <p className="text-[11px] text-muted">PostgreSQL Full-Text Search active</p>
        </div>
      </div>

      {/* Quick Action Cards */}
      <div>
        <h2 className="text-base font-bold text-ink mb-4">Studio Workspace</h2>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {CARDS.map(({ title, badge, description, to, icon: Icon, action }) => (
            <Link
              key={to}
              to={to}
              className="card group flex flex-col justify-between p-6 bg-card border border-border-subtle hover:border-accent/50 hover:shadow-cardHover transition-all rounded-xl"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent/10 text-accent group-hover:scale-105 transition-transform">
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="rounded-full bg-card-elevated border border-border-subtle px-2.5 py-0.5 text-[11px] font-semibold text-muted">
                    {badge}
                  </span>
                </div>
                <div>
                  <h3 className="text-base font-bold text-ink group-hover:text-accent transition-colors">
                    {title}
                  </h3>
                  <p className="text-xs text-muted mt-1 leading-relaxed">{description}</p>
                </div>
              </div>

              <div className="mt-6 flex items-center gap-1.5 text-xs font-bold text-accent pt-4 border-t border-border-subtle/60">
                {action}
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}