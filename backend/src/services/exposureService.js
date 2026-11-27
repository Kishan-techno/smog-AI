/**
 * Personal Air Exposure Score calculator.
 * Exposure Proxy = sum(microenvironment concentration * duration hours).
 * Clearly NOT an internal biological / inhaled dose.
 */

export function calculateExposureProxy({
  ambientPm25 = 65,
  homeHours = 14,
  schoolOrWorkHours = 6.5,
  commuteHours = 1.5,
  outdoorHours = 2.0,
  commuteEnclosed = false,
  wearsN95OnCommute = false,
  kitchenExhaust = true,
}) {
  const basePm = Math.max(5, Number(ambientPm25) || 65);
  const totalHours = homeHours + schoolOrWorkHours + commuteHours + outdoorHours;
  if (totalHours > 24.01) {
    throw new Error('Total microenvironment hours cannot exceed 24 hours per day');
  }

  // Microenvironment concentrations (ug/m3)
  const homeConc = Math.round((basePm * (kitchenExhaust ? 0.62 : 0.88) + 6) * 10) / 10;
  const schoolWorkConc = Math.round(basePm * 0.72 * 10) / 10;
  const rawCommuteFactor = commuteEnclosed ? 0.88 : 1.35;
  const n95Factor = wearsN95OnCommute ? 0.35 : 1.0;
  const commuteConc = Math.round(basePm * rawCommuteFactor * n95Factor * 10) / 10;
  const outdoorConc = Math.round(basePm * 1.05 * 10) / 10;

  const environments = [
    {
      id: 'home',
      label: 'Home Indoor',
      hours: Number(homeHours),
      concentration: homeConc,
      proxyScore: Math.round(homeConc * homeHours),
    },
    {
      id: 'school_work',
      label: 'School / Workplace',
      hours: Number(schoolOrWorkHours),
      concentration: schoolWorkConc,
      proxyScore: Math.round(schoolWorkConc * schoolOrWorkHours),
    },
    {
      id: 'commute',
      label: 'Transit / Commute',
      hours: Number(commuteHours),
      concentration: commuteConc,
      proxyScore: Math.round(commuteConc * commuteHours),
    },
    {
      id: 'outdoor',
      label: 'Outdoor Activity',
      hours: Number(outdoorHours),
      concentration: outdoorConc,
      proxyScore: Math.round(outdoorConc * outdoorHours),
    },
  ];

  const totalExposureProxy = environments.reduce((acc, e) => acc + e.proxyScore, 0);
  const weightedAvgPm25 =
    totalHours > 0 ? Math.round((totalExposureProxy / totalHours) * 10) / 10 : 0;

  // WHO 24-hour guideline reference proxy: 15 ug/m3 * 24h = 360 ug/m3*hr
  const whoReferenceProxy = 360;
  const ratioToWho = Math.round((totalExposureProxy / whoReferenceProxy) * 10) / 10;

  const band =
    weightedAvgPm25 <= 25
      ? { label: 'Low Proxy', color: '#10B981' }
      : weightedAvgPm25 <= 55
        ? { label: 'Moderate Proxy', color: '#F59E0B' }
        : weightedAvgPm25 <= 90
          ? { label: 'Elevated Proxy', color: '#F97316' }
          : { label: 'High Proxy', color: '#EF4444' };

  return {
    ambientPm25: basePm,
    totalHours: Math.round(totalHours * 10) / 10,
    totalExposureProxy,
    weightedAvgPm25,
    whoReferenceProxy,
    ratioToWho,
    band,
    environments: environments.map((e) => ({
      ...e,
      sharePct:
        totalExposureProxy > 0 ? Math.round((e.proxyScore / totalExposureProxy) * 100) : 0,
    })),
    formula: 'Exposure Proxy = Σ (Estimated Microenvironment PM2.5 µg/m³ × Hours)',
    disclaimer:
      'This is an environmental concentration-time exposure proxy, NOT an inhaled biological dose or medical risk assessment.',
  };
}
