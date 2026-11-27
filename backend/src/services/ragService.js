import { RAG_CORPUS } from '../data/ragCorpus.js';
import { env } from '../config/env.js';
import { logger } from '../config/logger.js';

const DEVANAGARI_RE = /[\u0900-\u097F]/;
const HINGLISH_HINTS = [
  'kya',
  'kaise',
  'kab',
  'hai',
  'hain',
  'karna',
  'kare',
  'karein',
  'mein',
  'subah',
  'shaam',
  'bachche',
  'bacche',
  'bahar',
  'safe',
  'aaj',
  'kal',
  'chahiye',
  'nahi',
];

export function detectLanguage(query, requested = 'auto') {
  if (requested && requested !== 'auto') return requested;
  if (DEVANAGARI_RE.test(query)) return 'hi';
  const tokens = query.toLowerCase().split(/\W+/);
  const hits = tokens.filter((t) => HINGLISH_HINTS.includes(t)).length;
  if (hits >= 2) return 'hinglish';
  return 'en';
}

export function retrieveGuidanceDocs(query, { cityId = 'bhopal', topK = 3 } = {}) {
  const qLower = query.toLowerCase();
  const terms = qLower.split(/[\s,?.!।]+/).filter((w) => w.length >= 2);

  const scored = RAG_CORPUS.map((doc) => {
    let score = 0;
    for (const kw of doc.keywords) {
      if (qLower.includes(kw)) score += 3;
      for (const t of terms) {
        if (kw.includes(t) || t.includes(kw)) score += 1.2;
      }
    }
    if (cityId === 'bhopal' && doc.id === 'BHOPAL-DISPERSION') score += 1.5;
    if (doc.id === 'CPCB-NAQI-2014') score += 0.5;
    return { doc, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, topK).map((s) => s.doc);
}

function buildGroundedPrompt({ message, language, aqiData, routine, docs }) {
  const langInstruction =
    language === 'hi'
      ? 'Respond in clear, natural Hindi (Devanagari script).'
      : language === 'hinglish'
        ? 'Respond in natural conversational Hinglish (Hindi words written in Latin script + simple English).'
        : 'Respond in clear, empathetic, concise English.';

  const contextBlock = {
    city: aqiData.city.name,
    aqi: aqiData.aqi,
    category: aqiData.category,
    dominantPollutant: aqiData.dominantPollutant,
    pollutants: aqiData.pollutants,
    weather: aqiData.weather,
    dataQuality: aqiData.dataQuality,
    stationTimestamp: aqiData.stationTimestamp,
    source: aqiData.source,
    familyRoutine: {
      zoneLabel: routine.zoneLabel,
      schoolWindow: `${routine.schoolStart}-${routine.schoolEnd}`,
      commuteMode: routine.commuteMode,
      outdoorWindow: `${routine.outdoorWindow} (${routine.outdoorMinutes}m)`,
      hasChildrenOrElderly: routine.hasChildrenOrElderly,
      cookingFuel: routine.cookingFuel,
    },
  };

  const docLines = docs
    .map((d) => `[${d.id}] (${d.organization}) ${d.title}: ${d.snippet}`)
    .join('\n');

  return [
    'You are Smog Saathi AI, an air pollution decision-support assistant for Indian families.',
    langInstruction,
    'STRICT RULES:',
    '- Ground every number ONLY in the JSON sensor context below. Never invent readings.',
    '- Cite supporting source IDs inline like [CPCB-NAQI-2014] or [WHO-AQG-2021].',
    '- Never claim medical diagnosis or guaranteed health outcomes.',
    '- Give a crisp, practical answer with timing, why, and key assumption.',
    '',
    `LIVE SENSOR & ROUTINE CONTEXT:\n${JSON.stringify(contextBlock)}`,
    '',
    `TRUSTED GUIDANCE EXCERPTS:\n${docLines}`,
    '',
    `USER QUESTION: ${message}`,
  ].join('\n');
}

function synthesizeGroundedFallback({ message, language, aqiData, routine, docs }) {
  const city = aqiData.city.name;
  const aqi = aqiData.aqi;
  const cat = aqiData.category;
  const pm25 = aqiData.pollutants?.pm25 ?? '--';
  const wind = aqiData.weather?.windKmh ?? '--';
  const qualityTag =
    aqiData.dataQuality === 'live'
      ? 'live'
      : aqiData.dataQuality === 'stale'
        ? 'stale cached'
        : 'sample demo';
  const citeIds = docs.map((d) => `[${d.id}]`).join(' ');
  const q = message.toLowerCase();

  const isMaskQ = /mask|n95|kf94|मास्क|commute|bike|scooter|bus|car/.test(q);
  const isOutdoorQ = /walk|play|run|jog|exercise|park|outdoor|school|morning|evening|बच्चे|खेल|टहल/.test(
    q
  );
  const isIndoorQ = /window|indoor|home|cook|kitchen|purifier|खोल|खिड़की|घर/.test(q);

  const guidancePoints = docs.map((d) => `• ${d.guidance[language] || d.guidance.en} [${d.id}]`).join('\n');

  if (language === 'hi') {
    const leadAdvice = isMaskQ
      ? aqi > 150
        ? `बाहर निकलते समय (विशेषकर ${routine.commuteMode.replace('_', ' ')} से) अच्छी फिटिंग वाला N95/KF94 मास्क ज़रूर पहनें।`
        : `भीड़भाड़ वाली सड़कों पर N95 मास्क उपयोगी रहेगा, क्योंकि अभी ${city} में PM2.5 स्तर ${pm25} µg/m³ है।`
      : isIndoorQ
        ? `शाम को हवा धीमी (${wind} km/h) होने पर सड़क की तरफ की खिड़कियाँ बंद रखें और रसोई का एग्जॉस्ट फैन चलाएँ।`
        : isOutdoorQ
          ? aqi > 200
            ? `अभी ${city} का AQI ${aqi} (${cat}) है — बच्चों के बाहरी खेल और सुबह की दौड़ को घर के अंदर शिफ्ट करना सुरक्षित रहेगा।`
            : `अभी ${city} का AQI ${aqi} (${cat}) है — दोपहर (1:00–4:30 PM) में हल्की सैर बेहतर रहेगी; सुबह की भारी कसरत सीमित रखें।`
          : `अभी ${city} में AQI ${aqi} (${cat}, मुख्य प्रदूषक ${aqiData.dominantPollutant}, PM2.5 ${pm25} µg/m³) और हवा ${wind} km/h है।`;

    return [
      `📍 **${city} स्थिति (${qualityTag} डेटा):** AQI **${aqi} (${cat})**, PM2.5 **${pm25} µg/m³**, हवा **${wind} km/h**।`,
      '',
      `**आपके रूटीन (${routine.zoneLabel}) के लिए सलाह:** ${leadAdvice}`,
      '',
      '**स्रोत-आधारित मार्गदर्शन:**',
      guidancePoints,
      '',
      `⚠️ *अस्वीकरण: यह केवल पर्यावरणीय निर्णय-सहायता मार्गदर्शन है (${citeIds}), कोई चिकित्सीय निदान या गारंटी नहीं।*`,
    ].join('\n');
  }

  if (language === 'hinglish') {
    const leadAdvice = isMaskQ
      ? aqi > 150
        ? `${routine.commuteMode.replace('_', ' ')} commute ke dauran snug N95/KF94 mask zaroor pehnein; cloth mask PM2.5 nahi rokta.`
        : `Busy traffic roads par N95 mask better protection dega kyunki abhi PM2.5 ${pm25} µg/m³ hai.`
      : isIndoorQ
        ? `Shaam ko hawa ${wind} km/h slow hone par windows band rakhein, cooking ke time exhaust fan chalayein aur wet-mop use karein.`
        : isOutdoorQ
          ? aqi > 200
            ? `Abhi ${city} ka AQI ${aqi} (${cat}) hai — bachchon ka outdoor play aur vigorous exercise aaj indoor shift karna best rahega.`
            : `Abhi ${city} ka AQI ${aqi} (${cat}) hai — heavy outdoor activity 30 min tak limit karein aur 1:00–4:30 PM ki breeze window prefer karein.`
          : `Aaj ${city} mein AQI ${aqi} (${cat}) hai, dominant pollutant ${aqiData.dominantPollutant} aur wind ${wind} km/h chal rahi hai.`;

    return [
      `📍 **${city} Live Snapshot (${qualityTag}):** AQI **${aqi} (${cat})** · PM2.5 **${pm25} µg/m³** · Wind **${wind} km/h**.`,
      '',
      `**Aapke Family Routine (${routine.zoneLabel}) ke liye action:** ${leadAdvice}`,
      '',
      '**Trusted Guidance:**',
      guidancePoints,
      '',
      `⚠️ *Note: Yeh decision-support guidance hai (${citeIds}), medical diagnosis ya guaranteed health outcome nahi.*`,
    ].join('\n');
  }

  const leadAdvice = isMaskQ
    ? aqi > 150
      ? `Wear a snug N95/KF94 respirator during your ${routine.commuteStart} commute, or switch from open transit to enclosed AC recirculation.`
      : `A fitted N95 mask helps on high-traffic corridors even at AQI ${aqi}, since roadside PM2.5 runs higher than background sensors.`
    : isIndoorQ
      ? `Time brief cross-ventilation for midday breeze hours, close road-facing windows before dusk (${wind} km/h wind), and run kitchen exhaust while cooking.`
      : isOutdoorQ
        ? aqi > 200
          ? `At AQI ${aqi} (${cat}), move your ${routine.outdoorMinutes}-minute outdoor session indoors and pause vigorous school playground exertion.`
          : `At AQI ${aqi} (${cat}), pace outdoor exertion to ~${Math.min(30, routine.outdoorMinutes)} minutes and favor 1:00–4:30 PM dispersion hours over calm mornings.`
        : `${city} currently reads AQI ${aqi} (${cat}), led by ${aqiData.dominantPollutant} (PM2.5 ${pm25} µg/m³) with ${wind} km/h wind.`;

  return [
    `📍 **${city} Snapshot (${qualityTag}):** AQI **${aqi} (${cat})** · PM2.5 **${pm25} µg/m³** · Wind **${wind} km/h**.`,
    '',
    `**Tailored to Your Routine (${routine.zoneLabel}):** ${leadAdvice}`,
    '',
    '**Grounded Guidance:**',
    guidancePoints,
    '',
    `⚠️ *Guidance only (${citeIds}) — not a medical diagnosis or guaranteed health outcome.*`,
  ].join('\n');
}

async function callGeminiIfConfigured(prompt) {
  if (!env.GEMINI_API_KEY) return null;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(env.LLM_MODEL)}:generateContent?key=${encodeURIComponent(env.GEMINI_API_KEY)}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.3, maxOutputTokens: 420 },
      }),
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`Gemini HTTP ${res.status}`);
    const data = await res.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text || null;
  } catch (err) {
    logger.warn('Gemini call failed; falling back to grounded RAG synthesizer', {
      error: err.message,
    });
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function callOpenAiIfConfigured(prompt) {
  if (!env.OPENAI_API_KEY) return null;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);
  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        temperature: 0.3,
        max_tokens: 420,
        messages: [{ role: 'user', parts: undefined, content: prompt }],
      }),
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`OpenAI HTTP ${res.status}`);
    const data = await res.json();
    return data?.choices?.[0]?.message?.content || null;
  } catch (err) {
    logger.warn('OpenAI call failed; falling back to grounded RAG synthesizer', {
      error: err.message,
    });
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export async function generateGroundedChatReply({ message, language = 'auto', aqiData, routine }) {
  const resolvedLang = detectLanguage(message, language);
  const docs = retrieveGuidanceDocs(message, { cityId: aqiData.city.id, topK: 3 });
  const prompt = buildGroundedPrompt({
    message,
    language: resolvedLang,
    aqiData,
    routine,
    docs,
  });

  let answer =
    (await callGeminiIfConfigured(prompt)) || (await callOpenAiIfConfigured(prompt));
  let mode = answer ? 'llm-rag' : 'grounded-rag-local';

  if (!answer) {
    answer = synthesizeGroundedFallback({
      message,
      language: resolvedLang,
      aqiData,
      routine,
      docs,
    });
  }

  return {
    answer,
    language: resolvedLang,
    mode,
    citations: docs.map((d) => ({
      id: d.id,
      title: d.title,
      organization: d.organization,
      snippet: d.snippet,
      url: d.url,
    })),
    sensorContext: {
      city: aqiData.city.name,
      aqi: aqiData.aqi,
      category: aqiData.category,
      dataQuality: aqiData.dataQuality,
      source: aqiData.source,
      stationTimestamp: aqiData.stationTimestamp,
    },
    disclaimer:
      'Decision-support guidance grounded in live/cached sensor data and CPCB/WHO/MoHFW advisories — not a medical diagnosis.',
  };
}
