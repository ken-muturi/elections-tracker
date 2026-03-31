import { Box, HStack } from '@chakra-ui/react'
import React from 'react'
import { usePathname } from "next/navigation";
import { dictionary } from "./dictionary";
import { useUX } from "@/context/UXContext";

const Menu = ({
  questionnaireId,
  organizationId,
  isAudit,
}: {
  isAudit: boolean;
  questionnaireId: string;
  organizationId: string;
}) => {
  const { translate } = useUX();
  const pathname = usePathname();
  const isQuizActive =
    pathname === `/assessments/${questionnaireId}/quiz` ||
    pathname.startsWith(`/assessments/${questionnaireId}/audit`);
  const isReportActive = pathname.startsWith(
    `/assessments/${questionnaireId}/report`
  );
  return (
    <HStack borderBottomWidth="medium" borderColor="orange.50" gap={4} mb={2}>
      <Box
        p={2}
        as="a"
        color={isQuizActive ? "warchild.white.default" : "inherit"}
        bg={isQuizActive ? "orange.50" : "transparent"}
      >
        {translate(dictionary.assessment)}
      </Box>

      <Box
        p={2}
        as="a"
        color={isReportActive ? "warchild.white.default" : "inherit"}
        bg={isReportActive ? "orange.50" : "transparent"}
      >
        {translate(dictionary.assessmentReport)}
      </Box>
    </HStack>
  );
};

export default Menu