import React from 'react'
import { RoleDetail } from '../type'
import { HStack } from "@chakra-ui/react";
import Modal from '@/components/Generic/Modal'
import { dictionary } from '../dictionary'
import { useUX } from '@/context/UXContext'
import Form from '../Form'
import { FaEdit } from 'react-icons/fa'
import DeleteRole from './DeleteRole'
import StyledIconButton from "@/components/Generic/StyledIconButton";

const Actions = ({data}: {data:RoleDetail}) => {
    const {translate } = useUX();
  return (
    <HStack gap={2}>
      <Modal
        size="lg"
        vh="40vh"
        title={`${translate(dictionary.editRole)} ${data.title}`}
        mainContent={<Form role={data} />}
      >
        <StyledIconButton
          variant="edit"
          aria-label={translate(dictionary.editRole)}
        >
          <FaEdit />
        </StyledIconButton>
      </Modal>
      <DeleteRole id={data.id} />
    </HStack>
  );
}

export default Actions