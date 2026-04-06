/* ── Elections component types ──────────────────────────────── */

export type ElectionForActions = {
  id: string
  title: string
  year: number
  electionDate: Date | string
  description?: string | null
  isActive: boolean
}

export type ElectionActionsProps = {
  election: ElectionForActions
  /** "card" = icon-only trigger (list view), "detail" = full button (detail page) */
  variant?: "card" | "detail"
}
