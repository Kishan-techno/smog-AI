import { getCityAirQuality, listSupportedCities } from '../services/aqiService.js';

export const aqiController = {
  async listCities(_req, res, next) {
    try {
      res.json({ cities: listSupportedCities() });
    } catch (err) {
      next(err);
    }
  },

  async getCurrent(req, res, next) {
    try {
      const { city, lat, lon } = req.validatedQuery;
      const data = await getCityAirQuality({ cityQuery: city, lat, lon });
      res.json(data);
    } catch (err) {
      next(err);
    }
  },
};
