import { AlertCircle, RefreshCw } from 'lucide-react';
import { MagneticButton } from './MagneticButton';

export function SkeletonBlock({ className = 'h-24 w-full' }) {
  return (
    <div
      aria-hidden="true"
      className={`animate-pulse rounded-xl bg-slate-200/70 dark:bg-slate-800/70 ${className}`}
    />
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6" aria-label="Loading air quality dashboard">
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        <SkeletonBlock className="h-72 lg:col-span-5" />
        <SkeletonBlock className="h-72 lg:col-span-7" />
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <SkeletonBlock className="h-44" />
        <SkeletonBlock className="h-44" />
      </div>
    </div>
  );
}

export function ErrorRetryCard({ title = 'Unable to load air data', message, onRetry }) {
  return (
    <div
      role="alert"
      className="glass-card rounded-2xl border border-orange-500/30 p-6 text-center"
    >
      <AlertCircle className="mx-auto h-10 w-10 text-orange-400" />
      <h3 className="mt-3 text-base font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
        {message || 'Network or sensor timeout occurred. You can retry safely.'}
      </p>
      {onRetry && (
        <div className="mt-4 flex justify-center">
          <MagneticButton onClick={onRetry} variant="secondary">
            <RefreshCw className="h-4 w-4" />
            Retry
          </MagneticButton>
        </div>
      )}
    </div>
  );
}
