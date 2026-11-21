import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "WeatherNow | Weather & Climate Intelligence",
  description: "Weather forecasts, seasonal outlooks and climate insights in one dashboard.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
