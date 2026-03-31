import React, { useState } from 'react'
import { dictionary } from './dictionary';
import Form from './Form';
import { Button, Icon } from '@chakra-ui/react';
import { FaEdit, FaPlus } from 'react-icons/fa';
import Modal from '@/components/Generic/Modal';
import { useUX } from '@/context/UXContext';
import { QuestionWithRelations } from './type';

const AddEditQuestion = ({question, questions, unitId}: {unitId:string, questions: QuestionWithRelations[], question?: QuestionWithRelations}) => {
  const [isOpen, setIsOpen] = useState(false);
  const { translate } = useUX();
  return (
    <Modal
      open={isOpen}
      onOpenChange={setIsOpen}
      title={translate(dictionary[question ? 'editQuestion' : 'addQuestion'])}
      size="lg"
      vh="90vh"
      mainContent={<Form otherQuestions={questions} unitId={unitId} question={question} />}
    >
      {question ? (
        <Icon
          size="xs"
          aria-label={translate(dictionary.editQuestion)}
        >
          <FaEdit />
        </Icon>
      ) :
      (
        <Button variant="outline" size="xs">
          <FaPlus />
          {translate(dictionary.addQuestion)}
        </Button>
      )
      }
    </Modal>
  )
}

export default AddEditQuestion