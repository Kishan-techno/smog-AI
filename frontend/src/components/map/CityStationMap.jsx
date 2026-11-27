import { useMemo, useState } from 'react';
import { MapPin, Clock, Radio } from 'lucide-react';
import { formatTimeIST, getAqiToken } from '../../utils/aqiTokens';
import { useLanguage } from '../../app/LanguageContext';

export function CityStationMap({ city, stations = [], selectedStationId, onSelectStation }) {
  const { t } = useLanguage();
  const [hoveredId, setHoveredId] = useState(null);

  const projected = useMemo(() => {
    if (!stations.length) return [];
    const lats = stations.map((s) => s.lat);
    const lons = stations.map((s) => s.lon);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLon = Math.min(...lons);
    const maxLon = Math.max(...lons);
    const latSpan = Math.max(0.04, maxLat - minLat);
    const lonSpan = Math.max(0.04, maxLon - minLon);

    return stations.map((st) => {
      const x = 16 + ((st.lon - minLon) / lonSpan) * 68;
      const y = 82 - ((st.lat - minLat) / latSpan) * 64;
      return { ...st, x, y };
    });
  }, [stations]);

  const activeStation =
    projected.find((s) => s.id === (hoveredId || selectedStationId)) || projected[0] || null;

  return (
    <div className="hud-corners relative overflow-hidden rounded-2xl border border-cyan-500/30 bg-[#050a1e]/95 p-4 text-slate-100 shadow-[0_0_45px_-14px_rgba(34,211,238,0.38)]">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-cyan-400" />
          </span>
          <MapPin className="h-4 w-4 text-cyan-400" />
          <span className="text-sm font-semibold tracking-tight">
            {city?.name} {t('mapTelemetrySuffix')}
          </span>
        </div>
        <span className="font-mono text-[11px] text-cyan-300/85">
          {stations.length} {t('mapNodesHint')}
        </span>
      </div>

      {/* Spatial SVG Map */}
      <div className="relative h-[265px] w-full overflow-hidden rounded-xl border border-indigo-900/70 bg-[radial-gradient(circle_at_35%_35%,rgba(34,211,238,0.18),rgba(3,6,20,0.98))]">
        {/* Subtle rotating radar sweep */}
        <div
          aria-hidden="true"
          className="radar-sweep pointer-events-none absolute left-1/2 top-1/2 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 opacity-30"
          style={{
            background:
              'conic-gradient(from 0deg, rgba(34,211,238,0.42) 0deg, rgba(168,85,247,0.14) 40deg, transparent 78deg)',
          }}
        />
        <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden="true">
          {/* Subtle grid */}
          {[20, 40, 60, 80].map((pos) => (
            <g key={pos}>
              <line x1={pos} y1="0" x2={pos} y2="100" stroke="#334155" strokeWidth="0.25" />
              <line x1="0" y1={pos} x2="100" y2={pos} stroke="#334155" strokeWidth="0.25" />
            </g>
          ))}
          {/* Bhopal Upper/Lower Lake stylized water body when Bhopal is active */}
          {city?.id === 'bhopal' && (
            <path
              d="M 10 42 C 20 32, 34 38, 38 48 C 40 56, 26 62, 15 55 Z"
              fill="rgba(56, 189, 248, 0.22)"
              stroke="rgba(56, 189, 248, 0.45)"
              strokeWidth="0.5"
            />
          )}
          {/* Connecting corridors */}
          {projected.length > 1 &&
            projected.slice(1).map((st) => (
              <line
                key={`line-${st.id}`}
                x1={projected[0].x}
                y1={projected[0].y}
                x2={st.x}
                y2={st.y}
                stroke="rgba(148, 163, 184, 0.16)"
                strokeWidth="0.4"
                strokeDasharray="1.5 1.5"
              />
            ))}
        </svg>

        {/* Interactive Station Markers */}
        {projected.map((st) => {
          const token = getAqiToken(st.aqi);
          const isExpanded = activeStation?.id === st.id;
          return (
            <button
              key={st.id}
              type="button"
              onMouseEnter={() => setHoveredId(st.id)}
              onMouseLeave={() => setHoveredId(null)}
              onFocus={() => setHoveredId(st.id)}
              onClick={() => onSelectStation?.(st)}
              style={{ left: `${st.x}%`, top: `${st.y}%` }}
              aria-label={`${st.name}, AQI ${st.aqi} (${token.label})`}
              className={`group absolute -translate-x-1/2 -translate-y-1/2 transition-transform duration-200 focus:outline-none ${
                isExpanded ? 'z-20 scale-110' : 'z-10 hover:scale-105'
              }`}
            >
              <span
                className="flex items-center gap-1.5 rounded-full border border-white/25 px-2.5 py-1 text-xs font-mono font-bold shadow-lg backdrop-blur-md"
                style={{
                  backgroundColor: isExpanded ? token.color : 'rgba(15, 23, 42, 0.88)',
                  color: isExpanded ? '#020617' : '#f8fafc',
                }}
              >
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: isExpanded ? '#020617' : token.color }}
                />
                {st.aqi}
              </span>
            </button>
          );
        })}

        {/* Expanded Mini AQI Card */}
        {activeStation && (
          <div className="absolute bottom-2.5 left-2.5 right-2.5 z-30 rounded-xl border border-white/15 bg-slate-950/90 p-3 backdrop-blur-md sm:left-auto sm:w-72">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs font-semibold text-white">{activeStation.name}</p>
                <p className="text-[11px] text-slate-400">{activeStation.zone}</p>
              </div>
              <span
                className="rounded-md px-2 py-0.5 font-mono text-xs font-bold text-slate-950"
                style={{ backgroundColor: getAqiToken(activeStation.aqi).color }}
              >
                AQI {activeStation.aqi}
              </span>
            </div>
            <div className="mt-2 grid grid-cols-3 gap-2 font-mono text-[11px] text-slate-300">
              <div>PM2.5: {activeStation.pollutants?.pm25 ?? '--'}</div>
              <div>PM10: {activeStation.pollutants?.pm10 ?? '--'}</div>
              <div>NO2: {activeStation.pollutants?.no2 ?? '--'}</div>
            </div>
            <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400">
              <span className="inline-flex items-center gap-1">
                <Radio className="h-3 w-3 text-emerald-400" />
                {activeStation.dataQuality === 'live'
                  ? 'Live'
                  : activeStation.dataQuality === 'stale'
                    ? 'Stale Cache'
                    : 'Sample Demo'}
              </span>
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatTimeIST(activeStation.timestamp)}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
