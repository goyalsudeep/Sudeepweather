# WeatherNow

A responsive weather and climate dashboard built with Next.js, TypeScript, Recharts, Lucide React and Open-Meteo APIs. Designed for GitHub + Vercel deployment.

## Features

- Current conditions and 10-day daily forecast
- Temperature highs/lows, precipitation probability and hourly trend
- Monthly seasonal outlook (when the provider returns data; up to the provider's supported horizon)
- Annual climate-model view summarized by month
- Historical weather comparison by selected year
- City search using Open-Meteo Geocoding
- Saved locations stored in browser local storage
- Celsius/Fahrenheit display toggle
- Air quality indicators (US AQI, PM2.5, PM10, ozone, NO2)
- Rule-based forecast notices for high rain probability, heat and thunderstorms
- Responsive desktop/tablet/mobile layout

## Important forecast limitations

WeatherNow intentionally separates three kinds of information:

1. **10-day forecast:** Short-range weather forecast from Open-Meteo. Forecast availability is provider-dependent; this app requests 10 days.
2. **Monthly outlook:** Uses Open-Meteo Seasonal Forecast API. Seasonal model output is probabilistic and less reliable than near-term forecasts. It is not a deterministic day-by-day prediction for a full month.
3. **Annual climate:** Uses Open-Meteo Climate API climate-model output, aggregated by month. This is climate-model information, not a precise forecast for each day next year.

The app's weather notices are generated from forecast thresholds. They are **not official weather warnings or emergency alerts**. AQI values are modelled estimates and may differ from regulatory monitoring stations. Always check your national/local meteorological agency and official air-quality sources for safety decisions.

## Tech stack

- Next.js App Router
- TypeScript
- Tailwind CSS (base setup) + custom responsive CSS
- Recharts
- Lucide React
- Open-Meteo Forecast, Geocoding, Seasonal Forecast, Climate, Historical Archive and Air Quality APIs

## Requirements

- Node.js 20.9+ recommended
- npm
- GitHub account
- Vercel account

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000.

Build check:

```bash
npm run build
```

## API routes

All third-party weather calls are proxied through Next.js route handlers:

| Route | Purpose |
|---|---|
| `/api/weather?lat=17.385&lon=78.4867` | Current weather, daily forecast and hourly data |
| `/api/geocode?q=Hyderabad` | City/location search |
| `/api/seasonal?lat=17.385&lon=78.4867` | Seasonal outlook |
| `/api/climate?lat=17.385&lon=78.4867&year=2027` | Climate-model daily values for a year |
| `/api/history?lat=17.385&lon=78.4867&year=2025` | Historical archive for a completed year |
| `/api/air-quality?lat=17.385&lon=78.4867` | Current air-quality indicators |

Hyderabad is configured as the initial location. Search for another city in the dashboard.

## GitHub setup

Create an empty GitHub repository named `weathernow-app`, then run in this project directory:

```bash
git init
git add .
git commit -m "Initial WeatherNow application"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/weathernow-app.git
git push -u origin main
```

Replace `YOUR_USERNAME` with your GitHub username.

## Deploy to Vercel

1. Sign in at https://vercel.com using GitHub.
2. Choose **Add New → Project**.
3. Import the `weathernow-app` repository.
4. Keep the detected Next.js framework and default build settings.
5. Select **Deploy**.
6. Vercel will build and publish the site. Future pushes to `main` trigger deployments.

No API key or environment variable is required for the Open-Meteo public endpoints used here. Check the provider's current terms, usage limits and licensing for your use case, especially commercial use.

## Notes for production

- Add request throttling and monitoring if traffic grows.
- Consider a paid/contracted weather data plan for commercial or high-volume use.
- Cache API responses appropriately and review each provider's attribution and terms.
- For official alert delivery, integrate the relevant national meteorological authority's alert feed. Current app alerts are heuristic only.
- For robust historical comparison, select comparable datasets and climate baselines; historical archive and climate-model outputs are not automatically like-for-like.
- The seasonal endpoint/model coverage and climate model/date coverage can vary by location and provider. The UI includes unavailable/error states.

## Project structure

```text
app/
  api/
    _shared.ts
    air-quality/route.ts
    climate/route.ts
    geocode/route.ts
    history/route.ts
    seasonal/route.ts
    weather/route.ts
  globals.css
  layout.tsx
  page.tsx
components/
  WeatherDashboard.tsx
lib/
  types.ts
  weather.ts
```

## License

Application source code is provided for your use. Open-Meteo data and API usage are subject to Open-Meteo's own terms and licenses: https://open-meteo.com/en/terms
