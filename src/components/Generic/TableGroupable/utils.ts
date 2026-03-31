/* eslint-disable @typescript-eslint/no-non-null-asserted-optional-chain */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { CellContext, FilterFn, SortingFn, sortingFns } from '@tanstack/react-table';
import {
  compareItems,
  RankingInfo,
  rankItem,
} from '@tanstack/match-sorter-utils';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { CSSProperties } from 'react';
import { TableCellProps } from '@chakra-ui/react';
import { omit } from 'lodash';

declare module '@tanstack/table-core' {
  interface FilterFns {
    fuzzy: FilterFn<unknown>;
    multiSelectFilter?: FilterFn<unknown>;
  }
  interface FilterMeta {
    itemRank: RankingInfo;
  }
}

declare module '@tanstack/react-table' {
  interface ColumnMeta<TData, TValue> {
    getCellContext: (context: CellContext<TData, TValue>) => TableCellProps | void
  }
}

declare global {
  interface Navigator {
    msSaveBlob?: (blob: any, defaultName?: string) => boolean;
  }
}

const getCommonPinningStyles = (column: any): CSSProperties => {
  const isPinned = column.getIsPinned();
  const isLastLeftPinnedColumn =
    isPinned === 'left' && column.getIsLastColumn('left');
  const isFirstRightPinnedColumn =
    isPinned === 'right' && column.getIsFirstColumn('right');

  // console.log({[column.id]: column.getStart('left')});
  // console.log({getSize: column.getStart('getSize')});

  const bg = isPinned ? { backgroundColor: 'white' } : {};
  const l = isPinned && isPinned === 'left' ? { left: `${column.getStart('left')}px` } : {};
  const r = isPinned && isPinned === 'right' ? { right: `${column.getStart('right')}px` } : {};
  let bs = isLastLeftPinnedColumn ? { boxShadow: '-4px 0 4px -4px gray inset' } : {};
  bs = isFirstRightPinnedColumn ? { boxShadow: '4px 0 4px -4px gray inset' } : {};

  return {
    ...bg,
    ...l,
    ...r,
    ...bs,
    // opacity: isPinned ? 0.95 : 1,
    position: isPinned ? 'sticky' : 'static',
    width: column.getSize(),
    zIndex: isPinned ? 10 : 9,
  };
};

function getFilterFunctions<TData>() {
  const fuzzyFilter: FilterFn<TData> = (row, columnId, value, addMeta) => {
    // Rank the item
    const itemRank = rankItem(row.getValue(columnId), value);

    // Store the itemRank info
    addMeta({
      itemRank,
    });

    // Return if the item should be filtered in/out
    return itemRank.passed;
  };

  const fuzzySort: SortingFn<TData> = (rowA, rowB, columnId) => {
    let dir = 0;

    // Only sort by rank if the column has ranking information
    if (rowA.columnFiltersMeta[columnId]) {
      dir = compareItems(
        rowA.columnFiltersMeta[columnId]?.itemRank!,
        rowB.columnFiltersMeta[columnId]?.itemRank!
      );
    }

    // Provide an alphanumeric fallback for when the item ranks are equal
    return dir === 0 ? sortingFns.alphanumeric(rowA, rowB, columnId) : dir;
  };

  const multiSelectFilter: FilterFn<TData> = (
    row,
    columnId,
    filterValue: string[],
  ) => {
    if (!filterValue.length) return true;
    const rowValue = row.getValue(columnId);
    return !!filterValue.find((option) => option === rowValue);
  };

  return {
    multiSelectFilter,
    fuzzyFilter,
    fuzzySort,
  };
}

const getTableDataForExport = (data: any[], columns: any[]) => {
  return data?.map((record: any) =>
    columns.reduce((recordToDownload, column) => {
      const columnTitle =
        typeof column.header === 'function' ? column.id : column.header;
      if (column?.columns) {
        return column.columns.reduce(
          (rtd: any, c: any) => ({
            ...rtd,
            [typeof c.header === 'function'
              ? `${columnTitle} ${c.id}`
              : `${columnTitle} ${c.header}`]: Array.isArray(
                record[c.accessorKey]
              )
                ? record[c.accessorKey].join(',')
                : record[c.accessorKey],
          }),
          recordToDownload
        );
      } else {
        return {
          ...recordToDownload,
          [columnTitle]: Array.isArray(record[column.accessorKey])
            ? record[column.accessorKey].join(',')
            : record[column.accessorKey],
        };
      }
    }, {})
  );
};

/**
 * @desc make csv from given data
 * @param rows
 * @param filename
 */
const ExportToCSV = async (rows: any[], filename: string) => {
  const separator = ',';
  const keys: string[] = Object.keys(rows[0]);

  const csvContent = `${keys.join(separator)}\n${rows
    .map(row =>
      keys
        .map(k => {
          let cell = ["id", 'selected',].includes(k) || row[k] === null || row[k] === undefined ? '' : row[k];

          cell =
            cell instanceof Date
              ? cell.toLocaleString()
              : cell
                .toString()
                .replace(/"/g, '""')
                .replace(/^\s+|\s+$/gm, '');

          if (cell.search(/("|,|\n)/g) >= 0) {
            cell = `"${cell}"`;
          }
          return cell;
        })
        .join(separator)
    )
    .join('\n')}`;

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  if (navigator.msSaveBlob) {
    // In case of IE 10+
    navigator.msSaveBlob(blob, filename);
  } else {
    const link = document.createElement('a');
    if (link.download !== undefined) {
      // Browsers that support HTML5 download attribute
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }
};

const ExportToPDF = async (rows: any[], filename: string) => {
  // Generate the PDF document
  const splittedRows = rows.map((row) => omit(row, ['id', 'selected']));
  const doc = new jsPDF('landscape');
  autoTable(doc, {
    theme: 'grid',
    head: [Object.keys(splittedRows[0])],
    body: splittedRows.map(item => Object.values(item)),
  });

  // Save the PDF document
  doc.save(filename);
};

export {
  getFilterFunctions,
  getTableDataForExport,
  getCommonPinningStyles,
  ExportToCSV,
  ExportToPDF,
};