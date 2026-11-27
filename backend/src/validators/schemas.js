import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(120),
  password: z.string().min(6).max(100),
  preferredCity: z.string().trim().min(2).max(40).optional().default('bhopal'),
  preferredLanguage: z.enum(['en', 'hi', 'hinglish']).optional().default('en'),
});

export const loginSchema = z.object({
  email: z.string().trim().email().max(120),
  password: z.string().min(1).max(100),
});

export const aqiQuerySchema = z.object({
  city: z.string().trim().min(1).max(50).optional().default('bhopal'),
  lat: z.coerce.number().min(-90).max(90).optional(),
  lon: z.coerce.number().min(-180).max(180).optional(),
});

const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/;

export const routineSchema = z.object({
  cityId: z.string().trim().min(2).max(40).default('bhopal'),
  zoneLabel: z.string().trim().min(2).max(60).default('TT Nagar / Arera Area'),
  schoolStart: z.string().regex(timePattern, 'Use HH:MM 24h format').default('07:45'),
  schoolEnd: z.string().regex(timePattern, 'Use HH:MM 24h format').default('13:45'),
  commuteMode: z
    .enum(['two_wheeler', 'car_ac', 'carpool', 'bus_metro', 'walk_cycle'])
    .default('two_wheeler'),
  commuteStart: z.string().regex(timePattern, 'Use HH:MM 24h format').default('08:30'),
  commuteReturn: z.string().regex(timePattern, 'Use HH:MM 24h format').default('18:15'),
  outdoorWindow: z
    .enum(['early_morning', 'midday', 'evening', 'none'])
    .default('early_morning'),
  outdoorMinutes: z.coerce.number().int().min(0).max(240).default(45),
  householdSize: z.coerce.number().int().min(1).max(15).default(4),
  hasChildrenOrElderly: z.boolean().default(true),
  cookingFuel: z.enum(['lpg_electric', 'mixed_biomass']).default('lpg_electric'),
});

export const chatRequestSchema = z.object({
  message: z.string().trim().min(1, 'Please enter a question').max(1000),
  city: z.string().trim().min(1).max(50).optional().default('bhopal'),
  language: z.enum(['auto', 'en', 'hi', 'hinglish']).optional().default('auto'),
});

export const forecastQuerySchema = z.object({
  city: z.string().trim().min(1).max(50).optional().default('bhopal'),
  hours: z.coerce.number().int().min(12).max(48).optional().default(48),
  simulateMissing: z.enum(['true', 'false']).optional().default('false'),
});

export const simulatorRequestSchema = z.object({
  city: z.string().trim().min(1).max(50).optional().default('bhopal'),
  baselinePm25: z.coerce.number().min(5).max(800).optional(),
  commuteMode: z
    .enum(['private_open', 'private_car_ac', 'carpool', 'public_transit'])
    .optional()
    .default('private_open'),
  simulatedCommuteMode: z
    .enum(['private_open', 'private_car_ac', 'carpool', 'public_transit'])
    .optional()
    .default('carpool'),
  baselineExercise: z
    .enum(['outdoor_peak', 'outdoor_midday', 'indoor'])
    .optional()
    .default('outdoor_peak'),
  simulatedExercise: z
    .enum(['outdoor_peak', 'outdoor_midday', 'indoor'])
    .optional()
    .default('indoor'),
  indoorExhaustFan: z.boolean().optional().default(true),
  indoorWetMop: z.boolean().optional().default(true),
  avoidIncenseBiomass: z.boolean().optional().default(true),
  n95MaskOnCommute: z.boolean().optional().default(false),
});

export const exposureRequestSchema = z
  .object({
    city: z.string().trim().min(1).max(50).optional().default('bhopal'),
    ambientPm25: z.coerce.number().min(5).max(800).optional(),
    homeHours: z.coerce.number().min(0).max(24).default(14),
    schoolOrWorkHours: z.coerce.number().min(0).max(24).default(6.5),
    commuteHours: z.coerce.number().min(0).max(12).default(1.5),
    outdoorHours: z.coerce.number().min(0).max(16).default(2.0),
    commuteEnclosed: z.boolean().optional().default(false),
    wearsN95OnCommute: z.boolean().optional().default(false),
    kitchenExhaust: z.boolean().optional().default(true),
  })
  .refine(
    (d) => d.homeHours + d.schoolOrWorkHours + d.commuteHours + d.outdoorHours <= 24.01,
    { message: 'Total daily hours across environments cannot exceed 24' }
  );

export const communityQuerySchema = z.object({
  city: z.string().trim().min(1).max(50).optional().default('bhopal'),
  page: z.coerce.number().int().min(1).max(50).optional().default(1),
  limit: z.coerce.number().int().min(1).max(20).optional().default(4),
});

export const pledgeRequestSchema = z.object({
  zoneId: z.string().trim().min(2).max(60),
  pledgeType: z.enum(['carpool', 'clean_cooking', 'mask_transit']),
});
