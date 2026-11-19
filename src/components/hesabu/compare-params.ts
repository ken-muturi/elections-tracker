/** /hesabu/compare URL params: parse with fallbacks (never 404) and build links */
import { DEFAULT_METRIC, MAX_COMPARE } from "./compare-metrics"

export type CompareView = "side" | "rank"
export interface CompareParams { view: CompareView; year: string; counties: string[]; metric: string }
export type RawSearchParams = Record<string, string | string[] | undefined>

const first = (v: string | string[] | undefined): string | undefined => (Array.isArray(v) ? v[0] : v)

export function parseCompareParams(raw: RawSearchParams, ctx: { years: string[]; countyCodes: string[] }): CompareParams {
  const view: CompareView = first(raw.view) === "rank" ? "rank" : "side"
  const yearRaw = first(raw.year)
  const year = yearRaw && ctx.years.includes(yearRaw) ? yearRaw : ctx.years[0]
  const known = new Set(ctx.countyCodes)
  const counties: string[] = []
  for (const code of (first(raw.counties) ?? "").split(",").map((c) => c.trim())) {
    if (known.has(code) && !counties.includes(code) && counties.length < MAX_COMPARE) counties.push(code)
  }
  const metric = first(raw.metric)?.trim() || DEFAULT_METRIC
  return { view, year, counties, metric }
}

export function buildCompareHref(p: CompareParams): string {
  const q = new URLSearchParams()
  q.set("view", p.view)
  q.set("year", p.year)
  if (p.counties.length > 0) q.set("counties", p.counties.join(","))
  if (p.metric !== DEFAULT_METRIC) q.set("metric", p.metric)
  return `/hesabu/compare?${q.toString()}`
}
