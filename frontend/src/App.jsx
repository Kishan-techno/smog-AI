import { lazy, Suspense, useState } from 'react';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { ThemeProvider } from './app/ThemeContext';
import { ToastProvider } from './app/ToastContext';
import { AuthProvider } from './app/AuthContext';
import { LanguageProvider, useLanguage } from './app/LanguageContext';
import { SmoothScrollProvider } from './components/motion/SmoothScrollProvider';
import { AmbientBackground } from './components/ui/AmbientBackground';
import { CustomCursor } from './components/ui/CustomCursor';
import { AlertsStrip } from './components/ui/AlertsStrip';
import { Navbar } from './components/layout/Navbar';
import { HeroSection } from './components/layout/HeroSection';
import { ScrollStorySection } from './components/motion/ScrollStorySection';
import { AuthModal } from './components/ui/AuthModal';
import { SkeletonBlock } from './components/ui/Skeleton';
import { DashboardSection } from './pages/DashboardSection';
import { SaathiChatSection } from './components/chat/SaathiChatSection';
import { apiFetch } from './utils/apiClient';

const TrendsAndForecastSection = lazy(() =>
  import('./components/charts/TrendsAndForecastSection')
);
const WhatIfSimulatorSection = lazy(() =>
  import('./components/simulator/WhatIfSimulatorSection')
);
const ExposureAndCommunitySection = lazy(() =>
  import('./components/exposure/ExposureAndCommunitySection')
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function Shell() {
  const { t } = useLanguage();
  const [selectedCity, setSelectedCity] = useState('bhopal');
  const [authOpen, setAuthOpen] = useState(false);

  const aqiQuery = useQuery({
    queryKey: ['aqi', selectedCity],
    queryFn: () => apiFetch(`/aqi/current?city=${encodeURIComponent(selectedCity)}`),
    staleTime: 5 * 60 * 1000,
  });

  return (
    <div className="relative min-h-screen">
      <AmbientBackground />
      <CustomCursor />
      <Navbar onOpenAuth={() => setAuthOpen(true)} />
      <main>
        <HeroSection aqiPreview={aqiQuery.data} />
        <AlertsStrip selectedCity={selectedCity} />
        <div id="how-it-works">
          <ScrollStorySection />
        </div>
        <DashboardSection
          selectedCity={selectedCity}
          onCityChange={setSelectedCity}
          aqiQuery={aqiQuery}
        />
        <SaathiChatSection selectedCity={selectedCity} />
        <Suspense
          fallback={
            <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
              <SkeletonBlock className="h-80 w-full" />
            </div>
          }
        >
          <TrendsAndForecastSection selectedCity={selectedCity} />
          <WhatIfSimulatorSection
            selectedCity={selectedCity}
            currentPm25={aqiQuery.data?.pollutants?.pm25}
          />
          <ExposureAndCommunitySection
            selectedCity={selectedCity}
            currentPm25={aqiQuery.data?.pollutants?.pm25}
          />
        </Suspense>
      </main>
      <footer className="border-t border-slate-200/70 py-8 text-center text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
        {t('footerText')}
      </footer>
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <LanguageProvider>
          <AuthProvider>
            <ToastProvider>
              <SmoothScrollProvider>
                <Shell />
              </SmoothScrollProvider>
            </ToastProvider>
          </AuthProvider>
        </LanguageProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
