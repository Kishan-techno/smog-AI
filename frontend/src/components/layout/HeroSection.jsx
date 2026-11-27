import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowDownRight, ShieldCheck, Sparkles, MapPin } from 'lucide-react';
import { MagneticButton } from '../ui/MagneticButton';
import { TiltGlassCard } from '../ui/TiltGlassCard';
import { AQI_SCALE, getAqiToken } from '../../utils/aqiTokens';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';
import { useLanguage } from '../../app/LanguageContext';

gsap.registerPlugin(ScrollTrigger);

export function HeroSection({ aqiPreview }) {
  const { t } = useLanguage();
  const heroRef = useRef(null);
  const orbRef = useRef(null);
  const cardRef = useRef(null);
  const reducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    if (reducedMotion || !heroRef.current) return undefined;
    const ctx = gsap.context(() => {
      if (orbRef.current) {
        gsap.to(orbRef.current, {
          yPercent: 22,
          ease: 'none',
          scrollTrigger: {
            trigger: heroRef.current,
            start: 'top top',
            end: 'bottom top',
            scrub: true,
          },
        });
      }
      if (cardRef.current) {
        gsap.to(cardRef.current, {
          yPercent: -10,
          ease: 'none',
          scrollTrigger: {
            trigger: heroRef.current,
            start: 'top top',
            end: 'bottom top',
            scrub: true,
          },
        });
      }
    }, heroRef);
    return () => ctx.revert();
  }, [reducedMotion]);

  const token = getAqiToken(aqiPreview?.aqi ?? 185);

  return (
    <section
      id="top"
      ref={heroRef}
      className="relative overflow-hidden border-b border-cyan-500/15 pb-16 pt-12 dark:border-cyan-400/15 sm:pb-24 sm:pt-20"
    >
      <div
        ref={orbRef}
        aria-hidden="true"
        className="pointer-events-none absolute right-[6%] top-6 h-72 w-72 rounded-full bg-gradient-to-tr from-cyan-500/25 via-violet-500/20 to-fuchsia-500/10 blur-3xl"
      />

      <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-10 px-4 sm:px-6 lg:grid-cols-12 lg:px-8">
        <div className="lg:col-span-7">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/40 bg-gradient-to-r from-cyan-500/15 via-indigo-500/10 to-violet-500/15 px-3.5 py-1.5 text-xs font-semibold text-cyan-700 shadow-[0_0_24px_-6px_rgba(34,211,238,0.55)] dark:text-cyan-300">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-400" />
            </span>
            <Sparkles className="h-3.5 w-3.5 text-violet-400" />
            {t('heroBadge')}
          </div>

          <h1 className="mt-5 font-display text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            {t('heroTitleLead')}{' '}
            <span className="bg-gradient-to-r from-cyan-400 via-sky-400 via-45% to-fuchsia-400 bg-clip-text text-transparent">
              {t('heroTitleAccent')}
            </span>
          </h1>

          <p className="mt-5 max-w-2xl text-base leading-relaxed text-slate-600 dark:text-slate-300 sm:text-lg">
            {t('heroSub')}
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <a href="#dashboard">
              <MagneticButton>
                {t('ctaDashboard')}
                <ArrowDownRight className="h-4 w-4" />
              </MagneticButton>
            </a>
            <a href="#routine-plan">
              <MagneticButton variant="secondary">{t('ctaRoutine')}</MagneticButton>
            </a>
          </div>

          {/* Consistent AQI Scale Legend */}
          <div className="mt-8 flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {t('cpcbScale')}
            </span>
            {AQI_SCALE.map((band) => (
              <span
                key={band.key}
                className="inline-flex items-center gap-1.5 rounded-full border border-slate-200/70 px-2 py-0.5 text-[11px] font-medium dark:border-slate-800"
              >
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: band.color }} />
                {band.label}
              </span>
            ))}
          </div>
        </div>

        <div ref={cardRef} className="lg:col-span-5">
          <TiltGlassCard gradientBorder className="hud-corners p-6">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
                <MapPin className="h-3.5 w-3.5 text-cyan-400" />
                {aqiPreview?.city?.name || 'Bhopal'}, MP
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-400/35 bg-cyan-500/15 px-2.5 py-0.5 font-mono text-[11px] font-semibold text-cyan-500 dark:text-cyan-300">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
                {aqiPreview?.dataQuality === 'live'
                  ? t('liveFeed')
                  : aqiPreview?.dataQuality === 'stale'
                    ? t('staleCache')
                    : t('sampleDemo')}
              </span>
            </div>

            <div className="relative mt-5 flex items-baseline gap-4">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -left-4 -top-4 h-24 w-24 rounded-full opacity-30 blur-2xl"
                style={{ backgroundColor: token.color }}
              />
              <span className="relative font-mono text-5xl font-bold tracking-tight" style={{ color: token.color }}>
                {aqiPreview?.aqi ?? '--'}
              </span>
              <div className="relative">
                <p className="font-display text-lg font-bold">{aqiPreview?.category || token.label}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  PM2.5: {aqiPreview?.pollutants?.pm25 ?? '--'} µg/m³ · Wind:{' '}
                  {aqiPreview?.weather?.windKmh ?? '--'} km/h
                </p>
              </div>
            </div>

            {/* Futuristic micro-telemetry bars */}
            <div className="mt-4 grid grid-cols-3 gap-2 rounded-xl border border-indigo-500/20 bg-slate-950/5 p-2.5 font-mono text-[10px] dark:border-cyan-400/20 dark:bg-[#04081a]/70">
              <div>
                <span className="block text-slate-500">PM10</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {aqiPreview?.pollutants?.pm10 ?? '--'} µg/m³
                </span>
              </div>
              <div>
                <span className="block text-slate-500">{t('humidityLabel')}</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {aqiPreview?.weather?.humidityPct ?? aqiPreview?.weather?.humidity ?? '--'}%
                </span>
              </div>
              <div>
                <span className="block text-slate-500">{t('mlHorizon')}</span>
                <span className="font-semibold text-cyan-400">{t('ready48h')}</span>
              </div>
            </div>

            <div className="mt-5 rounded-xl border border-cyan-500/20 bg-slate-100/75 p-3.5 text-xs leading-relaxed text-slate-700 dark:border-indigo-500/25 dark:bg-[#070d26]/75 dark:text-slate-300">
              <strong className="bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent">
                {t('actionableInsight')}{' '}
              </strong>
              {token.description}
            </div>

            <div className="mt-4 flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
              <ShieldCheck className="h-4 w-4 shrink-0 text-cyan-400" />
              <span>{t('heroDisclaimer')}</span>
            </div>
          </TiltGlassCard>
        </div>
      </div>
    </section>
  );
}
