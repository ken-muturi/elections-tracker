'use client';

import React from 'react'
import { useQuery } from '@tanstack/react-query';
import { pick, } from 'lodash';
import FullPageLoader from '../../Generic/FullPageLoader';
import { TableGroupable } from '../../Generic/TableGroupable';
import Columns from './Columns';
import { Button } from '@chakra-ui/react';
import { FaPlus } from 'react-icons/fa';
import { TabDetail } from '../type';
import Modal from '@/components/Generic/Modal';
import Form from '../Form';
import { getTabs } from '@/services/Tabs';
import { ucwords } from '@/utils/util';
import { useUX } from '@/context/UXContext';
import { dictionary } from '../dictionary';

const Details = () => {
  const { translate } = useUX();

  const { data, isLoading } = useQuery({
    queryKey: ['tabs'],
    queryFn: async () => {
      return await getTabs();
    }
  })

  const tabDetails = (data || []).map(
    (d: { title: string; module: { title?: string } }) => {
      return {
        ...pick(d, ["id", "moduleId", "description"]),
        title: ucwords(d.title),
        module: ucwords(d.module?.title ?? ""),
      } as TabDetail;
    }
  );

  const ColumnDefinition = React.useMemo(
    () => Columns({ translate }),
    [translate]
  );

  return (
    <>
      {isLoading && <FullPageLoader />}
      {!isLoading && (
        <TableGroupable<TabDetail>
          title={translate(dictionary.tabs)}
          exportCsv={true}
          headingContent={
            <>
              <Modal size="lg" vh="40vh" mainContent={<Form />}>
                <Button variant="solid" size="sm">
                  <FaPlus />
                  Add
                </Button>
              </Modal>
            </>
          }
          columnInfo={ColumnDefinition}
          data={tabDetails}
          expandedRows={true}
          defaultGrouping={[]}
        />
      )}
    </>
  );
}

export default Details