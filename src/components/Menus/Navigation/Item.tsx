import Link from "next/link";
import {
  Link as LinkChakra,
  Heading,
  Box,
  Badge,
  Text,
  HStack,
  Spacer,
} from "@chakra-ui/react";
import React from "react";
import { useUX } from "@/context/UXContext";
import { HiChevronDown, HiChevronUp } from "react-icons/hi";
import { Item } from "../menus";
type NavItemProps = {
  item: Item;
  isActive?: boolean;
  isClosed?: string[];
  setIsClosed?: (label: string[]) => void;
  parent?: string;
};

const NavigationItem = ({
  item,
  isActive,
  setIsClosed,
  isClosed,
}: NavItemProps) => {
  const { label, icon } = item;
  const { showSidebar } = useUX();

  // Using static color values since useColorModeValue is not available in v3
  const linkGradientColor = isActive ? "white" : "whiteAlpha.500";
  const linkColor = isActive ? "white" : "whiteAlpha.500";
  const handleClick = (label: string) => {
    if (setIsClosed && isClosed) {
      if (isClosed.includes(label)) {
        setIsClosed(isClosed.filter((i) => i !== label));
      } else {
        setIsClosed([...isClosed, label]);
      }
    }
  };

  if (item.type === "link") {
    const { href, notifications, messages } = item;
    return (
      <Box
        display="flex"
        alignItems="center"
        my={3}
        mx={2}
        justifyContent="center"
      >
        <LinkChakra
          href={href}
          as={Link}
          gap={1}
          display="flex"
          alignItems="center"
          _hover={{ textDecoration: "none", color: "white" }}
          fontWeight="medium"
          fontSize="sm"
          color={linkGradientColor}
          w="full"
          justifyContent={!showSidebar ? "center" : ""}
        >
          <Box
            as={icon}
            fontSize={18}
            color={linkColor}
            _hover={{ color: "white" }}
            m="0"
          />
          {showSidebar && (
            <Text color={linkColor} _hover={{ color: "white" }}>
              {label}
            </Text>
          )}
        </LinkChakra>
        {showSidebar && (
          <React.Fragment>
            {notifications && (
              <Badge
                borderRadius="full"
                colorScheme="yellow"
                w={6}
                textAlign="center"
              >
                {notifications}
              </Badge>
            )}
            {messages && (
              <Badge
                borderRadius="full"
                colorScheme="green"
                w={6}
                textAlign="center"
              >
                {messages}
              </Badge>
            )}
          </React.Fragment>
        )}
      </Box>
    );
  }

  return (
    <Heading
      color="whiteAlpha.600"
      fontWeight="medium"
      textTransform="uppercase"
      fontSize="sm"
      borderBottomWidth={1}
      borderColor="orange.200"
      pb={0.5}
      my={4}
      _hover={{ color: "white" }}
    >
      <HStack
        h={6}
        cursor="pointer"
        _hover={{ color: "white" }}
        onClick={() => handleClick(label)}
      >
        <Text
          lineHeight="1.2"
          _hover={{ color: "white" }}
          color={linkColor}
          display={showSidebar ? "flex" : "none"}
          letterSpacing="wider"
        >
          {label}
        </Text>
        <Spacer />
        {item.type ? <HiChevronDown /> : <HiChevronUp />}
      </HStack>
    </Heading>
  );
};

export default NavigationItem;
