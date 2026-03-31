/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState } from "react";
import {
  Box,
  VStack,
  HStack,
  Text,
  Heading,
  SimpleGrid,
  Badge,
  Table,
  Flex,
} from "@chakra-ui/react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { ElectionDashboardData } from "@/services/Results";

const COLORS = [
  "#3182CE",
  "#E53E3E",
  "#38A169",
  "#D69E2E",
  "#805AD5",
  "#DD6B20",
  "#319795",
  "#E53E3E",
  "#718096",
  "#D53F8C",
];

const statusColors: Record<string, string> = {
  PENDING: "yellow",
  VERIFIED: "green",
  DISPUTED: "orange",
  REJECTED: "red",
};

const ResultsDashboard = ({ data }: { data: ElectionDashboardData }) => {
  const [view, setView] = useState<"overview" | "stations" | "submissions">(
    "overview"
  );

  // Resolve questionnaire title
  const title =
    (
      data.questionnaireTitle as Array<{
        body: { text: string; language: string };
      }>
    )?.[0]?.body?.text || "Election Results";

  // Prepare chart data for vote totals
  const voteChartData = data.results.map((r) => ({
    name:
      (
        r.questionTitle as Array<{ body: { text: string; language: string } }>
      )?.[0]?.body?.text || "Unknown",
    votes: r.totalValue,
  }));

  // Prepare pie chart data
  const totalVotes = data.results.reduce((s, r) => s + r.totalValue, 0);
  const pieData = data.results.map((r) => ({
    name:
      (
        r.questionTitle as Array<{ body: { text: string; language: string } }>
      )?.[0]?.body?.text || "Unknown",
    value: r.totalValue,
    percentage: totalVotes > 0 ? ((r.totalValue / totalVotes) * 100).toFixed(1) : "0",
  }));

  // Submission status data for pie chart
  const statusPieData = data.submissionsByStatus.filter((s) => s.count > 0);

  return (
    <VStack gap={6} w="full" alignItems="start" p={4}>
      {/* Header */}
      <Box>
        <Heading size="lg">{title}</Heading>
        <Text color="gray.500" mt={1}>
          Live election results dashboard
        </Text>
      </Box>

      {/* Tab navigation */}
      <HStack gap={1}>
        {(["overview", "stations", "submissions"] as const).map((tab) => (
          <Box
            key={tab}
            px={4}
            py={2}
            cursor="pointer"
            borderBottomWidth="2px"
            borderBottomColor={view === tab ? "blue.500" : "transparent"}
            fontWeight={view === tab ? "bold" : "normal"}
            color={view === tab ? "blue.600" : "gray.500"}
            onClick={() => setView(tab)}
            _hover={{ color: "blue.500" }}
            textTransform="capitalize"
            fontSize="sm"
          >
            {tab}
          </Box>
        ))}
      </HStack>

      {/* Stats Cards */}
      <SimpleGrid columns={{ base: 2, md: 4 }} gap={4} w="full">
        <Box p={4} borderWidth="1px" borderRadius="lg" bg="blue.50">
          <Text fontSize="xs" color="gray.500">
            Total Submissions
          </Text>
          <Text fontSize="2xl" fontWeight="bold" color="blue.600">
            {data.totalSubmissions}
          </Text>
        </Box>
        <Box p={4} borderWidth="1px" borderRadius="lg" bg="green.50">
          <Text fontSize="xs" color="gray.500">
            Stations Reported
          </Text>
          <Text fontSize="2xl" fontWeight="bold" color="green.600">
            {data.stationsReported} / {data.totalStations}
          </Text>
        </Box>
        <Box p={4} borderWidth="1px" borderRadius="lg" bg="purple.50">
          <Text fontSize="xs" color="gray.500">
            Total Votes Cast
          </Text>
          <Text fontSize="2xl" fontWeight="bold" color="purple.600">
            {totalVotes.toLocaleString()}
          </Text>
        </Box>
        <Box p={4} borderWidth="1px" borderRadius="lg" bg="orange.50">
          <Text fontSize="xs" color="gray.500">
            Reporting Rate
          </Text>
          <Text fontSize="2xl" fontWeight="bold" color="orange.600">
            {data.totalStations > 0
              ? ((data.stationsReported / data.totalStations) * 100).toFixed(1)
              : 0}
            %
          </Text>
        </Box>
      </SimpleGrid>

      {/* Overview View */}
      {view === "overview" && (
        <VStack gap={6} w="full" alignItems="start">
          {/* Vote tallies */}
          <Box w="full">
            <Heading size="md" mb={4}>
              Vote Tallies
            </Heading>
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={3}>
              {data.results.map((result, index) => {
                const name =
                  (
                    result.questionTitle as Array<{
                      body: { text: string; language: string };
                    }>
                  )?.[0]?.body?.text || "Unknown";
                const pct =
                  totalVotes > 0
                    ? ((result.totalValue / totalVotes) * 100).toFixed(1)
                    : "0";
                return (
                  <Box
                    key={result.questionId}
                    p={4}
                    borderWidth="1px"
                    borderRadius="lg"
                    borderLeftWidth="4px"
                    borderLeftColor={COLORS[index % COLORS.length]}
                  >
                    <Text fontWeight="bold" fontSize="sm">
                      {name}
                    </Text>
                    <HStack justifyContent="space-between" mt={2}>
                      <Text fontSize="2xl" fontWeight="bold">
                        {result.totalValue.toLocaleString()}
                      </Text>
                      <Badge
                        colorPalette={
                          parseFloat(pct) > 50 ? "green" : "gray"
                        }
                        fontSize="md"
                      >
                        {pct}%
                      </Badge>
                    </HStack>
                    <Text fontSize="xs" color="gray.400">
                      from {result.submissions} submissions
                    </Text>
                  </Box>
                );
              })}
            </SimpleGrid>
          </Box>

          {/* Bar Chart */}
          {voteChartData.length > 0 && (
            <Box w="full" h="400px">
              <Heading size="md" mb={4}>
                Results Chart
              </Heading>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={voteChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="votes" fill="#3182CE" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          )}

          {/* Pie Chart */}
          {pieData.length > 0 && (
            <Flex
              w="full"
              gap={6}
              direction={{ base: "column", md: "row" }}
            >
              <Box flex={1} h="350px">
                <Heading size="md" mb={4}>
                  Vote Distribution
                </Heading>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }: any) =>
                        `${name}: ${(percent * 100).toFixed(1)}%`
                      }
                      outerRadius={120}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieData.map((_entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Box>

              {/* Submission Status */}
              {statusPieData.length > 0 && (
                <Box flex={1}>
                  <Heading size="md" mb={4}>
                    Submission Status
                  </Heading>
                  <VStack gap={2} alignItems="start">
                    {data.submissionsByStatus.map((s) => (
                      <HStack key={s.status} gap={3}>
                        <Badge colorPalette={statusColors[s.status] || "gray"}>
                          {s.status}
                        </Badge>
                        <Text fontWeight="bold">{s.count}</Text>
                      </HStack>
                    ))}
                  </VStack>
                </Box>
              )}
            </Flex>
          )}
        </VStack>
      )}

      {/* Stations View */}
      {view === "stations" && (
        <Box w="full" overflowX="auto">
          <Heading size="md" mb={4}>
            Results by Polling Station
          </Heading>
          {data.results.length === 0 ? (
            <Text color="gray.400">No results available yet.</Text>
          ) : (
            <Table.Root size="sm" striped>
              <Table.Header>
                <Table.Row>
                  <Table.ColumnHeader>Station</Table.ColumnHeader>
                  <Table.ColumnHeader>Code</Table.ColumnHeader>
                  <Table.ColumnHeader>County</Table.ColumnHeader>
                  <Table.ColumnHeader>Constituency</Table.ColumnHeader>
                  <Table.ColumnHeader>Ward</Table.ColumnHeader>
                  {data.results.map((r) => (
                    <Table.ColumnHeader key={r.questionId}>
                      {(
                        r.questionTitle as Array<{
                          body: { text: string; language: string };
                        }>
                      )?.[0]?.body?.text || "?"}
                    </Table.ColumnHeader>
                  ))}
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {(() => {
                  // Collect all unique stations
                  const stationMap = new Map<
                    string,
                    {
                      stationId: string;
                      stationName: string;
                      stationCode: string;
                      county: string;
                      constituency: string;
                      ward: string;
                      values: Record<string, number>;
                    }
                  >();

                  data.results.forEach((result) => {
                    result.byStation.forEach((bs) => {
                      if (!stationMap.has(bs.stationId)) {
                        stationMap.set(bs.stationId, {
                          stationId: bs.stationId,
                          stationName: bs.stationName,
                          stationCode: bs.stationCode,
                          county: bs.county,
                          constituency: bs.constituency,
                          ward: bs.ward,
                          values: {},
                        });
                      }
                      stationMap.get(bs.stationId)!.values[
                        result.questionId
                      ] = bs.value;
                    });
                  });

                  return Array.from(stationMap.values()).map((station) => (
                    <Table.Row key={station.stationId}>
                      <Table.Cell fontWeight="500">
                        {station.stationName}
                      </Table.Cell>
                      <Table.Cell>
                        <Badge colorPalette="blue" size="sm">
                          {station.stationCode}
                        </Badge>
                      </Table.Cell>
                      <Table.Cell>{station.county}</Table.Cell>
                      <Table.Cell>{station.constituency}</Table.Cell>
                      <Table.Cell>{station.ward}</Table.Cell>
                      {data.results.map((r) => (
                        <Table.Cell key={r.questionId}>
                          {(
                            station.values[r.questionId] || 0
                          ).toLocaleString()}
                        </Table.Cell>
                      ))}
                    </Table.Row>
                  ));
                })()}
              </Table.Body>
            </Table.Root>
          )}
        </Box>
      )}

      {/* Submissions View */}
      {view === "submissions" && (
        <Box w="full" overflowX="auto">
          <Heading size="md" mb={4}>
            Recent Submissions
          </Heading>
          <Table.Root size="sm" striped>
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeader>#</Table.ColumnHeader>
                <Table.ColumnHeader>Polling Station</Table.ColumnHeader>
                <Table.ColumnHeader>Code</Table.ColumnHeader>
                <Table.ColumnHeader>Submitted By</Table.ColumnHeader>
                <Table.ColumnHeader>Date</Table.ColumnHeader>
                <Table.ColumnHeader>Status</Table.ColumnHeader>
                <Table.ColumnHeader>Answers</Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {data.recentSubmissions.length === 0 ? (
                <Table.Row>
                  <Table.Cell colSpan={7}>
                    <Text textAlign="center" color="gray.400" py={4}>
                      No submissions yet
                    </Text>
                  </Table.Cell>
                </Table.Row>
              ) : (
                data.recentSubmissions.map((sub: any, index: number) => (
                  <Table.Row key={sub.id}>
                    <Table.Cell>{index + 1}</Table.Cell>
                    <Table.Cell fontWeight="500">
                      {sub.stationName}
                    </Table.Cell>
                    <Table.Cell>
                      <Badge colorPalette="blue" size="sm">
                        {sub.stationCode}
                      </Badge>
                    </Table.Cell>
                    <Table.Cell>{sub.submittedBy}</Table.Cell>
                    <Table.Cell>
                      {new Date(sub.submittedAt).toLocaleString()}
                    </Table.Cell>
                    <Table.Cell>
                      <Badge
                        colorPalette={statusColors[sub.status] || "gray"}
                      >
                        {sub.status}
                      </Badge>
                    </Table.Cell>
                    <Table.Cell>{sub.answerCount}</Table.Cell>
                  </Table.Row>
                ))
              )}
            </Table.Body>
          </Table.Root>
        </Box>
      )}
    </VStack>
  );
};

export default ResultsDashboard;
