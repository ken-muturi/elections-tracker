import { notFound } from "next/navigation"
import {
  getCountyByCode,
  getReportsByCounty,
  getAvailableFiscalYears,
  getHistoricalTrend,
} from "@/services/Hesabu"
import { HesabuDashboard } from "@/components/hesabu/Dashboard"

export const metadata = {
  title: "Hesabu — County Budget Transparency",
  description:
    "Track how county development funds are spent. Citizen accountability platform for Kenya counties.",
}

type Props = {
  searchParams: Promise<{ year?: string }>
}

export default async function HesabuPage({ searchParams }: Props) {
  const { year: yearParam } = await searchParams

  // Available years for Baringo — descending
  const availableYears = await getAvailableFiscalYears("030")

  // Default to most recent year with data
  const fiscalYear =
    yearParam && availableYears.includes(yearParam)
      ? yearParam
      : (availableYears[0] ?? "2025/2026")

  const [county, trendData] = await Promise.all([
    getCountyByCode("030", fiscalYear),
    getHistoricalTrend("030"),
  ])

  if (!county) notFound()

  const reports = await getReportsByCounty(county.id)

  return (
    <HesabuDashboard
      county={county}
      reports={reports}
      availableYears={availableYears}
      currentYear={fiscalYear}
      trendData={trendData}
    />
  )
}
