import { useEffect, useState } from 'react';
import { ShieldAlert, ArrowRight, ArrowLeft, Check } from 'lucide-react';
import { TiltGlassCard } from '../ui/TiltGlassCard';
import { MagneticButton } from '../ui/MagneticButton';
import { useLanguage } from '../../app/LanguageContext';

export function FamilyRoutineWizard({ initialRoutine, cityId, onSave, saving }) {
  const { t } = useLanguage();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(() => ({
    cityId: cityId || 'bhopal',
    zoneLabel: initialRoutine?.zoneLabel || 'TT Nagar / Arera Area',
    schoolStart: initialRoutine?.schoolStart || '07:45',
    schoolEnd: initialRoutine?.schoolEnd || '13:45',
    commuteMode: initialRoutine?.commuteMode || 'two_wheeler',
    commuteStart: initialRoutine?.commuteStart || '08:30',
    commuteReturn: initialRoutine?.commuteReturn || '18:15',
    outdoorWindow: initialRoutine?.outdoorWindow || 'early_morning',
    outdoorMinutes: initialRoutine?.outdoorMinutes ?? 45,
    householdSize: initialRoutine?.householdSize ?? 4,
    hasChildrenOrElderly: initialRoutine?.hasChildrenOrElderly ?? true,
    cookingFuel: initialRoutine?.cookingFuel || 'lpg_electric',
  }));

  useEffect(() => {
    if (initialRoutine) {
      setForm((prev) => ({
        ...prev,
        ...initialRoutine,
        cityId: cityId || initialRoutine.cityId || prev.cityId,
      }));
    }
  }, [initialRoutine, cityId]);

  const update = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (step !== 3 || saving) return;
    onSave({
      ...form,
      cityId: cityId || form.cityId,
      outdoorMinutes: Number(form.outdoorMinutes),
      householdSize: Number(form.householdSize),
    });
  };

  const steps = [
    { num: 1, title: t('stepMorning') },
    { num: 2, title: t('stepCommute') },
    { num: 3, title: t('stepOutdoor') },
  ];

  return (
    <TiltGlassCard className="p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-cyan-400">
            {t('routineTag')}
          </span>
          <h3 className="mt-1 font-display text-lg font-bold">{t('routineTitle')}</h3>
        </div>
        <div className="inline-flex items-center gap-1.5 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-1 text-[11px] text-cyan-700 dark:text-cyan-300">
          <ShieldAlert className="h-3.5 w-3.5" />
          {t('routinePrivacy')}
        </div>
      </div>

      {/* Stepper */}
      <div className="mt-5 grid grid-cols-3 gap-2">
        {steps.map((s) => (
          <button
            key={s.num}
            type="button"
            onClick={() => setStep(s.num)}
            className={`rounded-xl border px-3 py-2 text-left text-xs transition-colors ${
              step === s.num
                ? 'border-cyan-400 bg-gradient-to-br from-cyan-500/15 to-violet-500/15 font-semibold text-cyan-600 dark:text-cyan-300'
                : 'border-slate-300/60 text-slate-500 hover:border-slate-400 dark:border-slate-700 dark:text-slate-400'
            }`}
          >
            <div className="font-mono text-[10px]">
              {t('stepWord')} 0{s.num}
            </div>
            <div className="truncate">{s.title}</div>
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="mt-5 space-y-4">
        {step === 1 && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="block sm:col-span-2">
              <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                {t('wardLabel')}
              </span>
              <input
                type="text"
                maxLength={60}
                value={form.zoneLabel}
                onChange={(e) => update('zoneLabel', e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-300 bg-white/70 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900/70"
                placeholder="e.g. Arera Colony / TT Nagar"
              />
            </label>
            <label className="block">
              <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                {t('schoolStart')}
              </span>
              <input
                type="time"
                value={form.schoolStart}
                onChange={(e) => update('schoolStart', e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-300 bg-white/70 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900/70"
              />
            </label>
            <label className="block">
              <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                {t('schoolEnd')}
              </span>
              <input
                type="time"
                value={form.schoolEnd}
                onChange={(e) => update('schoolEnd', e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-300 bg-white/70 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900/70"
              />
            </label>
          </div>
        )}

        {step === 2 && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="block sm:col-span-2">
              <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                {t('commuteModeLabel')}
              </span>
              <select
                value={form.commuteMode}
                onChange={(e) => update('commuteMode', e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-300 bg-white/70 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900/70"
              >
                <option value="two_wheeler">{t('commuteTwoWheeler')}</option>
                <option value="carpool">{t('commuteCarpool')}</option>
                <option value="car_ac">{t('commuteCarAc')}</option>
                <option value="bus_metro">{t('commuteBusMetro')}</option>
                <option value="walk_cycle">{t('commuteWalkCycle')}</option>
              </select>
            </label>
            <label className="block">
              <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                {t('morningLeave')}
              </span>
              <input
                type="time"
                value={form.commuteStart}
                onChange={(e) => update('commuteStart', e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-300 bg-white/70 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900/70"
              />
            </label>
            <label className="block">
              <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                {t('eveningReturn')}
              </span>
              <input
                type="time"
                value={form.commuteReturn}
                onChange={(e) => update('commuteReturn', e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-300 bg-white/70 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900/70"
              />
            </label>
          </div>
        )}

        {step === 3 && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                {t('outdoorWindowLabel')}
              </span>
              <select
                value={form.outdoorWindow}
                onChange={(e) => update('outdoorWindow', e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-300 bg-white/70 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900/70"
              >
                <option value="early_morning">{t('windowEarly')}</option>
                <option value="midday">{t('windowMidday')}</option>
                <option value="evening">{t('windowEvening')}</option>
                <option value="none">{t('windowNone')}</option>
              </select>
            </label>
            <label className="block">
              <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                {t('outdoorDurationLabel')}
              </span>
              <input
                type="number"
                min={0}
                max={240}
                value={form.outdoorMinutes}
                onChange={(e) => update('outdoorMinutes', e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-300 bg-white/70 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900/70"
              />
            </label>
            <label className="block">
              <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
                {t('cookingFuelLabel')}
              </span>
              <select
                value={form.cookingFuel}
                onChange={(e) => update('cookingFuel', e.target.value)}
                className="mt-1 w-full rounded-xl border border-slate-300 bg-white/70 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900/70"
              >
                <option value="lpg_electric">{t('fuelLpg')}</option>
                <option value="mixed_biomass">{t('fuelBiomass')}</option>
              </select>
            </label>
            <label className="flex items-center gap-2.5 pt-5 text-sm">
              <input
                type="checkbox"
                checked={form.hasChildrenOrElderly}
                onChange={(e) => update('hasChildrenOrElderly', e.target.checked)}
                className="h-4 w-4 rounded accent-cyan-400"
              />
              <span>{t('vulnerableAtHome')}</span>
            </label>
          </div>
        )}

        <div className="flex items-center justify-between pt-2">
          <MagneticButton
            variant="ghost"
            disabled={step === 1}
            onClick={() => setStep((s) => Math.max(1, s - 1))}
          >
            <ArrowLeft className="h-4 w-4" />
            {t('backBtn')}
          </MagneticButton>

          {step < 3 ? (
            <MagneticButton
              key="next-step-btn"
              type="button"
              variant="secondary"
              onClick={() => setStep((s) => Math.min(3, s + 1))}
            >
              {t('nextStepBtn')}
              <ArrowRight className="h-4 w-4" />
            </MagneticButton>
          ) : (
            <MagneticButton key="submit-plan-btn" type="submit" disabled={saving}>
              <Check className="h-4 w-4" />
              {saving ? t('updatingPlanBtn') : t('savePlanBtn')}
            </MagneticButton>
          )}
        </div>
      </form>
    </TiltGlassCard>
  );
}
