import React from "react";
import { Box, Center, IconButton } from "@chakra-ui/react";
import Navigation from "./Navigation";
import { MdMenu } from "react-icons/md";

const Sidebar = ({
  collapse,
  handleCollapse,
}: {
  handleCollapse: (v: boolean) => void;
  collapse: boolean;
}) => (
  <Box w="full">
    <Center>
      <IconButton
        aria-label="Menu Colapse"
        borderRadius="full"
        onClick={() => handleCollapse(!collapse)}
      >
        <MdMenu />
      </IconButton>
    </Center>
    <Navigation />
  </Box>
);

export default Sidebar;
