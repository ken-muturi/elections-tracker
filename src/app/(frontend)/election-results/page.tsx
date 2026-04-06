import {
  Box, Heading, Text, VStack, HStack, SimpleGrid, Flex, Badge,
} from "@chakra-ui/react";
import Link from "next/link";
import { getPublicElections } from "@/services/Elections";

import {
  FiCalendar, FiUsers, FiArrowRight, FiBarChart2, FiActivity, FiMapPin,
  FiChevronRight,
} from "react-icons/fi";
import { MdHowToVote } from "react-icons/md";

export const metadata = {
  title: "Election Results — Live",
  description: "View live election results — no login required",
};

function AnimStyles() {
  return (
    <style>{`
      @keyframes float1  { 0%,100%{transform:translate(0,0) scale(1)}  50%{transform:translate(30px,-40px) scale(1.1)} }
      @keyframes float2  { 0%,100%{transform:translate(0,0) scale(1)}  50%{transform:translate(-40px,30px) scale(1.15)} }
      @keyframes float3  { 0%,100%{transform:translate(0,0) scale(1)}  50%{transform:translate(20px,35px) scale(1.05)} }
      @keyframes pulse-dot { 0%,100%{opacity:1} 50%{opacity:.4} }
      @keyframes shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
      @keyframes gradient-x { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
    `}</style>
  );
}

export default async function PublicElectionsPage() {
  const elections = await getPublicElections().catch(() => []);

  const totalPositions = elections.reduce((s, e) => s + e.positions.length, 0);
  const totalCandidates = elections.reduce(
    (s, e) => s + e.positions.reduce((ps, p) => ps + p.candidates.length, 0),
    0,
  );

  return (
    <Box minH="100vh" bg="#f8fafc">
      <AnimStyles />

      {/* ── HERO ──────────────────────────────────────────── */}
      <Box
        position="relative" overflow="hidden"
        bg="linear-gradient(135deg, #0f172a 0%, #1e3a5f 40%, #155e75 70%, #0d9488 100%)"
        backgroundSize="200% 200%"
        css={{ animation: "gradient-x 15s ease infinite" }}
      >
        {/* Floating orbs */}
        <Box
          position="absolute" w="500px" h="500px" borderRadius="full"
          bg="radial-gradient(circle, rgba(201,217,39,0.2) 0%, transparent 70%)"
          top="-180px" right="-80px" css={{ animation: "float1 15s ease-in-out infinite" }}
        />
        <Box
          position="absolute" w="400px" h="400px" borderRadius="full"
          bg="radial-gradient(circle, rgba(56,189,248,0.15) 0%, transparent 70%)"
          bottom="-120px" left="-100px" css={{ animation: "float2 18s ease-in-out infinite" }}
        />
        <Box
          position="absolute" w="300px" h="300px" borderRadius="full"
          bg="radial-gradient(circle, rgba(167,139,250,0.12) 0%, transparent 70%)"
          top="20%" left="50%" css={{ animation: "float3 12s ease-in-out infinite" }}
        />

        {/* Grid overlay */}
        <Box
          position="absolute" inset={0} opacity={0.04}
          backgroundImage="linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px)"
          backgroundSize="60px 60px"
        />

        <Box maxW="7xl" mx="auto" px={{ base: 4, md: 8 }} pt={{ base: 14, md: 20 }} pb={{ base: 16, md: 24 }} position="relative">
          <VStack gap={{ base: 6, md: 8 }} alignItems="center" textAlign="center">
            {/* Eyebrow */}
            <HStack
              gap={2} px={4} py={2} borderRadius="full"
              bg="rgba(255,255,255,0.1)" backdropFilter="blur(8px)"
              borderWidth="1px" borderColor="rgba(255,255,255,0.15)"
            >
              <FiActivity fontSize="0.75rem" color="#C9D927" />
              <Text fontSize="xs" fontWeight="700" color="#C9D927" letterSpacing="wide" textTransform="uppercase">
                Real-time Results
              </Text>
            </HStack>

            {/* Headline */}
            <VStack gap={3}>
              <Heading
                fontWeight="900" fontSize={{ base: "4xl", md: "6xl", lg: "7xl" }}
                lineHeight="1.0" letterSpacing="tighter" color="white"
              >
                Election Results
              </Heading>
              <Text
                fontSize={{ base: "md", md: "lg" }} color="rgba(255,255,255,0.65)"
                maxW="xl" lineHeight="1.7" fontWeight="400"
              >
                Real-time results streamed directly from polling stations.
                Transparent. Verified. Instant.
              </Text>
            </VStack>

            {/* Stat cards */}
            {elections.length > 0 && (
              <HStack gap={{ base: 2, md: 4 }} pt={2} flexWrap="wrap" justify="center">
                {[
                  { value: elections.length, label: "Elections", icon: MdHowToVote, color: "#C9D927" },
                  { value: totalPositions, label: "Positions", icon: FiBarChart2, color: "#38bdf8" },
                  { value: totalCandidates.toLocaleString(), label: "Candidates", icon: FiUsers, color: "#a78bfa" },
                ].map(({ value, label, icon: Icon, color }) => (
                  <VStack
                    key={label} gap={0.5} px={{ base: 5, md: 8 }} py={{ base: 3, md: 4 }}
                    bg="rgba(255,255,255,0.08)" backdropFilter="blur(12px)"
                    borderRadius="2xl"
                    borderWidth="1px" borderColor="rgba(255,255,255,0.12)"
                    minW={{ base: "100px", md: "140px" }}
                  >
                    <Icon fontSize="1rem" color={color} />
                    <Text fontWeight="900" fontSize={{ base: "2xl", md: "3xl" }} color="white" lineHeight="1.1">
                      {value}
                    </Text>
                    <Text fontSize="xs" color="rgba(255,255,255,0.5)" fontWeight="500">
                      {label}
                    </Text>
                  </VStack>
                ))}
              </HStack>
            )}
          </VStack>
        </Box>

        {/* Curved bottom edge */}
        <Box position="absolute" bottom={-1} left={0} right={0}>
          <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: "block", width: "100%" }}>
            <path d="M0 60h1440V30C1200 55 960 0 720 30S240 55 0 30v30z" fill="#f8fafc" />
          </svg>
        </Box>
      </Box>

      {/* ── ELECTIONS ─────────────────────────────────────── */}
      <Box maxW="7xl" mx="auto" px={{ base: 4, md: 8 }} py={{ base: 6, md: 10 }} mt={-4}>
        {elections.length === 0 ? (
          <Box
            bg="white" borderRadius="3xl" p={{ base: 10, md: 16 }} textAlign="center"
            borderWidth="1px" borderColor="#e2e8f0"
            boxShadow="0 4px 24px rgba(0,0,0,0.04)"
          >
            <Flex
              w={24} h={24} borderRadius="3xl" bg="#f0fdf4"
              borderWidth="1px" borderColor="#bbf7d0"
              align="center" justify="center" mx="auto" mb={6}
            >
              <MdHowToVote fontSize="2.8rem" color="#16a34a" />
            </Flex>
            <Heading fontWeight="800" fontSize="2xl" color="#0f172a" mb={3}>
              No Active Elections
            </Heading>
            <Text fontSize="md" color="#64748b" maxW="md" mx="auto" lineHeight="1.7">
              There are no elections in progress right now.
              Results will appear here as soon as voting begins.
            </Text>
          </Box>
        ) : (
          <VStack gap={{ base: 6, md: 8 }} alignItems="stretch">
            {/* Section header */}
            <Flex justify="space-between" align="center" flexWrap="wrap" gap={3}>
              <HStack gap={3}>
                <Box w="3px" h={6} borderRadius="full" bg="linear-gradient(to bottom, #0f172a, #94a3b8)" />
                <Text fontSize="sm" fontWeight="800" color="#334155" textTransform="uppercase" letterSpacing="widest">
                  Active Elections
                </Text>
              </HStack>
              <HStack
                gap={2} px={3} py={1.5} borderRadius="full"
                bg="#ecfdf5" borderWidth="1px" borderColor="#a7f3d0"
              >
                <Box
                  w="6px" h="6px" borderRadius="full" bg="#10b981"
                  css={{ animation: "pulse-dot 2s ease-in-out infinite" }}
                />
                <Text fontSize="xs" color="#059669" fontWeight="600">
                  Auto-refreshing
                </Text>
              </HStack>
            </Flex>

            {/* Cards grid */}
            <SimpleGrid columns={{ base: 1, lg: 2 }} gap={{ base: 4, md: 6 }}>
              {elections.map((election, i) => {
                const candidateCount = election.positions.reduce(
                  (s, p) => s + p.candidates.length, 0,
                );
                const themes = [
                  { gradient: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)", accent: "#C9D927", accentBg: "#eff9d1", accentText: "#4d5e0f", chipBg: "rgba(255,255,255,0.08)", chipText: "rgba(255,255,255,0.7)" },
                  { gradient: "linear-gradient(135deg, #312e81 0%, #4338ca 100%)", accent: "#a78bfa", accentBg: "#ede9fe", accentText: "#5b21b6", chipBg: "rgba(255,255,255,0.08)", chipText: "rgba(255,255,255,0.7)" },
                  { gradient: "linear-gradient(135deg, #7f1d1d 0%, #b91c1c 100%)", accent: "#fca5a5", accentBg: "#fef2f2", accentText: "#991b1b", chipBg: "rgba(255,255,255,0.08)", chipText: "rgba(255,255,255,0.7)" },
                  { gradient: "linear-gradient(135deg, #064e3b 0%, #047857 100%)", accent: "#6ee7b7", accentBg: "#ecfdf5", accentText: "#065f46", chipBg: "rgba(255,255,255,0.08)", chipText: "rgba(255,255,255,0.7)" },
                ];
                const t = themes[i % themes.length];

                return (
                  <Link key={election.id} href={`/election-results/${election.id}`}>
                    <Box
                      position="relative" overflow="hidden" h="full"
                      borderRadius="2xl"
                      boxShadow="0 4px 24px rgba(0,0,0,0.08)"
                      cursor="pointer"
                      transition="all 0.35s cubic-bezier(.4,0,.2,1)"
                      _hover={{
                        transform: "translateY(-6px)",
                        boxShadow: "0 24px 48px -12px rgba(0,0,0,0.18)",
                      }}
                    >
                      {/* ── Card hero band ─────────────────── */}
                      <Box bg={t.gradient} position="relative" overflow="hidden">
                        {/* Shimmer */}
                        <Box
                          position="absolute" top={0} left={0} right={0} h="2px"
                          bg={`linear-gradient(90deg, transparent 0%, ${t.accent} 50%, transparent 100%)`}
                          backgroundSize="200% 100%"
                          css={{ animation: "shimmer 3s ease-in-out infinite" }}
                        />
                        {/* Decorative orb */}
                        <Box
                          position="absolute" w="180px" h="180px" borderRadius="full"
                          bg={`radial-gradient(circle, rgba(255,255,255,0.06), transparent 70%)`}
                          top="-70px" right="-40px" pointerEvents="none"
                        />

                        <Box p={{ base: 5, md: 6 }} position="relative">
                          <Flex justify="space-between" align="center" mb={4}>
                            <Badge
                              px={3} py={1} borderRadius="full"
                              bg="rgba(16,185,129,0.2)" color="#6ee7b7"
                              fontSize="xs" fontWeight="700"
                              display="flex" alignItems="center" gap={2}
                              borderWidth="1px" borderColor="rgba(16,185,129,0.3)"
                            >
                              <Box
                                w="6px" h="6px" borderRadius="full" bg="#34d399"
                                css={{ animation: "pulse-dot 2s ease-in-out infinite" }}
                              />
                              Active
                            </Badge>
                            <Flex
                              w={8} h={8} borderRadius="lg"
                              bg="rgba(255,255,255,0.1)"
                              align="center" justify="center"
                              transition="all 0.2s"
                            >
                              <FiArrowRight fontSize="0.9rem" color="rgba(255,255,255,0.7)" />
                            </Flex>
                          </Flex>
                          <Heading fontWeight="800" fontSize={{ base: "lg", md: "xl" }} color="white" lineHeight="1.25" mb={2}>
                            {election.title}
                          </Heading>
                          <HStack gap={2}>
                            <Box
                              px={2} py={0.5} bg="rgba(255,255,255,0.12)"
                              borderRadius="md" fontSize="xs" fontWeight="700" color="white"
                            >
                              {election.year}
                            </Box>
                            <HStack gap={1.5}>
                              <FiCalendar fontSize="0.7rem" color="rgba(255,255,255,0.5)" />
                              <Text fontSize="xs" color="rgba(255,255,255,0.5)" fontWeight="500">
                                {new Date(election.electionDate).toLocaleDateString("en-US", {
                                  month: "short", day: "numeric", year: "numeric",
                                })}
                              </Text>
                            </HStack>
                          </HStack>
                        </Box>
                      </Box>

                      {/* ── Card body (white) ──────────────── */}
                      <Box bg="white" p={{ base: 5, md: 6 }}>
                        <HStack gap={3} flexWrap="wrap" mb={5}>
                          <HStack gap={1.5} px={3} py={1.5} borderRadius="lg" bg="#f1f5f9">
                            <FiBarChart2 fontSize="0.75rem" color="#475569" />
                            <Text fontSize="xs" fontWeight="600" color="#475569">
                              {election.positions.length} positions
                            </Text>
                          </HStack>
                          <HStack gap={1.5} px={3} py={1.5} borderRadius="lg" bg="#f1f5f9">
                            <FiUsers fontSize="0.75rem" color="#475569" />
                            <Text fontSize="xs" fontWeight="600" color="#475569">
                              {candidateCount.toLocaleString()} candidates
                            </Text>
                          </HStack>
                          <HStack gap={1.5} px={3} py={1.5} borderRadius="lg" bg="#f1f5f9">
                            <FiMapPin fontSize="0.75rem" color="#475569" />
                            <Text fontSize="xs" fontWeight="600" color="#475569">
                              Nationwide
                            </Text>
                          </HStack>
                        </HStack>

                        <Flex
                          pt={4} borderTopWidth="1px" borderTopColor="#f1f5f9"
                          align="center" justify="space-between"
                        >
                          <Text fontSize="xs" fontWeight="700" color="#0f172a" letterSpacing="wide" textTransform="uppercase">
                            View Results
                          </Text>
                          <Flex
                            w={7} h={7} borderRadius="full" bg="#0f172a"
                            align="center" justify="center"
                          >
                            <FiChevronRight fontSize="0.75rem" color="white" />
                          </Flex>
                        </Flex>
                      </Box>
                    </Box>
                  </Link>
                );
              })}
            </SimpleGrid>
          </VStack>
        )}
      </Box>

      {/* ── FOOTER ────────────────────────────────────────── */}
      <Box mt={12} borderTopWidth="1px" borderTopColor="#e2e8f0" bg="white">
        <Flex
          maxW="7xl" mx="auto" px={{ base: 4, md: 8 }} py={6}
          direction={{ base: "column", md: "row" }}
          justify="space-between" align="center" gap={4}
        >
          <HStack gap={3}>
            <Flex
              w={8} h={8} borderRadius="lg" bg="#0f172a"
              align="center" justify="center"
            >
              <MdHowToVote fontSize="0.85rem" color="#C9D927" />
            </Flex>
            <VStack alignItems="flex-start" gap={0}>
              <Text fontSize="xs" color="#64748b" fontWeight="600">
                Election Tracking System
              </Text>
              <Text fontSize="10px" color="#94a3b8" fontWeight="500">
                Transparent · Verified · Real-time
              </Text>
            </VStack>
          </HStack>
          <Text fontSize="xs" color="#94a3b8" textAlign={{ base: "center", md: "right" }}>
            Results are unofficial and update automatically as data is received from polling stations.
          </Text>
        </Flex>
      </Box>
    </Box>
  );
}
