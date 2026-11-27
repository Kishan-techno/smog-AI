import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BellRing, X } from 'lucide-react';
import { apiFetch } from '../../utils/apiClient';
import { useLanguage } from '../../app/LanguageContext';

const SEVERITY_STYLES = {
  high: 'border-orange-500/40 bg-orange-500/10 text-orange-700 dark:text-orange-200',
  medium: 'border-amber-500/35 bg-amber-500/10 text-amber-800 dark:text-amber-200',
  low: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200',
};

export function AlertsStrip({ selectedCity }) {
  const { t } = useLanguage();
  const [dismissed, setDismissed] = useState([]);

  const alertsQuery = useQuery({
    queryKey: ['alerts', selectedCity],
    queryFn: () => apiFetch(`/alerts?city=${encodeURIComponent(selectedCity)}`),
    staleTime: 5 * 60 * 1000,
  });

  const visible = (alertsQuery.data?.alerts || []).filter((a) => !dismissed.includes(a.id));
  if (!visible.length) return null;

  return (
    <section
      aria-label={t('alertsHeading')}
      className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8"
    >
      <div className="space-y-2">
        {visible.slice(0, 2).map((alert) => (
          <div
            key={alert.id}
            className={`flex items-start justify-between gap-3 rounded-xl border px-4 py-2.5 text-xs ${
              SEVERITY_STYLES[alert.severity] || SEVERITY_STYLES.medium
            }`}
          >
            <div className="flex items-start gap-2.5">
              <BellRing className="mt-0.5 h-4 w-4 shrink-0" />
              <div>
                <span className="font-semibold">{alert.title}: </span>
                <span>{alert.detail}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setDismissed((d) => [...d, alert.id])}
              aria-label="Dismiss alert"
              className="rounded p-0.5 opacity-70 hover:opacity-100"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
