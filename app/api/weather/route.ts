import { NextResponse } from 'next/server'

const LAT = 37.7607
const LON = -122.3883
const CACHE_TTL = 3600000 // 1 hour in ms

export interface WeatherData {
  condition: 'clear' | 'clouds' | 'fog' | 'rain' | 'drizzle' | 'storm'
  clouds: number       // 0-100 percent
  humidity: number     // 0-100 percent
  temp: number         // Fahrenheit
  wind: number         // mph
  windDeg: number      // degrees (0=N, 90=E, 180=S, 270=W)
  visibility: number   // meters
  pressure: number     // hPa
  description: string  // Human-readable like "scattered clouds"
  hourlyForecast: HourlyForecast[]
}

interface HourlyForecast {
  time: number    // unix timestamp
  temp: number
  condition: string
  icon: string    // OWM icon code
  windSpeed: number
  windDeg: number
}

let cache: { data: WeatherData; timestamp: number } | null = null

function mapCondition(weatherId: number, visibility: number): WeatherData['condition'] {
  // OWM weather condition codes: https://openweathermap.org/weather-conditions
  if (visibility < 2000) return 'fog'
  if (weatherId >= 200 && weatherId < 300) return 'storm'
  if (weatherId >= 300 && weatherId < 400) return 'drizzle'
  if (weatherId >= 500 && weatherId < 600) return 'rain'
  if (weatherId >= 700 && weatherId < 800) return 'fog' // Atmosphere group (mist, haze, fog)
  if (weatherId === 800) return 'clear'
  if (weatherId > 800) return 'clouds'
  return 'clear'
}

function mapForecastCondition(weatherId: number): string {
  if (weatherId >= 200 && weatherId < 300) return 'storm'
  if (weatherId >= 300 && weatherId < 400) return 'drizzle'
  if (weatherId >= 500 && weatherId < 600) return 'rain'
  if (weatherId >= 700 && weatherId < 800) return 'fog'
  if (weatherId === 800) return 'clear'
  if (weatherId > 800) return 'clouds'
  return 'clear'
}

export async function GET() {
  // Return cached data if fresh
  if (cache && Date.now() - cache.timestamp < CACHE_TTL) {
    return NextResponse.json(cache.data)
  }

  const apiKey = process.env.OPENWEATHERMAP_API_KEY
  if (!apiKey) {
    // Graceful fallback when no API key
    const fallback: WeatherData = {
      condition: 'clear',
      clouds: 0,
      humidity: 65,
      temp: 58,
      wind: 8,
      windDeg: 270,
      visibility: 10000,
      pressure: 1013,
      description: 'clear sky',
      hourlyForecast: [],
    }
    return NextResponse.json(fallback)
  }

  try {
    // Fetch current weather and 5-day/3-hour forecast in parallel
    const [currentRes, forecastRes] = await Promise.all([
      fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${LAT}&lon=${LON}&appid=${apiKey}&units=imperial`,
        { next: { revalidate: 3600 } }
      ),
      fetch(
        `https://api.openweathermap.org/data/2.5/forecast?lat=${LAT}&lon=${LON}&appid=${apiKey}&units=imperial&cnt=8`,
        { next: { revalidate: 3600 } }
      ),
    ])

    if (!currentRes.ok) throw new Error(`Weather API ${currentRes.status}`)

    const current = await currentRes.json()
    const forecast = forecastRes.ok ? await forecastRes.json() : null

    const visibility = current.visibility ?? 10000
    const weatherId = current.weather?.[0]?.id ?? 800

    const hourlyForecast: HourlyForecast[] = forecast?.list
      ? forecast.list.slice(0, 5).map((item: any) => ({
          time: item.dt,
          temp: Math.round(item.main.temp),
          condition: mapForecastCondition(item.weather?.[0]?.id ?? 800),
          icon: item.weather?.[0]?.icon ?? '01d',
          windSpeed: Math.round(item.wind?.speed ?? 0),
          windDeg: item.wind?.deg ?? 0,
        }))
      : []

    const data: WeatherData = {
      condition: mapCondition(weatherId, visibility),
      clouds: current.clouds?.all ?? 0,
      humidity: current.main?.humidity ?? 65,
      temp: Math.round(current.main?.temp ?? 58),
      wind: Math.round(current.wind?.speed ?? 0),
      windDeg: current.wind?.deg ?? 0,
      visibility,
      pressure: current.main?.pressure ?? 1013,
      description: current.weather?.[0]?.description ?? 'clear sky',
      hourlyForecast,
    }

    cache = { data, timestamp: Date.now() }
    return NextResponse.json(data)
  } catch (error) {
    console.error('Weather API error:', error)
    // Return stale cache if available, otherwise fallback
    if (cache) return NextResponse.json(cache.data)
    return NextResponse.json({
      condition: 'clear',
      clouds: 0,
      humidity: 65,
      temp: 58,
      wind: 8,
      windDeg: 270,
      visibility: 10000,
      pressure: 1013,
      description: 'clear sky',
      hourlyForecast: [],
    } satisfies WeatherData)
  }
}
