import { getCityAirQuality } from '../services/aqiService.js';
import { getCityTrendsAndForecast } from '../services/forecastService.js';
import { runWhatIfSimulation } from '../services/simulatorService.js';

export const forecastController = {
  async getForecast(req, res, next) {
    try {
      const { city, hours, simulateMissing } = req.validatedQuery;
      const result = await getCityTrendsAndForecast({
        cityQuery: city,
        horizonHours: hours,
        simulateMissing: simulateMissing === 'true',
      });
      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  async simulate(req, res, next) {
    try {
      const { city, ...options } = req.body;
      let baselinePm25 = options.baselinePm25;
      if (baselinePm25 == null) {
        const aqiData = await getCityAirQuality({ cityQuery: city || 'bhopal' });
        baselinePm25 = aqiData.pollutants?.pm25 ?? 85;
      }
      const result = runWhatIfSimulation({ ...options, baselinePm25 });
      res.json(result);
    } catch (err) {
      next(err);
    }
  },
};
