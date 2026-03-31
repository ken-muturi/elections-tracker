import React, { useEffect, useState } from 'react';
import { Column, Table } from '@tanstack/react-table';

import DebouncedInput from '../DebouncedInput';
import DebouncedSearch from '../DebouncedInput/search';
import { flattenDeep, uniq } from 'lodash';
import { Box, HStack, Icon } from '@chakra-ui/react';
import { GrSearch } from 'react-icons/gr';
import DebouncedSelect from '../DebouncedInput/Select';
import { useUX } from '@/context/UXContext';
import { dictionary } from './dictionary';

const Filter = function <TData>({
  column: columnDef,
  table,
  globalFilter,
  setGlobalFilter,
}: {
  column?: Column<TData>;
  globalFilter?: string;
  setGlobalFilter?: (search: string) => void;
  table: Table<TData>;
}) {
  const { translate } = useUX();
  const [column, setColumn] = useState(columnDef);

  useEffect(() => {
    setColumn(columnDef);
  }, [columnDef]);

  if (!column && setGlobalFilter) {
    return (
      <Box w="full" px="1">
        <DebouncedSearch
          title=""
          autoFocus={true}
          borderRadius="lg"
          height="32px"
          debounce={0}
          value={globalFilter ?? ''}
          onChange={(value) => { setGlobalFilter(value as string) }}
          placeholder={translate(dictionary.allColumns)}
          closeButton={true}
        />
      </Box>
    );
  }

  if (column) {
    const firstValue = table
      .getPreFilteredRowModel()
      .flatRows[0]?.getValue(column.id);

    const columnFilterValue = column.getFilterValue();
    const sortedUniqueValues =
      typeof firstValue === 'number'
        ? []
        : uniq(
          flattenDeep(Array.from(column.getFacetedUniqueValues().keys()))
        ).sort();

    const title = (column.columnDef.header ?? '') as string;
    // console.log({ title })

    return (
      <HStack gap="0" w="full">
        {typeof firstValue === 'number' ? (
          <HStack
            gap="2"
            px={2}
            py={1}
            borderWidth="1px"
            borderRadius="lg"
            w="full"
          >
            <Box fontWeight="medium">
              <Icon mr={2} as={GrSearch} size="sm" color="gray.700" />
              {(column.columnDef.header ?? '') as string}{' '}
            </Box>
            <DebouncedInput
              debounce={0}
              size="lg"
              type="number"
              width={100}
              min={Number(column.getFacetedMinMaxValues()?.[0] ?? '')}
              max={Number(column.getFacetedMinMaxValues()?.[1] ?? '')}
              value={(columnFilterValue as [number, number])?.[0] ?? ''}
              onChange={value =>
                column.setFilterValue((old: [number, number]) => [
                  value,
                  old?.[1],
                ])
              }
              placeholder={`${translate(dictionary.min)} ${column.getFacetedMinMaxValues()?.[0]
                  ? `(${column.getFacetedMinMaxValues()?.[0]})`
                  : ''
                }`}
            />
            <DebouncedInput
              debounce={0}
              size="xs"
              type="number"
              width={100}
              min={Number(column.getFacetedMinMaxValues()?.[0] ?? '')}
              max={Number(column.getFacetedMinMaxValues()?.[1] ?? '')}
              value={(columnFilterValue as [number, number])?.[1] ?? ''}
              onChange={value =>
                column.setFilterValue((old: [number, number]) => [
                  old?.[0],
                  value,
                ])
              }
              placeholder={`${translate(dictionary.max)} ${column.getFacetedMinMaxValues()?.[1]
                  ? `(${column.getFacetedMinMaxValues()?.[1]})`
                  : ''
                }`}
            />
          </HStack>
        ) : (
          <DebouncedSelect
            debounce={0}
            clearColumns={() => {
              setColumn(undefined);
            }}
            options={sortedUniqueValues
              .slice(0, 5000)
              .map(d => ({ value: d, label: d }))}
            title={title}
            value={Array.from((columnFilterValue as unknown[]) || []).map(
              d => ({ value: d as string, label: d as string })
            )}
            onChange={value => column.setFilterValue(value)}
            placeholder={`${translate(dictionary.search)} ${title} (${column.getFacetedUniqueValues().size
              })`}
          />
        )}
      </HStack>
    );
  }
  return <></>;
};

export default Filter;