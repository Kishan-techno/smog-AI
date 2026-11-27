import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    preferredCity: { type: String, default: 'bhopal' },
    preferredLanguage: { type: String, enum: ['en', 'hi', 'hinglish'], default: 'en' },
  },
  { timestamps: true }
);

const familyRoutineSchema = new mongoose.Schema(
  {
    ownerKey: { type: String, required: true, unique: true, index: true },
    cityId: { type: String, default: 'bhopal', index: true },
    zoneLabel: { type: String, default: 'Central Bhopal', maxlength: 60 },
    schoolStart: { type: String, default: '07:45' },
    schoolEnd: { type: String, default: '13:45' },
    commuteMode: {
      type: String,
      enum: ['two_wheeler', 'car_ac', 'carpool', 'bus_metro', 'walk_cycle'],
      default: 'two_wheeler',
    },
    commuteStart: { type: String, default: '08:30' },
    commuteReturn: { type: String, default: '18:15' },
    outdoorWindow: {
      type: String,
      enum: ['early_morning', 'midday', 'evening', 'none'],
      default: 'early_morning',
    },
    outdoorMinutes: { type: Number, min: 0, max: 240, default: 45 },
    householdSize: { type: Number, min: 1, max: 15, default: 4 },
    hasChildrenOrElderly: { type: Boolean, default: true },
    cookingFuel: {
      type: String,
      enum: ['lpg_electric', 'mixed_biomass'],
      default: 'lpg_electric',
    },
  },
  { timestamps: true }
);

const aqiSnapshotSchema = new mongoose.Schema(
  {
    cityId: { type: String, required: true, index: true },
    aqi: { type: Number, required: true },
    dominantPollutant: { type: String, required: true },
    dataQuality: { type: String, enum: ['live', 'stale', 'sample'], required: true },
    source: { type: String, required: true },
    recordedAt: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true }
);

aqiSnapshotSchema.index({ cityId: 1, recordedAt: -1 });

export const UserModel = mongoose.models.User || mongoose.model('User', userSchema);
export const FamilyRoutineModel =
  mongoose.models.FamilyRoutine || mongoose.model('FamilyRoutine', familyRoutineSchema);
export const AqiSnapshotModel =
  mongoose.models.AqiSnapshot || mongoose.model('AqiSnapshot', aqiSnapshotSchema);
