import { useState } from 'react';
import { ChevronDown, Info, Clock, Database, Shield, Printer } from 'lucide-react';
import { TiltGlassCard } from '../ui/TiltGlassCard';
import { StreamingText } from '../motion/StreamingText';
import { formatTimeIST } from '../../utils/aqiTokens';
import { useLanguage } from '../../app/LanguageContext';

const PRIORITY_STYLE = {
  high: 'bg-orange-500/15 text-orange-600 dark:text-orange-300 border-orange-500/30',
  medium: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30',
  low: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
};

export function ActionPlanSection({ plan }) {
  const { t } = useLanguage();
  const [expandedId, setExpandedId] = useState(null);

  const handlePrint = () => {
    window.print();
  };

  if (!plan?.items?.length) {
    return (
      <div className="glass-card rounded-2xl p-6 text-center text-sm text-slate-500">
        {t('emptyPlan')}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="font-display text-xl font-bold">{t('planTitle')}</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {t('sourceLabel')} {plan.dataSource} · {t('updatedLabel')}{' '}
            {formatTimeIST(plan.stationTimestamp)} · {t('confidenceLabel')}{' '}
            <span className="font-semibold uppercase text-cyan-400">
              {plan.confidence?.level} ({Math.round((plan.confidence?.score || 0.7) * 100)}%)
            </span>
          </p>
        </div>
        <button
          type="button"
          onClick={handlePrint}
          className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-500/30 bg-white/70 px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-cyan-400 hover:bg-cyan-500/10 dark:border-cyan-400/25 dark:bg-slate-900/80 dark:text-slate-200"
          title={t('exportPrintBtn')}
        >
          <Printer className="h-3.5 w-3.5 text-cyan-400" />
          <span>{t('exportPrintBtn')}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {plan.items.map((item) => {
          const isOpen = expandedId === item.id;
          return (
            <TiltGlassCard key={item.id} gradientBorder={item.priority === 'high'} className="p-5">
              <div className="flex items-start justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 font-mono text-xs text-slate-500 dark:text-slate-400">
                  <Clock className="h-3.5 w-3.5 text-cyan-400" />
                  {item.timeWindow}
                </span>
                <span
                  className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase ${
                    PRIORITY_STYLE[item.priority] || PRIORITY_STYLE.medium
                  }`}
                >
                  {item.priority}
                </span>
              </div>

              <h4 className="mt-2 font-display text-base font-bold">{item.title}</h4>
              <p className="mt-2 text-sm leading-relaxed text-slate-700 dark:text-slate-200">
                <StreamingText text={item.action} />
              </p>

              <div className="mt-3 rounded-xl bg-slate-200/50 p-2.5 text-xs text-slate-700 dark:bg-slate-800/60 dark:text-slate-300">
                <span className="font-semibold">{t('whyLabel')} </span>
                {item.why}
              </div>

              <button
                type="button"
                aria-expanded={isOpen}
                onClick={() => setExpandedId(isOpen ? null : item.id)}
                className="mt-3 flex w-full items-center justify-between text-xs font-medium text-cyan-600 hover:underline dark:text-cyan-400"
              >
                <span className="inline-flex items-center gap-1">
                  <Info className="h-3.5 w-3.5" />
                  {t('impactSourceAssumptions')}
                </span>
                <ChevronDown
                  className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {isOpen && (
                <div className="mt-3 space-y-2 border-t border-slate-200/70 pt-3 text-xs text-slate-600 dark:border-slate-700/70 dark:text-slate-300">
                  <p>
                    <strong className="text-slate-900 dark:text-slate-100">{t('expectedImpact')} </strong>
                    {item.impact}
                  </p>
                  <p className="inline-flex items-center gap-1 text-[11px] text-slate-500">
                    <Database className="h-3 w-3" />
                    {item.dataSource} · {formatTimeIST(item.stationTimestamp)}
                  </p>
                  <div>
                    <strong className="text-slate-900 dark:text-slate-100">{t('assumptionsLabel')}</strong>
                    <ul className="mt-1 list-disc space-y-0.5 pl-4">
                      {item.assumptions?.map((a, idx) => (
                        <li key={idx}>{a}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </TiltGlassCard>
          );
        })}
      </div>

      <div className="flex items-start gap-2 rounded-xl border border-slate-300/60 bg-slate-100/70 p-3 text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-400">
        <Shield className="mt-0.5 h-4 w-4 shrink-0 text-cyan-400" />
        <span>{plan.disclaimer}</span>
      </div>
    </div>
  );
}
