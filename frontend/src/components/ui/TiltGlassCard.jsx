import { useRef, useState } from 'react';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';

export function TiltGlassCard({
  children,
  className = '',
  gradientBorder = false,
  disableTilt = false,
}) {
  const cardRef = useRef(null);
  const reducedMotion = usePrefersReducedMotion();
  const [tilt, setTilt] = useState({ rx: 0, ry: 0, gx: 50, gy: 50, hovering: false });

  const handleMouseMove = (e) => {
    if (disableTilt || reducedMotion || window.matchMedia('(pointer: coarse)').matches) return;
    const el = cardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    setTilt({
      rx: (0.5 - py) * 9,
      ry: (px - 0.5) * 10,
      gx: px * 100,
      gy: py * 100,
      hovering: true,
    });
  };

  const handleMouseLeave = () => {
    setTilt({ rx: 0, ry: 0, gx: 50, gy: 50, hovering: false });
  };

  const inner = (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={
        disableTilt || reducedMotion
          ? undefined
          : {
              transform: `perspective(1000px) rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`,
              transition: tilt.hovering ? 'transform 100ms ease-out' : 'transform 400ms ease-out',
            }
      }
      className={`glass-card relative overflow-hidden rounded-[1.2rem] shadow-glass ${className}`}
    >
      {/* Moving glare highlight */}
      {!disableTilt && !reducedMotion && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-20 transition-opacity duration-300"
          style={{
            opacity: tilt.hovering ? 0.2 : 0,
            background: `radial-gradient(circle 240px at ${tilt.gx}% ${tilt.gy}%, rgba(255,255,255,0.7), transparent 65%)`,
          }}
        />
      )}
      {/* Scan-line shimmer on hover */}
      {!disableTilt && !reducedMotion && tilt.hovering && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 z-10 h-px bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent"
          style={{ top: `${tilt.gy}%` }}
        />
      )}
      <div className="relative z-10">{children}</div>
    </div>
  );

  if (gradientBorder) {
    return <div className="gradient-border-wrap">{inner}</div>;
  }
  return inner;
}
