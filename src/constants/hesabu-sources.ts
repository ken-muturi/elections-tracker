/**
 * Hesabu data sources — shared by the scraper (scripts/hesabu) and the dashboard UI.
 */

export const SOURCE_KEYS = ["news", "cob", "oag", "tenders", "bajeti", "gpris", "hawkeye", "county-sites"] as const
export type SourceKey = (typeof SOURCE_KEYS)[number]

export const SOURCE_INFO: Record<SourceKey, { name: string; kind: "official" | "secondary" | "media"; site: string }> = {
  news: { name: "News media (Brave search)", kind: "media", site: "various" },
  cob: { name: "Controller of Budget — County Budget Implementation Review", kind: "official", site: "https://cob.go.ke" },
  oag: { name: "Office of the Auditor-General (via Parliament library)", kind: "official", site: "https://libraryir.parliament.go.ke" },
  tenders: { name: "Public Procurement Information Portal", kind: "official", site: "https://tenders.go.ke" },
  bajeti: { name: "National Treasury — Bajeti Yetu", kind: "official", site: "https://bajetiyetu.treasury.go.ke" },
  gpris: { name: "Government Projects Reporting & Information System", kind: "official", site: "https://gpris.go.ke" },
  hawkeye: { name: "Hawkeye Kenya (derived from OAG)", kind: "secondary", site: "https://hawkeye.africa" },
  "county-sites": { name: "County government website", kind: "official", site: "various" },
}
