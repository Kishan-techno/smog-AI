import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  LocateFixed,
  RefreshCw,
  Wind,
  Droplets,
  Thermometer,
  AlertTriangle,
  Radio,
} from 'lucide-react';
import { apiFetch } from '../utils/apiClient';
import { formatTimeIST } from '../utils/aqiTokens';
import { useToast } from '../app/ToastContext';
import { useLanguage } from '../app/LanguageContext';
import { TiltGlassCard } from '../components/ui/TiltGlassCard';
import { MagneticButton } from '../components/ui/MagneticButton';
import { DashboardSkeleton, ErrorRetryCard } from '../components/ui/Skeleton';
import { AqiGauge } from '../components/charts/AqiGauge';
import { CountUpNumber } from '../components/motion/CountUpNumber';
import { CityStationMap } from '../components/map/CityStationMap';
import { FamilyRoutineWizard } from '../components/routine/FamilyRoutineWizard';
import { ActionPlanSection } from '../components/routine/ActionPlanSection';

export function DashboardSection({ selectedCity, onCityChange, aqiQuery }) {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const { pushToast } = useToast();
  const [coords, setCoords] = useState(null);
  const [selectedStation, setSelectedStation] = useState(null);
  const [locating, setLocating] = useState(false);

  const citiesQuery = useQuery({
    queryKey: ['cities'],
    queryFn: () => apiFetch('/aqi/cities'),
    staleTime: 60 * 60 * 1000,
  });

  const planQuery = useQuery({
    queryKey: ['plan', selectedCity],
    queryFn: () => apiFetch(`/recommendations/plan?city=${encodeURIComponent(selectedCity)}`),
  });

  const saveRoutineMutation = useMutation({
    mutationFn: (payload) => apiFetch('/routine', { method: 'PUT', body: payload }),
    onSuccess: (data) => {
      queryClient.setQueryData(['plan', selectedCity], {
        plan: data.plan,
        routine: data.routine,
      });
      pushToast({
        title: 'Family routine saved',
        description: 'Your personalized daily action plan has been refreshed.',
        type: 'success',
      });
    },
    onError: (err) => {
      pushToast({
        title: 'Could not save routine',
        description: err.message,
        type: 'error',
      });
    },
  });

  const handleUseLocation = () => {
    if (!navigator.geolocation) {
      pushToast({
        title: 'Location unavailable',
        description: 'Geolocation is not supported in this browser. Pick a city manually.',
        type: 'error',
      });
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const nearby = await apiFetch(
            `/aqi/current?lat=${latitude.toFixed(3)}&lon=${longitude.toFixed(3)}`
          );
          setCoords({ lat: latitude, lon: longitude });
          if (nearby?.city?.id) {
            onCityChange(nearby.city.id);
          }
          pushToast({
            title: `Matched ${nearby.city?.name || 'nearest city'}`,
            description: 'Approximate zone matched without storing your exact coordinates.',
            type: 'success',
          });
        } catch (err) {
          pushToast({ title: 'Location lookup failed', description: err.message, type: 'error' });
        } finally {
          setLocating(false);
        }
      },
      () => {
        setLocating(false);
        pushToast({
          title: 'Location permission declined',
          description: 'Staying on Bhopal. You can switch cities anytime from the dropdown.',
          type: 'info',
        });
      },
      { timeout: 6000 }
    );
  };

  const aqiData = aqiQuery.data;

  return (
    <section id="dashboard" className="mx-auto max-w-7xl space-y-10 px-4 py-14 sm:px-6 lg:px-8">
      {/* Control Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-sky-500/30 bg-sky-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-sky-600 dark:text-sky-300">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sky-400 opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-sky-500" />
            </span>
            {t('dashBadge')}
          </span>
          <h2 className="mt-3 font-display text-2xl font-bold tracking-tight sm:text-3xl">
            {t('dashTitle')}
          </h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{t('dashSub')}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <label className="sr-only" htmlFor="city-select">
            Select City
          </label>
          <select
            id="city-select"
            value={selectedCity}
            onChange={(e) => {
              setSelectedStation(null);
              setCoords(null);
              onCityChange(e.target.value);
            }}
            className="glass-card rounded-xl px-3.5 py-2.5 text-sm font-medium focus:ring-2 focus:ring-cyan-400"
          >
            {(citiesQuery.data?.cities || [{ id: 'bhopal', name: 'Bhopal', state: 'Madhya Pradesh' }]).map(
              (c) => (
                <option key={c.id} value={c.id} className="bg-slate-900 text-slate-100">
                  {c.name}, {c.state}
                </option>
              )
            )}
          </select>

          <MagneticButton
            variant="secondary"
            disabled={locating}
            onClick={handleUseLocation}
            aria-label="Use approximate location"
          >
            <LocateFixed className="h-4 w-4 text-cyan-400" />
            {locating ? t('detecting') : t('useLocation')}
          </MagneticButton>

          <MagneticButton
            variant="ghost"
            onClick={() => aqiQuery.refetch()}
            aria-label="Refresh AQI data"
          >
            <RefreshCw className={`h-4 w-4 ${aqiQuery.isFetching ? 'animate-spin' : ''}`} />
          </MagneticButton>
        </div>
      </div>

      {/* Freshness / Stale / Sample Banner */}
      {aqiData && (
        <div
          className={`flex flex-wrap items-center justify-between gap-2 rounded-xl border px-4 py-2.5 text-xs ${
            aqiData.dataQuality === 'live'
              ? 'border-cyan-500/35 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300'
              : 'border-amber-500/35 bg-amber-500/10 text-amber-700 dark:text-amber-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {aqiData.dataQuality === 'live' ? (
              <Radio className="h-4 w-4 shrink-0" />
            ) : (
              <AlertTriangle className="h-4 w-4 shrink-0" />
            )}
            <span>
              <strong>
                {aqiData.dataQuality === 'live'
                  ? t('liveTelemetry')
                  : aqiData.dataQuality === 'stale'
                    ? t('staleFallback')
                    : t('sampleFallback')}
              </strong>{' '}
              — {t('sourceLabel')} {aqiData.source} · {t('stationTimeLabel')}{' '}
              {formatTimeIST(aqiData.stationTimestamp)}
            </span>
          </div>
          {coords && <span className="font-mono text-[11px]">{t('approxMatched')}</span>}
        </div>
      )}

      {/* Main Dashboard Grid */}
      {aqiQuery.isLoading ? (
        <DashboardSkeleton />
      ) : aqiQuery.isError ? (
        <ErrorRetryCard
          title="Could not fetch air quality snapshot"
          message={aqiQuery.error?.message}
          onRetry={() => aqiQuery.refetch()}
        />
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Left: Gauge + Pollutants + Weather */}
          <TiltGlassCard className="p-6 lg:col-span-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-display text-lg font-bold">
                  {aqiData.city?.name} {t('overviewSuffix')}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {selectedStation ? `${t('focusedPrefix')} ${selectedStation.name}` : t('cityAvg')}
                </p>
              </div>
              {selectedStation && (
                <button
                  type="button"
                  onClick={() => setSelectedStation(null)}
                  className="text-xs font-medium text-cyan-400 hover:underline"
                >
                  {t('resetCityAvg')}
                </button>
              )}
            </div>

            <div className="mt-4">
              <AqiGauge
                aqi={selectedStation ? selectedStation.aqi : aqiData.aqi}
                category={selectedStation ? selectedStation.category : aqiData.category}
                dominantPollutant={
                  selectedStation ? selectedStation.dominantPollutant : aqiData.dominantPollutant
                }
              />
            </div>

            {/* Pollutant Count-ups */}
            <div className="mt-6 grid grid-cols-3 gap-2.5">
              {[
                { label: 'PM2.5', val: (selectedStation || aqiData).pollutants?.pm25, unit: 'µg/m³' },
                { label: 'PM10', val: (selectedStation || aqiData).pollutants?.pm10, unit: 'µg/m³' },
                { label: 'NO2', val: (selectedStation || aqiData).pollutants?.no2, unit: 'µg/m³' },
              ].map((p) => (
                <div
                  key={p.label}
                  className="rounded-xl border border-slate-200/70 bg-slate-100/70 p-2.5 text-center dark:border-slate-800 dark:bg-slate-900/60"
                >
                  <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                    {p.label}
                  </div>
                  <div className="mt-0.5 font-mono text-lg font-bold">
                    <CountUpNumber value={p.val ?? 0} decimals={1} />
                  </div>
                  <div className="text-[10px] text-slate-400">{p.unit}</div>
                </div>
              ))}
            </div>

            {/* Weather Dispersion Strip */}
            {aqiData.weather && (
              <div className="mt-4 rounded-xl border border-slate-200/70 bg-slate-100/50 p-3 dark:border-slate-800 dark:bg-slate-900/50">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="inline-flex items-center gap-1">
                    <Thermometer className="h-3.5 w-3.5 text-amber-400" />
                    {aqiData.weather.tempC}°C
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Wind className="h-3.5 w-3.5 text-sky-400" />
                    {aqiData.weather.windKmh} km/h
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Droplets className="h-3.5 w-3.5 text-cyan-400" />
                    {aqiData.weather.humidityPct}% RH
                  </span>
                </div>
                <p className="mt-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                  {t('dispersionLabel')}{' '}
                  <strong className="text-slate-700 dark:text-slate-200">
                    {aqiData.weather.dispersionRating?.label}
                  </strong>{' '}
                  ({aqiData.weather.source})
                </p>
              </div>
            )}
          </TiltGlassCard>

          {/* Right: Interactive Station Map */}
          <div className="lg:col-span-7">
            <CityStationMap
              city={aqiData.city}
              stations={aqiData.stations}
              selectedStationId={selectedStation?.id}
              onSelectStation={(st) => setSelectedStation(st)}
            />
          </div>
        </div>
      )}

      {/* Routine & Personalized Action Plan */}
      <div id="routine-plan" className="grid grid-cols-1 gap-6 pt-4 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <FamilyRoutineWizard
            initialRoutine={planQuery.data?.routine}
            cityId={selectedCity}
            saving={saveRoutineMutation.isPending}
            onSave={(payload) => saveRoutineMutation.mutate(payload)}
          />
        </div>
        <div className="lg:col-span-7">
          {planQuery.isLoading ? (
            <DashboardSkeleton />
          ) : planQuery.isError ? (
            <ErrorRetryCard
              title="Unable to load family action plan"
              message={planQuery.error?.message}
              onRetry={() => planQuery.refetch()}
            />
          ) : (
            <ActionPlanSection plan={planQuery.data?.plan} />
          )}
        </div>
      </div>
    </section>
  );
}
