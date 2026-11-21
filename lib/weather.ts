import type { Place } from "./types";

export const DEFAULT_PLACE: Place = {
  id: "hyderabad-in",
  name: "Hyderabad",
  country: "India",
  admin1: "Telangana",
  latitude: 17.385,
  longitude: 78.4867,
  timezone: "Asia/Kolkata",
};

export function cToF(c: number) { return (c * 9) / 5 + 32; }
export function formatTemp(value: number | undefined, unit: "C" | "F" | "both" = "both") {
  if (value === undefined || Number.isNaN(value)) return "—";
  const c = Math.round(value);
  const f = Math.round(cToF(value));
  if (unit === "C") return `${c}°`;
  if (unit === "F") return `${f}°`;
  return `${c}°C / ${f}°F`;
}
export function shortTemp(value: number | undefined, unit: "C" | "F") {
  if (value === undefined || Number.isNaN(value)) return "—";
  return `${Math.round(unit === "C" ? value : cToF(value))}°`;
}
export function weatherLabel(code?: number) {
  if (code === undefined) return "Weather";
  if (code === 0) return "Clear sky";
  if ([1, 2].includes(code)) return "Mainly clear";
  if (code === 3) return "Overcast";
  if ([45, 48].includes(code)) return "Fog";
  if ([51, 53, 55, 56, 57].includes(code)) return "Drizzle";
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return "Rain";
  if ([71, 73, 75, 77, 85, 86].includes(code)) return "Snow";
  if ([95, 96, 99].includes(code)) return "Thunderstorm";
  return "Variable conditions";
}
export function weatherEmoji(code?: number) {
  if (code === 0) return "☀️";
  if (code !== undefined && [1,2].includes(code)) return "🌤️";
  if (code === 3) return "☁️";
  if (code !== undefined && [45,48].includes(code)) return "🌫️";
  if (code !== undefined && [51,53,55,56,57].includes(code)) return "🌦️";
  if (code !== undefined && [61,63,65,66,67,80,81,82].includes(code)) return "🌧️";
  if (code !== undefined && [71,73,75,77,85,86].includes(code)) return "❄️";
  if (code !== undefined && [95,96,99].includes(code)) return "⛈️";
  return "🌡️";
}
export function aqiLabel(aqi?: number) {
  if (aqi === undefined) return { label: "Unavailable", color: "slate" };
  if (aqi <= 50) return { label: "Good", color: "green" };
  if (aqi <= 100) return { label: "Moderate", color: "yellow" };
  if (aqi <= 150) return { label: "Unhealthy for sensitive groups", color: "orange" };
  if (aqi <= 200) return { label: "Unhealthy", color: "red" };
  if (aqi <= 300) return { label: "Very unhealthy", color: "purple" };
  return { label: "Hazardous", color: "rose" };
}
export function buildAlerts(daily?: { time: string[]; precipitation_probability_max?: number[]; temperature_2m_max: number[]; weather_code: number[] }) {
  if (!daily) return [];
  const alerts: { title: string; detail: string; tone: string }[] = [];
  daily.time.slice(0, 3).forEach((day, i) => {
    const rain = daily.precipitation_probability_max?.[i] ?? 0;
    const max = daily.temperature_2m_max[i];
    const code = daily.weather_code[i];
    const date = new Date(`${day}T12:00:00`).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
    if (rain >= 70) alerts.push({ title: "High rain probability", detail: `${date}: ${Math.round(rain)}% chance of precipitation. Carry rain protection.`, tone: "blue" });
    if (max >= 38) alerts.push({ title: "High temperature", detail: `${date}: forecast high around ${Math.round(max)}°C. Stay hydrated and limit midday exposure.`, tone: "orange" });
    if ([95, 96, 99].includes(code)) alerts.push({ title: "Thunderstorm conditions", detail: `${date}: thunderstorm conditions appear in the forecast. Check local official advisories.`, tone: "purple" });
  });
  return alerts;
}
export async function searchPlaces(query: string): Promise<Place[]> {
  const response = await fetch(`/api/geocode?q=${encodeURIComponent(query)}`);
  if (!response.ok) throw new Error("Could not search locations");
  const data = await response.json();
  return (data.results ?? []).map((p: any) => ({
    id: `${p.id ?? p.name}-${p.latitude}-${p.longitude}`,
    name: p.name, country: p.country ?? "", admin1: p.admin1,
    latitude: p.latitude, longitude: p.longitude, timezone: p.timezone,
  }));
}
export function placeLabel(place: Place) {
  return [place.name, place.admin1, place.country].filter(Boolean).join(", ");
}
