import { useRef, useState } from 'react';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';

export function MagneticButton({
  children,
  className = '',
  variant = 'primary',
  type = 'button',
  disabled = false,
  onClick,
  ...props
}) {
  const ref = useRef(null);
  const reducedMotion = usePrefersReducedMotion();
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [glare, setGlare] = useState({ gx: 50, gy: 50, show: false });

  const handleMove = (e) => {
    if (disabled || reducedMotion || window.matchMedia('(pointer: coarse)').matches) return;
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    const dx = (e.clientX - (rect.left + rect.width / 2)) * 0.18;
    const dy = (e.clientY - (rect.top + rect.height / 2)) * 0.18;
    const gx = ((e.clientX - rect.left) / rect.width) * 100;
    const gy = ((e.clientY - rect.top) / rect.height) * 100;
    setOffset({ x: Math.max(-8, Math.min(8, dx)), y: Math.max(-6, Math.min(6, dy)) });
    setGlare({ gx, gy, show: true });
  };

  const reset = () => {
    setOffset({ x: 0, y: 0 });
    setGlare((g) => ({ ...g, show: false }));
  };

  const variants = {
    primary:
      'relative overflow-hidden bg-gradient-to-r from-cyan-500 via-indigo-500 to-violet-600 text-white font-semibold shadow-[0_0_24px_-4px_rgba(34,211,238,0.6),0_0_32px_-8px_rgba(139,92,246,0.5)] hover:from-cyan-400 hover:via-indigo-500 hover:to-violet-500 hover:shadow-[0_0_32px_-4px_rgba(34,211,238,0.85),0_0_40px_-6px_rgba(168,85,247,0.7)]',
    secondary:
      'glass-card relative overflow-hidden text-slate-900 dark:text-slate-100 font-medium border-cyan-500/25 hover:border-cyan-400/50 hover:bg-cyan-500/10 dark:hover:bg-cyan-500/15',
    ghost:
      'text-slate-700 dark:text-slate-200 hover:bg-cyan-500/10 font-medium',
  };

  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled}
      onClick={onClick}
      onMouseMove={handleMove}
      onMouseLeave={reset}
      style={
        reducedMotion
          ? undefined
          : {
              transform: `translate3d(${offset.x}px, ${offset.y}px, 0)`,
              transition: 'transform 180ms cubic-bezier(0.22, 1, 0.36, 1)',
            }
      }
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm transition-all disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${className}`}
      {...props}
    >
      {/* Per-button glare highlight */}
      {glare.show && !reducedMotion && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-xl opacity-30 transition-opacity duration-150"
          style={{
            background: `radial-gradient(circle 70px at ${glare.gx}% ${glare.gy}%, rgba(255,255,255,0.85), transparent 70%)`,
          }}
        />
      )}
      {children}
    </button>
  );
}