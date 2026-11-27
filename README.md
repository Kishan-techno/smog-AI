# Smog Saathi AI

**Explainable Air Pollution Decision-Support Platform for Families & Communities (Default City: Bhopal, India)**

Smog Saathi AI combines live air quality telemetry, meteorology dispersion, family routine windows, a FastAPI 24–48h forecasting service, a grounded multilingual RAG assistant (English / हिन्दी / Hinglish), a What-If simulator, and a privacy-preserving community dashboard.

> **Disclaimer:** Decision-support guidance only — never claims medical diagnosis, guaranteed health outcomes, or biological inhaled dose.

---

## Folder Structure

```text
smog-saathi-ai/
├── .env.example
├── docker-compose.yml
├── package.json              # Root scripts: `npm run dev`, `npm run build`, `npm run lint`, `npm test`
├── backend/                  # Node.js + Express (routes -> controllers -> services -> repositories -> validators)
│   ├── src/
│   │   ├── config/           # Env validation (Zod), MongoDB + memory fallback, SWR LRU cache, logger
│   │   ├── controllers/
│   │   ├── data/             # Bhopal & Indian city stations + CPCB/WHO/MoHFW RAG corpus
│   │   ├── middleware/       # Helmet, CORS, rate limiters, JWT auth, Zod validator, central error handler
│   │   ├── repositories/     # Mongoose models & indexed queries
│   │   ├── routes/
│   │   ├── services/         # AQI, Weather, Recommendations, RAG+SSE, Forecast, Simulator, Exposure, Community
│   │   ├── utils/            # CPCB NAQI calculator, CircuitBreaker HTTP client
│   │   └── validators/       # Zod schemas for every endpoint
│   └── tests/                # Vitest + Supertest unit and integration tests
├── ml-service/               # Python + FastAPI (24–48h forecast + sensor validation + insufficient-data guard)
│   ├── app/
│   │   ├── main.py
│   │   ├── forecaster.py
│   │   └── schemas.py
│   └── tests/                # Pytest test suite
└── frontend/                 # React + Vite + Tailwind + Framer Motion + GSAP + Lenis + Recharts + React Query
    ├── src/
    │   ├── app/              # Theme, Auth, Language (EN/HI/Hinglish), Toast providers
    │   ├── components/       # UI, Motion, Charts, Map, Chat, Routine, Simulator, Exposure & Community
    │   ├── i18n/             # English, Hindi, Hinglish UI dictionaries
    │   ├── pages/
    │   └── utils/            # AQI scale tokens & API client
    └── e2e/                  # Playwright Chrome E2E verification scripts
```

---

## Environment Variables (`.env`)

Copy `.env.example` to `.env`:

| Variable | Default | Purpose |
|---|---|---|
| `PORT` | `5000` | Express API port |
| `FRONTEND_URL` | `http://localhost:5173` | CORS allowed origin |
| `MONGODB_URI` | _(blank)_ | MongoDB connection string (uses in-memory fallback if blank/unreachable) |
| `JWT_SECRET` | _(dev secret)_ | JWT signing key (set a strong secret in production) |
| `AQI_CACHE_TTL_SECONDS` | `600` | Fresh AQI cache TTL (10 min SWR) |
| `WEATHER_CACHE_TTL_SECONDS` | `900` | Fresh weather cache TTL (15 min SWR) |
| `ML_SERVICE_URL` | `http://127.0.0.1:8000` | FastAPI ML forecast service URL |
| `WAQI_TOKEN` | _(optional)_ | Optional WAQI station token (Open-Meteo works without keys) |
| `OPENAQ_API_KEY` | _(optional)_ | Optional OpenAQ API key |
| `GEMINI_API_KEY` | _(optional)_ | Optional Gemini key (grounded local RAG synthesizer runs if blank) |
| `OPENAI_API_KEY` | _(optional)_ | Optional OpenAI key |

---

## Quick Start (One Command)

### 1. Install Dependencies
```bash
npm run install:all
pip install -r ml-service/requirements.txt
```

### 2. Run Everything (`API` + `ML` + `WEB`)
```bash
npm run dev
```
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:5000/api/health`
- FastAPI ML Service: `http://127.0.0.1:8000/health`

### Or via Docker Compose
```bash
docker-compose up --build
```

---

## Testing & Linting

```bash
# Backend lint + Vitest unit/integration tests
npm --prefix backend run lint && npm --prefix backend test

# ML service Pytest suite
python -m pytest -c ml-service/pytest.ini ml-service/tests

# Frontend lint + Vitest + production build
npm --prefix frontend run lint && npm --prefix frontend test && npm --prefix frontend run build
```
