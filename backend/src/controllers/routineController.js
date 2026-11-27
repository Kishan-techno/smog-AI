import { resolveOwnerKey } from '../middleware/auth.js';
import { routineRepository } from '../repositories/routineRepository.js';
import { getCityAirQuality } from '../services/aqiService.js';
import { generateDailyActionPlan } from '../services/recommendationService.js';

export const routineController = {
  async getRoutine(req, res, next) {
    try {
      const ownerKey = resolveOwnerKey(req);
      const routine = await routineRepository.findByOwner(ownerKey);
      res.json({ routine });
    } catch (err) {
      next(err);
    }
  },

  async saveRoutine(req, res, next) {
    try {
      const ownerKey = resolveOwnerKey(req);
      const routine = await routineRepository.upsertByOwner(ownerKey, req.body);
      const aqiData = await getCityAirQuality({ cityQuery: routine.cityId });
      const plan = generateDailyActionPlan({ aqiData, routine });
      res.json({ routine, plan });
    } catch (err) {
      next(err);
    }
  },

  async getPlan(req, res, next) {
    try {
      const ownerKey = resolveOwnerKey(req);
      const routine = await routineRepository.findByOwner(ownerKey);
      const cityQuery = req.query.city || routine.cityId || 'bhopal';
      const aqiData = await getCityAirQuality({ cityQuery });
      const plan = generateDailyActionPlan({ aqiData, routine });
      res.json({ plan, routine });
    } catch (err) {
      next(err);
    }
  },
};
