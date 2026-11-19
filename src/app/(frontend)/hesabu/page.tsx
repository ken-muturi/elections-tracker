import { notFound } from "next/navigation"
import {
  getCountyByCode,
  getReportsByCounty,
  getAvailableFiscalYears,
  getHistoricalTrend,
  getUniqueCounties,
  getProjectSummaryByCard,
  getProjectSummaryBySector,
} from "@/services/Hesabu";
import { HesabuDashboard } from "@/components/hesabu/Dashboard"
import { orFallback } from "@/components/hesabu/project-format"

export const metadata = {
  title: "Hesabu — Country Budget Transparency",
  description:
    "Track how county development funds are spent. Citizen accountability platform for Kenya counties.",
};

type Props = {
  searchParams: Promise<{ year?: string; county?: string }>;
};

export default async function HesabuPage({ searchParams }: Props) {
  const { year: yearParam, county: countyParam } = await searchParams;

  // Default to Wajir (008) — showcases ASAL data; Baringo (030) also available
  const countyCode = countyParam ?? "008";

  // Run county list + years in parallel
  const [uniqueCounties, availableYears] = await Promise.all([
    getUniqueCounties(),
    getAvailableFiscalYears(countyCode),
  ]);

  // If requested county has no data yet, fall back to Baringo
  const resolvedCode = availableYears.length > 0 ? countyCode : "030";
  const resolvedYears =
    availableYears.length > 0
      ? availableYears
      : await getAvailableFiscalYears("030");

  // Default to most recent available year
  const fiscalYear =
    yearParam && resolvedYears.includes(yearParam)
      ? yearParam
      : (resolvedYears[0] ?? "2025/2026");

  const [county, trendData, projectSummary, sectorSummary] = await Promise.all([
    getCountyByCode(resolvedCode, fiscalYear),
    getHistoricalTrend(resolvedCode),
    // Optional: the dashboard still renders if h_projects is missing or the query fails
    orFallback(getProjectSummaryByCard(resolvedCode, fiscalYear), [], "project summary"),
    orFallback(getProjectSummaryBySector(resolvedCode, fiscalYear), [], "sector project summary"),
  ]);

  if (!county) notFound()

  const reports = await getReportsByCounty(county.id)

  return (
    <HesabuDashboard
      county={county}
      reports={reports}
      availableYears={resolvedYears}
      currentYear={fiscalYear}
      trendData={trendData}
      uniqueCounties={uniqueCounties}
      currentCountyCode={resolvedCode}
      projectSummary={projectSummary}
      sectorSummary={sectorSummary}
    />
  );
}
