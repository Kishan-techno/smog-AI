import { resolveOwnerKey } from '../middleware/auth.js';
import { routineRepository } from '../repositories/routineRepository.js';
import { getCityAirQuality } from '../services/aqiService.js';
import { generateGroundedChatReply } from '../services/ragService.js';

export const chatController = {
  async ask(req, res, next) {
    try {
      const { message, city, language } = req.body;
      const ownerKey = resolveOwnerKey(req);
      const [routine, aqiData] = await Promise.all([
        routineRepository.findByOwner(ownerKey),
        getCityAirQuality({ cityQuery: city || 'bhopal' }),
      ]);
      const reply = await generateGroundedChatReply({ message, language, aqiData, routine });
      res.json(reply);
    } catch (err) {
      next(err);
    }
  },

  async stream(req, res, next) {
    const startMs = Date.now();
    let closed = false;
    req.on('close', () => {
      closed = true;
    });

    try {
      const { message, city, language } = req.body;
      const ownerKey = resolveOwnerKey(req);

      res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
      res.setHeader('Cache-Control', 'no-cache, no-transform');
      res.setHeader('Connection', 'keep-alive');
      res.flushHeaders?.();

      const [routine, aqiData] = await Promise.all([
        routineRepository.findByOwner(ownerKey),
        getCityAirQuality({ cityQuery: city || 'bhopal' }),
      ]);

      if (closed) return;

      const reply = await generateGroundedChatReply({ message, language, aqiData, routine });
      if (closed) return;

      res.write(
        `event: meta\ndata: ${JSON.stringify({
          language: reply.language,
          mode: reply.mode,
          citations: reply.citations,
          sensorContext: reply.sensorContext,
          disclaimer: reply.disclaimer,
        })}\n\n`
      );

      // Stream tokens incrementally so first words arrive immediately (<1s)
      const chunks = reply.answer.match(/\S+\s*/g) || [reply.answer];
      for (let i = 0; i < chunks.length; i += 2) {
        if (closed) return;
        const delta = chunks.slice(i, i + 2).join('');
        res.write(`event: token\ndata: ${JSON.stringify({ delta })}\n\n`);
        await new Promise((r) => setTimeout(r, 18));
      }

      if (!closed) {
        res.write(
          `event: done\ndata: ${JSON.stringify({
            fullText: reply.answer,
            latencyMs: Date.now() - startMs,
          })}\n\n`
        );
        res.end();
      }
    } catch (err) {
      if (!res.headersSent) {
        return next(err);
      }
      res.write(`event: error\ndata: ${JSON.stringify({ message: err.message })}\n\n`);
      res.end();
    }
  },
};
