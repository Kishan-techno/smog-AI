import { useEffect, useState } from 'react';
import { Wind, Sun, Moon, User, LogOut, Menu, X } from 'lucide-react';
import { useTheme } from '../../app/ThemeContext';
import { useAuth } from '../../app/AuthContext';
import { useLanguage } from '../../app/LanguageContext';
import { MagneticButton } from '../ui/MagneticButton';

export function Navbar({ onOpenAuth }) {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const { lang, setLang, t } = useLanguage();
  const [scrollPct, setScrollPct] = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const doc = document.documentElement;
      const total = doc.scrollHeight - window.innerHeight;
      setScrollPct(total > 0 ? Math.min(100, (window.scrollY / total) * 100) : 0);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const navLinks = [
    { href: '#how-it-works', label: t('navHow') },
    { href: '#dashboard', label: t('navDashboard') },
    { href: '#routine-plan', label: t('navPlan') },
    { href: '#assistant', label: t('navChat') },
    { href: '#forecast', label: t('navForecast') },
    { href: '#simulator', label: t('navSimulator') },
    { href: '#exposure-community', label: t('navExposure') },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-cyan-500/15 bg-white/75 backdrop-blur-2xl dark:border-cyan-400/15 dark:bg-[#030614]/80">
      {/* Animated scroll progress bar */}
      <div
        aria-hidden="true"
        className="h-[2.5px] bg-gradient-to-r from-cyan-400 via-indigo-400 to-fuchsia-500 transition-[width] duration-75"
        style={{ width: `${scrollPct}%` }}
      />
      {/* Subtle top glow line */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/60 to-transparent"
      />
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-3 py-2.5 sm:px-6 lg:px-8">
        <a href="#top" className="group flex min-w-0 items-center gap-2">
          <span className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400 via-indigo-500 to-violet-600 text-white shadow-[0_0_20px_-3px_rgba(34,211,238,0.8)] transition-shadow group-hover:shadow-[0_0_30px_-2px_rgba(168,85,247,0.9)] sm:h-9 sm:w-9">
            <Wind className="h-4 w-4 sm:h-5 sm:w-5" />
          </span>
          <div className="min-w-0">
            <span className="block truncate bg-gradient-to-r from-slate-900 via-indigo-900 to-slate-800 bg-clip-text font-display text-sm font-bold tracking-tight text-transparent dark:from-white dark:via-cyan-200 dark:to-violet-200 sm:text-base">
              Smog Saathi AI
            </span>
            <span className="hidden text-[10px] font-semibold uppercase tracking-widest text-cyan-600 dark:text-cyan-400 sm:block">
              {t('brandTag')}
            </span>
          </div>
        </a>

        <nav aria-label="Primary" className="hidden items-center gap-4 lg:flex">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="whitespace-nowrap text-xs font-medium text-slate-600 transition-colors hover:text-cyan-500 dark:text-slate-300 dark:hover:text-cyan-300"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Bilingual UI Switcher */}
          <div
            role="group"
            aria-label="UI Language"
            className="flex items-center rounded-xl border border-cyan-500/20 bg-white/60 p-0.5 text-[11px] dark:border-cyan-400/20 dark:bg-slate-900/75"
          >
            {[
              { id: 'en', label: 'EN' },
              { id: 'hi', label: 'हिं' },
              { id: 'hinglish', label: 'Hing' },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setLang(item.id)}
                className={`rounded-lg px-2 py-1 font-medium transition-colors ${
                  lang === item.id
                    ? 'bg-gradient-to-r from-cyan-400 to-violet-500 font-semibold text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-300'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            className="glass-card rounded-xl p-2 text-slate-700 hover:text-cyan-400 dark:text-slate-200"
          >
            {theme === 'dark' ? <Sun className="h-4 w-4 text-amber-300" /> : <Moon className="h-4 w-4 text-indigo-600" />}
          </button>

          {user ? (
            <div className="hidden items-center gap-2 sm:flex">
              <span className="glass-card rounded-xl px-3 py-1.5 text-xs font-medium">
                {user.name}
              </span>
              <button
                type="button"
                onClick={logout}
                aria-label="Sign out"
                className="glass-card rounded-xl p-2 text-slate-400 hover:text-orange-400"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <MagneticButton
              variant="secondary"
              onClick={onOpenAuth}
              className="hidden sm:inline-flex !px-3 !py-2 text-xs"
            >
              <User className="h-3.5 w-3.5" />
              {t('signIn')}
            </MagneticButton>
          )}

          <button
            type="button"
            onClick={() => setMobileOpen((o) => !o)}
            aria-label="Toggle navigation menu"
            aria-expanded={mobileOpen}
            className="glass-card rounded-xl p-2 lg:hidden"
          >
            {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-slate-200/70 px-4 py-3 dark:border-slate-800 lg:hidden">
          <div className="flex flex-col gap-1.5">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="rounded-lg px-3 py-2 text-sm font-medium hover:bg-slate-500/10"
              >
                {link.label}
              </a>
            ))}
            {!user ? (
              <button
                type="button"
                onClick={() => {
                  setMobileOpen(false);
                  onOpenAuth();
                }}
                className="rounded-lg bg-gradient-to-r from-cyan-500 to-violet-500 px-3 py-2 text-left text-sm font-semibold text-white"
              >
                {t('signInMobile')}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setMobileOpen(false);
                  logout();
                }}
                className="rounded-lg px-3 py-2 text-left text-sm text-orange-400"
              >
                {t('signOut')} ({user.name})
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
