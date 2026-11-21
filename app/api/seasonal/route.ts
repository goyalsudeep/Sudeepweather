import { NextRequest, NextResponse } from "next/server";
import { coordinates, proxy } from "../_shared";

export async function GET(request: NextRequest) {
  const c = coordinates(request);
  if ("error" in c) return c.error;
  const url = new URL("https://seasonal-api.open-meteo.com/v1/seasonal");
  url.search = new URLSearchParams({
    latitude: String(c.lat), longitude: String(c.lon),
    hourly: "temperature_2m,precipitation",
    forecast_days: "180", timezone: "auto",
  }).toString();
  return proxy(url, 21600);
}
