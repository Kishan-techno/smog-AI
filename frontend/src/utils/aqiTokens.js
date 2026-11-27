export const AQI_SCALE = [
  {
    key: 'good',
    label: 'Good',
    min: 0,
    max: 50,
    color: '#10B981',
    bgClass: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border-emerald-500/30',
    description: 'Clean air; ideal for all outdoor family routines.',
  },
  {
    key: 'satisfactory',
    label: 'Satisfactory',
    min: 51,
    max: 100,
    color: '#84CC16',
    bgClass: 'bg-lime-500/15 text-lime-700 dark:text-lime-300 border-lime-500/30',
    description: 'Acceptable air; unusually sensitive individuals may pace heavy exertion.',
  },
  {
    key: 'moderate',
    label: 'Moderate',
    min: 101,
    max: 200,
    color: '#F59E0B',
    bgClass: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30',
    description: 'Children, older adults, and asthma-prone individuals should shorten strenuous outdoor play.',
  },
  {
    key: 'poor',
    label: 'Poor',
    min: 201,
    max: 300,
    color: '#F97316',
    bgClass: 'bg-orange-500/15 text-orange-700 dark:text-orange-300 border-orange-500/30',
    description: 'Use snug N95 masks for roadside transit and shift vigorous cardio indoors.',
  },
  {
    key: 'very_poor',
    label: 'Very Poor',
    min: 301,
    max: 400,
    color: '#EF4444',
    bgClass: 'bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/30',
    description: 'Keep windows sealed in peak haze hours and avoid outdoor exertion.',
  },
  {
    key: 'severe',
    label: 'Severe',
    min: 401,
    max: 500,
    color: '#991B1B',
    bgClass: 'bg-rose-900/25 text-rose-700 dark:text-rose-300 border-rose-700/40',
    description: 'High risk across all groups; minimize outdoor exposure and run indoor filtration if available.',
  },
];

export function getAqiToken(aqi) {
  const val = Math.max(0, Math.min(500, Math.round(Number(aqi) || 0)));
  return (
    AQI_SCALE.find((b) => val >= b.min && val <= b.max) || AQI_SCALE[AQI_SCALE.length - 1]
  );
}

export function formatTimeIST(isoString) {
  if (!isoString) return 'Just now';
  try {
    return new Intl.DateTimeFormat('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: 'short',
      hour12: true,
    }).format(new Date(isoString));
  } catch {
    return isoString;
  }
}
