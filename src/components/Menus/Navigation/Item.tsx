import Link from "next/link";
import {
  Link as LinkChakra,
  Box,
  Badge,
  Text,
  HStack,
  Spacer,
  Flex,
} from "@chakra-ui/react";
import React from "react";
import { useUX } from "@/context/UXContext";
import { HiChevronDown, HiChevronRight } from "react-icons/hi";
import { Item } from "../menus";

type NavItemProps = {
  item: Item;
  isActive?: boolean;
  isClosed?: string[];
  setIsClosed?: (label: string[]) => void;
  parent?: string;
};

const SIDEBAR_HOVER = "#1e293b";
const SIDEBAR_ACTIVE_BG = "#1e293b";
const SIDEBAR_ACTIVE_ACCENT = "#C9D927";
const SIDEBAR_TEXT = "#94a3b8";
const SIDEBAR_TEXT_ACTIVE = "#ffffff";
const SIDEBAR_TEXT_HOVER = "#f1f5f9";

const NavigationItem = ({
  item,
  isActive,
  setIsClosed,
  isClosed,
  parent,
}: NavItemProps) => {
  const { label, icon } = item;
  const { showSidebar } = useUX();
  const isChild = Boolean(parent);

  const handleClick = (label: string) => {
    if (setIsClosed && isClosed) {
      if (isClosed.includes(label)) {
        setIsClosed(isClosed.filter((i) => i !== label));
      } else {
        setIsClosed([...isClosed, label]);
      }
    }
  };

  // Link item
  if (item.type === "link") {
    const { href, notifications, messages } = item;
    return (
      <LinkChakra
        href={href}
        as={Link}
        display="flex"
        alignItems="center"
        gap={3}
        px={3}
        py={isChild ? 2 : 2.5}
        my={0.5}
        borderRadius="lg"
        textDecoration="none"
        position="relative"
        bg={isActive ? SIDEBAR_ACTIVE_BG : "transparent"}
        color={isActive ? SIDEBAR_TEXT_ACTIVE : SIDEBAR_TEXT}
        fontWeight={isActive ? "600" : "500"}
        fontSize="sm"
        transition="all 0.15s ease"
        _hover={{
          textDecoration: "none",
          bg: SIDEBAR_HOVER,
          color: SIDEBAR_TEXT_HOVER,
        }}
        // Active left accent bar
        _before={isActive ? {
          content: '""',
          position: "absolute",
          left: 0,
          top: "20%",
          bottom: "20%",
          w: "3px",
          bg: SIDEBAR_ACTIVE_ACCENT,
          borderRadius: "full",
        } : undefined}
        pl={isActive ? 4 : 3}
      >
        {/* Icon */}
        <Flex
          w={isChild ? 6 : 7}
          h={isChild ? 6 : 7}
          borderRadius="md"
          align="center"
          justify="center"
          bg={isActive ? "rgba(201, 217, 39, 0.15)" : "transparent"}
          flexShrink={0}
        >
          {icon && (
            <Box
              as={icon}
              fontSize={isChild ? "0.9rem" : "1rem"}
              color={isActive ? SIDEBAR_ACTIVE_ACCENT : "inherit"}
            />
          )}
        </Flex>

        {/* Label */}
        {showSidebar && (
          <Text
            fontSize={isChild ? "xs" : "sm"}
            flex={1}
            lineHeight="1.3"
            color="inherit"
          >
            {label}
          </Text>
        )}

        {/* Badges */}
        {showSidebar && (
          <React.Fragment>
            {notifications && (
              <Badge
                bg={SIDEBAR_ACTIVE_ACCENT}
                color="#0f172a"
                borderRadius="full"
                fontSize="9px"
                px={1.5}
                py={0.5}
                fontWeight="700"
                minW="18px"
                textAlign="center"
              >
                {notifications}
              </Badge>
            )}
            {messages && (
              <Badge
                bg="#3b82f6"
                color="white"
                borderRadius="full"
                fontSize="9px"
                px={1.5}
                py={0.5}
                fontWeight="700"
                minW="18px"
                textAlign="center"
              >
                {messages}
              </Badge>
            )}
          </React.Fragment>
        )}
      </LinkChakra>
    );
  }

  // Section header / group
  const isExpanded = !isClosed?.includes(label);
  return (
    <Box
      px={3}
      py={2}
      mt={2}
      mb={0.5}
      cursor="pointer"
      borderRadius="lg"
      _hover={{ bg: SIDEBAR_HOVER }}
      transition="background 0.15s"
      onClick={() => handleClick(label)}
    >
      <HStack gap={3}>
        {/* Group icon */}
        <Flex
          w={7}
          h={7}
          borderRadius="md"
          align="center"
          justify="center"
          flexShrink={0}
        >
          {icon && (
            <Box as={icon} fontSize="1rem" color="#475569" />
          )}
        </Flex>

        {showSidebar && (
          <>
            <Text
              flex={1}
              fontSize="xs"
              fontWeight="700"
              color="#475569"
              textTransform="uppercase"
              letterSpacing="wider"
              lineHeight="1.3"
            >
              {label}
            </Text>
            <Spacer />
            <Box
              as={isExpanded ? HiChevronDown : HiChevronRight}
              fontSize="0.85rem"
              color="#475569"
              transition="transform 0.2s"
            />
          </>
        )}
      </HStack>
    </Box>
  );
};

export default NavigationItem;
