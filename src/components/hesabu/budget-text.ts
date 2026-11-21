/** Dashboard budget wording — always for the year being viewed, never hard-coded */
export function absorbedLabel(rate: number | null, fiscalYear: string): string {
  return `${rate === null ? "N/A" : rate.toFixed(0)}% absorbed (FY ${fiscalYear})`
}

export function absorptionAlertText(fiscalYear: string, rate: number | null, devBudgetText: string): string {
  const share = rate === null ? "an unknown share" : `${rate.toFixed(0)}%`
  return `In FY ${fiscalYear}, ${share} of the ${devBudgetText} development budget was spent.`
}
