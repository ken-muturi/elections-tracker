import React from 'react';
import { Flex, Text, Box } from "@chakra-ui/react";
import { pickMessage } from "./loadingMessages";

const FullPageLoader = () => {
  const [message, setMessage] = React.useState(pickMessage);
  const [displayed, setDisplayed] = React.useState("");

  React.useEffect(() => {
    const interval = setInterval(() => setMessage(pickMessage), 3000);
    return () => clearInterval(interval);
  }, []);

  React.useEffect(() => {
    setDisplayed("");
    let i = 0;
    const timer = setInterval(() => {
      i++;
      setDisplayed(message.slice(0, i));
      if (i >= message.length) clearInterval(timer);
    }, 45);
    return () => clearInterval(timer);
  }, [message]);

  return (
    <Flex
      position="fixed"
      top="0"
      left="0"
      width="100%"
      height="100%"
      alignItems="center"
      justifyContent="center"
      backgroundColor="rgba(255, 255, 255, 0.8)"
      zIndex="1000"
      gap={4}
    >
      <style>{`
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>
      {/* <Spinner size="xl" /> */}
      <Flex align="center" gap={1.5}>
        <Box
          as="span"
          fontSize="lg"
          color="green.500"
          style={{ animation: "blink 1s step-start infinite" }}
        >
          ▶
        </Box>
        <Text fontSize="md" fontWeight="500" color="gray.600" minW="220px">
          {displayed}{displayed.endsWith("...") ? "" : "..."}
        </Text>
      </Flex>
    </Flex>
  );
};

export default FullPageLoader;
