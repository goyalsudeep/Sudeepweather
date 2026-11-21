import { NextRequest } from "next/server";
import { coordinates, proxy } from "../_shared";

export async function GET(request: NextRequest) {
  const c = coordinates(request);
  if ("error" in c) return c.error;
  const url = new URL("https://air-quality-api.open-meteo.com/v1/air-quality");
  url.search = new URLSearchParams({
    latitude: String(c.lat), longitude: String(c.lon),
    current: "european_aqi,us_aqi,pm2_5,pm10,nitrogen_dioxide,ozone",
    hourly: "us_aqi,pm2_5", timezone: "auto",
  }).toString();
  return proxy(url, 3600);
}
