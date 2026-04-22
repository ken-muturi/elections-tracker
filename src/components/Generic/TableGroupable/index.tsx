/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { ReactNode, useCallback, useMemo, useState } from "react";
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
} from "@tanstack/react-table";

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
import { ChildHeader, ChildRow } from "./ExpandedRowContent";
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

export function TableGroupable<TData, TChildColumn = unknown>({
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
  childColumnsInfo,
  getChildRows,
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
  childColumnsInfo?: ColumnDef<TChildColumn>[];
  getChildRows?: (row: TData) => TChildColumn[];
}) {
  const { translate } = useUX();
  const columns = useMemo<ColumnDef<TData>[]>(
    () =>
      columnInfo.map((d) => {
        return d.enableColumnFilter === false
          ? d
          : { ...d, filterFn: "multiSelectFilter" };
      }),
    [columnInfo],
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
  const [expandedChildRows, setExpandedChildRows] = useState<Set<string>>(
    new Set(),
  );
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
    <Table.Root
      size="sm"
      stickyHeader
      variant="outline"
      style={{
        borderRadius: "12px",
        overflow: "hidden",
        border: "1px solid #e5e7eb",
      }}
    >
      <Table.Header bg="#f8fafc">
        {table.getHeaderGroups().map((headerGroup, hgindex) => (
          <Table.Row
            key={hgindex}
            bg="#f8fafc"
            borderBottomWidth="2px"
            borderBottomColor="gray.200"
          >
            {headerGroup.headers.map((header, hindex) => {
              return (
                <Table.ColumnHeader
                  key={hindex}
                  className={header.column?.id ?? ""}
                  colSpan={header.colSpan}
                  py="2px"
                  px={2}
                  fontSize="xs"
                  fontWeight="semibold"
                  style={{
                    ...getCommonPinningStyles(header.column),
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    color: "#374151",
                  }}
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
                          header.getContext(),
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
                <Text fontSize="xs" textAlign="center" color="gray.500">
                  {translate(dictionary.noRecordsFound)}
                </Text>
              )}
            </Table.Cell>
          </Table.Row>
        ) : (
          table.getRowModel().rows.flatMap((row, rindex) => {
            const visibleCellCount = row.getVisibleCells().length;
            const isChildExpanded = expandedChildRows.has(row.id);
            const toggleChildExpanded = () =>
              setExpandedChildRows((prev) => {
                const next = new Set(prev);
                if (next.has(row.id)) next.delete(row.id);
                else next.add(row.id);
                return next;
              });
            const childItems =
              isChildExpanded && childColumnsInfo && getChildRows
                ? getChildRows(row.original)
                : [];

            const parentRow = (
              <Table.Row
                key={`row-${rindex}`}
                _hover={{ bg: "#f8fafc" }}
                transition="background 0.15s"
                borderBottomWidth="1px"
                borderBottomColor="gray.100"
              >
                {row.getVisibleCells().map((cell, cindex) => {
                  const hasMeta = cell.getContext().cell.column.columnDef.meta;
                  return (
                    <Table.Cell
                      key={cindex}
                      className={`${cell.column.id ?? ""}`}
                      fontSize="xs"
                      py="2px"
                      px={2}
                      style={{
                        ...getCommonPinningStyles(cell.column),
                        color: "#1f2937",
                      }}
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
                              cell.getContext(),
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
                          cell.getContext(),
                        )
                      ) : cell.getIsPlaceholder() ? null : cindex === 0 && // Otherwise, just render the regular cell
                        childColumnsInfo ? (
                        <HStack gap={1}>
                          <HeaderButton
                            iconObj={
                              isChildExpanded ? FaCaretDown : FaCaretRight
                            }
                            onClick={toggleChildExpanded}
                            aria-label={translate(dictionary.expandCollapse)}
                            size="xs"
                            color={isChildExpanded ? "blue.500" : "gray.400"}
                          />
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext(),
                          )}
                        </HStack>
                      ) : (
                        flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )
                      )}
                    </Table.Cell>
                  );
                })}
              </Table.Row>
            );

            const childHeaderRow =
              childItems.length > 0 ? (
                <ChildHeader<TChildColumn>
                  key={`child-header-${rindex}`}
                  childColumns={childColumnsInfo!}
                  totalColumnCount={visibleCellCount}
                />
              ) : null;

            const childDataRows = childItems.map((item, cidx) => (
              <ChildRow<TChildColumn>
                key={`child-${rindex}-${cidx}`}
                item={item}
                childColumns={childColumnsInfo!}
                totalColumnCount={visibleCellCount}
              />
            ));

            return [parentRow, childHeaderRow, ...childDataRows].filter(
              Boolean,
            ) as React.ReactElement[];
          })
        )}
      </Table.Body>
    </Table.Root>
  );

  return (
    <VStack w="full" alignItems="stretch" gap={2}>
      {/* Enhanced Header */}
      <Box
      // bg="white"
      // p={4}
      // py={2}
      // borderRadius="xl"
      // borderWidth="1px"
      // borderColor="gray.100"
      // boxShadow="0 1px 3px 0 rgba(0,0,0,0.06)"
      >
        <Stack
          w="full"
          direction={{ base: "column", md: "row" }}
          gap={3}
          alignItems={{ base: "stretch", md: "center" }}
        >
          {title && (
            <Box fontWeight="800" fontSize="xl" color="gray.900">
              {title}
            </Box>
          )}
          <Spacer />
          {/* Search and Filters */}
          {searchable && (
            <Box>
              <HStack gap={3} w="full" flexWrap="wrap">
                <Box flex={1} minW="250px">
                  <Filter<TData>
                    column={columnToFilter}
                    table={table}
                    globalFilter={globalFilter}
                    setGlobalFilter={setGlobalFilter}
                  />
                </Box>
                {advancedSearchButton && <Box>{advancedSearchButton}</Box>}
                {Boolean(Object.keys(columnVisibility).length) && (
                  <Button
                    size="sm"
                    variant="outline"
                    colorPalette="gray"
                    onClick={() => {
                      setColumnVisibility(stableVisibleColumns);
                    }}
                  >
                    {translate(dictionary.resetColumns)}
                  </Button>
                )}
              </HStack>
            </Box>
          )}

          {headingContent}

          <HStack display={{ base: "none", md: "flex" }} gap={2}>
            {exportCsv && (
              <Button
                size="xs"
                variant="outline"
                colorPalette="gray"
                onClick={() =>
                  ExportToCSV(
                    getTableDataForExport(data, columns),
                    `${title}_${Date.now()}_table.csv`,
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
                colorPalette="gray"
                onClick={() =>
                  ExportToPDF(
                    getTableDataForExport(data, columns),
                    `${title}_${Date.now()}_table.pdf`,
                  )
                }
              >
                <MdDownload />
                {translate(dictionary.downloadPDF)}
              </Button>
            )}
          </HStack>
        </Stack>
      </Box>

      {/* Table Container */}
      <Box
        bg="white"
        borderRadius="xl"
        borderWidth="1px"
        borderColor="gray.100"
        overflow="hidden"
        boxShadow="0 1px 3px 0 rgba(0,0,0,0.06)"
      >
        {scrollable ? (
          <Box
            w="full"
            overflowX="auto"
            style={{
              scrollbarWidth: "thin",
              scrollbarColor: "#cbd5e1 #f1f5f9",
            }}
          >
            {renderTable}
          </Box>
        ) : (
          renderTable
        )}
      </Box>

      <Pagination<TData> totalRows={data.length} table={table} />
    </VStack>
  );
}