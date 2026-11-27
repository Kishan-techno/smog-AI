import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import {
  Activity,
  Users,
  ShieldCheck,
  AlertOctagon,
  ChevronLeft,
  ChevronRight,
  HeartHandshake,
} from 'lucide-react';
import { apiFetch } from '../../utils/apiClient';
import { useDebounce } from '../../hooks/useDebounce';
import { useLanguage } from '../../app/LanguageContext';
import { useToast } from '../../app/ToastContext';
import { TiltGlassCard } from '../ui/TiltGlassCard';
import { MagneticButton } from '../ui/MagneticButton';
import { CountUpNumber } from '../motion/CountUpNumber';
import { SkeletonBlock } from '../ui/Skeleton';
import { getAqiToken } from '../../utils/aqiTokens';

export default function ExposureAndCommunitySection({ selectedCity, currentPm25 }) {
  const { t } = useLanguage();
  const { pushToast } = useToast();
  const queryClient = useQueryClient();

  const [hours, setHours] = useState({
    homeHours: 14,
    schoolOrWorkHours: 6.5,
    commuteHours: 1.5,
    outdoorHours: 2.0,
    commuteEnclosed: false,
    wearsN95OnCommute: false,
    kitchenExhaust: true,
  });
  const [page, setPage] = useState(1);
  const debouncedHours = useDebounce(hours, 180);

  const totalHours =
    Number(hours.homeHours) +
    Number(hours.schoolOrWorkHours) +
    Number(hours.commuteHours) +
    Number(hours.outdoorHours);
  const over24 = totalHours > 24;

  const exposureQuery = useQuery({
    queryKey: ['exposure', selectedCity, currentPm25, debouncedHours],
    enabled: !over24,
    queryFn: () =>
      apiFetch('/exposure/calculate', {
        method: 'POST',
        body: {
          city: selectedCity,
          ambientPm25: currentPm25 || undefined,
          ...debouncedHours,
        },
      }),
    staleTime: 60_000,
  });

  const communityQuery = useQuery({
    queryKey: ['community', selectedCity, page],
    queryFn: () =>
      apiFetch(`/community/summary?city=${encodeURIComponent(selectedCity)}&page=${page}&limit=3`),
    staleTime: 60_000,
  });

  const pledgeMutation = useMutation({
    mutationFn: (payload) => apiFetch('/community/pledge', { method: 'POST', body: payload }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['community', selectedCity] });
      pushToast({
        title: 'Anonymous zone pledge counted',
        description: 'Added to aggregated ward metrics without storing personal details.',
        type: 'success',
      });
    },
    onError: (err) => {
      pushToast({ title: 'Could not submit pledge', description: err.message, type: 'error' });
    },
  });

  const exp = exposureQuery.data;
  const com = communityQuery.data;

  return (
    <section id="exposure-community" className="mx-auto max-w-7xl space-y-12 px-4 py-12 sm:px-6 lg:px-8">
      {/* Personal Air Exposure Score */}
      <div>
        <div className="mb-6">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-500/35 bg-gradient-to-r from-cyan-500/15 to-violet-500/15 px-3 py-1 text-xs font-semibold text-cyan-600 dark:text-cyan-300">
            <Activity className="h-3.5 w-3.5 text-violet-400" />
            {t('exposureBadge')}
          </span>
          <h2 className="mt-2 font-display text-2xl font-bold tracking-tight sm:text-3xl">
            {t('exposureTitle')}
          </h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{t('exposureSub')}</p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <TiltGlassCard disableTilt className="space-y-4 p-5 sm:p-6 lg:col-span-5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold">{t('dailyHoursAlloc')}</span>
              <span
                className={`font-mono font-bold ${
                  over24 ? 'text-rose-500' : 'text-cyan-400'
                }`}
              >
                {totalHours.toFixed(1)} / 24.0 hrs
              </span>
            </div>

            {over24 && (
              <div
                role="alert"
                className="rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-400"
              >
                {t('over24Warning')}
              </div>
            )}

            {[
              { key: 'homeHours', label: t('hrsHome'), max: 20, step: 0.5 },
              { key: 'schoolOrWorkHours', label: t('hrsSchoolWork'), max: 14, step: 0.5 },
              { key: 'commuteHours', label: t('hrsCommute'), max: 6, step: 0.5 },
              { key: 'outdoorHours', label: t('hrsOutdoor'), max: 8, step: 0.5 },
            ].map((s) => (
              <label key={s.key} className="block">
                <div className="flex justify-between text-xs">
                  <span>{s.label}</span>
                  <span className="font-mono font-semibold">{hours[s.key]}h</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={s.max}
                  step={s.step}
                  value={hours[s.key]}
                  onChange={(e) =>
                    setHours((prev) => ({ ...prev, [s.key]: Number(e.target.value) }))
                  }
                  className="mt-1 w-full accent-cyan-400"
                />
              </label>
            ))}

            <div className="space-y-2 border-t border-slate-200/70 pt-3 text-sm dark:border-slate-800">
              <label className="flex items-center gap-2.5">
                <input
                  type="checkbox"
                  checked={hours.commuteEnclosed}
                  onChange={(e) =>
                    setHours((h) => ({ ...h, commuteEnclosed: e.target.checked }))
                  }
                  className="h-4 w-4 rounded accent-cyan-400"
                />
                <span>{t('chkEnclosedAc')}</span>
              </label>
              <label className="flex items-center gap-2.5">
                <input
                  type="checkbox"
                  checked={hours.wearsN95OnCommute}
                  onChange={(e) =>
                    setHours((h) => ({ ...h, wearsN95OnCommute: e.target.checked }))
                  }
                  className="h-4 w-4 rounded accent-cyan-400"
                />
                <span>{t('chkN95Commute')}</span>
              </label>
              <label className="flex items-center gap-2.5">
                <input
                  type="checkbox"
                  checked={hours.kitchenExhaust}
                  onChange={(e) =>
                    setHours((h) => ({ ...h, kitchenExhaust: e.target.checked }))
                  }
                  className="h-4 w-4 rounded accent-cyan-400"
                />
                <span>{t('chkKitchenExhaust')}</span>
              </label>
            </div>
          </TiltGlassCard>

          <TiltGlassCard disableTilt className="p-5 sm:p-6 lg:col-span-7">
            {exposureQuery.isLoading || !exp ? (
              <SkeletonBlock className="h-72 w-full" />
            ) : (
              <div className="space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {t('cumulativeExposureLabel')}
                    </p>
                    <div className="mt-1 flex items-baseline gap-3">
                      <span
                        className="font-mono text-4xl font-bold"
                        style={{ color: exp.band?.color || '#22D3EE' }}
                      >
                        <CountUpNumber value={exp.totalExposureProxy} />
                      </span>
                      <span className="font-mono text-xs text-slate-400">
                        µg/m³·hr · Avg {exp.weightedAvgPm25} µg/m³
                      </span>
                    </div>
                  </div>
                  <div className="rounded-xl border border-slate-200/70 bg-slate-100/70 px-3.5 py-2 text-xs dark:border-slate-800 dark:bg-slate-900/70">
                    <div>
                      {t('whoBenchmarkLabel')} <strong>{exp.whoReferenceProxy}</strong>
                    </div>
                    <div className="text-slate-500 dark:text-slate-400">
                      {t('currentRatioLabel')} <strong>{exp.ratioToWho}×</strong>{' '}
                      {t('guidelineProxySuffix')}
                    </div>
                  </div>
                </div>

                <div className="h-[200px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={exp.environments} layout="vertical" margin={{ left: 4, right: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.16)" />
                      <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                      <YAxis
                        type="category"
                        dataKey="label"
                        width={98}
                        tick={{ fontSize: 11, fill: '#cbd5e1' }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'rgba(15, 23, 42, 0.94)',
                          border: '1px solid rgba(148,163,184,0.2)',
                          borderRadius: '12px',
                          color: '#f8fafc',
                          fontSize: '12px',
                        }}
                      />
                      <Bar
                        dataKey="proxyScore"
                        name="Exposure Proxy (µg/m³·hr)"
                        fill={exp.band?.color || '#10B981'}
                        radius={[0, 6, 6, 0]}
                        animationDuration={500}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="flex items-start gap-2 rounded-xl border border-amber-500/35 bg-amber-500/10 p-3 text-xs text-amber-800 dark:text-amber-200">
                  <AlertOctagon className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                  <div>
                    <strong>{t('nonMedicalTitle')}</strong> {exp.formula}.{' '}
                    {exp.disclaimer}
                  </div>
                </div>
              </div>
            )}
          </TiltGlassCard>
        </div>
      </div>

      {/* Aggregated Community Dashboard */}
      <div id="community">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-500/30 bg-sky-500/10 px-3 py-1 text-xs font-semibold text-sky-600 dark:text-sky-300">
              <Users className="h-3.5 w-3.5" />
              {t('communityBadge')}
            </span>
            <h2 className="mt-2 font-display text-2xl font-bold tracking-tight sm:text-3xl">
              {t('communityTitle')}
            </h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{t('communitySub')}</p>
          </div>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-cyan-500/35 bg-cyan-500/10 px-3 py-1 text-xs text-cyan-600 dark:text-cyan-300">
            <ShieldCheck className="h-4 w-4" />
            {t('zeroPiiBadge')}
          </div>
        </div>

        {communityQuery.isLoading || !com ? (
          <SkeletonBlock className="h-64 w-full" />
        ) : (
          <TiltGlassCard disableTilt className="hud-corners p-5 sm:p-6">
            <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: t('statHouseholds'), val: com.totals.households },
                { label: t('statCarpools'), val: com.totals.carpoolTrips },
                { label: t('statCooking'), val: com.totals.cleanCooking },
                { label: t('statCo2'), val: com.totals.co2SavedKg },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-xl border border-indigo-500/20 bg-slate-100/60 p-3.5 dark:border-cyan-400/20 dark:bg-[#050a1e]/70"
                >
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">{stat.label}</div>
                  <div className="mt-1 bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text font-mono text-2xl font-bold text-transparent">
                    <CountUpNumber value={stat.val} />
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {com.zones.map((z) => {
                const token = getAqiToken(z.aqi);
                return (
                  <div
                    key={z.zoneId}
                    className="rounded-2xl border border-slate-200/70 bg-slate-100/50 p-4 dark:border-slate-800 dark:bg-slate-900/60"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-display text-sm font-bold">{z.zoneName}</h3>
                        <p className="text-[11px] text-slate-500">{z.stationName}</p>
                      </div>
                      <span
                        className="rounded-md px-2 py-0.5 font-mono text-xs font-bold text-slate-950"
                        style={{ backgroundColor: token.color }}
                      >
                        AQI {z.aqi}
                      </span>
                    </div>

                    <div className="mt-3 space-y-1 text-xs text-slate-600 dark:text-slate-300">
                      <div>
                        {t('householdsPrefix')} {z.householdsParticipating}
                      </div>
                      <div>
                        {t('carpoolsPrefix')} {z.carpoolTripsWeek}
                      </div>
                      <div>
                        {t('cleanCookPrefix')} {z.cleanCookingPledges}
                      </div>
                    </div>

                    <div className="mt-3 flex gap-2">
                      <MagneticButton
                        variant="secondary"
                        disabled={pledgeMutation.isPending}
                        onClick={() =>
                          pledgeMutation.mutate({ zoneId: z.zoneId, pledgeType: 'carpool' })
                        }
                        className="w-full !py-1.5 text-xs"
                      >
                        <HeartHandshake className="h-3.5 w-3.5 text-cyan-400" />
                        {t('pledgeBtn')}
                      </MagneticButton>
                    </div>
                  </div>
                );
              })}
            </div>

            {com.pagination.totalPages > 1 && (
              <div className="mt-5 flex items-center justify-between text-xs text-slate-500">
                <span>
                  Page {com.pagination.page} of {com.pagination.totalPages} ({com.pagination.totalItems}{' '}
                  zones)
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="glass-card rounded-lg px-2.5 py-1 disabled:opacity-40"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    disabled={page >= com.pagination.totalPages}
                    onClick={() => setPage((p) => Math.min(com.pagination.totalPages, p + 1))}
                    className="glass-card rounded-lg px-2.5 py-1 disabled:opacity-40"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </TiltGlassCard>
        )}
      </div>
    </section>
  );
}
