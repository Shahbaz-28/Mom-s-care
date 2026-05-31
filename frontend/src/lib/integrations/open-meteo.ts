export interface DailyWeather {
  date: string;
  tempF: number;
}

export function getWeatherCoordinates() {
  const lat = parseFloat(process.env.WEATHER_LAT ?? "40.7128");
  const lon = parseFloat(process.env.WEATHER_LON ?? "-74.0060");
  return { lat, lon };
}

export async function fetchDailyWeather(
  startDate: string,
  endDate: string
): Promise<DailyWeather[]> {
  const { lat, lon } = getWeatherCoordinates();
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    start_date: startDate,
    end_date: endDate,
    daily: "temperature_2m_max",
    temperature_unit: "fahrenheit",
    timezone: "auto",
  });

  const forecastUrl = `https://api.open-meteo.com/v1/forecast?${params}`;
  let res = await fetch(forecastUrl, { next: { revalidate: 3600 } });

  if (!res.ok) {
    const archiveUrl = `https://archive-api.open-meteo.com/v1/archive?${params}`;
    res = await fetch(archiveUrl, { next: { revalidate: 86400 } });
  }

  if (!res.ok) {
    throw new Error(`Open-Meteo request failed (${res.status})`);
  }

  const json = (await res.json()) as {
    daily?: { time?: string[]; temperature_2m_max?: number[] };
  };

  const times = json.daily?.time ?? [];
  const temps = json.daily?.temperature_2m_max ?? [];

  return times.map((date, i) => ({
    date,
    tempF: Math.round(temps[i] ?? 0),
  }));
}

export function weatherMap(rows: DailyWeather[]): Record<string, number> {
  return Object.fromEntries(rows.map((r) => [r.date, r.tempF]));
}
