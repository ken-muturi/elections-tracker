'use client';

import React, { useState } from "react";
import {
  HStack,
  Accordion,
  Box,
  IconButton,
  Icon,
  createToaster,
} from "@chakra-ui/react";
import { FaTimes } from "react-icons/fa";
import { useUX } from "@/context/UXContext";
import { dictionary } from "./dictionary";
import { UnitWithRelation } from "./type";
import Questions from "../Questions";
import { TbSection } from "react-icons/tb";
import { useQueryClient } from "@tanstack/react-query";
import { deleteUnit, updatUnitOrder } from "@/services/Units";
import { handleReturnError } from "@/db/error-handling";
import { Reorder } from "framer-motion";
import AddEditUnitModal from "./AddEditUnitModal";
import { values } from "lodash";

const Details = ({
  units: initialUnits,
  sectionId,
}: {
  sectionId: string;
  units: UnitWithRelation[];
}) => {
  const toaster = createToaster({
    placement: "top-end",
  });
  const { translate } = useUX();
  const queryClient = useQueryClient();
  const units = (initialUnits || []).sort((a, b) => a.sortOrder - b.sortOrder);
  const [sortableUnits, setSortableUnits] = useState(units);
  const [expanded, setExpanded] = useState<string[]>(units.map((u) => u.id));

  const handleDeleteUnit = async (unitId: string) => {
    try {
      await deleteUnit(unitId);
      await queryClient.refetchQueries({ queryKey: ["sections"] });
      toaster.success({
        title: translate(dictionary.success),
      });
    } catch (error) {
      const message = handleReturnError(error);
      toaster.error({
        title: translate(dictionary.error),
        description: message,
      });
    }
  };

  const handleReorder = async (newOrder: UnitWithRelation[]) => {
    try {
      setSortableUnits(newOrder);

      // Only triggered on drag stop - update the order
      const sortedUnits = newOrder.map((unit, idx) => ({
        id: unit.id,
        sortOrder: idx,
      }));
      await updatUnitOrder(sortedUnits);
    } catch (error) {
      const message = handleReturnError(error);
      toaster.error({
        title: translate(dictionary.error),
        description: message,
      });
    }
  };

  return (
    <Reorder.Group
      axis="y"
      values={sortableUnits}
      onReorder={handleReorder} // Only triggers on drag stop when order changes
      style={{ listStyle: "none", padding: 0, margin: 0 }}
    >
      <Accordion.Root
        multiple
        value={expanded}
        onValueChange={(details) => setExpanded(details.value)}
      >
        {(sortableUnits || []).map((unit) => (
          <Reorder.Item
            key={unit.id}
            value={unit}
            style={{ marginBottom: "8px" }}
            whileDrag={{
              scale: 1.02,
              boxShadow: "2xl",
              zIndex: 1000,
            }}
            whileTap={{ scale: 0.98 }}
            transition={{ duration: 0.2 }}
          >
            <Accordion.Item
              key={unit.id}
              value={unit.id}
              borderWidth="0px"
              borderBottomWidth="thin"
            >
              <HStack
                pr={2}
                w="full"
                {...(expanded.includes(unit.id)
                  ? {
                      bg: "green.600",
                      borderRadius: "none",
                    }
                  : {})}
              >
                <Accordion.ItemTrigger p={1}>
                  <HStack textAlign="left">
                    <Icon
                      size="lg"
                      fontWeight="bold"
                      verticalAlign="middle"
                      fontSize="md"
                      color={expanded.includes(unit.id) ? "black" : "green.600"}
                    >
                      <TbSection />
                    </Icon>
                    <Box fontSize="sm">
                      <>
                        {translate(dictionary.unit)}:{" "}
                        {translate(
                          unit.title as PrismaJson.PartialTranslation[]
                        )}
                      </>
                    </Box>
                  </HStack>
                  <Accordion.ItemIndicator />
                </Accordion.ItemTrigger>
                <AddEditUnitModal sectionId={sectionId} data={unit} />
                <IconButton
                  variant="ghost"
                  disabled={unit.questions && unit.questions.length > 0}
                  size="xs"
                  aria-label={translate(dictionary.deleteUnit)}
                  onClick={async () => {
                    await handleDeleteUnit(unit.id);
                  }}
                >
                  <FaTimes />
                </IconButton>
              </HStack>
              <Accordion.ItemContent
                p={4}
                {...(expanded.includes(unit.id)
                  ? {
                      borderWidth: "thin",
                      borderColor: "green.600",
                      borderRadius: "none",
                    }
                  : {})}
              >
                <Box fontStyle="italic" fontWeight="300" mb={2} fontSize="sm">
                  {translate(
                    unit.description as PrismaJson.PartialTranslation[]
                  )}
                </Box>
                <Questions questions={unit.questions || []} unitId={unit.id} />
              </Accordion.ItemContent>
            </Accordion.Item>
          </Reorder.Item>
        ))}
      </Accordion.Root>
      <AddEditUnitModal sectionId={sectionId} />
    </Reorder.Group>
  );
};

export default Details