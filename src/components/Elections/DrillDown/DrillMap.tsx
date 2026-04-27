"use client"

import "leaflet/dist/leaflet.css"
import { useEffect, useRef, useState } from "react"
import { Box, Text, Flex } from "@chakra-ui/react"
import type { DrillDownResult, ChildResult } from "@/services/PublicResults"
import { getIEBCFormRef, LEVEL_LABEL } from "../constants"

type LcColors = { bg: string; color: string; border: string }

type Props = {
  data: DrillDownResult
  lc: LcColors
  colorMap: Map<string, string>
  onDrill: (childId: string) => void
}

const LEVEL_GEO: Partial<Record<string, { path: string; nameKey: string }>> = {
  NATIONAL: { path: "/geodata/ke_counties.geojson", nameKey: "COUNTY_NAM" },
  COUNTY: { path: "/geodata/ke_constituencies.geojson", nameKey: "CONSTITUEN" },
  // WARD level intentionally omitted — DB ward names ("Changamwe Ward 1") don't
  // correspond to IEBC geojson ward names ("BARTABWA") so the map would be empty.
};

function normaliseName(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9 ]/g, "").replace(/\s+/g, " ").trim()
}

function opacityFromShare(pct: number) {
  // map 0–100% share → 0.25–0.85 opacity
  return Math.min(0.85, Math.max(0.25, (pct / 100) * 0.85))
}

export default function DrillMap({
  data,
  lc,
  colorMap: colorById,
  onDrill,
}: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const leafletRef = useRef<any>(null);
  // Saved center/zoom from the previous map instance — restored on next init
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const savedViewRef = useRef<{ center: any; zoom: number } | null>(null);

  const levelGeo = LEVEL_GEO[data.level];

  useEffect(() => {
    if (!mapRef.current || !levelGeo) return;

    let cancelled = false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let mapInstance: any = null;

    async function init() {
      if (!levelGeo) return;
      const L = (await import("leaflet")).default;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "/leaflet/marker-icon-2x.png",
        iconUrl: "/leaflet/marker-icon.png",
        shadowUrl: "/leaflet/marker-shadow.png",
      });

      if (cancelled || !mapRef.current) return;

      const childByName = new Map<string, ChildResult>();
      for (const child of data.children) {
        childByName.set(normaliseName(child.entityName), child);
      }

      const res = await fetch(levelGeo.path);
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
          const name = normaliseName(
            feature.properties?.[levelGeo.nameKey] ?? "",
          );
          const child = childByName.get(name);
          if (!child)
            return {
              fillColor: "#d1d5db",
              fillOpacity: 0.4,
              color: "#fff",
              weight: 1,
            };

          const leader = child.candidates[0];
          const total = child.candidates.reduce((s, c) => s + c.votes, 0);
          const pct = total > 0 ? (leader.votes / total) * 100 : 0;
          const fill = leader
            ? (colorById.get(leader.candidateId) ?? "#d1d5db")
            : "#d1d5db";
          return {
            fillColor: fill,
            fillOpacity: opacityFromShare(pct),
            color: "#fff",
            weight: 1,
          };
        },
        onEachFeature: (feature, layer) => {
          const rawName = feature.properties?.[levelGeo.nameKey] ?? "";
          const child = childByName.get(normaliseName(rawName));
          if (child) matchedLayers.push(layer);

          layer.on({
            mouseover(e) {
              const l = e.target;
              const fill = child?.candidates[0]
                ? (colorById.get(child.candidates[0].candidateId) ?? lc.color)
                : lc.color;
              l.setStyle({
                weight: 2.5,
                color: fill,
                fillOpacity: Math.min(1, (l.options.fillOpacity ?? 0.5) + 0.15),
              });
              if (child) {
                const total = child.candidates.reduce((s, c) => s + c.votes, 0);
                const lines = child.candidates
                  .slice(0, 3)
                  .map((c) => {
                    const party = c.party ? ` (${c.party})` : "";
                    return `${c.name}${party}: ${total > 0 ? ((c.votes / total) * 100).toFixed(1) : 0}%`;
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
              if (child) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const bounds = (e.target as any).getBounds();
                if (bounds?.isValid()) {
                  map.flyToBounds(bounds, { padding: [40, 40], duration: 0.5 });
                  setTimeout(() => {
                    // Capture the zoomed-in view so the next map init restores it
                    savedViewRef.current = {
                      center: map.getCenter(),
                      zoom: map.getZoom(),
                    };
                    onDrill(child.entityId);
                  }, 520);
                } else {
                  onDrill(child.entityId);
                }
              }
            },
          });
        },
      }).addTo(map);

      if (savedViewRef.current) {
        // Restore the pan/zoom the user was at when they clicked through
        map.setView(savedViewRef.current.center, savedViewRef.current.zoom, {
          animate: false,
        });
        savedViewRef.current = null;
      } else {
        // Fit to matched entities only; fall back to full layer
        const matchedGroup = matchedLayers.length > 0
          ? L.featureGroup(matchedLayers)
          : geoLayer;
        const fitTarget = matchedGroup.getBounds();
        if (fitTarget.isValid()) map.fitBounds(fitTarget, { padding: [24, 24] });
      }
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
  }, [data.level, data.children, colorById, levelGeo]);

  if (!levelGeo) {
    return (
      <Flex
        h="340px"
        borderRadius="2xl"
        bg="gray.50"
        borderWidth="1px"
        borderColor="gray.100"
        align="center"
        justify="center"
        direction="column"
        gap={2}
      >
        <Text fontSize="sm" color="gray.400">
          Map not available at stream level
        </Text>
      </Flex>
    );
  }

  const formRef = getIEBCFormRef(data.positionType, data.level);
  const isPresidential = data.positionType.toUpperCase() === "PRESIDENT";
  const isNationalView = data.level === "NATIONAL";

  // National non-presidential: one row per child entity showing local winner
  const childWinnerRows = (!isPresidential && isNationalView)
    ? data.children
        .filter((c) => c.candidates.length > 0 && c.candidates[0].votes > 0)
        .sort((a, b) => b.candidates[0].votes - a.candidates[0].votes)
        .map((child) => {
          const leader = child.candidates[0];
          const pct = child.totalVotes > 0 ? (leader.votes / child.totalVotes * 100).toFixed(1) : "0.0";
          return {
            entityName: child.entityName,
            name: leader.name,
            party: leader.party ?? "",
            color: colorById.get(leader.candidateId) ?? "#d1d5db",
            votes: leader.votes.toLocaleString(),
            pct,
          };
        })
    : null;

  // Aggregate legend rows for presidential or drilled-in views
  const legendItems = (isPresidential || !isNationalView)
    ? data.candidates
        .filter((c) => c.votes > 0)
        .slice(0, 5)
        .map((c) => ({
          name: c.name,
          party: c.party ?? "",
          color: colorById.get(c.candidateId) ?? "#d1d5db",
          votes: c.votes.toLocaleString(),
          pct: data.totalVotes > 0 ? (c.votes / data.totalVotes * 100).toFixed(1) : "0.0",
        }))
    : [];

  // Build level-aggregate rows for the collapsible (from entered/declared votes)
  const levelItems = (() => {
    const ev = data.enteredVotes;
    if (!ev || ev.totalVotes == null || ev.candidates.length === 0) return null;
    const total = ev.totalVotes;
    const rows = data.candidates
      .filter((c) => c.votes > 0)
      .slice(0, 5)
      .map((c) => {
        const entered = ev.candidates.find((e) => e.candidateId === c.candidateId);
        const v = entered?.votes ?? 0;
        return {
          name: c.name,
          party: c.party ?? "",
          color: colorById.get(c.candidateId) ?? "#d1d5db",
          votes: v.toLocaleString(),
          pct: total > 0 ? (v / total * 100).toFixed(1) : "0.0",
        };
      });
    return { rows, rejectedVotes: ev.rejectedVotes ?? 0, totalVotes: total };
  })();

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const [resultsOpen, setResultsOpen] = useState(true);

  return (
    <Box position="relative" overflow="hidden" px={4} pb={4} pt={3}>
      <style>{`.drill-map-tip { font-size: 12px; line-height: 1.5; }`}</style>
      <Box
        ref={mapRef}
        h="calc(100vh - 280px)"
        minH="440px"
        w="full"
        borderRadius="xl"
        overflow="hidden"
      />

      {/* ── Legend ── */}
      {(legendItems.length > 0 || (childWinnerRows && childWinnerRows.length > 0)) && (
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
          maxW="280px"
          maxH="calc(100vh - 320px)"
          display="flex"
          flexDirection="column"
        >
          {/* Title */}
          <Text fontSize="11px" fontWeight="700" color="gray.600" mb={2} flexShrink={0}>
            {isPresidential || !isNationalView
              ? `${LEVEL_LABEL[data.level] ?? data.level}: Stream Aggregate — ${data.totalVotes.toLocaleString()} votes`
              : `${LEVEL_LABEL[data.level] ?? data.level}: Winning Candidates`}
          </Text>

          {/* Scrollable body */}
          <Box overflowY="auto" flex={1}
            css={{ "&::-webkit-scrollbar": { width: "4px" }, "&::-webkit-scrollbar-thumb": { background: "#d1d5db", borderRadius: "4px" } }}
          >
          {/* Presidential / drilled-in: aggregate top-5 */}
          {(isPresidential || !isNationalView) && legendItems.map((item) => (
            <Flex key={item.name} align="center" gap={2} mb={1} _last={{ mb: 0 }}>
              <Box w={3} h={3} borderRadius="sm" flexShrink={0} bg={item.color} />
              <Text fontSize="11px" fontWeight="600" color="gray.700" flex={1} lineClamp={1}>
                {item.name}
                {item.party ? <Text as="span" fontWeight="400" color="gray.400"> ({item.party})</Text> : null}
              </Text>
              <Text fontSize="11px" color="gray.500" ml={1}>{item.votes}</Text>
              <Text fontSize="11px" fontWeight="700" color="gray.800" ml={1}>{item.pct}%</Text>
            </Flex>
          ))}

          {/* National non-presidential: one row per entity with local winner */}
          {!isPresidential && isNationalView && (childWinnerRows ?? []).map((row) => (
            <Flex key={row.entityName} align="center" gap={2} mb={1} _last={{ mb: 0 }}>
              <Box w={2.5} h={2.5} borderRadius="sm" flexShrink={0} bg={row.color} mt="1px" />
              <Text fontSize="11px" color="gray.500" flexShrink={0} mr={0.5}>{row.entityName}</Text>
              <Text fontSize="11px" fontWeight="600" color="gray.700" flex={1} lineClamp={1}>
                {row.name}
                {row.party ? <Text as="span" fontWeight="400" color="gray.400"> ({row.party})</Text> : null}
              </Text>
              <Text fontSize="11px" fontWeight="700" color="gray.800" ml={1}>{row.pct}%</Text>
            </Flex>
          ))}
          {/* Collapsible level-aggregate results */}
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
          </Box>{/* end scrollable body */}
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
