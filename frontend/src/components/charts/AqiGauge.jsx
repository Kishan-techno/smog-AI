import { useEffect, useRef, useState } from 'react';
import { getAqiToken } from '../../utils/aqiTokens';
import { CountUpNumber } from '../motion/CountUpNumber';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';

export function AqiGauge({ aqi = 0, category, dominantPollutant = 'PM25' }) {
  const reducedMotion = usePrefersReducedMotion();
  const containerRef = useRef(null);
  const [swept, setSwept] = useState(reducedMotion);
  const token = getAqiToken(aqi);
  const clamped = Math.max(0, Math.min(500, Number(aqi) || 0));
  const targetAngle = -90 + (clamped / 500) * 180;

  useEffect(() => {
    if (reducedMotion) {
      setSwept(true);
      return undefined;
    }
    const el = containerRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setSwept(true);
      return undefined;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setSwept(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [reducedMotion]);

  const needleAngle = swept ? targetAngle : -90;

  return (
    <div ref={containerRef} className="flex flex-col items-center">
      <svg
        viewBox="0 0 260 155"
        className="w-full max-w-[260px]"
        role="img"
        aria-label={`AQI gauge reading ${clamped}, ${category || token.label}`}
      >
        <defs>
          <linearGradient id="aqiArcGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#10B981" />
            <stop offset="20%" stopColor="#84CC16" />
            <stop offset="40%" stopColor="#F59E0B" />
            <stop offset="60%" stopColor="#F97316" />
            <stop offset="80%" stopColor="#EF4444" />
            <stop offset="100%" stopColor="#991B1B" />
          </linearGradient>
          <filter id="aqiGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Inner HUD dashed telemetry ring */}
        <path
          d="M 48 130 A 82 82 0 0 1 212 130"
          fill="none"
          stroke="currentColor"
          strokeOpacity="0.18"
          strokeWidth="1.5"
          strokeDasharray="3 5"
        />

        {/* Track */}
        <path
          d="M 25 130 A 105 105 0 0 1 235 130"
          fill="none"
          stroke="currentColor"
          strokeOpacity="0.12"
          strokeWidth="18"
          strokeLinecap="round"
        />

        {/* Colored scale arc with holographic glow */}
        <path
          d="M 25 130 A 105 105 0 0 1 235 130"
          fill="none"
          stroke="url(#aqiArcGrad)"
          strokeWidth="18"
          strokeLinecap="round"
          filter="url(#aqiGlow)"
        />

        {/* Needle glow blur shadow */}
        <g
          aria-hidden="true"
          style={{
            transform: `rotate(${needleAngle}deg)`,
            transformOrigin: '130px 130px',
            transition: reducedMotion
              ? 'none'
              : 'transform 1100ms cubic-bezier(0.22, 1, 0.36, 1)',
            opacity: 0.4,
            filter: `blur(5px)`,
          }}
        >
          <line x1="130" y1="130" x2="130" y2="42" stroke={token.color} strokeWidth="7" strokeLinecap="round" />
        </g>
        {/* Sweeping needle */}
        <g
          style={{
            transform: `rotate(${needleAngle}deg)`,
            transformOrigin: '130px 130px',
            transition: reducedMotion
              ? 'none'
              : 'transform 1100ms cubic-bezier(0.22, 1, 0.36, 1)',
          }}
        >
          <line
            x1="130"
            y1="130"
            x2="130"
            y2="38"
            stroke={token.color}
            strokeWidth="3"
            strokeLinecap="round"
          />
          {/* Needle tip dot with ring */}
          <circle cx="130" cy="38" r="3.5" fill={token.color} opacity="0.9" />
          {/* Pivot hub */}
          <circle cx="130" cy="130" r="9" fill={token.color} opacity="0.3" />
          <circle cx="130" cy="130" r="6" fill={token.color} />
          <circle cx="130" cy="130" r="3" fill="#020617" />
        </g>

        <text x="20" y="150" className="fill-slate-400 text-[10px] font-mono">
          0
        </text>
        <text x="122" y="18" className="fill-slate-400 text-[10px] font-mono">
          250
        </text>
        <text x="225" y="150" className="fill-slate-400 text-[10px] font-mono">
          500
        </text>
      </svg>

      <div className="-mt-2 text-center">
        <div className="font-mono text-4xl font-bold tracking-tight" style={{ color: token.color }}>
          <CountUpNumber value={clamped} />
        </div>
        <div className="mt-1 flex items-center justify-center gap-2">
          <span
            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${token.bgClass}`}
          >
            {category || token.label}
          </span>
          <span className="font-mono text-xs text-slate-500 dark:text-slate-400">
            Lead: {dominantPollutant}
          </span>
        </div>
      </div>
    </div>
  );
}
