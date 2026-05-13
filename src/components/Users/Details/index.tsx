/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import React, { useState } from "react";
import { useQuery } from '@tanstack/react-query';
import { pick, } from 'lodash';
import FullPageLoader from '../../Generic/FullPageLoader';
import { TableGroupable } from '../../Generic/TableGroupable';
import Columns from './Columns';
import { Button, HStack } from "@chakra-ui/react";
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
  if (filters.partyId) {
    filteredData = filteredData.filter(
      (d: any) => d.partyId === filters.partyId,
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
        "dateOfBirth",
        "nextOfKin",
        "nextOfKinContacts",
        "address",
        "password",
        "passwordConfirm",
        "partyId",
      ]),
      fullnames: `${d.firstname} ${d.othernames}`,
      role: d.role?.title,
      partyTitle: d.party?.name,
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
                <Button colorPalette="blue" size="xs">
                  <HStack gap={1.5}>
                    <FaPlus fontSize="0.85rem" />
                    <span>Add User</span>
                  </HStack>
                </Button>
              </Modal>
            </>
          }
          columnInfo={ColumnDefinition}
          data={UserDetails}
          expandedRows={true}
          defaultGrouping={["partyTitle"]}
        />
      )}
    </>
  );
};

export default Details