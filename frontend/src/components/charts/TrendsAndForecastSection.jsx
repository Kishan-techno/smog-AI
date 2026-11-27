import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from 'recharts';
import { TrendingUp, AlertCircle, Clock, ShieldAlert } from 'lucide-react';
import { apiFetch } from '../../utils/apiClient';
import { formatTimeIST, getAqiToken } from '../../utils/aqiTokens';
import { TiltGlassCard } from '../ui/TiltGlassCard';
import { SkeletonBlock, ErrorRetryCard } from '../ui/Skeleton';
import { useLanguage } from '../../app/LanguageContext';

function ForecastTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const pt = payload[0]?.payload;
  if (!pt) return null;
  const aqiVal = pt.forecastAqi ?? pt.historyAqi;
  const token = getAqiToken(aqiVal);

  return (
    <div className="glass-card-strong rounded-xl border border-slate-700/80 p-3 text-xs shadow-xl">
      <p className="font-mono text-[11px] text-slate-400">{pt.fullTime}</p>
      <div className="mt-1 flex items-center gap-2">
        <span className="font-mono text-base font-bold" style={{ color: token.color }}>
          AQI {aqiVal}
        </span>
        <span className="text-slate-300">({token.label})</span>
      </div>
      {pt.pm25 != null && <p className="mt-0.5 text-slate-400">PM2.5: {pt.pm25} µg/m³</p>}
      {pt.bandRange && (
        <p className="mt-0.5 text-sky-400">
          Confidence Band: {pt.bandRange[0]} – {pt.bandRange[1]}
        </p>
      )}
      <p className="mt-1 text-[10px] uppercase tracking-wider text-cyan-400">
        {pt.kind === 'forecast' ? 'ML Forecast' : 'Observed History'}
      </p>
    </div>
  );
}

export default function TrendsAndForecastSection({ selectedCity }) {
  const { t } = useLanguage();
  const [horizon, setHorizon] = useState(48);

  const forecastQuery = useQuery({
    queryKey: ['forecast', selectedCity, horizon],
    queryFn: () =>
      apiFetch(`/forecast?city=${encodeURIComponent(selectedCity)}&hours=${horizon}`),
    staleTime: 5 * 60 * 1000,
  });

  const data = forecastQuery.data;

  const chartData = useMemo(() => {
    if (!data) return [];
    const hist = (data.history || []).slice(-18).map((p) => ({
      label: new Date(p.timestamp).toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }),
      fullTime: formatTimeIST(p.timestamp),
      historyAqi: p.aqi,
      pm25: p.pm25,
      kind: 'history',
    }));

    const fc =
      data.forecast?.status === 'ok'
        ? (data.forecast.points || []).map((p) => ({
            label: `+${p.hour_offset}h`,
            fullTime: formatTimeIST(p.timestamp),
            forecastAqi: p.aqi,
            bandRange: [p.lower_aqi, p.upper_aqi],
            pm25: p.pm25,
            kind: 'forecast',
          }))
        : [];

    // Bridge last history point smoothly into first forecast point
    if (hist.length && fc.length) {
      const lastH = hist[hist.length - 1];
      lastH.forecastAqi = lastH.historyAqi;
    }

    return [...hist, ...fc];
  }, [data]);

  const isUnavailable = data?.forecast?.status === 'forecast unavailable';

  return (
    <section id="forecast" className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-500/30 bg-sky-500/10 px-3 py-1 text-xs font-semibold text-sky-600 dark:text-sky-300">
            <TrendingUp className="h-3.5 w-3.5" />
            {t('forecastBadge')}
          </span>
          <h2 className="mt-2 font-display text-2xl font-bold tracking-tight sm:text-3xl">
            {t('forecastTitlePrefix')} {horizon}{t('forecastTitleSuffix')}
          </h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{t('forecastSub')}</p>
        </div>

        <div className="flex items-center gap-2 self-start rounded-xl border border-slate-200/70 bg-white/60 p-1 dark:border-slate-800 dark:bg-slate-900/70">
          {[24, 48].map((h) => (
            <button
              key={h}
              type="button"
              onClick={() => setHorizon(h)}
              className={`rounded-lg px-3 py-1.5 font-mono text-xs font-semibold transition-colors ${
                horizon === h
                  ? 'bg-gradient-to-r from-cyan-400 to-violet-500 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-300'
              }`}
            >
              {h === 24 ? t('forecast24Btn') : t('forecast48Btn')}
            </button>
          ))}
        </div>
      </div>

      {forecastQuery.isLoading ? (
        <SkeletonBlock className="h-96 w-full" />
      ) : forecastQuery.isError ? (
        <ErrorRetryCard
          title="Unable to load historical trends & forecast"
          message={forecastQuery.error?.message}
          onRetry={() => forecastQuery.refetch()}
        />
      ) : (
        <TiltGlassCard disableTilt className="hud-corners p-5 sm:p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-cyan-400" />
              {t('sourceLabel')} {data.historySource} · {t('freshnessLabel')}{' '}
              <strong className="uppercase text-cyan-400">{data.dataQuality}</strong>
            </span>
            {!isUnavailable && data.forecast?.confidence && (
              <span>
                {t('forecastConfLabel')}{' '}
                <strong className="uppercase text-violet-400">
                  {data.forecast.confidence.label} ({Math.round(data.forecast.confidence.score * 100)}
                  %)
                </strong>{' '}
                · {t('engineLabel')} {data.forecastEngine}
              </span>
            )}
          </div>

          {isUnavailable ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-amber-500/30 bg-amber-500/10 p-10 text-center">
              <AlertCircle className="h-10 w-10 text-amber-400" />
              <h3 className="mt-3 font-display text-lg font-bold">{t('forecastUnavailable')}</h3>
              <p className="mt-1 max-w-md text-sm text-slate-600 dark:text-slate-300">
                {data.forecast.reason}
              </p>
            </div>
          ) : (
            <div className="h-[320px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 10, right: 16, left: -12, bottom: 0 }}>
                  <defs>
                    <linearGradient id="bandFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#A855F7" stopOpacity={0.32} />
                      <stop offset="95%" stopColor="#22D3EE" stopOpacity={0.04} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.16)" />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} minTickGap={22} />
                  <YAxis domain={[0, 'auto']} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                  <Tooltip content={<ForecastTooltip />} />
                  <ReferenceLine y={200} stroke="#F97316" strokeDasharray="4 4" />
                  <Area
                    type="monotone"
                    dataKey="bandRange"
                    stroke="none"
                    fill="url(#bandFill)"
                    animationDuration={500}
                  />
                  <Line
                    type="monotone"
                    dataKey="historyAqi"
                    name="Observed AQI"
                    stroke="#22D3EE"
                    strokeWidth={2.5}
                    dot={false}
                    connectNulls
                    animationDuration={550}
                    activeDot={{ r: 5 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="forecastAqi"
                    name="Forecast AQI"
                    stroke="#A855F7"
                    strokeWidth={2.5}
                    strokeDasharray="6 3"
                    dot={false}
                    connectNulls
                    animationDuration={550}
                    activeDot={{ r: 5 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          )}

          {data.forecast?.assumptions?.length > 0 && (
            <div className="mt-4 flex items-start gap-2 rounded-xl border border-slate-200/70 bg-slate-100/60 p-3 text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-400">
              <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-sky-400" />
              <div>
                <strong>{t('modelAssumptions')} </strong>
                {data.forecast.assumptions.join(' · ')}
              </div>
            </div>
          )}
        </TiltGlassCard>
      )}
    </section>
  );
}
