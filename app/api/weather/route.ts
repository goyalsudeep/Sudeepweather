import { NextRequest } from "next/server";
import { coordinates, proxy } from "../_shared";

export async function GET(request: NextRequest) {
  const c = coordinates(request);
  if ("error" in c) return c.error;
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.search = new URLSearchParams({
    latitude: String(c.lat), longitude: String(c.lon),
    current: "temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,wind_speed_10m,weather_code",
    daily: "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum,wind_speed_10m_max,uv_index_max,sunrise,sunset",
    hourly: "temperature_2m,precipitation_probability,relative_humidity_2m",
    forecast_days: "10", timezone: "auto",
  }).toString();
  return proxy(url, 1800);
}
