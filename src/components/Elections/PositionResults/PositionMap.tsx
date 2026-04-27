"use client"

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore – CSS side-effect import resolved by Next.js bundler
import "leaflet/dist/leaflet.css"
import { useEffect, useRef, useState } from "react"
import { Box, Flex, Text } from "@chakra-ui/react"
import { useRouter } from "next/navigation"
import type { ResultStat } from "../ResultsSummary"
import { CANDIDATE_PALETTE, } from "../DrillDown/candidateColors"
import { getIEBCFormRef, LEVEL_LABEL } from "../constants"

type Entity = ResultStat["entities"][number]
type LcColors = { bg: string; color: string; border: string }

/** Map from aggregationLevel (where results are declared) → geojson for those entities */
const ENTITY_GEO: Partial<Record<string, { path: string; nameKey: string }>> = {
  COUNTY:       { path: "/geodata/ke_counties.geojson",       nameKey: "COUNTY_NAM" },
  CONSTITUENCY: { path: "/geodata/ke_constituencies.geojson", nameKey: "CONSTITUEN" },
  // WARD intentionally omitted — DB ward names ("Changamwe Ward 1") don't match
  // IEBC geojson ward names ("BARTABWA"), so the map would always appear empty.
}

function normaliseName(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9 ]/g, "").replace(/\s+/g, " ").trim()
}

function opacityFromShare(pct: number) {
  return Math.min(0.88, Math.max(0.22, (pct / 100) * 0.88))
}

type Props = {
  entities: Entity[]
  aggregationLevel: string
  positionType: string
  lc: LcColors
  electionId: string
  positionId: string
}

export default function PositionMap({
  entities,
  aggregationLevel,
  positionType,
  lc,
  electionId,
  positionId,
}: Props) {
  const router = useRouter()
  const mapRef = useRef<HTMLDivElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const leafletRef = useRef<any>(null)

  const geo = ENTITY_GEO[aggregationLevel]
  const isPresidential = positionType.toUpperCase() === "PRESIDENT";

  // Build a stable candidate → color map (keyed by candidate id, ranked by stream votes)
  const candidateColorMap = (() => {
    const ranked = new Map<string, string>();
    // Collect all unique candidate ids ordered by their global stream-vote rank
    const totals = new Map<string, number>();
    for (const entity of entities) {
      for (const c of entity.candidates)
        totals.set(c.id, (totals.get(c.id) ?? 0) + c.streamVotes);
    }
    const sorted = [...totals.entries()].sort((a, b) => b[1] - a[1]);
    sorted.forEach(([id], i) =>
      ranked.set(id, CANDIDATE_PALETTE[i % CANDIDATE_PALETTE.length]),
    );
    return ranked;
  })();

  useEffect(() => {
    if (!mapRef.current || !geo) return;

    let cancelled = false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let mapInstance: any = null;

    async function init() {
      if (!geo) return;
      const L = (await import("leaflet")).default;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "/leaflet/marker-icon-2x.png",
        iconUrl: "/leaflet/marker-icon.png",
        shadowUrl: "/leaflet/marker-shadow.png",
      });

      if (cancelled || !mapRef.current) return;

      const entityByName = new Map<string, Entity>();
      for (const entity of entities)
        entityByName.set(normaliseName(entity.entityName), entity);

      const res = await fetch(geo.path);
      if (!res.ok || cancelled) return;
      const geojson = await res.json();

      if (cancelled || !mapRef.current) return;

      if (leafletRef.current) {
        leafletRef.current.remove();
        leafletRef.current = null;
      }

      const map = L.map(mapRef.current, {
        zoomControl: false,
        attributionControl: false,
        scrollWheelZoom: true,
        dragging: true,
        // Constrain pan/zoom to Kenya
        maxBounds: L.latLngBounds([-5.0, 33.9], [5.1, 42.0]),
        maxBoundsViscosity: 0.85,
        minZoom: 5,
      });
      L.control.zoom({ position: "topright" }).addTo(map);
      mapInstance = map;
      leafletRef.current = map;

      L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png",
        {
          maxZoom: 19,
          subdomains: "abcd",
        },
      ).addTo(map);

      const tooltip = L.tooltip({
        permanent: false,
        direction: "auto",
        className: "drill-map-tip",
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const matchedLayers: any[] = [];

      const geoLayer = L.geoJSON(geojson, {
        style: (feature) => {
          if (!feature) return {};
          const name = normaliseName(feature.properties?.[geo.nameKey] ?? "");
          const entity = entityByName.get(name);
          if (!entity)
            return {
              fillColor: "#d1d5db",
              fillOpacity: 0.3,
              color: "#fff",
              weight: 1,
            };

          const leader = entity.candidates[0];
          const total = entity.candidates.reduce(
            (s, c) => s + c.streamVotes,
            0,
          );
          const pct = total > 0 ? (leader.streamVotes / total) * 100 : 0;
          const fill = leader
            ? (candidateColorMap.get(leader.id) ?? "#d1d5db")
            : "#d1d5db";
          return {
            fillColor: fill,
            fillOpacity: opacityFromShare(pct),
            color: "#fff",
            weight: 1,
          };
        },
        onEachFeature: (feature, layer) => {
          const rawName = feature.properties?.[geo.nameKey] ?? "";
          const entity = entityByName.get(normaliseName(rawName));
          if (entity) matchedLayers.push(layer);

          layer.on({
            mouseover(e) {
              const l = e.target;
              const fill = entity?.candidates[0]
                ? (candidateColorMap.get(entity.candidates[0].id) ?? lc.color)
                : lc.color;
              l.setStyle({
                weight: 2.5,
                color: fill,
                fillOpacity: Math.min(1, (l.options.fillOpacity ?? 0.4) + 0.15),
              });
              if (entity) {
                const total = entity.candidates.reduce(
                  (s, c) => s + c.streamVotes,
                  0,
                );
                const candidatesToShow = isPresidential
                  ? entity.candidates.slice(0, 3)
                  : entity.candidates.slice(0, 1);
                const lines = candidatesToShow
                  .map((c) => {
                    const party = c.party ? ` (${c.party})` : "";
                    return `${c.name}${party}: ${total > 0 ? ((c.streamVotes / total) * 100).toFixed(1) : 0}%`;
                  })
                  .join("<br/>");
                tooltip.setContent(`<b>${rawName}</b><br/>${lines}`);
                tooltip.setLatLng(e.latlng);
                if (!tooltip.isOpen()) map.openTooltip(tooltip);
                const el = tooltip.getElement();
                if (el) {
                  el.style.backgroundColor = fill + "28";
                  el.style.borderLeft = `3px solid ${fill}`;
                  el.style.borderRadius = "6px";
                }
              }
            },
            mouseout(e) {
              geoLayer.resetStyle(e.target);
              map.closeTooltip(tooltip);
            },
            click(e) {
              if (entity) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const bounds = (e.target as any).getBounds();
                const url = `/election-results/${electionId}/drill/${positionId}?entityId=${entity.entityId}&entityLevel=${aggregationLevel}`;
                if (bounds?.isValid()) {
                  map.flyToBounds(bounds, { padding: [40, 40], duration: 0.5 });
                  setTimeout(() => router.push(url), 520);
                } else {
                  router.push(url);
                }
              }
            },
          });
        },
      }).addTo(map);

      // Fit to matched entities only; fall back to full layer
      const matchedGroup =
        matchedLayers.length > 0 ? L.featureGroup(matchedLayers) : geoLayer;
      const fitTarget = matchedGroup.getBounds();
      if (fitTarget.isValid()) map.fitBounds(fitTarget, { padding: [24, 24] });
    }

    init().catch(console.error);

    return () => {
      cancelled = true;
      if (mapInstance) {
        mapInstance.remove();
        mapInstance = null;
      }
      leafletRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aggregationLevel, entities, geo, electionId, positionId]);

  const formRef = getIEBCFormRef(positionType, aggregationLevel);
  const levelLabel = LEVEL_LABEL[aggregationLevel] ?? aggregationLevel;

  // Build legend: stream-aggregate rows (always visible)
  const { legendItems, streamGrandTotal } = (() => {
    const totals = new Map<
      string,
      { name: string; party: string; votes: number }
    >();
    for (const entity of entities)
      for (const c of entity.candidates)
        totals.set(c.id, {
          name: c.name,
          party: c.party ?? "",
          votes: (totals.get(c.id)?.votes ?? 0) + c.streamVotes,
        });
    const sorted = [...totals.entries()]
      .sort((a, b) => b[1].votes - a[1].votes)
      .slice(0, 5)
      .filter(([, v]) => v.votes > 0);
    const grandTotal = sorted.reduce((s, [, v]) => s + v.votes, 0);
    return {
      streamGrandTotal: grandTotal,
      legendItems: sorted.map(([id, v]) => ({
        name: v.name,
        party: v.party,
        color: candidateColorMap.get(id) ?? "#d1d5db",
        votes: v.votes.toLocaleString(),
        pct: grandTotal > 0 ? ((v.votes / grandTotal) * 100).toFixed(1) : "0.0",
      })),
    };
  })();

  // Per-entity winner rows for non-presidential legend (one row per county/constituency)
  const entityRows = (() => {
    if (isPresidential) return null;
    return entities
      .filter((e) => e.candidates.length > 0 && e.candidates[0].streamVotes > 0)
      .sort((a, b) => b.candidates[0].streamVotes - a.candidates[0].streamVotes)
      .map((e) => {
        const leader = e.candidates[0];
        const total = e.candidates.reduce((s, c) => s + c.streamVotes, 0);
        return {
          entityName: e.entityName,
          candidateName: leader.name,
          party: leader.party ?? "",
          color: candidateColorMap.get(leader.id) ?? "#d1d5db",
          pct:
            total > 0 ? ((leader.streamVotes / total) * 100).toFixed(1) : "0.0",
        };
      });
  })();

  // Build level-aggregate rows for the collapsible (levelVotes = declared at the entity level)
  const levelItems = (() => {
    const totals = new Map<string, { name: string; party: string; votes: number }>()
    for (const entity of entities)
      for (const c of entity.candidates)
        totals.set(c.id, { name: c.name, party: c.party ?? "", votes: (totals.get(c.id)?.votes ?? 0) + c.levelVotes })
    const sorted = [...totals.entries()]
      .sort((a, b) => b[1].votes - a[1].votes)
      .slice(0, 5)
      .filter(([, v]) => v.votes > 0)
    if (sorted.length === 0) return null
    const grandTotal = sorted.reduce((s, [, v]) => s + v.votes, 0)
    const rejectedVotes = entities.reduce((s, e) => s + (e.rejectedVotes ?? 0), 0)
    return {
      rows: sorted.map(([id, v]) => ({
        name: v.name,
        party: v.party,
        color: candidateColorMap.get(id) ?? "#d1d5db",
        votes: v.votes.toLocaleString(),
        pct: grandTotal > 0 ? (v.votes / grandTotal * 100).toFixed(1) : "0.0",
      })),
      rejectedVotes,
      totalVotes: grandTotal,
    }
  })()

  const [resultsOpen, setResultsOpen] = useState(true)

  return (
    <Box position="relative" overflow="hidden" px={4} pb={4} pt={3}>
      <style>{`.drill-map-tip { font-size: 12px; line-height: 1.5; }`}</style>
      <Box
        ref={mapRef}
        h="calc(100vh - 320px)"
        minH="420px"
        w="full"
        borderRadius="xl"
        overflow="hidden"
      />

      {/* ── Legend ── */}
      {(legendItems.length > 0 || (entityRows && entityRows.length > 0)) && (
        <Box
          position="absolute"
          top={7}
          left={8}
          bg="white"
          borderRadius="lg"
          boxShadow="md"
          px={3}
          py={2.5}
          zIndex={1000}
          borderWidth="1px"
          borderColor="gray.100"
          minW="200px"
          maxW="260px"
          maxH="calc(100vh - 360px)"
          display="flex"
          flexDirection="column"
        >
          {/* Title — not scrolled */}
          <Text
            fontSize="11px"
            fontWeight="700"
            color="gray.600"
            mb={2}
            flexShrink={0}
          >
            {isPresidential
              ? `${levelLabel}: Stream Aggregate — ${streamGrandTotal.toLocaleString()} votes`
              : `${levelLabel}: Leading Candidates`}
          </Text>

          {/* Scrollable body */}
          <Box
            overflowY="auto"
            flex={1}
            css={{
              "&::-webkit-scrollbar": { width: "4px" },
              "&::-webkit-scrollbar-thumb": {
                background: "#d1d5db",
                borderRadius: "4px",
              },
            }}
          >
            {/* Presidential: aggregate votes + % */}
            {isPresidential
              ? legendItems.map((item) => (
                  <Flex
                    key={item.name}
                    align="center"
                    gap={2}
                    mb={1}
                    _last={{ mb: 0 }}
                  >
                    <Box
                      w={3}
                      h={3}
                      borderRadius="sm"
                      flexShrink={0}
                      bg={item.color}
                    />
                    <Text
                      fontSize="11px"
                      fontWeight="600"
                      color="gray.700"
                      flex={1}
                      lineClamp={1}
                    >
                      {item.name}
                      {item.party ? (
                        <Text as="span" fontWeight="400" color="gray.400">
                          {" "}
                          ({item.party})
                        </Text>
                      ) : null}
                    </Text>
                    <Text fontSize="11px" color="gray.500">
                      {item.votes}
                    </Text>
                    <Text
                      fontSize="11px"
                      fontWeight="700"
                      color="gray.800"
                      ml={1}
                    >
                      {item.pct}%
                    </Text>
                  </Flex>
                ))
              : /* Non-presidential: one row per entity (county / constituency) */
                (entityRows ?? []).map((row) => (
                  <Flex
                    key={row.entityName}
                    align="center"
                    gap={2}
                    mb={1}
                    _last={{ mb: 0 }}
                  >
                    <Box
                      w={2.5}
                      h={2.5}
                      borderRadius="sm"
                      flexShrink={0}
                      bg={row.color}
                      mt="1px"
                    />
                    <Text
                      fontSize="11px"
                      color="gray.500"
                      flexShrink={0}
                      mr={0.5}
                    >
                      {row.entityName}
                    </Text>
                    <Text
                      fontSize="11px"
                      fontWeight="600"
                      color="gray.700"
                      flex={1}
                      lineClamp={1}
                    >
                      {row.candidateName}
                      {row.party ? (
                        <Text as="span" fontWeight="400" color="gray.400">
                          {" "}
                          ({row.party})
                        </Text>
                      ) : null}
                    </Text>
                    <Text
                      fontSize="11px"
                      fontWeight="700"
                      color="gray.800"
                      ml={1}
                    >
                      {row.pct}%
                    </Text>
                  </Flex>
                ))}

            {/* Collapsible level-aggregate results — inside scroll area */}
            {levelItems && (
              <>
                <Box
                  borderTopWidth="1px"
                  borderColor="gray.100"
                  mt={2}
                  mb={1.5}
                />
                <Flex
                  align="center"
                  justify="space-between"
                  cursor="pointer"
                  onClick={() => setResultsOpen((o) => !o)}
                  mb={resultsOpen ? 1.5 : 0}
                >
                  <Text
                    fontSize="10px"
                    fontWeight="700"
                    color="gray.500"
                    lineClamp={1}
                  >
                    {formRef.form} · {formRef.label}
                  </Text>
                  <Text fontSize="10px" color="gray.400" ml={2}>
                    {resultsOpen ? "▲" : "▼"}
                  </Text>
                </Flex>
                {resultsOpen && (
                  <>
                    {levelItems.rows.map((item) => (
                      <Flex key={item.name} align="center" gap={1.5} mb={1}>
                        <Box
                          w={2.5}
                          h={2.5}
                          borderRadius="sm"
                          flexShrink={0}
                          bg={item.color}
                        />
                        <Text
                          fontSize="11px"
                          color="gray.700"
                          flex={1}
                          lineClamp={1}
                        >
                          {item.name}
                          {item.party ? (
                            <Text as="span" color="gray.400">
                              {" "}
                              ({item.party})
                            </Text>
                          ) : null}
                        </Text>
                        <Text fontSize="11px" color="gray.500" ml={1}>
                          {item.votes}
                        </Text>
                        <Text
                          fontSize="11px"
                          fontWeight="700"
                          color="gray.800"
                          ml={1}
                        >
                          {item.pct}%
                        </Text>
                      </Flex>
                    ))}
                    {levelItems.rejectedVotes > 0 && (
                      <Flex align="center" gap={1.5} mt={0.5}>
                        <Box
                          w={2.5}
                          h={2.5}
                          borderRadius="sm"
                          flexShrink={0}
                          bg="red.300"
                        />
                        <Text fontSize="11px" color="red.600" flex={1}>
                          Rejected
                        </Text>
                        <Text fontSize="11px" color="gray.500" ml={1}>
                          {levelItems.rejectedVotes.toLocaleString()}
                        </Text>
                        <Text
                          fontSize="11px"
                          fontWeight="700"
                          color="red.700"
                          ml={1}
                        >
                          {levelItems.totalVotes > 0
                            ? (
                                (levelItems.rejectedVotes /
                                  levelItems.totalVotes) *
                                100
                              ).toFixed(1)
                            : "0.0"}
                          %
                        </Text>
                      </Flex>
                    )}
                  </>
                )}
              </>
            )}
          </Box>
        </Box>
      )}

      <Box
        position="absolute"
        bottom={8}
        right={8}
        fontSize="10px"
        color="gray.400"
        bg="white"
        px={2}
        py={1}
        borderRadius="md"
        boxShadow="sm"
      >
        © OpenStreetMap / CartoDB
      </Box>
    </Box>
  );
}
