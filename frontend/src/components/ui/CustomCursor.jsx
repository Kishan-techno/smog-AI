import { useEffect, useState } from 'react';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';

export function CustomCursor() {
  const reducedMotion = usePrefersReducedMotion();
  const [enabled, setEnabled] = useState(false);
  const [pos, setPos] = useState({ x: -100, y: -100, active: false });
  const [trail, setTrail] = useState({ x: -100, y: -100 });

  useEffect(() => {
    if (reducedMotion || typeof window === 'undefined') {
      setEnabled(false);
      return undefined;
    }
    const isFinePointer = window.matchMedia('(pointer: fine)').matches;
    if (!isFinePointer) {
      setEnabled(false);
      return undefined;
    }
    setEnabled(true);

    let rafId = 0;
    let trailX = -100;
    let trailY = -100;

    const handleMove = (e) => {
      const target = e.target;
      const isInteractive = Boolean(
        target?.closest?.('a, button, input, select, textarea, [role="button"]')
      );
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        setPos({ x: e.clientX, y: e.clientY, active: isInteractive });
        trailX += (e.clientX - trailX) * 0.14;
        trailY += (e.clientY - trailY) * 0.14;
        setTrail({ x: trailX, y: trailY });
      });
    };

    window.addEventListener('mousemove', handleMove, { passive: true });
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('mousemove', handleMove);
    };
  }, [reducedMotion]);

  if (!enabled) return null;

  return (
    <div aria-hidden="true" className="pointer-events-none fixed left-0 top-0 z-[9999] hidden lg:block">
      {/* Outer trailing ring */}
      <div
        className={`absolute h-9 w-9 rounded-full border transition-colors ${
          pos.active ? 'border-violet-400/70' : 'border-cyan-400/45'
        }`}
        style={{
          transform: `translate3d(${trail.x - 18}px, ${trail.y - 18}px, 0)`,
          transition: 'transform 320ms cubic-bezier(0.22,1,0.36,1), border-color 200ms',
        }}
      />
      {/* Inner sharp glowing dot */}
      <div
        className="absolute rounded-full"
        style={{
          transform: `translate3d(${pos.x - 5}px, ${pos.y - 5}px, 0) scale(${pos.active ? 2.2 : 1})`,
          width: '10px',
          height: '10px',
          background: pos.active
            ? 'radial-gradient(circle, rgba(34,211,238,0.95) 0%, rgba(168,85,247,0.8) 100%)'
            : 'radial-gradient(circle, rgba(34,211,238,1) 0%, rgba(99,102,241,0.85) 100%)',
          boxShadow: pos.active
            ? '0 0 16px 4px rgba(34,211,238,0.65), 0 0 32px 8px rgba(168,85,247,0.4)'
            : '0 0 10px 2px rgba(34,211,238,0.55)',
          transition: 'transform 80ms cubic-bezier(0.22,1,0.36,1), box-shadow 150ms, background 150ms',
        }}
      />
      {/* Scan-line flare on interactive hover */}
      {pos.active && (
        <div
          className="absolute h-px w-16 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-transparent via-cyan-300/75 to-transparent"
          style={{ left: pos.x, top: pos.y }}
        />
      )}
    </div>
  );
}