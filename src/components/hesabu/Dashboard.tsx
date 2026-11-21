"use client"

import { useState } from "react"
import { Box, Text, HStack, VStack } from "@chakra-ui/react"
import {
  CountyFull,
  ReportData,
  TrendPoint,
  CountyOption,
} from "@/services/Hesabu";
import { KPICards } from "@/components/hesabu/KPICards"
import { BudgetOverview } from "@/components/hesabu/BudgetOverview"
import { WardComparison } from "@/components/hesabu/WardComparison"
import { CitizenReports } from "@/components/hesabu/CitizenReports"
import { YearSelector } from "@/components/hesabu/YearSelector"
import { CountySelector } from "@/components/hesabu/CountySelector";
import type { ProjectCardSummary } from "@/components/hesabu/project-format";
import Link from "next/link"
import { buildCompareHref } from "@/components/hesabu/compare-params"
import { DEFAULT_METRIC } from "@/components/hesabu/compare-metrics"

type Tab = "budget" | "wards" | "reports"

const fmtB = (n: bigint) => {
  const v = Number(n)
  return `KSh ${(v / 1_000_000_000).toFixed(2)}B`
}

const pct = (a: bigint, b: bigint) =>
  b > 0n ? Math.round((Number(a) / Number(b)) * 100) : 0

type Props = {
  county: CountyFull;
  reports: ReportData[];
  availableYears: string[];
  currentYear: string;
  trendData: TrendPoint[];
  uniqueCounties: CountyOption[];
  currentCountyCode: string;
  projectSummary: ProjectCardSummary[];
  sectorSummary: ProjectCardSummary[];
};

export const HesabuDashboard = ({
  county,
  reports,
  availableYears,
  currentYear,
  trendData,
  uniqueCounties,
  currentCountyCode,
  projectSummary,
  sectorSummary,
}: Props) => {
  const [activeTab, setActiveTab] = useState<Tab>("budget");

  const tabs: { id: Tab; label: string; short: string; icon: string }[] = [
    { id: "budget", label: "Budget Overview", short: "Overview", icon: "🏛️" },
    { id: "wards", label: "Ward Comparison", short: "Wards", icon: "🗺️" },
    { id: "reports", label: "Citizen Reports", short: "Reports", icon: "🚩" },
  ];

  const recurrentPct = pct(county.recurrentExpenditure, county.totalBudget);
  const devPct = pct(county.developmentExpenditure, county.totalBudget);

  return (
    <Box bg="#f8fafc" minH="100vh" color="#0f172a" data-hesabu-root="">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <Box
        bg="linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #155e75 100%)"
        px={{ base: 4, md: 8 }}
        py={6}
      >
        <HStack
          gap={4}
          maxW="1200px"
          mx="auto"
          justify="space-between"
          flexWrap="wrap"
        >
          <HStack gap={4}>
            <Box
              w="48px"
              h="48px"
              bg="rgba(255,255,255,0.15)"
              borderRadius="lg"
              display="flex"
              alignItems="center"
              justifyContent="center"
              fontSize="24px"
              flexShrink={0}
              backdropFilter="blur(8px)"
            >
              🏦
            </Box>
            <VStack align="start" gap={0}>
              <Text
                fontSize={{ base: "xl", md: "2xl" }}
                fontWeight="800"
                color="white"
                lineHeight={1.2}
              >
                Hesabu ya {county.name}
              </Text>
              <Text
                fontSize="xs"
                color="rgba(255,255,255,0.6)"
                textTransform="uppercase"
                letterSpacing="widest"
              >
                County Budget Transparency Tracker &mdash; FY{" "}
                {county.fiscalYear}
              </Text>
            </VStack>
          </HStack>
          <HStack gap={2} flexWrap="wrap">
            <CountySelector
              counties={uniqueCounties}
              currentCode={currentCountyCode}
            />
            <YearSelector
              availableYears={availableYears}
              currentYear={currentYear}
            />
            <Box asChild display="inline-flex" alignItems="center" minH={{ base: "40px", md: "auto" }}>
              <Link
                href={buildCompareHref({ view: "side", year: currentYear, counties: [currentCountyCode], metric: DEFAULT_METRIC })}
                style={{
                  background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.3)", borderRadius: 8,
                  color: "white", fontSize: 13, fontWeight: 600, padding: "6px 12px", whiteSpace: "nowrap",
                }}
              >
                ⇄ Compare counties
              </Link>
            </Box>
          </HStack>
        </HStack>
      </Box>

      <Box w="100%" maxW="8xl" mx="auto" px={{ base: 4, md: 8 }} py={6}>
        {/* ── Summary bar ────────────────────────────────────────────────── */}
        <Box
          bg="white"
          border="1px solid"
          borderColor="gray.200"
          borderRadius="lg"
          px={4}
          py={3}
          mb={5}
          boxShadow="sm"
        >
          <HStack gap={2} flexWrap="wrap">
            <Box w="10px" h="10px" bg="#0d9488" borderRadius="sm" />
            <Text fontSize="xs" color="gray.500">
              Approved budget:{" "}
              <Text as="span" color="gray.900" fontWeight="semibold">
                {fmtB(county.totalBudget)}
              </Text>{" "}
              &bull; Recurrent:{" "}
              <Text as="span" color="gray.900" fontWeight="semibold">
                {fmtB(county.recurrentExpenditure)} ({recurrentPct}%)
              </Text>{" "}
              &bull; Development:{" "}
              <Text as="span" color="gray.900" fontWeight="semibold">
                {fmtB(county.developmentExpenditure)} ({devPct}%)
              </Text>
            </Text>
          </HStack>
        </Box>

        {/* ── KPI Cards ──────────────────────────────────────────────────── */}
        <Box mb={6}>
          <KPICards county={county} reports={reports} />
        </Box>

        {/* ── Tabs ───────────────────────────────────────────────────────── */}
        <Box
          bg="white"
          border="1px solid"
          borderColor="gray.200"
          borderRadius="xl"
          overflow="hidden"
          boxShadow="sm"
        >
          {/* Tab bar */}
          <HStack
            gap={0}
            borderBottom="1px solid"
            borderColor="gray.100"
            px={{ base: 2, md: 4 }}
            pt={3}
            bg="gray.50"
            overflowX="auto"
            overflowY="hidden"
            pb="1px"
          >
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <Box
                  key={tab.id}
                  data-tab={tab.id}
                  as="button"
                  px={{ base: 3, md: 4 }}
                  py={2.5}
                  flexShrink={0}
                  whiteSpace="nowrap"
                  minH={{ base: "40px", md: "auto" }}
                  fontSize="sm"
                  fontWeight={isActive ? "bold" : "normal"}
                  color={isActive ? "white" : "gray.500"}
                  bg={isActive ? "#0f172a" : "transparent"}
                  borderRadius="md"
                  mb="-1px"
                  cursor="pointer"
                  onClick={() => setActiveTab(tab.id)}
                  _hover={{ color: isActive ? "white" : "gray.800" }}
                  transition="all 0.15s"
                  mr={1}
                >
                  {tab.icon}{" "}
                  <Box as="span" display={{ base: "inline", md: "none" }}>{tab.short}</Box>
                  <Box as="span" display={{ base: "none", md: "inline" }}>{tab.label}</Box>
                </Box>
              );
            })}
          </HStack>

          {/* Tab content */}
          <Box p={{ base: 4, md: 6 }}>
            {activeTab === "budget" && (
              <BudgetOverview
                county={county}
                trendData={trendData}
                currentYear={currentYear}
                countyCode={currentCountyCode}
                sectorSummary={sectorSummary}
              />
            )}
            {activeTab === "wards" && (
              <WardComparison
                county={county}
                countyCode={currentCountyCode}
                fiscalYear={currentYear}
                projectSummary={projectSummary}
              />
            )}
            {activeTab === "reports" && (
              <CitizenReports county={county} initialReports={reports} />
            )}
          </Box>
        </Box>

        {/* Footer */}
        <Text fontSize="xs" color="gray.400" textAlign="center" mt={6}>
          Data sourced from{" "}
          {county.dataSource ?? "official county budget documents"} &bull; Showing
          FY {currentYear} &bull; Built with Hesabu platform
        </Text>
      </Box>
    </Box>
  );
};
