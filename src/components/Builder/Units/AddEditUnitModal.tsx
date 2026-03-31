import React, { useState } from 'react'
import { dictionary } from './dictionary';
import Form from './Form';
import { Button, Icon } from '@chakra-ui/react';
import { FaEdit, FaPlus } from 'react-icons/fa';
import Modal from '@/components/Generic/Modal';
import { useUX } from '@/context/UXContext';
import { UnitWithRelation } from './type';

const AddEditUnit = ({data, sectionId}: {sectionId:string, data?: UnitWithRelation}) => {
  const [isOpen, setIsOpen] = useState(false);
  const { translate } = useUX();
  return (
    <Modal
      open={isOpen}
      onOpenChange={setIsOpen}
      title={translate(dictionary[data ? 'editUnit' : 'addUnit'])}
      size="lg"
      vh="60vh"
      mainContent={<Form sectionId={sectionId} unit={data} onClose={() => setIsOpen(false)} />}
    >
      {data ? (
        <Icon
          size="xs"
          aria-label={translate(dictionary.editUnit)}
        >
          <FaEdit />
        </Icon>
      ) :
      (
        <Button variant="outline" size="xs">
          <FaPlus />
          {translate(dictionary.addUnit)}
        </Button>
      )
      }
    </Modal>
  )
}

export default AddEditUnit