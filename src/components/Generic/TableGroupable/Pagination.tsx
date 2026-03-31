import React from 'react';
import { Box, Button, HStack, IconButton, Input, Stack, Text } from '@chakra-ui/react';
import { Table } from '@tanstack/react-table';
import {
  HiChevronLeft,
  HiChevronDoubleLeft,
  HiChevronRight,
  HiChevronDoubleRight,
} from 'react-icons/hi';
import { dictionary } from './dictionary';
import { useUX } from '@/context/UXContext';

function Pagination<TData>({
  table,
  totalRows,
}: {
  totalRows: number;
  table: Table<TData>;
}) {
  const { translate } = useUX();
  if (!table.getPageCount()) return <></>;
  const steps = [5, 10, 20, 30, 40, 50, 100, 500, 'All'];

  return (
    <Stack gap={2} fontWeight="semibold" fontSize="xs" direction={{ base: "column", md: "row" }}>
        <HStack gap={2}>
          <Box>
            {table.getRowModel().rows.length.toLocaleString()} {translate(dictionary.of)}{' '}
            {totalRows.toLocaleString()} {translate(dictionary.items)}
          </Box>
          <Box>
            <select
              style={{
                fontSize: "12px",
                borderRadius: "8px",
                border: "1px solid #ccc",
                padding: "2px 4px"
              }}
              value={table.getState().pagination.pageSize}
              onChange={(e) => {
                const v =
                  e.target.value.toLowerCase() === 'all'
                    ? totalRows
                    : e.target.value;
                table.setPageSize(Number(v));
              }}
            >
              {steps.map(size => (
                <option key={size} value={size}>
                  {translate(dictionary.show)} {size}
                </option>
              ))}
            </select>
          </Box>
        </HStack>
        <HStack gap={2}>
          <HStack gap={2}>
            <IconButton
              variant="outline"
              size="xs"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
              aria-label={translate(dictionary.firstPage)}
            >
              <HiChevronDoubleLeft />
            </IconButton>
            <Button
              variant="outline"
              size="xs"
              aria-label={translate(dictionary.previousPage)}
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <HiChevronLeft />
              {translate(dictionary.prev)}
            </Button>
            <Button
              variant="outline"
              aria-label={translate(dictionary.nextPage)}
              size="xs"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              {translate(dictionary.next)}
              <HiChevronRight />
            </Button>
            <IconButton
              variant="outline"
              size="xs"
              aria-label={translate(dictionary.lastPage)}
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
            >
              <HiChevronDoubleRight />
            </IconButton>
          </HStack>
          {/* <Box>
          Page{' '}
          <strong>
            {table.getState().pagination.pageIndex + 1} of{' '}
            {table.getPageCount().toLocaleString()}
          </strong>
        </Box> */}
          <HStack gap="1">
            <Box>{translate(dictionary.page)}:</Box>
            <Box>
              <Input
                w="30px"
                borderRadius="lg"
                size="xs"
                type="number"
              defaultValue={table.getState().pagination.pageIndex + 1}
                onChange={e => {
                  const page = e.target.value ? Number(e.target.value) - 1 : 0;
                  table.setPageIndex(page);
                }}
              />
            </Box>
            <Text>{translate(dictionary.of)}:</Text>
            <Text>{table.getPageCount().toLocaleString()}</Text>
          </HStack>
        </HStack>
    </Stack>
  );
}

export default Pagination;
