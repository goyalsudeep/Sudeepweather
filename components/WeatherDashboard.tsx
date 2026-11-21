'use client';

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity, AlertTriangle, Bookmark, CalendarDays, Check, ChevronDown, Cloud,
  CloudRain, Droplets, Gauge, Globe2, MapPin, Plus, RefreshCw, Search, Sun,
  Thermometer, Trash2, Wind, X
} from "lucide-react";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, ComposedChart, Line,
  LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis
} from "recharts";
import type { AirPayload, Place, WeatherPayload } from "@/lib/types";
import {
  aqiLabel, buildAlerts, DEFAULT_PLACE, formatTemp, placeLabel, searchPlaces,
  shortTemp, weatherEmoji, weatherLabel
} from "@/lib/weather";

type Tab = "10d" | "month" | "year";
type Unit = "C" | "F";
type ApiState<T> = { data: T | null; loading: boolean; error: string | null };
const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const fmtDay = (s: string) => new Date(`${s}T12:00:00`).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
const fmtHour = (s: string) => new Date(s).toLocaleTimeString(undefined, { hour: "numeric" });

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  const body = await response.json();
  if (!response.ok) throw new Error(body.error ?? "Request failed");
  return body as T;
}
function useApi<T>(url: string, enabled = true) {
  const [state, setState] = useState<ApiState<T>>({ data: null, loading: false, error: null });
  const load = useCallback(async () => {
    if (!enabled) return;
    setState(s => ({ ...s, loading: true, error: null }));
    try { const data = await fetchJson<T>(url); setState({ data, loading: false, error: null }); }
    catch (e) { setState(s => ({ ...s, loading: false, error: e instanceof Error ? e.message : "Unable to load data" })); }
  }, [url, enabled]);
  useEffect(() => { void load(); }, [load]);
  return { ...state, reload: load };
}
function Stat({ icon: Icon, label, value, sub }: { icon: React.ElementType; label: string; value: string; sub?: string }) {
  return <div className="stat-card"><div className="stat-icon"><Icon size={17}/></div><div><p className="stat-label">{label}</p><p className="stat-value">{value}</p>{sub && <p className="stat-sub">{sub}</p>}</div></div>;
}
function Panel({ title, subtitle, children, action }: { title: string; subtitle?: string; children: React.ReactNode; action?: React.ReactNode }) {
  return <section className="panel"><div className="panel-heading"><div><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div>{action}</div>{children}</section>;
}
function Loading({ label = "Loading weather data…" }: { label?: string }) { return <div className="loading"><span className="spinner"/>{label}</div>; }
function ErrorNote({ message, retry }: { message: string; retry: () => void }) { return <div className="error-note"><AlertTriangle size={17}/><span>{message}</span><button onClick={retry}>Retry</button></div>; }

export default function WeatherDashboard() {
  const [place, setPlace] = useState<Place>(DEFAULT_PLACE);
  const [tab, setTab] = useState<Tab>("10d");
  const [unit, setUnit] = useState<Unit>("C");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Place[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [saved, setSaved] = useState<Place[]>([]);
  const [showSaved, setShowSaved] = useState(false);
  const [historyYear, setHistoryYear] = useState(new Date().getFullYear() - 1);
  const [climateYear, setClimateYear] = useState(new Date().getFullYear() + 1);

  const coords = `lat=${place.latitude}&lon=${place.longitude}`;
  const weather = useApi<WeatherPayload>(`/api/weather?${coords}`);
  const air = useApi<AirPayload>(`/api/air-quality?${coords}`);
  const seasonal = useApi<any>(`/api/seasonal?${coords}`, tab === "month");
  const climate = useApi<any>(`/api/climate?${coords}&year=${climateYear}`, tab === "year");
  const history = useApi<any>(`/api/history?${coords}&year=${historyYear}`, tab === "year");

  useEffect(() => {
    try {
      const raw = localStorage.getItem("weathernow-saved");
      if (raw) setSaved(JSON.parse(raw));
    } catch { /* Ignore malformed local storage. */ }
  }, []);
  const persistSaved = (next: Place[]) => {
    setSaved(next);
    try { localStorage.setItem("weathernow-saved", JSON.stringify(next)); } catch { /* Storage may be unavailable. */ }
  };
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.trim().length < 2) { setResults([]); setSearchError(""); return; }
      setSearching(true); setSearchError("");
      try { setResults(await searchPlaces(query.trim())); }
      catch (e) { setSearchError(e instanceof Error ? e.message : "Search failed"); }
      finally { setSearching(false); }
    }, 350);
    return () => clearTimeout(timer);
  }, [query]);

  const choosePlace = (p: Place) => { setPlace(p); setQuery(""); setResults([]); setShowSaved(false); };
  const addSaved = () => {
    if (!saved.some(p => p.id === place.id)) persistSaved([...saved, place]);
  };
  const removeSaved = (id: string) => persistSaved(saved.filter(p => p.id !== id));
  const current = weather.data?.current;
  const daily = weather.data?.daily;
  const airCurrent = air.data?.current;
  const alerts = useMemo(() => buildAlerts(daily), [daily]);
  const dailyChart = useMemo(() => (daily?.time ?? []).map((date, i) => ({
    day: fmtDay(date), high: daily?.temperature_2m_max[i], low: daily?.temperature_2m_min[i],
    rain: daily?.precipitation_probability_max?.[i] ?? 0,
  })), [daily]);
  const monthlyRows = useMemo(() => {
    const hourly = seasonal.data?.hourly;
    if (!hourly?.time) return [];
    const buckets = new Map<string, { sum: number; count: number; rain: number; rainCount: number }>();
    hourly.time.forEach((time: string, i: number) => {
      const key = time.slice(0, 7);
      const bucket = buckets.get(key) ?? { sum: 0, count: 0, rain: 0, rainCount: 0 };
      if (Number.isFinite(hourly.temperature_2m?.[i])) { bucket.sum += hourly.temperature_2m[i]; bucket.count++; }
      if (Number.isFinite(hourly.precipitation?.[i])) { bucket.rain += hourly.precipitation[i]; bucket.rainCount++; }
      buckets.set(key, bucket);
    });
    return [...buckets.entries()].map(([key, b]) => ({
      month: new Date(`${key}-15T12:00:00`).toLocaleDateString(undefined, { month: "short" }),
      temperature: b.count ? b.sum / b.count : null,
      rainfall: b.rainCount ? b.rain : null,
    }));
  }, [seasonal.data]);
  const climateRows = useMemo(() => {
    const d = climate.data?.daily;
    if (!d?.time) return [];
    const buckets = new Map<number, { t: number; n: number; rain: number }>();
    d.time.forEach((date: string, i: number) => {
      const m = Number(date.slice(5, 7)) - 1;
      const b = buckets.get(m) ?? { t: 0, n: 0, rain: 0 };
      if (Number.isFinite(d.temperature_2m_mean?.[i])) { b.t += d.temperature_2m_mean[i]; b.n++; }
      if (Number.isFinite(d.precipitation_sum?.[i])) b.rain += d.precipitation_sum[i];
      buckets.set(m, b);
    });
    return months.map((month, i) => ({ month, temperature: buckets.get(i)?.n ? buckets.get(i)!.t / buckets.get(i)!.n : null, rainfall: buckets.get(i)?.rain ?? null }));
  }, [climate.data]);
  const historyRows = useMemo(() => {
    const d = history.data?.daily;
    if (!d?.time) return [];
    const buckets = new Map<number, { t: number; n: number; rain: number }>();
    d.time.forEach((date: string, i: number) => {
      const m = Number(date.slice(5, 7)) - 1;
      const b = buckets.get(m) ?? { t: 0, n: 0, rain: 0 };
      if (Number.isFinite(d.temperature_2m_mean?.[i])) { b.t += d.temperature_2m_mean[i]; b.n++; }
      if (Number.isFinite(d.precipitation_sum?.[i])) b.rain += d.precipitation_sum[i];
      buckets.set(m, b);
    });
    return months.map((month, i) => ({ month, temperature: buckets.get(i)?.n ? buckets.get(i)!.t / buckets.get(i)!.n : null, rainfall: buckets.get(i)?.rain ?? null }));
  }, [history.data]);
  const aqi = aqiLabel(airCurrent?.us_aqi);
  const hourlyRows = (weather.data?.hourly?.time ?? []).slice(0, 24).filter((_, i) => i % 3 === 0).map((time, _, arr) => {
    const index = (weather.data?.hourly?.time ?? []).indexOf(time);
    return { time: fmtHour(time), temp: weather.data?.hourly?.temperature_2m?.[index] };
  });

  return <main className="app-shell">
    <aside className="sidebar">
      <a className="brand" href="#"><span className="brand-mark"><Cloud size={22}/></span><span>Weather<span>Now</span><small>WEATHER INTELLIGENCE</small></span></a>
      <div className="side-label">WORKSPACE</div>
      <button className={`nav-item ${tab === "10d" ? "active" : ""}`} onClick={() => setTab("10d")}><Sun size={18}/> Weather overview</button>
      <button className={`nav-item ${tab === "month" ? "active" : ""}`} onClick={() => setTab("month")}><CalendarDays size={18}/> Monthly outlook</button>
      <button className={`nav-item ${tab === "year" ? "active" : ""}`} onClick={() => setTab("year")}><Activity size={18}/> Annual climate</button>
      <div className="side-label saved-label">SAVED LOCATIONS <button aria-label="Show saved locations" onClick={() => setShowSaved(!showSaved)}><Plus size={14}/></button></div>
      <div className="saved-list">
        {saved.length === 0 ? <p className="empty-saved">Save places to compare their weather.</p> : saved.map(p => <div className="saved-place" key={p.id}><button onClick={() => choosePlace(p)}><MapPin size={14}/><span>{p.name}</span></button><button className="remove-place" aria-label={`Remove ${p.name}`} onClick={() => removeSaved(p.id)}><Trash2 size={13}/></button></div>)}
      </div>
      <div className="sidebar-bottom"><div className="provider-mark"><Globe2 size={16}/><span>Powered by Open-Meteo</span></div><p>Forecasts are model-based estimates. Always follow official local warnings.</p></div>
    </aside>

    <section className="main-area">
      <header className="topbar">
        <div><p className="eyebrow">WEATHER & CLIMATE INTELLIGENCE</p><h1>Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 18 ? "afternoon" : "evening"}</h1></div>
        <div className="top-actions">
          <div className="unit-toggle"><button className={unit === "C" ? "selected" : ""} onClick={() => setUnit("C")}>°C</button><button className={unit === "F" ? "selected" : ""} onClick={() => setUnit("F")}>°F</button><span>Both shown in details</span></div>
          <button className="icon-button" title="Refresh weather" onClick={() => { void weather.reload(); void air.reload(); }}><RefreshCw size={17}/></button>
        </div>
      </header>

      <div className="location-row">
        <div className="location-heading"><MapPin size={17}/><div><strong>{place.name}</strong><span>{[place.admin1, place.country].filter(Boolean).join(", ")}</span></div></div>
        <div className="search-wrap">
          <Search size={17}/>
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search city or location…" aria-label="Search city"/>
          {query && <button className="clear-search" onClick={() => { setQuery(""); setResults([]); }}><X size={15}/></button>}
          {(results.length > 0 || searching || searchError) && <div className="search-results">
            {searching && <p className="search-status">Searching locations…</p>}
            {searchError && <p className="search-status error-text">{searchError}</p>}
            {results.map(p => <button key={p.id} onClick={() => choosePlace(p)}><MapPin size={15}/><span><strong>{p.name}</strong><small>{[p.admin1, p.country].filter(Boolean).join(", ")}</small></span></button>)}
            {!searching && results.length === 0 && !searchError && <p className="search-status">No locations found.</p>}
          </div>}
        </div>
        <button className="save-button" onClick={addSaved}><Bookmark size={16}/>{saved.some(p => p.id === place.id) ? "Saved" : "Save location"}</button>
      </div>

      <div className="tab-row">
        <button className={tab === "10d" ? "active" : ""} onClick={() => setTab("10d")}>10-day forecast</button>
        <button className={tab === "month" ? "active" : ""} onClick={() => setTab("month")}>Monthly outlook</button>
        <button className={tab === "year" ? "active" : ""} onClick={() => setTab("year")}>Annual climate</button>
      </div>

      {weather.loading && !weather.data ? <Loading/> : weather.error && !weather.data ? <ErrorNote message={weather.error} retry={() => void weather.reload()}/> : <>
        <div className="hero-grid">
          <section className="hero-card">
            <div className="hero-top"><span className="live-dot"/> CURRENT CONDITIONS <span className="updated-label">{current?.time ? `Updated ${new Date(current.time).toLocaleTimeString([], {hour:"numeric",minute:"2-digit"})}` : "Live weather"}</span></div>
            <div className="hero-main"><div><p className="hero-temp">{current ? shortTemp(current.temperature_2m, unit) : "—"}</p><p className="hero-description">{weatherLabel(current?.weather_code)}</p><p className="feels-like">Feels like {current ? formatTemp(current.apparent_temperature, "both") : "—"}</p></div><div className="hero-weather-icon">{weatherEmoji(current?.weather_code)}</div></div>
            <div className="hero-bottom"><span><Sun size={15}/> {current?.is_day ? "Daytime" : "Current conditions"}</span><span><MapPin size={15}/> {place.name}</span></div>
          </section>
          <div className="stats-grid">
            <Stat icon={Droplets} label="Humidity" value={current ? `${Math.round(current.relative_humidity_2m)}%` : "—"} sub="Relative humidity"/>
            <Stat icon={Wind} label="Wind speed" value={current ? `${Math.round(current.wind_speed_10m)} km/h` : "—"} sub="10 m above ground"/>
            <Stat icon={Thermometer} label="Feels like" value={current ? formatTemp(current.apparent_temperature, unit) : "—"} sub="Apparent temperature"/>
            <Stat icon={CloudRain} label="Precipitation" value={current ? `${current.precipitation ?? 0} mm` : "—"} sub="Current amount"/>
          </div>
        </div>

        <div className="content-grid">
          <div className="primary-column">
            {tab === "10d" && <>
              <Panel title="10-day forecast" subtitle="Daily highs, lows and precipitation probability" action={<span className="small-pill">Daily forecast</span>}>
                {!daily ? <Loading/> : <div className="forecast-list">{daily.time.map((date, i) => <div className="forecast-row" key={date}><div className="forecast-date">{i === 0 ? "Today" : i === 1 ? "Tomorrow" : fmtDay(date)}</div><div className="forecast-icon">{weatherEmoji(daily.weather_code[i])}</div><div className="forecast-condition">{weatherLabel(daily.weather_code[i])}</div><div className="forecast-rain"><Droplets size={13}/>{daily.precipitation_probability_max?.[i] ?? "—"}%</div><div className="forecast-temp"><strong>{shortTemp(daily.temperature_2m_max[i], unit)}</strong><span>{shortTemp(daily.temperature_2m_min[i], unit)}</span></div></div>)}</div>}
              </Panel>
              <Panel title="Temperature trend" subtitle="Daily maximum and minimum temperatures">
                {dailyChart.length ? <div className="chart-wrap"><ResponsiveContainer width="100%" height={250}><LineChart data={dailyChart} margin={{top:10,right:12,left:-18,bottom:0}}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e9eef5"/><XAxis dataKey="day" tick={{fontSize:11,fill:"#8190a5"}} axisLine={false} tickLine={false}/><YAxis tick={{fontSize:11,fill:"#8190a5"}} axisLine={false} tickLine={false} unit="°"/><Tooltip/><Line type="monotone" dataKey="high" name="High °C" stroke="#f59e0b" strokeWidth={2.5} dot={{r:3}}/><Line type="monotone" dataKey="low" name="Low °C" stroke="#3b82f6" strokeWidth={2.5} dot={{r:3}}/></LineChart></ResponsiveContainer></div> : <Loading/>}
              </Panel>
              <Panel title="Next 24 hours" subtitle="Hourly temperature trend">
                {hourlyRows.length ? <div className="chart-wrap"><ResponsiveContainer width="100%" height={190}><AreaChart data={hourlyRows}><defs><linearGradient id="tempFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#3b82f6" stopOpacity={0.22}/><stop offset="100%" stopColor="#3b82f6" stopOpacity={0.01}/></linearGradient></defs><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e9eef5"/><XAxis dataKey="time" tick={{fontSize:11,fill:"#8190a5"}} axisLine={false} tickLine={false}/><YAxis hide/><Tooltip/><Area type="monotone" dataKey="temp" name="Temperature °C" stroke="#3b82f6" fill="url(#tempFill)" strokeWidth={2.5}/></AreaChart></ResponsiveContainer></div> : <Loading/>}
              </Panel>
            </>}

            {tab === "month" && <>
              <Panel title="Monthly outlook" subtitle="Seasonal model outlook aggregated by calendar month" action={<span className="small-pill">Up to provider horizon</span>}>
                {seasonal.loading && !seasonal.data ? <Loading label="Loading seasonal forecast…"/> : seasonal.error ? <ErrorNote message={seasonal.error} retry={() => void seasonal.reload()}/> : monthlyRows.length ? <>
                  <div className="notice info"><InfoIcon/> Long-range outlooks have lower confidence than short-range forecasts. Monthly values are model aggregates, not exact daily predictions.</div>
                  <div className="forecast-list">{monthlyRows.map((row, i) => <div className="forecast-row monthly-row" key={`${row.month}-${i}`}><div className="forecast-date">{row.month}</div><div className="forecast-icon">🌤️</div><div className="forecast-condition">Seasonal estimate</div><div className="forecast-rain"><Droplets size={13}/>{row.rainfall == null ? "—" : `${row.rainfall.toFixed(0)} mm`}</div><div className="forecast-temp"><strong>{row.temperature == null ? "—" : shortTemp(row.temperature, unit)}</strong><span>Avg temp</span></div></div>)}</div>
                </> : <div className="empty-state">Seasonal model data is not currently available for this location. Try again later or use the climate view for long-term context.</div>}
              </Panel>
              {monthlyRows.length > 0 && <Panel title="Seasonal temperature trend" subtitle="Modelled monthly mean temperature"><div className="chart-wrap"><ResponsiveContainer width="100%" height={250}><LineChart data={monthlyRows}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e9eef5"/><XAxis dataKey="month" tick={{fontSize:11,fill:"#8190a5"}} axisLine={false} tickLine={false}/><YAxis unit="°" tick={{fontSize:11,fill:"#8190a5"}} axisLine={false} tickLine={false}/><Tooltip/><Line type="monotone" dataKey="temperature" name="Mean temperature °C" stroke="#2563eb" strokeWidth={2.5} connectNulls/></LineChart></ResponsiveContainer></div></Panel>}
            </>}

            {tab === "year" && <>
              <Panel title="Annual climate trends" subtitle="Climate-model projection summarized by month" action={<select className="year-select" value={climateYear} onChange={e => setClimateYear(Number(e.target.value))}>{Array.from({length: 11}, (_, i) => new Date().getFullYear() + i).map(y => <option key={y} value={y}>{y}</option>)}</select>}>
                {climate.loading && !climate.data ? <Loading label="Loading climate projection…"/> : climate.error ? <ErrorNote message={climate.error} retry={() => void climate.reload()}/> : climateRows.length ? <>
                  <div className="notice warning"><InfoIcon/> Climate-model output describes long-term patterns and scenarios. It is not a reliable day-by-day weather forecast for the selected year.</div>
                  <div className="chart-wrap"><ResponsiveContainer width="100%" height={270}><ComposedChart data={climateRows}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e9eef5"/><XAxis dataKey="month" tick={{fontSize:11,fill:"#8190a5"}} axisLine={false} tickLine={false}/><YAxis yAxisId="temp" unit="°" tick={{fontSize:11,fill:"#8190a5"}} axisLine={false} tickLine={false}/><YAxis yAxisId="rain" orientation="right" unit=" mm" tick={{fontSize:11,fill:"#8190a5"}} axisLine={false} tickLine={false}/><Tooltip/><Bar yAxisId="rain" dataKey="rainfall" name="Rainfall mm" fill="#bfdbfe" radius={[5,5,0,0]}/><Line yAxisId="temp" type="monotone" dataKey="temperature" name="Mean temperature °C" stroke="#f59e0b" strokeWidth={2.5} connectNulls/></ComposedChart></ResponsiveContainer></div>
                </> : <div className="empty-state">No climate projection was returned for this year and location. Try another year or consult the API model coverage.</div>}
              </Panel>
              <Panel title="Historical comparison" subtitle="Compare monthly historical weather against the climate projection" action={<select className="year-select" value={historyYear} onChange={e => setHistoryYear(Number(e.target.value))}>{Array.from({length: 10}, (_, i) => new Date().getFullYear() - 1 - i).map(y => <option key={y} value={y}>{y}</option>)}</select>}>
                {history.loading && !history.data ? <Loading label="Loading historical observations…"/> : history.error ? <ErrorNote message={history.error} retry={() => void history.reload()}/> : historyRows.length ? <div className="chart-wrap"><ResponsiveContainer width="100%" height={250}><LineChart data={historyRows.map((r,i)=>({...r, projected:climateRows[i]?.temperature}))}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e9eef5"/><XAxis dataKey="month" tick={{fontSize:11,fill:"#8190a5"}} axisLine={false} tickLine={false}/><YAxis unit="°" tick={{fontSize:11,fill:"#8190a5"}} axisLine={false} tickLine={false}/><Tooltip/><Line type="monotone" dataKey="temperature" name={`Historical ${historyYear} °C`} stroke="#2563eb" strokeWidth={2.5}/><Line type="monotone" dataKey="projected" name={`Climate model ${climateYear} °C`} stroke="#f59e0b" strokeDasharray="5 4" strokeWidth={2.5}/></LineChart></ResponsiveContainer><p className="chart-footnote">Historical archive and climate-model data may use different model systems and baselines; compare as context, not as a like-for-like verification.</p></div> : <div className="empty-state">Historical data is unavailable for this selection.</div>}
              </Panel>
            </>}
          </div>

          <aside className="right-column">
            <Panel title="Air quality" subtitle="Current modelled air-quality indicators">
              {air.loading && !air.data ? <Loading label="Loading air quality…"/> : air.error ? <ErrorNote message={air.error} retry={() => void air.reload()}/> : <div className="air-content">
                <div className="aqi-score"><div><span>US AQI</span><strong>{airCurrent?.us_aqi == null ? "—" : Math.round(airCurrent.us_aqi)}</strong></div><span className={`aqi-tag ${aqi.color}`}>{aqi.label}</span></div>
                <div className="aqi-meter"><span style={{width: `${Math.min(100, Math.max(0, (airCurrent?.us_aqi ?? 0) / 3))}%`}}/></div>
                <div className="pollutant-list"><div><span>PM2.5</span><strong>{airCurrent?.pm2_5 == null ? "—" : `${airCurrent.pm2_5.toFixed(1)} µg/m³`}</strong></div><div><span>PM10</span><strong>{airCurrent?.pm10 == null ? "—" : `${airCurrent.pm10.toFixed(1)} µg/m³`}</strong></div><div><span>Ozone</span><strong>{airCurrent?.ozone == null ? "—" : `${airCurrent.ozone.toFixed(1)} µg/m³`}</strong></div><div><span>NO₂</span><strong>{airCurrent?.nitrogen_dioxide == null ? "—" : `${airCurrent.nitrogen_dioxide.toFixed(1)} µg/m³`}</strong></div></div>
                <p className="tiny-note">AQI is an indicative model estimate, not a regulatory monitoring-station reading.</p>
              </div>}
            </Panel>
            <Panel title="Weather alerts" subtitle="Rule-based notices from the forecast">
              {weather.loading && !weather.data ? <Loading/> : alerts.length ? <div className="alerts-list">{alerts.map((a,i)=><div className={`alert-item ${a.tone}`} key={`${a.title}-${i}`}><span className="alert-symbol"><AlertTriangle size={16}/></span><div><strong>{a.title}</strong><p>{a.detail}</p></div></div>)}</div> : <div className="all-clear"><span><Check size={18}/></span><div><strong>No rule-based alerts</strong><p>No high-rain, heat or thunderstorm triggers were found in the next three forecast days.</p></div></div>}
              <p className="tiny-note">These are app-generated indicators, not official emergency alerts. Check local meteorological authorities for warnings.</p>
            </Panel>
            <Panel title="Sunrise & sunset" subtitle="Local time">
              <div className="sun-times"><div><span className="sun-bubble rise"><Sun size={17}/></span><div><small>Sunrise</small><strong>{daily?.sunrise?.[0] ? new Date(daily.sunrise[0]).toLocaleTimeString([], {hour:"numeric",minute:"2-digit"}) : "—"}</strong></div></div><div><span className="sun-bubble set"><Sun size={17}/></span><div><small>Sunset</small><strong>{daily?.sunset?.[0] ? new Date(daily.sunset[0]).toLocaleTimeString([], {hour:"numeric",minute:"2-digit"}) : "—"}</strong></div></div></div>
            </Panel>
          </aside>
        </div>
      </>}
      <footer className="footer"><span>WeatherNow</span><span>Weather data: Open-Meteo · Forecasts are estimates, not official warnings.</span><a href="https://open-meteo.com/" target="_blank" rel="noreferrer">Data provider ↗</a></footer>
    </section>
  </main>;
}
function InfoIcon() { return <span className="info-icon">i</span>; }
