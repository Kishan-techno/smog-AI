/**
 * What-If Scenario Simulator for daily PM2.5 exposure proxy (ug/m3 * hours).
 * Clearly shows assumptions and never presents proxy scores as medical inhaled dose.
 */

const COMMUTE_MULTIPLIERS = {
  private_open: { roadsideFactor: 1.35, durationHr: 1.2, label: 'Private open / dense traffic' },
  private_car_ac: { roadsideFactor: 0.92, durationHr: 1.0, label: 'Private car (AC)' },
  carpool: { roadsideFactor: 0.85, durationHr: 1.0, label: 'Shared carpool (AC recirculate)' },
  public_transit: { roadsideFactor: 0.88, durationHr: 1.1, label: 'Bus / Metro transit' },
};

const EXERCISE_SCENARIOS = {
  outdoor_peak: { ambientFactor: 1.18, breathingWeight: 2.8, hours: 0.75, label: 'Outdoor morning/evening peak' },
  outdoor_midday: { ambientFactor: 0.80, breathingWeight: 2.5, hours: 0.65, label: 'Outdoor midday breeze' },
  indoor: { ambientFactor: 0.55, breathingWeight: 2.2, hours: 0.75, label: 'Indoor workout' },
};

export function runWhatIfSimulation({
  baselinePm25 = 85,
  commuteMode = 'private_open',
  simulatedCommuteMode = 'carpool',
  baselineExercise = 'outdoor_peak',
  simulatedExercise = 'indoor',
  indoorExhaustFan = true,
  indoorWetMop = true,
  avoidIncenseBiomass = true,
  n95MaskOnCommute = false,
}) {
  const pm25 = Math.max(5, Number(baselinePm25) || 85);

  // Baseline daily breakdown (24h split: commute + exercise + home indoor + ambient baseline)
  const baseCommuteCfg = COMMUTE_MULTIPLIERS[commuteMode] || COMMUTE_MULTIPLIERS.private_open;
  const simCommuteCfg = COMMUTE_MULTIPLIERS[simulatedCommuteMode] || COMMUTE_MULTIPLIERS.carpool;

  const baseExCfg = EXERCISE_SCENARIOS[baselineExercise] || EXERCISE_SCENARIOS.outdoor_peak;
  const simExCfg = EXERCISE_SCENARIOS[simulatedExercise] || EXERCISE_SCENARIOS.indoor;

  const baseCommuteProxy = pm25 * baseCommuteCfg.roadsideFactor * baseCommuteCfg.durationHr;
  const maskFactor = n95MaskOnCommute ? 0.35 : 1.0;
  const simCommuteProxy = pm25 * simCommuteCfg.roadsideFactor * simCommuteCfg.durationHr * maskFactor;

  const baseExerciseProxy = pm25 * baseExCfg.ambientFactor * baseExCfg.hours * baseExCfg.breathingWeight;
  const simExerciseProxy = pm25 * simExCfg.ambientFactor * simExCfg.hours * simExCfg.breathingWeight;

  // Home indoor hours (~16 hours/day)
  const indoorHours = 16;
  const baseIndoorConc = pm25 * 0.72 + 18; // baseline indoor cooking/dust addition (+18 ug/m3)
  let indoorReduction = 0;
  if (indoorExhaustFan) indoorReduction += 0.16;
  if (indoorWetMop) indoorReduction += 0.08;
  if (avoidIncenseBiomass) indoorReduction += 0.14;
  const simIndoorConc = Math.max(8, baseIndoorConc * (1 - indoorReduction));

  const baseIndoorProxy = baseIndoorConc * indoorHours;
  const simIndoorProxy = simIndoorConc * indoorHours;

  const baselineTotal = Math.round(baseCommuteProxy + baseExerciseProxy + baseIndoorProxy);
  const simulatedTotal = Math.round(simCommuteProxy + simExerciseProxy + simIndoorProxy);
  const delta = Math.max(0, baselineTotal - simulatedTotal);
  const reductionPct = baselineTotal > 0 ? Math.round((delta / baselineTotal) * 1000) / 10 : 0;

  // Community vehicle emission proxy if neighborhood households carpool
  const tailpipeNote =
    simulatedCommuteMode === 'carpool' || simulatedCommuteMode === 'public_transit'
      ? 'Sharing rides reduces per-person corridor tailpipe emissions by ~45–60% on that trip.'
      : 'Commute vehicle tailpipe footprint unchanged.';

  return {
    baselinePm25: pm25,
    baselineTotalProxy: baselineTotal,
    simulatedTotalProxy: simulatedTotal,
    exposureProxySaved: delta,
    reductionPct,
    tailpipeNote,
    breakdown: [
      {
        segment: 'Commute',
        baseline: Math.round(baseCommuteProxy),
        simulated: Math.round(simCommuteProxy),
      },
      {
        segment: 'Exercise',
        baseline: Math.round(baseExerciseProxy),
        simulated: Math.round(simExerciseProxy),
      },
      {
        segment: 'Indoor Home',
        baseline: Math.round(baseIndoorProxy),
        simulated: Math.round(simIndoorProxy),
      },
    ],
    assumptions: [
      'Exposure proxy = sum(estimated microenvironment PM2.5 × hours × ventilation weighting); NOT an internal medical inhaled dose.',
      `Roadside traffic PM2.5 modeled at 1.35x urban background for open transit vs 0.85x for enclosed AC carpool.`,
      'Indoor smoke & dust controls assume functional kitchen exhaust fan (+16%), wet mopping (+8%), and avoiding incense/coils/biomass (+14%).',
      n95MaskOnCommute
        ? 'N95 mask assumes ~65% effective real-world filtration accounting for typical strap fit.'
        : 'No respirator mask assumed in simulated commute.',
    ],
  };
}
