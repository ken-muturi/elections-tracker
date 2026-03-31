'use client';

import React, { useMemo, useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query';
import FullPageLoader from '@/components/Generic/FullPageLoader';
import { TableGroupable } from '@/components/Generic/TableGroupable';
import Columns from './Columns';
import { Button } from '@chakra-ui/react';
import { FaPlus } from 'react-icons/fa';
import { QuestionnaireDetail, QuestionnaireWithRelations } from "../type";
import Modal from "@/components/Generic/Modal";
import Form from "../Form";
import { useUX } from "@/context/UXContext";
import { dictionary } from "../dictionary";
import { getQuestionnaires } from "@/services/Questionnaires";
import { format } from "date-fns";

const Details = ({ forms }: { forms: QuestionnaireWithRelations[] }) => {
  const { translate } = useUX();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const { data, isLoading } = useQuery({
    queryKey: ["questionnaires"],
    queryFn: async () => {
      return (await getQuestionnaires(
        undefined,
        true
      )) as QuestionnaireWithRelations[];
    },
    placeholderData: forms,
  });

  const questionnaireDetails = useMemo(() => {
    return (data || []).map((d) => {
      return {
        ...d,
        startDate: d.startDate ? format(new Date(d.startDate), "yyyy-MM-dd") : "",
        endDate: d.endDate ? format(new Date(d.endDate), "yyyy-MM-dd") : "",
        hasSections: d.sections && d.sections.length > 0,
      } as QuestionnaireDetail;
    });
  }, [data]);

  const ColumnDefinition = React.useMemo(
    () => Columns({ translate }),
    [translate]
  );

  return (
    <>
      {isLoading && <FullPageLoader />}
      {!isLoading && isClient && (
        <TableGroupable<QuestionnaireDetail>
          title={translate(dictionary.forms)}
          exportCsv={true}
          headingContent={
            <>
              <Modal
                title={translate(dictionary.addQuestionnaire)}
                size="lg"
                vh="75vh"
                mainContent={<Form />}
              >
                <Button variant="solid" size="sm">
                  <FaPlus />
                  {translate(dictionary.add)}
                </Button>
              </Modal>
            </>
          }
          columnInfo={ColumnDefinition}
          data={questionnaireDetails}
          expandedRows={true}
          defaultGrouping={[]}
        />
      )}
    </>
  );
};

export default Details;