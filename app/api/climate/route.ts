import { NextRequest, NextResponse } from "next/server";
import { coordinates, proxy } from "../_shared";

export async function GET(request: NextRequest) {
  const c = coordinates(request);
  if ("error" in c) return c.error;
  const year = Number(request.nextUrl.searchParams.get("year") ?? new Date().getFullYear() + 1);
  const currentYear = new Date().getFullYear();
  if (!Number.isInteger(year) || year < 1950 || year > currentYear + 20) {
    return NextResponse.json({ error: "Select a supported year." }, { status: 400 });
  }
  const url = new URL("https://climate-api.open-meteo.com/v1/climate");
  url.search = new URLSearchParams({
    latitude: String(c.lat), longitude: String(c.lon),
    start_date: `${year}-01-01`, end_date: `${year}-12-31`,
    models: "EC_Earth3P_HR",
    daily: "temperature_2m_mean,temperature_2m_max,temperature_2m_min,precipitation_sum",
  }).toString();
  return proxy(url, 86400);
}
