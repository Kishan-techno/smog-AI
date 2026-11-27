import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { Sliders, ArrowDown, Info } from 'lucide-react';
import { apiFetch } from '../../utils/apiClient';
import { useDebounce } from '../../hooks/useDebounce';
import { TiltGlassCard } from '../ui/TiltGlassCard';
import { CountUpNumber } from '../motion/CountUpNumber';
import { SkeletonBlock } from '../ui/Skeleton';
import { useLanguage } from '../../app/LanguageContext';

export default function WhatIfSimulatorSection({ selectedCity, currentPm25 }) {
  const { t } = useLanguage();
  const [sim, setSim] = useState({
    commuteMode: 'private_open',
    simulatedCommuteMode: 'carpool',
    baselineExercise: 'outdoor_peak',
    simulatedExercise: 'indoor',
    indoorExhaustFan: true,
    indoorWetMop: true,
    avoidIncenseBiomass: true,
    n95MaskOnCommute: true,
  });

  const debouncedSim = useDebounce(sim, 180);

  const simQuery = useQuery({
    queryKey: ['simulator', selectedCity, currentPm25, debouncedSim],
    queryFn: () =>
      apiFetch('/simulator/run', {
        method: 'POST',
        body: {
          city: selectedCity,
          baselinePm25: currentPm25 || undefined,
          ...debouncedSim,
        },
      }),
    staleTime: 60_000,
  });

  const result = simQuery.data;

  return (
    <section id="simulator" className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-6">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-500/35 bg-gradient-to-r from-violet-500/15 to-fuchsia-500/15 px-3 py-1 text-xs font-semibold text-violet-600 dark:text-violet-300">
          <Sliders className="h-3.5 w-3.5 text-fuchsia-400" />
          {t('simBadge')}
        </span>
        <h2 className="mt-2 font-display text-2xl font-bold tracking-tight sm:text-3xl">
          {t('simTitle')}
        </h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{t('simSub')}</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Controls */}
        <TiltGlassCard disableTilt className="space-y-4 p-5 sm:p-6 lg:col-span-5">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                {t('currentCommute')}
              </span>
              <select
                value={sim.commuteMode}
                onChange={(e) => setSim((s) => ({ ...s, commuteMode: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-slate-300 bg-white/80 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-900/80"
              >
                <option value="private_open">{t('optPrivateOpen')}</option>
                <option value="private_car_ac">{t('optPrivateCarAc')}</option>
                <option value="public_transit">{t('optPublicTransit')}</option>
              </select>
            </label>
            <label className="block">
              <span className="text-xs font-medium text-cyan-600 dark:text-cyan-400">
                {t('simulatedCommute')}
              </span>
              <select
                value={sim.simulatedCommuteMode}
                onChange={(e) => setSim((s) => ({ ...s, simulatedCommuteMode: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-cyan-500/40 bg-white/80 px-3 py-2 text-xs dark:bg-slate-900/80"
              >
                <option value="carpool">{t('optCarpool')}</option>
                <option value="public_transit">{t('optPublicTransit')}</option>
                <option value="private_car_ac">{t('optPrivateCarAc')}</option>
                <option value="private_open">{t('optKeepOpen')}</option>
              </select>
            </label>

            <label className="block">
              <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                {t('currentExercise')}
              </span>
              <select
                value={sim.baselineExercise}
                onChange={(e) => setSim((s) => ({ ...s, baselineExercise: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-slate-300 bg-white/80 px-3 py-2 text-xs dark:border-slate-700 dark:bg-slate-900/80"
              >
                <option value="outdoor_peak">{t('optOutdoorPeak')}</option>
                <option value="outdoor_midday">{t('optOutdoorMidday')}</option>
                <option value="indoor">{t('optIndoor')}</option>
              </select>
            </label>
            <label className="block">
              <span className="text-xs font-medium text-cyan-600 dark:text-cyan-400">
                {t('simulatedExercise')}
              </span>
              <select
                value={sim.simulatedExercise}
                onChange={(e) => setSim((s) => ({ ...s, simulatedExercise: e.target.value }))}
                className="mt-1 w-full rounded-xl border border-cyan-500/40 bg-white/80 px-3 py-2 text-xs dark:bg-slate-900/80"
              >
                <option value="indoor">{t('optIndoorYoga')}</option>
                <option value="outdoor_midday">{t('optMiddayBreeze')}</option>
                <option value="outdoor_peak">{t('optOutdoorPeak')}</option>
              </select>
            </label>
          </div>

          <div className="space-y-2 border-t border-slate-200/70 pt-3 dark:border-slate-800">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              {t('smokeControlsHeading')}
            </p>
            {[
              { key: 'n95MaskOnCommute', label: t('ctrlN95') },
              { key: 'indoorExhaustFan', label: t('ctrlExhaust') },
              { key: 'indoorWetMop', label: t('ctrlWetMop') },
              { key: 'avoidIncenseBiomass', label: t('ctrlNoIncense') },
            ].map((item) => (
              <label key={item.key} className="flex items-center gap-2.5 text-sm">
                <input
                  type="checkbox"
                  checked={sim[item.key]}
                  onChange={(e) => setSim((s) => ({ ...s, [item.key]: e.target.checked }))}
                  className="h-4 w-4 rounded accent-cyan-400"
                />
                <span>{item.label}</span>
              </label>
            ))}
          </div>
        </TiltGlassCard>

        {/* Results & Comparison Chart */}
        <TiltGlassCard disableTilt className="hud-corners p-5 sm:p-6 lg:col-span-7">
          {simQuery.isLoading || !result ? (
            <SkeletonBlock className="h-72 w-full" />
          ) : (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    {t('simReductionLabel')}
                  </p>
                  <div className="mt-1 flex items-baseline gap-3">
                    <span className="inline-flex items-center gap-1 bg-gradient-to-r from-cyan-400 to-teal-300 bg-clip-text font-mono text-3xl font-bold text-transparent">
                      <ArrowDown className="h-6 w-6 text-cyan-400" />
                      <CountUpNumber value={result.reductionPct} decimals={1} />%
                    </span>
                    <span className="font-mono text-xs text-slate-500 dark:text-slate-400">
                      {result.baselineTotalProxy} → {result.simulatedTotalProxy} µg/m³·hr proxy
                    </span>
                  </div>
                </div>
                <div className="rounded-xl border border-cyan-500/35 bg-cyan-500/10 px-3 py-2 text-xs text-cyan-700 dark:text-cyan-300">
                  {result.tailpipeNote}
                </div>
              </div>

              <div className="h-[220px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={result.breakdown}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.16)" />
                    <XAxis dataKey="segment" tick={{ fontSize: 12, fill: '#94a3b8' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(10, 15, 36, 0.96)',
                        border: '1px solid rgba(34, 211, 238, 0.28)',
                        borderRadius: '12px',
                        color: '#f8fafc',
                        fontSize: '12px',
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    <Bar
                      dataKey="baseline"
                      name="Baseline Proxy"
                      fill="#FB7185"
                      radius={[6, 6, 0, 0]}
                      animationDuration={450}
                    />
                    <Bar
                      dataKey="simulated"
                      name="With Changes"
                      fill="#22D3EE"
                      radius={[6, 6, 0, 0]}
                      animationDuration={450}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="rounded-xl border border-slate-200/70 bg-slate-100/60 p-3 text-xs text-slate-600 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-400">
                <div className="mb-1 flex items-center gap-1.5 font-semibold text-slate-800 dark:text-slate-200">
                  <Info className="h-3.5 w-3.5 text-amber-400" />
                  {t('transparentAssumptions')}
                </div>
                <ul className="list-disc space-y-0.5 pl-4">
                  {result.assumptions.map((a, i) => (
                    <li key={i}>{a}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </TiltGlassCard>
      </div>
    </section>
  );
}
