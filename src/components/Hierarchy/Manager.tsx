"use client"

import { Box, Tabs } from "@chakra-ui/react"
import { FiMapPin, FiLayers, FiMap } from "react-icons/fi"
import Counties from "./Counties"
import Constituencies from "./Constituencies"
import Wards from "./Wards"
import { Election } from "./types"

export default function HierarchyManager({ elections }: { elections: Election[] }) {
  return (
    <Box bg="white" borderRadius="xl" borderWidth="1px" borderColor="gray.100"
      boxShadow="0 1px 3px 0 rgba(0,0,0,0.06)" overflow="hidden">
      <Tabs.Root defaultValue="counties">
        <Tabs.List px={4} borderBottomWidth="1px" borderBottomColor="gray.100" bg="#f8fafc">
          <Tabs.Trigger value="counties" fontSize="sm" fontWeight="600">
            <FiMapPin /> Counties
          </Tabs.Trigger>
          <Tabs.Trigger value="constituencies" fontSize="sm" fontWeight="600">
            <FiLayers /> Constituencies
          </Tabs.Trigger>
          <Tabs.Trigger value="wards" fontSize="sm" fontWeight="600">
            <FiMap /> Wards
          </Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content value="counties" p={5}><Counties /></Tabs.Content>
        <Tabs.Content value="constituencies" p={5}><Constituencies /></Tabs.Content>
        <Tabs.Content value="wards" p={5}><Wards elections={elections} /></Tabs.Content>
      </Tabs.Root>
    </Box>
  )
}
