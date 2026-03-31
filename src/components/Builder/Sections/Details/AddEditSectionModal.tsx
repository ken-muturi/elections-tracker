import React, { useState } from 'react'
import { dictionary } from '../dictionary';
import Form from '../Form';
import { Button, Icon } from '@chakra-ui/react';
import { FaEdit, FaPlus } from 'react-icons/fa';
import Modal from '@/components/Generic/Modal';
import { useUX } from '@/context/UXContext';
import { SectionWithRelations } from '../type';

const AddEditSection = ({data}: {data?: SectionWithRelations}) => {
  const [isOpen, setIsOpen] = useState(false);
  const { translate } = useUX();
  return (
    <Modal
      open={isOpen}
      onOpenChange={setIsOpen}
      title={translate(dictionary[data ? 'editSection' : 'addSection'])}
      size="lg"
      vh="60vh"
      mainContent={<Form section={data} />}
    >
      {data ? (
        <Icon
          size="xs"
          aria-label={translate(dictionary.editSection)}
        >
          <FaEdit />
        </Icon>
      ) :
      (
        <Button variant="outline" size="xs">
          <FaPlus />
          {translate(dictionary.addSection)}
        </Button>
      )
      }
    </Modal>
  )
}

export default AddEditSection