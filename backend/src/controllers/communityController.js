import { getCityAirQuality } from '../services/aqiService.js';
import { getCityTrendsAndForecast } from '../services/forecastService.js';
import { calculateExposureProxy } from '../services/exposureService.js';
import {
  generateCityAlerts,
  getAggregatedCommunitySummary,
  recordCommunityPledge,
} from '../services/communityService.js';

export const communityController = {
  async calculateExposure(req, res, next) {
    try {
      const { city, ...params } = req.body;
      let ambientPm25 = params.ambientPm25;
      if (ambientPm25 == null) {
        const aqiData = await getCityAirQuality({ cityQuery: city || 'bhopal' });
        ambientPm25 = aqiData.pollutants?.pm25 ?? 65;
      }
      const result = calculateExposureProxy({ ...params, ambientPm25 });
      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  async getCommunity(req, res, next) {
    try {
      const { city, page, limit } = req.validatedQuery;
      const cityAqi = await getCityAirQuality({ cityQuery: city });
      const summary = getAggregatedCommunitySummary({ cityAqi, page, limit });
      res.json(summary);
    } catch (err) {
      next(err);
    }
  },

  async createPledge(req, res, next) {
    try {
      const updated = recordCommunityPledge(req.body);
      res.status(201).json({ pledge: updated });
    } catch (err) {
      next(err);
    }
  },

  async getAlerts(req, res, next) {
    try {
      const city = req.query.city || 'bhopal';
      const [aqiData, forecastRes] = await Promise.all([
        getCityAirQuality({ cityQuery: city }),
        getCityTrendsAndForecast({ cityQuery: city, horizonHours: 24 }),
      ]);
      res.json(generateCityAlerts({ aqiData, forecast: forecastRes.forecast }));
    } catch (err) {
      next(err);
    }
  },
};
