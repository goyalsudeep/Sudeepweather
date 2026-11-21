import { NextRequest, NextResponse } from "next/server";

export function coordinates(request: NextRequest) {
  const lat = Number(request.nextUrl.searchParams.get("lat"));
  const lon = Number(request.nextUrl.searchParams.get("lon"));
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
    return { error: NextResponse.json({ error: "Valid latitude and longitude are required." }, { status: 400 }) };
  }
  return { lat, lon };
}
export async function proxy(url: URL, revalidate: number) {
  try {
    const response = await fetch(url, { next: { revalidate } });
    if (!response.ok) return NextResponse.json({ error: "Weather provider returned an error.", status: response.status }, { status: 502 });
    return NextResponse.json(await response.json());
  } catch {
    return NextResponse.json({ error: "Unable to reach weather provider." }, { status: 502 });
  }
}
