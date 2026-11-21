import { NextRequest, NextResponse } from "next/server";
import { coordinates, proxy } from "../_shared";

export async function GET(request: NextRequest) {
  const c = coordinates(request);
  if ("error" in c) return c.error;
  const year = Number(request.nextUrl.searchParams.get("year") ?? new Date().getFullYear() - 1);
  const maxYear = new Date().getFullYear() - 1;
  if (!Number.isInteger(year) || year < 1940 || year > maxYear) {
    return NextResponse.json({ error: `Historical year must be between 1940 and ${maxYear}.` }, { status: 400 });
  }
  const url = new URL("https://archive-api.open-meteo.com/v1/archive");
  url.search = new URLSearchParams({
    latitude: String(c.lat), longitude: String(c.lon),
    start_date: `${year}-01-01`, end_date: `${year}-12-31`,
    daily: "temperature_2m_mean,temperature_2m_max,temperature_2m_min,precipitation_sum",
    timezone: "auto",
  }).toString();
  return proxy(url, 86400);
}
