"use client"

import { useEffect, useRef } from "react"
import { Box, Text, Flex } from "@chakra-ui/react"
import type { DrillDownResult, ChildResult } from "@/services/PublicResults"

type LcColors = { bg: string; color: string; border: string }

type Props = {
  data: DrillDownResult
  lc: LcColors
  onDrill: (childId: string) => void
}

// GeoJSON file + the property field that holds the entity name, per level
const LEVEL_GEO: Partial<Record<string, { path: string; nameKey: string }>> = {
  NATIONAL:     { path: "/geodata/ke_counties.geojson",       nameKey: "COUNTY_NAM" },
  COUNTY:       { path: "/geodata/ke_constituencies.geojson", nameKey: "CONSTITUEN" },
  CONSTITUENCY: { path: "/geodata/ke_wards.geojson",          nameKey: "NAME" },
}

/** Normalise a name for fuzzy matching (lowercase, collapse spaces, strip punctuation) */
function normaliseName(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9 ]/g, "").replace(/\s+/g, " ").trim()
}

/** Pick fill opacity based on leading candidate vote share (0.5 → 50% opacity, 1.0 → 100%) */
function opacityFromShare(pct: number) {
  // pct is 0-100; map 40–80% → 0.25–0.85 opacity
  return Math.min(0.85, Math.max(0.15, ((pct - 40) / 40) * 0.7 + 0.15))
}

export default function DrillMap({ data, lc, onDrill }: Props) {
  const mapRef = useRef<HTMLDivElement>(null)
  // keep a reference to the Leaflet map instance so we can destroy it on unmount
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const leafletRef = useRef<any>(null)

  const levelGeo = LEVEL_GEO[data.level]

  useEffect(() => {
    if (!mapRef.current || !levelGeo) return

    let cancelled = false
    let map: ReturnType<typeof import("leaflet")["map"]> | null = null

    async function init() {
      const L = (await import("leaflet")).default
      // Leaflet default icon paths break in Next.js — fix them
      // @ts-expect-error _getIconUrl exists at runtime
      delete L.Icon.Default.prototype._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      })

      if (cancelled || !mapRef.current) return

      // Build a lookup: normalised name → child result
      const childByName = new Map<string, ChildResult>()
      for (const child of data.children) {
        childByName.set(normaliseName(child.entityName), child)
      }

      if (!levelGeo) return
      const res = await fetch(levelGeo.path)
      if (!res.ok || cancelled) return
      const geojson = await res.json()

      if (cancelled || !mapRef.current) return

      map = L.map(mapRef.current, {
        zoomControl: true,
        attributionControl: false,
        scrollWheelZoom: false,
      })

      // Light grey basemap — no token required
      L.tileLayer("https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png", {
        maxZoom: 19,
        subdomains: "abcd",
      }).addTo(map)

      // Tooltip div (reused)
      const tooltip = L.tooltip({ permanent: false, direction: "auto", className: "drill-map-tip" })

      const geoLayer = L.geoJSON(geojson, {
        style: (feature) => {
          if (!feature) return {}
          const name = normaliseName(feature.properties?.[levelGeo.nameKey] ?? "")
          const child = childByName.get(name)
          if (!child) return { fillColor: "#e5e7eb", fillOpacity: 0.5, color: "#fff", weight: 1 }

          const leader = child.candidates[0]
          const total = child.candidates.reduce((s, c) => s + c.votes, 0)
          const pct = total > 0 ? (leader.votes / total) * 100 : 0
          return {
            fillColor: lc.border,
            fillOpacity: opacityFromShare(pct),
            color: "#fff",
            weight: 1,
          }
        },
        onEachFeature: (feature, layer) => {
          const rawName = feature.properties?.[levelGeo.nameKey] ?? ""
          const child = childByName.get(normaliseName(rawName))

          layer.on({
            mouseover(e) {
              const l = e.target
              l.setStyle({ weight: 2, color: lc.color, fillOpacity: Math.min(1, (l.options.fillOpacity ?? 0.5) + 0.15) })
              if (child) {
                const total = child.candidates.reduce((s, c) => s + c.votes, 0)
                const lines = child.candidates.slice(0, 3).map(
                  (c) => `${c.name}: ${total > 0 ? ((c.votes / total) * 100).toFixed(1) : 0}%`
                ).join("<br/>")
                tooltip.setContent(`<b>${rawName}</b><br/>${lines}`)
                tooltip.setLatLng(e.latlng)
                if (!tooltip.isOpen()) map!.openTooltip(tooltip)
              }
            },
            mouseout(e) {
              geoLayer.resetStyle(e.target)
              map!.closeTooltip(tooltip)
            },
            click() {
              if (child) onDrill(child.entityId)
            },
          })
        },
      }).addTo(map)

      // Fit map to the GeoJSON bounds
      const bounds = geoLayer.getBounds()
      if (bounds.isValid()) map.fitBounds(bounds, { padding: [12, 12] })

      leafletRef.current = map
    }

    init().catch(console.error)

    return () => {
      cancelled = true
      if (leafletRef.current) {
        leafletRef.current.remove()
        leafletRef.current = null
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.level, data.children, levelGeo])

  if (!levelGeo) {
    return (
      <Flex
        h="340px" borderRadius="2xl" bg="gray.50" borderWidth="1px" borderColor="gray.100"
        align="center" justify="center" direction="column" gap={2}
      >
        <Text fontSize="sm" color="gray.400">Map not available at stream level</Text>
      </Flex>
    )
  }

  return (
    <Box position="relative" borderRadius="2xl" overflow="hidden" borderWidth="1px" borderColor="gray.100">
      {/* Leaflet CSS — loaded once */}
      {/* eslint-disable-next-line @next/next/no-css-tags */}
      <style>{`
        @import url("https://unpkg.com/leaflet@1.9.4/dist/leaflet.css");
        .drill-map-tip { font-size: 12px; line-height: 1.5; }
      `}</style>
      <Box ref={mapRef} h="420px" w="full" />
      <Box
        position="absolute" bottom={3} right={3} fontSize="10px" color="gray.400"
        bg="white" px={2} py={1} borderRadius="md" boxShadow="sm"
      >
        © OpenStreetMap / CartoDB
      </Box>
    </Box>
  )
}
