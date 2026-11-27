import { useEffect, useRef, useState } from 'react';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';

export function CountUpNumber({ value = 0, decimals = 0, durationMs = 500, className = '' }) {
  const reducedMotion = usePrefersReducedMotion();
  const ref = useRef(null);
  const hasAnimated = useRef(false);
  const [display, setDisplay] = useState(value);

  useEffect(() => {
    const target = Number(value);
    if (Number.isNaN(target)) {
      setDisplay(value);
      return undefined;
    }

    if (reducedMotion) {
      setDisplay(target);
      return undefined;
    }

    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setDisplay(target);
      return undefined;
    }

    const animate = () => {
      const startVal = 0;
      const startTime = performance.now();
      let rafId = 0;

      const step = (now) => {
        const progress = Math.min(1, (now - startTime) / durationMs);
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = startVal + (target - startVal) * eased;
        setDisplay(current);
        if (progress < 1) {
          rafId = requestAnimationFrame(step);
        } else {
          setDisplay(target);
        }
      };

      rafId = requestAnimationFrame(step);
      return () => cancelAnimationFrame(rafId);
    };

    if (hasAnimated.current) {
      setDisplay(target);
      return undefined;
    }

    let cleanupAnim = null;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          cleanupAnim = animate();
          observer.disconnect();
        }
      },
      { threshold: 0.25 }
    );
    observer.observe(el);

    return () => {
      observer.disconnect();
      if (cleanupAnim) cleanupAnim();
    };
  }, [value, durationMs, reducedMotion]);

  const formatted =
    typeof display === 'number'
      ? decimals > 0
        ? display.toFixed(decimals)
        : Math.round(display)
      : display;

  return (
    <span ref={ref} className={`tabular-nums ${className}`}>
      {formatted}
    </span>
  );
}
