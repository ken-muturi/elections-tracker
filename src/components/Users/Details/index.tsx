/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import React, { useState } from "react";
import { useQuery } from '@tanstack/react-query';
import { pick, } from 'lodash';
import FullPageLoader from '../../Generic/FullPageLoader';
import { TableGroupable } from '../../Generic/TableGroupable';
import Columns from './Columns';
import { Button } from "@chakra-ui/react";
import { FaPlus } from "react-icons/fa";
import Filters, { FilterProps } from "../Filters";
import { UserDetail, UserWithRelations } from "../type";
import { getUsers } from "@/services/Users";
import Form from "../Form";
import Modal from "@/components/Generic/Modal";
import { Role } from "@prisma/client";
import { useUX } from "@/context/UXContext";

type DetailProps = {
  users: UserWithRelations[];
  roles: Role[];
};

const Details = ({ users: initalUsers, roles }: DetailProps) => {
  const [filters, setFilters] = useState<FilterProps>({});
  const { translate } = useUX();
  const { data, isLoading } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      return (await getUsers()) as unknown as UserWithRelations[];
    },
    placeholderData: initalUsers,
  });

  let filteredData = data || [];
  if (filters.organizationId) {
    filteredData = filteredData.filter(
      (d: any) => d.organizationId === filters.organizationId
    );
  }
  const UserDetails = filteredData.map((d: any) => {
    return {
      ...pick(d, [
        "id",
        "email",
        "firstname",
        "othernames",
        "gender",
        "nationalId",
        "phone",
        "alternatePhone",
        "dateOfBirth",
        "nextOfKin",
        "nextOfKinContacts",
        "address",
      ]),
      fullnames: `${d.firstname} ${d.othernames}`,
      role: d.role?.title,
      organizationTitle: d.organization?.title,
      image: d.image,
      roleId: d.roleId,
    } as UserDetail;
  });

  const ColumnDefinition = React.useMemo(
    () =>
      Columns({
        translate,
        roles,
      }),
    [translate, roles]
  );

  return (
    <>
      {isLoading && <FullPageLoader />}
      {!isLoading && (
        <TableGroupable<UserDetail>
          title="Users"
          exportCsv={true}
          exportPdf={true}
          headingContent={
            <>
              <Filters filters={filters} setFilters={setFilters} />
              <Modal
                title="Add User"
                size="lg"
                vh="90vh"
                mainContent={<Form roles={roles} />}
              >
                <Button variant="solid" colorScheme="green" as="a" size="xs">
                  <FaPlus />
                  Add
                </Button>
              </Modal>
            </>
          }
          columnInfo={ColumnDefinition}
          data={UserDetails}
          expandedRows={true}
          defaultGrouping={["organizationTitle"]}
        />
      )}
    </>
  );
};

export default Details