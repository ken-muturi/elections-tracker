'use client';

import React from 'react'
import { useQuery } from '@tanstack/react-query';
import FullPageLoader from '../../Generic/FullPageLoader';
import { TableGroupable } from '../../Generic/TableGroupable';
import Columns from './Columns';
import { Button } from '@chakra-ui/react';
import { FaPlus } from 'react-icons/fa';
import { RoleDetail } from '../type';
import { getRoles } from '@/services/Roles';
import Modal from '@/components/Generic/Modal';
import Form from '../Form';
import { useUX } from '@/context/UXContext';

const Details = () => {
  const { translate } = useUX()
  const { data, isLoading } = useQuery({
    queryKey: ['roles'],
    queryFn: async () => {
      return await getRoles();
    }
  })

  const roleDetails = (data || []).map((d: RoleDetail) => {
    return {
      id: d.id,
      title: d.title,
      description: d.description,
    } as unknown as RoleDetail;
  });

  const ColumnDefinition = React.useMemo(
    () => Columns({ translate }),
    [translate]
  );

  return (
    <>
      {isLoading && <FullPageLoader />}
      {!isLoading && (
        <TableGroupable<RoleDetail>
          title="Roles"
          exportCsv={true}
          headingContent={
            <>
              <Modal
                size="lg"
                vh="40vh"
                title="Add User Access"
                mainContent={<Form />}
              >
                <Button variant="solid" size="sm">
                  <FaPlus />
                  Add User Access
                </Button>
              </Modal>
            </>
          }
          columnInfo={ColumnDefinition}
          data={roleDetails}
          expandedRows={true}
          defaultGrouping={[]}
        />
      )}
    </>
  );
}

export default Details