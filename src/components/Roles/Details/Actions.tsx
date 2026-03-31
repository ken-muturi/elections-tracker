import React from 'react'
import { RoleDetail } from '../type'
import { HStack, IconButton } from '@chakra-ui/react'
import Modal from '@/components/Generic/Modal'
import { dictionary } from '../dictionary'
import { useUX } from '@/context/UXContext'
import Form from '../Form'
import { FaEdit } from 'react-icons/fa'
import DeleteRole from './DeleteRole'

const Actions = ({data}: {data:RoleDetail}) => {
    const {translate } = useUX();
  return (
    <HStack>
      <Modal
        size="lg"
        vh="40vh"
        title={`${translate(dictionary.editRole)} ${data.title}`}
        mainContent={<Form role={data} />}
      >
        <IconButton variant="ghost" aria-label={translate(dictionary.editRole)}>
          <FaEdit color="blue.500" />
        </IconButton>
      </Modal>
      <DeleteRole id={data.id} />
    </HStack>
  );
}

export default Actions