import { FamilyRoutineModel } from './models.js';
import { isDbConnected } from '../config/db.js';

export const DEFAULT_ROUTINE = {
  cityId: 'bhopal',
  zoneLabel: 'TT Nagar / Arera Area',
  schoolStart: '07:45',
  schoolEnd: '13:45',
  commuteMode: 'two_wheeler',
  commuteStart: '08:30',
  commuteReturn: '18:15',
  outdoorWindow: 'early_morning',
  outdoorMinutes: 45,
  householdSize: 4,
  hasChildrenOrElderly: true,
  cookingFuel: 'lpg_electric',
};

const fallbackRoutines = new Map();

export const routineRepository = {
  async findByOwner(ownerKey) {
    if (!isDbConnected()) {
      const stored = fallbackRoutines.get(ownerKey);
      return stored ? { ...stored, isDefault: false } : { ...DEFAULT_ROUTINE, ownerKey, isDefault: true };
    }
    const doc = await FamilyRoutineModel.findOne({ ownerKey }).lean();
    if (!doc) {
      return { ...DEFAULT_ROUTINE, ownerKey, isDefault: true };
    }
    return { ...doc, isDefault: false };
  },

  async upsertByOwner(ownerKey, payload) {
    if (!isDbConnected()) {
      const record = { ...DEFAULT_ROUTINE, ...payload, ownerKey, updatedAt: new Date().toISOString() };
      fallbackRoutines.set(ownerKey, record);
      return { ...record, isDefault: false };
    }
    const doc = await FamilyRoutineModel.findOneAndUpdate(
      { ownerKey },
      { $set: { ...payload, ownerKey } },
      { new: true, upsert: true, runValidators: true }
    ).lean();
    return { ...doc, isDefault: false };
  },
};
