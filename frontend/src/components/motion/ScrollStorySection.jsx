import { useEffect, useMemo, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Radio, Cpu, Compass, ShieldCheck, BookmarkCheck } from 'lucide-react';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';
import { useLanguage } from '../../app/LanguageContext';

gsap.registerPlugin(ScrollTrigger);

export function ScrollStorySection() {
  const { t } = useLanguage();
  const containerRef = useRef(null);
  const reducedMotion = usePrefersReducedMotion();
  const [activeIndex, setActiveIndex] = useState(0);
  const [progress, setProgress] = useState(0.2);

  const steps = useMemo(
    () => [
      {
        id: 'fetch',
        step: '01',
        title: t('step1Title'),
        icon: Radio,
        metric: t('step1Metric'),
        detail: t('step1Detail'),
      },
      {
        id: 'predict',
        step: '02',
        title: t('step2Title'),
        icon: Cpu,
        metric: t('step2Metric'),
        detail: t('step2Detail'),
      },
      {
        id: 'recommend',
        step: '03',
        title: t('step3Title'),
        icon: Compass,
        metric: t('step3Metric'),
        detail: t('step3Detail'),
      },
      {
        id: 'explain',
        step: '04',
        title: t('step4Title'),
        icon: ShieldCheck,
        metric: t('step4Metric'),
        detail: t('step4Detail'),
      },
      {
        id: 'save',
        step: '05',
        title: t('step5Title'),
        icon: BookmarkCheck,
        metric: t('step5Metric'),
        detail: t('step5Detail'),
      },
    ],
    [t]
  );

  useEffect(() => {
    const el = containerRef.current;
    if (!el || reducedMotion) return undefined;

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: el,
        start: 'top 25%',
        end: 'bottom 75%',
        scrub: 0.25,
        onUpdate: (self) => {
          setProgress(Math.max(0.05, self.progress));
          const idx = Math.min(steps.length - 1, Math.floor(self.progress * steps.length));
          setActiveIndex(idx);
        },
      });
    }, containerRef);

    return () => ctx.revert();
  }, [reducedMotion, steps.length]);

  const current = steps[activeIndex];
  const ActiveIcon = current.icon;

  return (
    <section
      ref={containerRef}
      aria-label="How Smog Saathi AI turns air data into family decisions"
      className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8"
    >
      <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-cyan-500/35 bg-gradient-to-r from-cyan-500/15 to-violet-500/15 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-cyan-600 dark:text-cyan-300">
            {t('pipelineBadge')}
          </span>
          <h2 className="mt-3 font-display text-2xl font-bold tracking-tight sm:text-3xl">
            {t('pipelineTitle')}
          </h2>
        </div>
        <p className="max-w-md text-sm text-slate-600 dark:text-slate-300">{t('pipelineSub')}</p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Sticky Spotlight Card */}
        <div className="lg:col-span-5">
          <div className="glass-card-strong hud-corners sticky top-24 overflow-hidden rounded-2xl p-6 shadow-glass">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full bg-gradient-to-br from-cyan-500/20 to-violet-500/20 blur-3xl"
            />
            <div className="mb-4 flex items-center justify-between text-xs font-mono text-slate-500 dark:text-slate-400">
              <span className="text-cyan-500">
                {t('stageLabel')} {current.step} / 05
              </span>
              <span>{current.metric}</span>
            </div>

            <div
              aria-hidden="true"
              className="mb-5 h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800"
            >
              <div
                className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-indigo-400 to-fuchsia-500 transition-all duration-200"
                style={{ width: `${Math.round(progress * 100)}%` }}
              />
            </div>

            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500/20 to-violet-500/20 text-cyan-400 ring-1 ring-cyan-400/30">
                <ActiveIcon className="h-6 w-6" />
              </div>
              <h3 className="font-display text-xl font-bold">{current.title}</h3>
            </div>

            <p className="mt-4 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              {current.detail}
            </p>

            <div className="mt-6 flex flex-wrap gap-2">
              {steps.map((st, idx) => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => {
                    setActiveIndex(idx);
                    setProgress((idx + 1) / steps.length);
                  }}
                  className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                    idx === activeIndex
                      ? 'bg-gradient-to-r from-cyan-400 to-violet-500 font-semibold text-white shadow-sm'
                      : 'bg-slate-200/70 text-slate-700 hover:bg-slate-300/80 dark:bg-slate-800 dark:text-slate-300'
                  }`}
                >
                  {st.step}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Scroll Step List */}
        <div className="space-y-4 lg:col-span-7">
          {steps.map((st, idx) => {
            const Icon = st.icon;
            const isActive = idx === activeIndex;
            return (
              <button
                key={st.id}
                type="button"
                onClick={() => {
                  setActiveIndex(idx);
                  setProgress((idx + 1) / steps.length);
                }}
                className={`w-full rounded-2xl p-5 text-left transition-all duration-300 ${
                  isActive
                    ? 'glass-card translate-x-1.5 border-cyan-400/60 shadow-[0_0_32px_-10px_rgba(34,211,238,0.55)] ring-1 ring-cyan-400/35'
                    : 'glass-card opacity-75 hover:opacity-100'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-all duration-300 ${
                      isActive
                        ? 'bg-gradient-to-br from-cyan-400 via-indigo-500 to-violet-600 text-white shadow-[0_0_18px_-2px_rgba(34,211,238,0.8)]'
                        : 'bg-slate-200/70 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    {isActive && (
                      <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-white bg-cyan-300 dark:border-slate-900" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h4 className="font-display text-base font-semibold">
                        {st.step}. {st.title}
                      </h4>
                      <span
                        className={`font-mono text-xs transition-colors ${
                          isActive ? 'text-cyan-400' : 'text-slate-500 dark:text-slate-400'
                        }`}
                      >
                        {st.metric}
                      </span>
                    </div>
                    <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-300">{st.detail}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
