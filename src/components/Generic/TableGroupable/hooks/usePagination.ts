import { PaginationState } from '@tanstack/react-table';
import { useState } from 'react';

export default function usePagination(initialSize = 30) {
  const [pagination, setPagination] = useState<PaginationState>({
    pageSize: initialSize,
    pageIndex: 0,
  });
  const { pageSize, pageIndex } = pagination;

  return {
    // table state
    onPaginationChange: setPagination,
    pagination,
    limit: pageSize,
    skip: pageSize * pageIndex,
  };
}