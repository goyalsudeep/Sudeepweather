export type Place = {
  id: string;
  name: string;
  country: string;
  admin1?: string;
  latitude: number;
  longitude: number;
  timezone?: string;
};

export type WeatherPayload = {
  current?: {
    time: string;
    temperature_2m: number;
    relative_humidity_2m: number;
    apparent_temperature: number;
    is_day?: number;
    precipitation?: number;
    wind_speed_10m: number;
    weather_code: number;
  };
  daily?: {
    time: string[];
    weather_code: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_probability_max?: number[];
    precipitation_sum?: number[];
    wind_speed_10m_max?: number[];
    uv_index_max?: number[];
    sunrise?: string[];
    sunset?: string[];
  };
  hourly?: {
    time: string[];
    temperature_2m?: number[];
    precipitation_probability?: number[];
    relative_humidity_2m?: number[];
  };
  daily_units?: Record<string, string>;
  current_units?: Record<string, string>;
  timezone?: string;
};

export type AirPayload = {
  current?: {
    time: string;
    european_aqi?: number;
    us_aqi?: number;
    pm2_5?: number;
    pm10?: number;
    nitrogen_dioxide?: number;
    ozone?: number;
  };
  hourly?: {
    time: string[];
    us_aqi?: number[];
    pm2_5?: number[];
  };
};

export type SeasonalPayload = {
  daily?: {
    time: string[];
    temperature_2m_max?: number[];
    temperature_2m_min?: number[];
    precipitation_sum?: number[];
    precipitation_probability_max?: number[];
    weather_code?: number[];
  };
  hourly?: {
    time: string[];
    temperature_2m?: number[];
    precipitation_probability?: number[];
    precipitation?: number[];
  };
};

export type ClimatePayload = {
  daily?: {
    time: string[];
    temperature_2m_mean?: number[];
    temperature_2m_max?: number[];
    temperature_2m_min?: number[];
    precipitation_sum?: number[];
  };
  monthly?: {
    time: string[];
    temperature_2m_mean?: number[];
    precipitation_sum?: number[];
  };
  yearly?: {
    time: string[];
    temperature_2m_mean?: number[];
    precipitation_sum?: number[];
  };
};

export type HistoryPayload = {
  daily?: {
    time: string[];
    temperature_2m_mean?: number[];
    temperature_2m_max?: number[];
    temperature_2m_min?: number[];
    precipitation_sum?: number[];
    weather_code?: number[];
  };
  hourly?: {
    time: string[];
    temperature_2m?: number[];
  };
};
