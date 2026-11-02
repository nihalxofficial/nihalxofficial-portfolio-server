import type { Request } from "express";

/**
 * Request-side geolocation that is Vercel-safe.
 *
 * Vercel injects `x-vercel-ip-*` headers at the edge, and Cloudflare adds
 * `cf-ipcountry`; both are read here so we never call a third-party geo API (no
 * mixed content, rate limits or cold-start latency on live). City/region are
 * best-effort text, and a small built-in centroid table gives map coordinates
 * whenever only a country code is available.
 */
export interface GeoLocation {
  country: string;
  countryCode: string;
  region: string;
  city: string;
  lat?: number;
  lng?: number;
}

const empty: GeoLocation = { country: "", countryCode: "", region: "", city: "" };

function header(req: Request, name: string): string {
  const value = req.headers[name];
  const single = Array.isArray(value) ? value[0] : value;
  return (single ?? "").trim();
}

function decode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function toNumber(value: string): number | undefined {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

/** ISO-3166 alpha-2 → display name + approximate centroid, for the world map. */
const COUNTRIES: Record<string, { name: string; lat: number; lng: number }> = {
  US: { name: "United States", lat: 39.8, lng: -98.6 },
  CA: { name: "Canada", lat: 56.1, lng: -106.3 },
  MX: { name: "Mexico", lat: 23.6, lng: -102.5 },
  BR: { name: "Brazil", lat: -14.2, lng: -51.9 },
  AR: { name: "Argentina", lat: -38.4, lng: -63.6 },
  CL: { name: "Chile", lat: -35.7, lng: -71.5 },
  CO: { name: "Colombia", lat: 4.6, lng: -74.1 },
  PE: { name: "Peru", lat: -9.2, lng: -75.0 },
  GB: { name: "United Kingdom", lat: 55.4, lng: -3.4 },
  IE: { name: "Ireland", lat: 53.1, lng: -8.1 },
  FR: { name: "France", lat: 46.2, lng: 2.2 },
  DE: { name: "Germany", lat: 51.2, lng: 10.5 },
  ES: { name: "Spain", lat: 40.5, lng: -3.7 },
  PT: { name: "Portugal", lat: 39.4, lng: -8.2 },
  IT: { name: "Italy", lat: 41.9, lng: 12.6 },
  NL: { name: "Netherlands", lat: 52.1, lng: 5.3 },
  BE: { name: "Belgium", lat: 50.5, lng: 4.5 },
  CH: { name: "Switzerland", lat: 46.8, lng: 8.2 },
  AT: { name: "Austria", lat: 47.5, lng: 14.6 },
  SE: { name: "Sweden", lat: 60.1, lng: 18.6 },
  NO: { name: "Norway", lat: 60.5, lng: 8.5 },
  DK: { name: "Denmark", lat: 56.3, lng: 9.3 },
  FI: { name: "Finland", lat: 61.9, lng: 25.7 },
  IS: { name: "Iceland", lat: 64.9, lng: -18.6 },
  PL: { name: "Poland", lat: 51.9, lng: 19.1 },
  CZ: { name: "Czechia", lat: 49.8, lng: 15.5 },
  HU: { name: "Hungary", lat: 47.2, lng: 19.5 },
  RO: { name: "Romania", lat: 45.9, lng: 25.0 },
  GR: { name: "Greece", lat: 39.1, lng: 21.8 },
  UA: { name: "Ukraine", lat: 48.4, lng: 31.2 },
  RU: { name: "Russia", lat: 61.5, lng: 105.3 },
  TR: { name: "Türkiye", lat: 38.9, lng: 35.2 },
  IL: { name: "Israel", lat: 31.0, lng: 34.9 },
  SA: { name: "Saudi Arabia", lat: 23.9, lng: 45.1 },
  AE: { name: "United Arab Emirates", lat: 23.4, lng: 53.8 },
  QA: { name: "Qatar", lat: 25.4, lng: 51.2 },
  KW: { name: "Kuwait", lat: 29.3, lng: 47.5 },
  OM: { name: "Oman", lat: 21.5, lng: 55.9 },
  JO: { name: "Jordan", lat: 31.2, lng: 36.5 },
  LB: { name: "Lebanon", lat: 33.9, lng: 35.8 },
  EG: { name: "Egypt", lat: 26.8, lng: 30.8 },
  MA: { name: "Morocco", lat: 31.8, lng: -7.1 },
  DZ: { name: "Algeria", lat: 28.0, lng: 1.7 },
  TN: { name: "Tunisia", lat: 33.9, lng: 9.5 },
  NG: { name: "Nigeria", lat: 9.1, lng: 8.7 },
  GH: { name: "Ghana", lat: 7.9, lng: -1.0 },
  KE: { name: "Kenya", lat: 0.0, lng: 37.9 },
  ET: { name: "Ethiopia", lat: 9.1, lng: 40.5 },
  ZA: { name: "South Africa", lat: -30.6, lng: 22.9 },
  IN: { name: "India", lat: 20.6, lng: 79.0 },
  PK: { name: "Pakistan", lat: 30.4, lng: 69.3 },
  BD: { name: "Bangladesh", lat: 23.7, lng: 90.4 },
  LK: { name: "Sri Lanka", lat: 7.9, lng: 80.7 },
  NP: { name: "Nepal", lat: 28.4, lng: 84.1 },
  CN: { name: "China", lat: 35.9, lng: 104.2 },
  JP: { name: "Japan", lat: 36.2, lng: 138.3 },
  KR: { name: "South Korea", lat: 35.9, lng: 127.8 },
  TW: { name: "Taiwan", lat: 23.7, lng: 121.0 },
  HK: { name: "Hong Kong", lat: 22.3, lng: 114.2 },
  SG: { name: "Singapore", lat: 1.35, lng: 103.8 },
  MY: { name: "Malaysia", lat: 4.2, lng: 101.9 },
  ID: { name: "Indonesia", lat: -0.8, lng: 113.9 },
  TH: { name: "Thailand", lat: 15.9, lng: 100.9 },
  VN: { name: "Vietnam", lat: 14.1, lng: 108.3 },
  PH: { name: "Philippines", lat: 12.9, lng: 121.8 },
  AU: { name: "Australia", lat: -25.3, lng: 133.8 },
  NZ: { name: "New Zealand", lat: -40.9, lng: 174.9 },
  KZ: { name: "Kazakhstan", lat: 48.0, lng: 66.9 },
  GE: { name: "Georgia", lat: 42.3, lng: 43.4 },
  AM: { name: "Armenia", lat: 40.1, lng: 45.0 },
  AZ: { name: "Azerbaijan", lat: 40.1, lng: 47.6 },
};

/** Resolves a coarse, privacy-friendly location from trusted edge headers. */
export function resolveGeo(req: Request): GeoLocation {
  const code =
    header(req, "x-vercel-ip-country").toUpperCase() ||
    header(req, "cf-ipcountry").toUpperCase();

  if (!code || code === "XX") return empty;

  const meta = COUNTRIES[code];
  const city = decode(header(req, "x-vercel-ip-city"));
  const region = header(req, "x-vercel-ip-country-region");

  // Prefer the precise edge coordinates; fall back to the country centroid.
  const lat = toNumber(header(req, "x-vercel-ip-latitude")) ?? meta?.lat;
  const lng = toNumber(header(req, "x-vercel-ip-longitude")) ?? meta?.lng;

  return {
    country: meta?.name ?? code,
    countryCode: code,
    region,
    city,
    lat,
    lng,
  };
}
