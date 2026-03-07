import SunCalc from 'suncalc'

const LAT = 37.7607
const LON = -122.3883

export type SkyPhase =
  | 'night'
  | 'astronomicalDawn'
  | 'nauticalDawn'
  | 'dawn'
  | 'sunrise'
  | 'goldenMorning'
  | 'day'
  | 'goldenEvening'
  | 'sunset'
  | 'dusk'
  | 'nauticalDusk'
  | 'astronomicalDusk'

export interface SkyData {
  phase: SkyPhase
  skyTop: string
  skyMid: string
  skyBottom: string
  sunPosition: { x: number; y: number; visible: boolean; altitude: number; color: string; glowSize: number }
  moonPosition: { x: number; y: number; visible: boolean; altitude: number; phase: number; illumination: number; glowColor: string }
  starsOpacity: number
  reflectionColor: string
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

// Map solar altitude (radians) to a 0-1 progress through the day
function altitudeToSkyColors(altitudeDeg: number): { top: string; mid: string; bottom: string } {
  // Below -18: full night
  // -18 to -12: astronomical twilight
  // -12 to -6: nautical twilight
  // -6 to 0: civil twilight
  // 0 to 10: sunrise/sunset zone
  // 10 to 30: golden light
  // 30+: full day

  if (altitudeDeg <= -18) {
    return { top: '#06080d', mid: '#080c14', bottom: '#0a0e18' }
  }
  if (altitudeDeg <= -12) {
    const t = (altitudeDeg + 18) / 6 // 0 to 1
    return {
      top: lerpColor('#06080d', '#08101e', t),
      mid: lerpColor('#080c14', '#0e1a30', t),
      bottom: lerpColor('#0a0e18', '#1a2040', t),
    }
  }
  if (altitudeDeg <= -6) {
    const t = (altitudeDeg + 12) / 6
    return {
      top: lerpColor('#08101e', '#0e1a30', t),
      mid: lerpColor('#0e1a30', '#2a3a5c', t),
      bottom: lerpColor('#1a2040', '#3a4570', t),
    }
  }
  if (altitudeDeg <= 0) {
    const t = (altitudeDeg + 6) / 6
    return {
      top: lerpColor('#0e1a30', '#2a4060', t),
      mid: lerpColor('#2a3a5c', '#c47060', t),
      bottom: lerpColor('#3a4570', '#e8a050', t),
    }
  }
  if (altitudeDeg <= 10) {
    const t = altitudeDeg / 10
    return {
      top: lerpColor('#2a4060', '#3a6090', t),
      mid: lerpColor('#c47060', '#6090c0', t),
      bottom: lerpColor('#e8a050', '#90c0e0', t),
    }
  }
  if (altitudeDeg <= 30) {
    const t = (altitudeDeg - 10) / 20
    return {
      top: lerpColor('#3a6090', '#2060a0', t),
      mid: lerpColor('#6090c0', '#4090d0', t),
      bottom: lerpColor('#90c0e0', '#70b8e8', t),
    }
  }
  // Full day
  return { top: '#2060a0', mid: '#4090d0', bottom: '#70b8e8' }
}

// For sunset side, we use warmer colors when sun is setting (azimuth > PI)
function applySunsetWarmth(colors: { top: string; mid: string; bottom: string }, altitudeDeg: number, isSetting: boolean): { top: string; mid: string; bottom: string } {
  if (!isSetting || altitudeDeg > 10 || altitudeDeg < -12) return colors

  // Blend toward warm sunset palette when sun is going down
  const warmth = altitudeDeg <= 0
    ? Math.max(0, 1 - Math.abs(altitudeDeg) / 12)
    : Math.max(0, 1 - altitudeDeg / 10)

  if (warmth <= 0) return colors

  // Sunset target colors
  const sunsetTop = altitudeDeg > 0 ? '#4a3060' : '#1a0a2e'
  const sunsetMid = altitudeDeg > 0 ? '#c06050' : '#6b2060'
  const sunsetBottom = altitudeDeg > 0 ? '#e87830' : '#e8732a'

  return {
    top: lerpColor(colors.top, sunsetTop, warmth * 0.7),
    mid: lerpColor(colors.mid, sunsetMid, warmth * 0.8),
    bottom: lerpColor(colors.bottom, sunsetBottom, warmth * 0.9),
  }
}

function getSunColor(altitudeDeg: number): string {
  if (altitudeDeg > 20) return '#fff8e0'
  if (altitudeDeg > 10) return '#ffe080'
  if (altitudeDeg > 5) return '#ffb040'
  if (altitudeDeg > 0) return '#ff8020'
  return '#ff4500'
}

function getSunGlowSize(altitudeDeg: number): number {
  if (altitudeDeg > 20) return 20
  if (altitudeDeg > 5) return 30
  if (altitudeDeg > 0) return 50
  return 60
}

function getMoonGlowColor(illumination: number, sunAltitudeDeg: number): string {
  if (sunAltitudeDeg > -4) return '#d8d1c0'
  if (illumination > 0.75) return '#dfe7f8'
  if (illumination > 0.35) return '#c9d5ec'
  return '#b3bfd8'
}

function progressBetween(now: number, start: number, end: number) {
  if (end <= start) return 0.5
  return clamp((now - start) / (end - start), 0, 1)
}

function getSunViewport(now: number, sunrise: number, sunset: number): { x: number; y: number } {
  const progress = progressBetween(now, sunrise, sunset)
  return {
    x: 108 - progress * 116,
    y: -8 + Math.sin(progress * Math.PI) * 26,
  }
}

function getMoonViewport(azimuth: number): { x: number; y: number } {
  const normalized = ((azimuth + Math.PI) / (2 * Math.PI) + 1) % 1
  return {
    x: 14 + normalized * 72,
    y: 18 - Math.sin(normalized * Math.PI) * 6,
  }
}

export function getSkyData(date: Date): SkyData {
  const times = SunCalc.getTimes(date, LAT, LON)
  const sunPos = SunCalc.getPosition(date, LAT, LON)
  const moonPos = SunCalc.getMoonPosition(date, LAT, LON)
  const moonIllum = SunCalc.getMoonIllumination(date)

  const sunAltDeg = sunPos.altitude * (180 / Math.PI)

  // Determine if sun is setting (past solar noon)
  const solarNoon = times.solarNoon.getTime()
  const isSetting = date.getTime() > solarNoon

  // Determine phase
  let phase: SkyPhase = 'night'
  const now = date.getTime()
  if (now >= times.nightEnd.getTime() && now < times.nauticalDawn.getTime()) phase = 'astronomicalDawn'
  else if (now >= times.nauticalDawn.getTime() && now < times.dawn.getTime()) phase = 'nauticalDawn'
  else if (now >= times.dawn.getTime() && now < times.sunrise.getTime()) phase = 'dawn'
  else if (now >= times.sunrise.getTime() && now < times.sunriseEnd.getTime()) phase = 'sunrise'
  else if (now >= times.sunriseEnd.getTime() && now < times.goldenHourEnd.getTime()) phase = 'goldenMorning'
  else if (now >= times.goldenHourEnd.getTime() && now < times.goldenHour.getTime()) phase = 'day'
  else if (now >= times.goldenHour.getTime() && now < times.sunset.getTime()) phase = 'goldenEvening'
  else if (now >= times.sunset.getTime() && now < times.sunsetStart.getTime()) phase = 'sunset'
  else if (now >= times.sunsetStart.getTime() && now < times.dusk.getTime()) phase = 'dusk'
  else if (now >= times.dusk.getTime() && now < times.nauticalDusk.getTime()) phase = 'nauticalDusk'
  else if (now >= times.nauticalDusk.getTime() && now < times.night.getTime()) phase = 'astronomicalDusk'

  // Get base colors from altitude
  let colors = altitudeToSkyColors(sunAltDeg)
  // Apply sunset warmth
  colors = applySunsetWarmth(colors, sunAltDeg, isSetting)

  // Sun viewport position
  const sunVP = getSunViewport(now, times.sunrise.getTime(), times.sunset.getTime())
  const sunVisible = sunAltDeg > -4

  // Moon viewport position
  const moonAltDeg = moonPos.altitude * (180 / Math.PI)
  const moonVP = getMoonViewport(moonPos.azimuth)
  const moonVisible = moonAltDeg > -2 && sunAltDeg < 5

  // Stars opacity: full at night, fade during twilight
  let starsOpacity = 0
  if (sunAltDeg <= -18) starsOpacity = 1
  else if (sunAltDeg <= -6) starsOpacity = (Math.abs(sunAltDeg) - 6) / 12
  else if (sunAltDeg <= 0) starsOpacity = 0

  // Reflection color (darker version of bottom sky color)
  const reflectionColor = lerpColor(colors.bottom, '#040608', 0.6)

  return {
    phase,
    skyTop: colors.top,
    skyMid: colors.mid,
    skyBottom: colors.bottom,
    sunPosition: {
      x: sunVP.x,
      y: sunVP.y,
      visible: sunVisible,
      altitude: sunAltDeg,
      color: getSunColor(sunAltDeg),
      glowSize: getSunGlowSize(sunAltDeg),
    },
    moonPosition: {
      x: moonVP.x,
      y: moonVP.y,
      visible: moonVisible,
      altitude: moonAltDeg,
      phase: moonIllum.phase,
      illumination: moonIllum.fraction,
      glowColor: getMoonGlowColor(moonIllum.fraction, sunAltDeg),
    },
    starsOpacity,
    reflectionColor,
  }
}

// Utility: linearly interpolate between two hex colors
function lerpColor(a: string, b: string, t: number): string {
  const clampChannel = (v: number) => Math.max(0, Math.min(255, Math.round(v)))
  const ar = parseInt(a.slice(1, 3), 16)
  const ag = parseInt(a.slice(3, 5), 16)
  const ab = parseInt(a.slice(5, 7), 16)
  const br = parseInt(b.slice(1, 3), 16)
  const bg = parseInt(b.slice(3, 5), 16)
  const bb = parseInt(b.slice(5, 7), 16)
  const r = clampChannel(ar + (br - ar) * t)
  const g = clampChannel(ag + (bg - ag) * t)
  const bl = clampChannel(ab + (bb - ab) * t)
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${bl.toString(16).padStart(2, '0')}`
}

// Export for use by HarborConditions and other components
export function getSunTimes(date: Date) {
  return SunCalc.getTimes(date, LAT, LON)
}

export function getMoonIllumination(date: Date) {
  return SunCalc.getMoonIllumination(date)
}
