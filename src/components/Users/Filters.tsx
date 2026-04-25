import { Text, HStack, Select, createListCollection } from "@chakra-ui/react";
import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { omit } from "lodash";
import { getParties } from "@/services/Parties";

export type FilterProps = {
  partyId?: string;
};

type AFiltersProps = {
  filters: FilterProps;
  setFilters: (d: FilterProps) => void;
};

const Filters = ({ setFilters, filters }: AFiltersProps) => {
  const { data } = useQuery({
    queryKey: ["parties"],
    queryFn: getParties,
  });

  const collection = useMemo(
    () =>
      createListCollection({
        items: [
          { value: "", label: "All" },
          ...(data?.map((p: { id: string; name: string }) => ({
            value: p.id,
            label: p.name,
          })) || []),
        ],
      }),
    [data],
  );

  return (
    <HStack>
      <Text fontSize="sm">Party</Text>
      <Select.Root
        collection={collection}
        size="xs"
        value={filters.partyId ? [filters.partyId] : []}
        onValueChange={(details) => {
          const value = details.value[0];
          if (value && value !== "") {
            setFilters({ ...filters, partyId: value });
          } else {
            setFilters(omit(filters, ["partyId"]));
          }
        }}
      >
        <Select.Control>
          <Select.Trigger>
            <Select.ValueText placeholder="All" />
          </Select.Trigger>
        </Select.Control>
        <Select.Positioner>
          <Select.Content>
            {collection.items.map((item) => (
              <Select.Item key={item.value} item={item}>
                <Select.ItemText>{item.label}</Select.ItemText>
              </Select.Item>
            ))}
          </Select.Content>
        </Select.Positioner>
      </Select.Root>
    </HStack>
  );
};

export default Filters;
