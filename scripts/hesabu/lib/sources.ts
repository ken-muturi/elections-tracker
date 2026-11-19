/**
 * Source registry — every report is tagged with the source it came from, and every
 * county output records per-source coverage (not every source has data for every county).
 */

export { SOURCE_KEYS, SOURCE_INFO } from "../../../src/constants/hesabu-sources"
export type { SourceKey } from "../../../src/constants/hesabu-sources"
import type { SourceKey } from "../../../src/constants/hesabu-sources"

/** One place a report was found */
export interface SourceRef {
  source: SourceKey
  url: string
}

/** Per-county result of one source */
export interface SourceCoverage {
  status: "found" | "no-data" | "error" | "skipped"
  reports: number
  error?: string
  /** Items kept from the previous run because this source failed or was skipped */
  carriedOver?: number
}
