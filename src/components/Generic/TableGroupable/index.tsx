/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { ReactNode, useCallback, useMemo, useState } from 'react';
import {
  Column,
  ColumnDef,
  ColumnFiltersState,
  ExpandedState,
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  getFacetedMinMaxValues,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getGroupedRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  GroupingState,
  PaginationState,
  SortingState,
  useReactTable,
  VisibilityState,
} from '@tanstack/react-table';

import {
  Box,
  Button,
  Center,
  HStack,
  Icon,
  IconButton,
  IconButtonProps,
  Menu,
  Portal,
  Spacer,
  Spinner,
  Stack,
  Table,
  Text,
  VStack,
} from "@chakra-ui/react";
import { GrClose, GrHide, GrTree } from "react-icons/gr";
import { FaCaretDown, FaCaretRight } from "react-icons/fa";
import { IconType } from "react-icons";
import { HiOutlineBarsArrowDown, HiOutlineBarsArrowUp } from "react-icons/hi2";

import Pagination from "./Pagination";
import Filter from "./Filter";
import {
  ExportToCSV,
  ExportToPDF,
  getCommonPinningStyles,
  getFilterFunctions,
  getTableDataForExport,
} from "./utils";
import { MdKeyboardArrowDown, MdDownload } from "react-icons/md";
import { FiFilter } from "react-icons/fi";
import { HiEyeOff } from "react-icons/hi";
import { dictionary } from "./dictionary";
import { useUX } from "@/context/UXContext";

interface HeaderButtonProps extends IconButtonProps {
  iconObj: IconType;
}

export type ColumnProps = {
  onItemSelect: (id: string | number, selected: boolean) => void;
};

const HeaderButton = ({ iconObj, ...rest }: HeaderButtonProps) => (
  <IconButton variant="ghost" size="md" {...rest}>
    <Icon as={iconObj} />
  </IconButton>
);

const Loader = () => (
  <Box>
    <Center>
      <Spinner size="xl" />
    </Center>
  </Box>
);

export function TableGroupable<TData>({
  data,
  title,
  headingContent,
  columnInfo,
  advancedSearchButton,
  exportCsv = false,
  exportPdf = false,
  searchable = true,
  expandedRows = false,
  defaultGrouping = [],
  stickyColumns = [],
  visibleColumns = {},
  pageSize = 100,
  showGroupCount = true,
  loading = false,
  scrollable = true,
}: {
  title?: ReactNode;
  headingContent?: ReactNode;
  data: TData[];
  columnInfo: ColumnDef<TData>[];
  exportCsv?: boolean;
  exportPdf?: boolean;
  searchable?: boolean;
  expandedRows?: boolean;
  defaultGrouping?: string[];
  stickyColumns?: string[];
  visibleColumns?: VisibilityState;
  pageSize?: number;
  showGroupCount?: boolean;
  loading?: boolean;
  scrollable?: boolean;
  advancedSearchButton?: ReactNode;
}) {
  const { translate } = useUX();
  const columns = useMemo<ColumnDef<TData>[]>(
    () =>
      columnInfo.map((d) => {
        return d.enableColumnFilter === false
          ? d
          : { ...d, filterFn: "multiSelectFilter" };
      }),
    [columnInfo]
  );

  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0, //initial page index
    pageSize,
  });

  const [columnPinning] = useState({
    left: stickyColumns,
    right: [],
  });
  const [grouping, setGrouping] = useState<GroupingState>(defaultGrouping);

  const [expanded, setExpanded] = useState<ExpandedState>(expandedRows || {});
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] =
    useState<VisibilityState>(visibleColumns);
  const [globalFilter, setGlobalFilter] = useState("");
  const [columnToFilter, setColumnToFilter] = useState<
    Column<TData> | undefined
  >(undefined);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  // const [, setHoveredColumn] = useState<number | undefined>(undefined);
  const { fuzzyFilter, multiSelectFilter } = getFilterFunctions<TData>();

  // const stableDefaultGrouping = useMemo(() => defaultGrouping, [defaultGrouping]);
  const stableVisibleColumns = useMemo(() => visibleColumns, [visibleColumns]);
  // const stablePagination = useMemo(() => pagination, [pagination]);
  const stableColumnPinning = useMemo(() => columnPinning, [columnPinning]);

  const onExpandedChange = useCallback((d: any) => {
    if (typeof d === "function") {
      setExpanded(d);
    }
  }, []);

  console.log("...table rendering ...");

  const table = useReactTable({
    data,
    columns,
    state: {
      grouping,
      expanded,
      sorting,
      columnFilters,
      globalFilter,
      columnVisibility,
      pagination,
      columnPinning: stableColumnPinning,
    },
    onExpandedChange,
    onPaginationChange: setPagination,
    onGlobalFilterChange: setGlobalFilter,
    onSortingChange: setSorting,
    onGroupingChange: setGrouping,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getFacetedMinMaxValues: getFacetedMinMaxValues(),
    getExpandedRowModel: getExpandedRowModel(),
    getGroupedRowModel: getGroupedRowModel(),
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    // debugTable: true,
    filterFns: {
      fuzzy: fuzzyFilter,
      multiSelectFilter,
    },
    globalFilterFn: fuzzyFilter,
    enableSubRowSelection: true,
    enableRowSelection: true,
    enableMultiRowSelection: true,
  });

  const renderTable = (
    <Table.Root size="sm" stickyHeader>
      <Table.Header>
        {table.getHeaderGroups().map((headerGroup, hgindex) => (
          <Table.Row key={hgindex} bg="bg.subtle">
            {headerGroup.headers.map((header, hindex) => {
              return (
                <Table.ColumnHeader
                  key={hindex}
                  className={header.column?.id ?? ""}
                  colSpan={header.colSpan}
                  style={{ ...getCommonPinningStyles(header.column) }}
                >
                  {header.isPlaceholder ? null : (
                    <HStack gap={0} w="full">
                      {header.column.getCanGroup() &&
                        header.column.getIsGrouped() && (
                          // If the header can be grouped, let's add a toggle
                          <HeaderButton
                            iconObj={GrClose}
                            onClick={header.column.getToggleGroupingHandler()}
                            aria-label={translate(dictionary.removeGrouping)}
                          />
                        )}
                      <Box
                        // flex={1}
                        cursor="pointer"
                        onClick={header.column.getToggleSortingHandler()}
                        _hover={{
                          textDecoration: header.column.getCanSort()
                            ? "underline"
                            : "inherit",
                        }}
                        // fontSize="xs"
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                      </Box>
                      <Spacer />
                      {header.column.getIsSorted() && (
                        <Box>
                          {{
                            asc: <HiOutlineBarsArrowDown />,
                            desc: <HiOutlineBarsArrowUp />,
                          }[header.column.getIsSorted() as string] ?? null}
                        </Box>
                      )}
                      {header.column.getIsFiltered() &&
                        columnToFilter === header.column && (
                          <Box>
                            <FiFilter />
                          </Box>
                        )}

                      {(header.column.getCanFilter() ||
                        header.column.getCanGroup() ||
                        header.column.getCanHide()) && (
                        <Menu.Root>
                          <Menu.Trigger asChild>
                            <IconButton
                              size="xs"
                              aria-label={translate(dictionary.options)}
                              variant="ghost"
                            >
                              <MdKeyboardArrowDown />
                            </IconButton>
                          </Menu.Trigger>
                          <Portal>
                            <Menu.Positioner>
                              <Menu.Content>
                                {header.column.getCanFilter() && (
                                  <Menu.Item
                                    value="toggle-filter"
                                    onClick={() => {
                                      if (header.column.getIsFiltered()) {
                                        setColumnFilters([]);
                                        setColumnToFilter(undefined);
                                        setGlobalFilter("");
                                      } else {
                                        setColumnToFilter(header.column);
                                      }
                                    }}
                                  >
                                    {header.column.getIsFiltered() &&
                                    columnToFilter === header.column ? (
                                      <HiEyeOff />
                                    ) : (
                                      <FiFilter />
                                    )}
                                    {header.column.getIsFiltered()
                                      ? translate(dictionary.clearFilter)
                                      : translate(dictionary.filter)}
                                  </Menu.Item>
                                )}
                                {header.column.getCanGroup() && (
                                  <Menu.Item
                                    value="toggle-grouping"
                                    onClick={header.column.getToggleGroupingHandler()}
                                  >
                                    <GrTree />
                                    {translate(dictionary.group)}
                                  </Menu.Item>
                                )}
                                {header.column.getCanHide() && (
                                  <>
                                    <Menu.Separator />
                                    <Menu.Item
                                      value="hide-column"
                                      onClick={header.column.getToggleVisibilityHandler()}
                                    >
                                      <GrHide />
                                      {translate(dictionary.hideColumn)}
                                    </Menu.Item>
                                  </>
                                )}
                              </Menu.Content>
                            </Menu.Positioner>
                          </Portal>
                        </Menu.Root>
                      )}
                    </HStack>
                  )}
                </Table.ColumnHeader>
              );
            })}
          </Table.Row>
        ))}
      </Table.Header>
      <Table.Body>
        {loading || data.length === 0 ? (
          <Table.Row>
            <Table.Cell colSpan={columnInfo.length}>
              {loading ? (
                <Loader />
              ) : (
                <Text>{translate(dictionary.noRecordsFound)}</Text>
              )}
            </Table.Cell>
          </Table.Row>
        ) : (
          table.getRowModel().rows.map((row, rindex) => {
            return (
              <Table.Row key={rindex}>
                {row.getVisibleCells().map((cell, cindex) => {
                  const hasMeta = cell.getContext().cell.column.columnDef.meta;
                  return (
                    <Table.Cell
                      // fontSize="xs"
                      key={cindex}
                      className={`${cell.column.id ?? ""}`}
                      style={{ ...getCommonPinningStyles(cell.column) }}
                      {...(hasMeta && {
                        ...hasMeta.getCellContext(cell.getContext()),
                      })}
                    >
                      {cell.getIsGrouped() ? (
                        // If it's a grouped cell, add an expander and row count
                        <HStack>
                          <HeaderButton
                            iconObj={
                              row.getIsExpanded() ? FaCaretDown : FaCaretRight
                            }
                            onClick={row.getToggleExpandedHandler()}
                            aria-label={translate(dictionary.expandCollapse)}
                          />
                          <Text fontWeight="bold">
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext()
                            )}
                            {showGroupCount && (
                              <>&nbsp; ({row.subRows.length}) </>
                            )}
                          </Text>
                        </HStack>
                      ) : cell.getIsAggregated() ? (
                        // If the cell is aggregated, use the Aggregated
                        // renderer for cell
                        flexRender(
                          cell.column.columnDef.aggregatedCell ??
                            cell.column.columnDef.cell,
                          cell.getContext()
                        )
                      ) : cell.getIsPlaceholder() ? null : ( // For cells with repeated values, render null
                        // Otherwise, just render the regular cell
                        flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )
                      )}
                    </Table.Cell>
                  );
                })}
              </Table.Row>
            );
          })
        )}
      </Table.Body>
    </Table.Root>
  );

  return (
    <VStack w="full" alignItems="left" gap={2}>
      <Stack w="full" direction={{ base: "column", md: "row" }}>
        {title && (
          <Box fontWeight="semibold" fontSize="lg">
            {title}
          </Box>
        )}
        <Spacer />
        {headingContent}
        <HStack display={{ base: "none", md: "block" }} gap={1}>
          {exportCsv && (
            <Button
              size="xs"
              variant="outline"
              onClick={() =>
                ExportToCSV(
                  getTableDataForExport(data, columns),
                  `${title}_${Date.now()}_table.csv`
                )
              }
            >
              <MdDownload />
              {translate(dictionary.downloadCSV)}
            </Button>
          )}

          {exportPdf && (
            <Button
              size="xs"
              variant="outline"
              onClick={() =>
                ExportToPDF(
                  getTableDataForExport(data, columns),
                  `${title}_${Date.now()}_table.pdf`
                )
              }
            >
              <MdDownload />
              {translate(dictionary.downloadPDF)}
            </Button>
          )}
        </HStack>
      </Stack>
      {searchable && (
        <HStack gap="2" w="full">
          <Filter<TData>
            column={columnToFilter}
            table={table}
            globalFilter={globalFilter}
            setGlobalFilter={setGlobalFilter}
          />
          {advancedSearchButton && <Box>{advancedSearchButton}</Box>}
          {Object.keys(columnVisibility).length && (
            <Box>
              <Button
                size="xs"
                p="2"
                onClick={() => {
                  setColumnVisibility(stableVisibleColumns);
                }}
              >
                {translate(dictionary.resetColumns)}
              </Button>
            </Box>
          )}
        </HStack>
      )}

      {scrollable && (
        <Box
          w="full"
          overflowX="auto"
          style={{
            scrollbarWidth: "thin",
            scrollbarColor: "#aab7cf transparent",
          }}
        >
          {renderTable}
        </Box>
      )}

      {!scrollable && renderTable}

      <Pagination<TData> totalRows={data.length} table={table} />
    </VStack>
  );
}