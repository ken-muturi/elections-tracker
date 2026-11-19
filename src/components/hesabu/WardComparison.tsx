"use client"

import { useState } from "react"
import { Box, Text, SimpleGrid } from "@chakra-ui/react"
import { CountyFull } from "@/services/Hesabu"
import { WardCard } from "./WardCard"
import { EquityAlert } from "./EquityAlert"
import { CountyWideCard } from "./CountyWideCard"
import { ProjectDrawer } from "./ProjectDrawer"
import { ProjectCardSummary } from "./project-format"

type Props = {
  county: CountyFull
  countyCode: string
  fiscalYear: string
  projectSummary: ProjectCardSummary[]
}

export const WardComparison = ({ county, countyCode, fiscalYear, projectSummary }: Props) => {
  const [drawer, setDrawer] = useState<{ cardName: string | null; label: string } | null>(null)
  const byCard = new Map(projectSummary.map((s) => [s.cardName, s]))

  return (
    <Box>
      <Text fontWeight="bold" color="gray.700" fontSize="md" mb={4}>
        Ward-by-Ward Project Delivery
      </Text>

      <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={4} mb={6}>
        {county.wards.map((ward) => (
          <WardCard
            key={ward.id}
            ward={ward}
            projects={byCard.get(ward.name)}
            onOpenProjects={() => setDrawer({ cardName: ward.name, label: ward.name })}
          />
        ))}
        <CountyWideCard
          summary={byCard.get(null)}
          onOpen={() => setDrawer({ cardName: null, label: "County-wide / location not stated" })}
        />
      </SimpleGrid>

      <EquityAlert wards={county.wards} countyName={county.name} />

      <ProjectDrawer
        open={drawer !== null}
        onClose={() => setDrawer(null)}
        countyCode={countyCode}
        fiscalYear={fiscalYear}
        cardName={drawer?.cardName ?? null}
        label={drawer?.label ?? ""}
      />
    </Box>
  )
}
