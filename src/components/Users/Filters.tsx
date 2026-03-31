import { Text, HStack, Select, createListCollection } from "@chakra-ui/react";
import React, { useMemo } from "react";
// import { useQuery } from '@tanstack/react-query'
import { omit } from "lodash";
// import { getOrganizations } from "@/services/Organizations";

export type FilterProps = {
  organizationId?: string;
};

type AFiltersProps = {
  filters: FilterProps;
  setFilters: (d: FilterProps) => void;
};

const Filters = ({ setFilters, filters }: AFiltersProps) => {
  // TODO: Restore when Organizations service is available
  // const { data } = useQuery({
  //   queryKey: ["organizations"],
  //   queryFn: async () => {
  //     return await getOrganizations();
  //   },
  // });

  const collection = useMemo(
    () =>
      createListCollection({
        items: [
          { value: "", label: "All" },
          // ...(data?.map((org: any) => ({ value: org.id, label: org.title })) || [])
        ],
      }),
    []
  );

  return (
    <HStack>
      <Text fontSize="sm">Organization</Text>
      <Select.Root
        collection={collection}
        size="xs"
        value={filters.organizationId ? [filters.organizationId] : []}
        onValueChange={(details) => {
          const value = details.value[0];
          if (value && value !== "") {
            setFilters({ ...filters, organizationId: value });
          } else {
            setFilters(omit(filters, ["organizationId"]));
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
