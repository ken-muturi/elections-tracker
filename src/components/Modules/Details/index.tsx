'use client';

import React from 'react'
import { useQuery } from '@tanstack/react-query';
import { pick, } from 'lodash';
import FullPageLoader from '../../Generic/FullPageLoader';
import { TableGroupable } from '../../Generic/TableGroupable';
import Columns from './Columns';
import { Button } from '@chakra-ui/react';
import { FaPlus } from 'react-icons/fa';
import { ModuleDetail } from '../type';
import Modal from '@/components/Generic/Modal';
import Form from '../Form';
import { ucwords } from '@/utils/util';
import { getModules } from "@/services/Modules";
import { useUX } from '@/context/UXContext';
import { dictionary } from '../dictionary';

const Details = () => {
  const { translate } = useUX()
  const { data, isLoading } = useQuery({
    queryKey: ['modules'],
    queryFn: async () => {
      return await getModules();
    }
  })

  const moduleDetails = (data || []).map((d) => {
    return {
      ...pick(d, ['id', 'title', 'description']),
      title: ucwords(d.title),
    } as ModuleDetail
  })

  const ColumnDefinition = React.useMemo(() => Columns({ translate }), [translate]);

  return (
    <>
      {isLoading && <FullPageLoader />}
      {!isLoading && (
        <TableGroupable<ModuleDetail>
          title={translate(dictionary.modules)}
          exportCsv={true}
          headingContent={
            <>
              <Modal size="lg" vh="40vh" mainContent={<Form />}>
                <Button variant="solid" size="sm">
                  <FaPlus />
                  {translate(dictionary.add)}
                </Button>
              </Modal>
            </>
          }
          columnInfo={ColumnDefinition}
          data={moduleDetails}
          expandedRows={true}
          defaultGrouping={[]}
        />
      )}
    </>
  );
}

export default Details