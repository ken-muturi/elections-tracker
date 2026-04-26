"use client"

import "leaflet/dist/leaflet.css"
import { useEffect, useRef } from "react"
import { Box, Text, Flex } from "@chakra-ui/react"
import type { DrillDownResult, ChildResult } from "@/services/PublicResults"

type LcColors = { bg: string; color: string; border: string }

type Props = {
  data: DrillDownResult
  lc: LcColors
  colorMap: Map<string, string>
  onDrill: (childId: string) => void
}

const LEVEL_GEO: Partial<Record<string, { path: string; nameKey: string }>> = {
  NATIONAL:     { path: "/geodata/ke_counties.geojson",       nameKey: "COUNTY_NAM" },
  COUNTY:       { path: "/geodata/ke_constituencies.geojson", nameKey: "CONSTITUEN" },
  CONSTITUENCY: { path: "/geodata/ke_wards.geojson",          nameKey: "NAME" },
}

function normaliseName(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9 ]/g, "").replace(/\s+/g, " ").trim()
}

function opacityFromShare(pct: number) {
  // map 0–100% share → 0.25–0.85 opacity
  return Math.min(0.85, Math.max(0.25, (pct / 100) * 0.85))
}

export default function DrillMap({ data, lc, colorMap: colorById, onDrill }: Props) {
  const mapRef = useRef<HTMLDivElement>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const leafletRef = useRef<any>(null)

  const levelGeo = LEVEL_GEO[data.level]

  useEffect(() => {
    if (!mapRef.current || !levelGeo) return

    let cancelled = false
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let mapInstance: any = null

    async function init() {
      if (!levelGeo) return
      const L = (await import("leaflet")).default

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "/leaflet/marker-icon-2x.png",
        iconUrl: "/leaflet/marker-icon.png",
        shadowUrl: "/leaflet/marker-shadow.png",
      })

      if (cancelled || !mapRef.current) return

      const childByName = new Map<string, ChildResult>()
      for (const child of data.children) {
        childByName.set(normaliseName(child.entityName), child)
      }

      const res = await fetch(levelGeo.path)
      if (!res.ok || cancelled) return
      const geojson = await res.json()

      if (cancelled || !mapRef.current) return

      if (leafletRef.current) {
        leafletRef.current.remove()
        leafletRef.current = null
      }

      const map = L.map(mapRef.current, {
        zoomControl: true,
        attributionControl: false,
        scrollWheelZoom: false,
      })
      mapInstance = map
      leafletRef.current = map

      L.tileLayer("https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png", {
        maxZoom: 19,
        subdomains: "abcd",
      }).addTo(map)

      const tooltip = L.tooltip({ permanent: false, direction: "auto", className: "drill-map-tip" })

      const geoLayer = L.geoJSON(geojson, {
        style: (feature) => {
          if (!feature) return {}
          const name = normaliseName(feature.properties?.[levelGeo.nameKey] ?? "")
          const child = childByName.get(name)
          if (!child) return { fillColor: "#d1d5db", fillOpacity: 0.4, color: "#fff", weight: 1 }

          const leader = child.candidates[0]
          const total = child.candidates.reduce((s, c) => s + c.votes, 0)
          const pct = total > 0 ? (leader.votes / total) * 100 : 0
          const fill = leader ? (colorById.get(leader.candidateId) ?? "#d1d5db") : "#d1d5db"
          return {
            fillColor: fill,
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
              const fill = child?.candidates[0]
                ? (colorById.get(child.candidates[0].candidateId) ?? lc.color)
                : lc.color
              l.setStyle({ weight: 2.5, color: fill, fillOpacity: Math.min(1, (l.options.fillOpacity ?? 0.5) + 0.15) })
              if (child) {
                const total = child.candidates.reduce((s, c) => s + c.votes, 0)
                const lines = child.candidates.slice(0, 3).map(
                  (c) => `${c.name}: ${total > 0 ? ((c.votes / total) * 100).toFixed(1) : 0}%`
                ).join("<br/>")
                tooltip.setContent(`<b>${rawName}</b><br/>${lines}`)
                tooltip.setLatLng(e.latlng)
                if (!tooltip.isOpen()) map.openTooltip(tooltip)
              }
            },
            mouseout(e) {
              geoLayer.resetStyle(e.target)
              map.closeTooltip(tooltip)
            },
            click() {
              if (child) onDrill(child.entityId)
            },
          })
        },
      }).addTo(map)

      const bounds = geoLayer.getBounds()
      if (bounds.isValid()) map.fitBounds(bounds, { padding: [12, 12] })
    }

    init().catch(console.error)

    return () => {
      cancelled = true
      if (mapInstance) {
        mapInstance.remove()
        mapInstance = null
      }
      leafletRef.current = null
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.level, data.children, colorById, levelGeo])

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
      <style>{`.drill-map-tip { font-size: 12px; line-height: 1.5; }`}</style>
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
