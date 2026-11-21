import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim();
  if (!q || q.length < 2 || q.length > 80) return NextResponse.json({ results: [] });
  const url = new URL("https://geocoding-api.open-meteo.com/v1/search");
  url.search = new URLSearchParams({ name: q, count: "8", language: "en", format: "json" }).toString();
  try {
    const response = await fetch(url, { next: { revalidate: 86400 } });
    if (!response.ok) return NextResponse.json({ error: "Geocoding provider unavailable" }, { status: 502 });
    return NextResponse.json(await response.json());
  } catch {
    return NextResponse.json({ error: "Unable to search locations" }, { status: 502 });
  }
}
