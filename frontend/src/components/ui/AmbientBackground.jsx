import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';

const PARTICLES = [
  { left: '8%', top: '18%', size: 3, dur: '11s', delay: '-2s', color: 'bg-cyan-400/60' },
  { left: '16%', top: '62%', size: 2, dur: '14s', delay: '-5s', color: 'bg-violet-400/55' },
  { left: '25%', top: '34%', size: 4, dur: '16s', delay: '-1s', color: 'bg-teal-300/45' },
  { left: '34%', top: '78%', size: 2.5, dur: '13s', delay: '-7s', color: 'bg-sky-400/55' },
  { left: '46%', top: '14%', size: 3, dur: '15s', delay: '-4s', color: 'bg-fuchsia-400/45' },
  { left: '58%', top: '44%', size: 2, dur: '12s', delay: '-8s', color: 'bg-cyan-300/60' },
  { left: '67%', top: '72%', size: 3.5, dur: '17s', delay: '-3s', color: 'bg-violet-400/50' },
  { left: '76%', top: '22%', size: 2.5, dur: '13s', delay: '-9s', color: 'bg-sky-300/55' },
  { left: '85%', top: '54%', size: 3, dur: '14s', delay: '-6s', color: 'bg-teal-300/50' },
  { left: '92%', top: '28%', size: 2, dur: '11s', delay: '-2s', color: 'bg-fuchsia-300/50' },
  { left: '42%', top: '56%', size: 2, dur: '15s', delay: '-10s', color: 'bg-cyan-400/45' },
  { left: '12%', top: '86%', size: 3, dur: '16s', delay: '-4s', color: 'bg-violet-400/45' },
];

export function AmbientBackground() {
  const reducedMotion = usePrefersReducedMotion();

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      {/* Subtle holographic telemetry grid */}
      <div className="hud-grid absolute inset-0 opacity-85 dark:opacity-100" />

      {/* Drifting aurora atmospheric aura orbs */}
      <div
        className={`absolute -left-24 -top-24 h-[480px] w-[480px] rounded-full bg-cyan-500/22 blur-[125px] dark:bg-cyan-500/18 ${
          reducedMotion ? '' : 'ambient-haze'
        }`}
      />
      <div
        className={`absolute right-[-90px] top-[16%] h-[460px] w-[460px] rounded-full bg-violet-500/20 blur-[135px] dark:bg-violet-500/18 ${
          reducedMotion ? '' : 'ambient-haze'
        }`}
        style={{ animationDelay: '-6s' }}
      />
      <div
        className={`absolute bottom-[-130px] left-[26%] h-[400px] w-[400px] rounded-full bg-fuchsia-500/12 blur-[130px] dark:bg-teal-500/14 ${
          reducedMotion ? '' : 'ambient-haze'
        }`}
        style={{ animationDelay: '-12s' }}
      />

      {/* Lightweight GPU-composited atmospheric particles */}
      {!reducedMotion &&
        PARTICLES.map((p, idx) => (
          <span
            key={idx}
            className={`particle-dot absolute rounded-full ${p.color}`}
            style={{
              left: p.left,
              top: p.top,
              width: `${p.size}px`,
              height: `${p.size}px`,
              '--dur': p.dur,
              animationDelay: p.delay,
            }}
          />
        ))}
    </div>
  );
}