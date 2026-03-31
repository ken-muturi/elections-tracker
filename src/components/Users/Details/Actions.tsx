import { HStack, IconButton } from '@chakra-ui/react'
import React from 'react'
import DeleteUser from './DeleteUser'
import { UserDetail } from '../type'
import { FaEdit } from 'react-icons/fa'
import { Role } from '@prisma/client'
import Modal from '@/components/Generic/Modal'
import Form from '../Form'

const Actions = ({data, roles}:{data:UserDetail, roles: Role[]}) => {
  return (
    <HStack>
      <Modal
        size="lg"
        vh="90vh"
        title={`Edit User: ${data.firstname} ${data.othernames}`}
        mainContent={<Form roles={roles} user={data} />}
      >
        <IconButton
          variant="ghost"
          size="xs"
          aria-label={`Edit User: ${data.firstname} ${data.othernames}`}
        >
          <FaEdit />
        </IconButton>
      </Modal>
      <DeleteUser id={data.id} />
    </HStack>
  );
}

export default Actions