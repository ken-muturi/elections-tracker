'use client'

import {
  Box,
  Flex,
  Text,
  IconButton,
  Stack,
  Icon,
  Popover,
  HStack,
  Avatar,
  useDisclosure,
} from "@chakra-ui/react";
import { keyframes } from "@emotion/react";
import Link from "next/link";
import {
  HiMenu,
  HiX,
  HiChevronDown,
  HiChevronRight,
} from "react-icons/hi";

import { adminItems, clientItems, NavItem } from "../menus";
import LanguageButton from "../LanguageButton";
import { signOut } from "next-auth/react";
import { useUX } from "@/context/UXContext";
import { dictionary } from "../dictionary";
import { FaChevronDown } from "react-icons/fa";
import { ucwords } from "@/utils/util";
import { usePermissions } from "@/context/AuthContext";
import { usePathname } from "next/navigation";
// import { User } from "@/app/auth";
const pulse = keyframes`
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
`;
export default function WithSubnavigation() {
  const { open: isOpen, onToggle } = useDisclosure();
  const { translate } = useUX();
  // Using static color values since useColorModeValue is not available in v3
  const linkColor = "warchild.white.default";
  const linkHoverColor = "warchild.sand.default";
  const { user, role, removePermissionsQuery } = usePermissions();

  const ITEMS: NavItem[] = ["admin", "super admin"].includes(
    role?.toLowerCase() || "ngo"
  )
    ? adminItems
    : clientItems;

  return (
    <Box>
      <Flex
        align="center"
        color={linkColor}
        minH={"60px"}
        py={{ base: 2 }}
        gap={2}
      >
        <Flex
          flex={{ base: 1, md: "auto" }}
          ml={{ base: -2 }}
          display={{ base: "flex", md: "none" }}
          gap={2}
        >
          <IconButton
            onClick={onToggle}
            variant={"ghost"}
            aria-label={"Toggle Navigation"}
          >
            {isOpen ? <HiX size={12} /> : <HiMenu size={20} />}
          </IconButton>
        </Flex>
        <Flex flex={{ base: 1 }} justify={{ base: "center", md: "start" }}>
          {/* <Image
            h="100px"
            src="/images/logo-warchild.svg"
            alt={process.env.NEXT_PUBLIC_APP}
          /> */}
          <Avatar.Root
            animation={`${pulse} 2s ease-in-out infinite`}
            size="xl"
            bg="white"
            color="orange.50"
          >
            <Avatar.Fallback fontSize="2xl" fontWeight="bold">
              OCAT
            </Avatar.Fallback>
          </Avatar.Root>
        </Flex>

        <Flex
          justify={"flex-end"}
          verticalAlign="middle"
          display={{ base: "none", md: "flex" }}
          align="center"
          gap={2}
        >
          {role &&
            !["admin", "super admin"].includes(
              role.toLowerCase() || "user"
            ) && (
              <Box textAlign="right">
                {/* <Box fontWeight="bold" color="white">
                  Organization: {user.organization.title}
                </Box>
                <Box opacity={0.9} fontSize="xs" color="white">
                  organizationId: {user.organization.id}
                </Box> */}
                <Box opacity={0.9} fontSize="xs" color="white">
                  names: {user.names} - {ucwords(role)}
                </Box>
                <Box opacity={0.9} fontSize="xs" color="white">
                  userId: {user.id}
                </Box>
              </Box>
            )}
          <DesktopNav items={ITEMS} />
          {user.id ? (
            <Box
              px={4}
              fontSize="md"
              cursor="pointer"
              _hover={{ color: linkHoverColor }}
              onClick={async () => {
                await removePermissionsQuery();
                await signOut({
                  callbackUrl: `/`,
                });
                console.log("sign out");
              }}
            >
              {translate(dictionary.logout)}
            </Box>
          ) : (
            <Link href="/login">
              <Box
                _hover={{ color: linkHoverColor }}
                fontSize="md"
              >
                {translate(dictionary.login)}
              </Box>
            </Link>
          )}
          <HStack gap={1}>
            <LanguageButton language="en" />
            <LanguageButton language="ar" />
            <LanguageButton language="fr" />
            <LanguageButton language="es" />
          </HStack>
        </Flex>
      </Flex>

      {isOpen && (
        <MobileNav items={ITEMS} />
      )}
    </Box>
  );
}

const DesktopNav = ({ items }: { items: NavItem[] }) => {
  const url = usePathname();
  // Using static color values since useColorModeValue is not available in v3
  const linkColor = "warchild.white.default";
  const linkHoverColor = "orange.50";
  const popoverContentBgColor = "white";
  const { translate } = useUX();

  return (
    <Stack direction={"row"} gap={2}>
      {items.map((navItem) => (
        <Box key={navItem.label}>
          <Popover.Root>
            <Popover.Trigger asChild>
              <Link
                href={navItem.children ? "#" : navItem.href ?? "#"}
                style={{
                  fontSize: "md",
                  color: url === navItem.href ? linkHoverColor : linkColor,
                  textDecoration: "none",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px"
                }}
              >
                {translate(dictionary[navItem.abbreviation])}
                {navItem.children && navItem.children.length > 0 && (
                  <Icon mt={2} fontSize="xs" as={FaChevronDown} />
                )}
              </Link>
            </Popover.Trigger>

            {navItem.children && (
              <Popover.Content
                border={0}
                boxShadow="base"
                bg={popoverContentBgColor}
                p={4}
                minW={"sm"}
              >
                <Stack>
                  {navItem.children.map((child) => (
                    <DesktopSubNav key={child.label} {...child} />
                  ))}
                </Stack>
              </Popover.Content>
            )}
          </Popover.Root>
        </Box>
      ))}
    </Stack>
  );
};

const DesktopSubNav = ({ href, abbreviation }: NavItem) => {
  const { translate } = useUX();
  const label = translate(dictionary[abbreviation]);
  return (
    <Link href={href || "#"}>
      <Box
        role={"group"}
        display={"block"}
        p={2}
        rounded={"md"}
        _hover={{ bg: "pink.50" }}
      >
        <Stack direction={"row"} align={"center"}>
          <Box color="warchild.black.default">
            <Text
              transition={"all .3s ease"}
              _groupHover={{ color: "warchild.red.400" }}
              fontWeight={500}
              color="orange.50"
            >
              {label}
            </Text>
            <Text fontSize={"sm"}>{label}</Text>
          </Box>
          <Flex
            transition={"all .3s ease"}
            transform={"translateX(-10px)"}
            opacity={0}
            _groupHover={{ opacity: "100%", transform: "translateX(0)" }}
            justify={"flex-end"}
            align={"center"}
            flex={1}
          >
            <Icon color={"warchild.red.400"} w={5} h={5} as={HiChevronRight} />
          </Flex>
        </Stack>
      </Box>
    </Link>
  );
};

const MobileNav = ({ items }: { items: NavItem[] }) => {
  return (
    <Stack
      bg="white"
      p={4}
      display={{ md: "none" }}
    >
      {items.map((navItem) => (
        <MobileNavItem key={navItem.label} {...navItem} />
      ))}
    </Stack>
  );
};

const MobileNavItem = ({ label, children, href }: NavItem) => {
  const { open, onToggle } = useDisclosure()

  return (
    <Stack gap={4} onClick={children && onToggle}>
      <Link href={href ?? '#'}>
        <Box
          py={2}
          justifyContent="space-between"
          alignItems="center"
          _hover={{
            textDecoration: 'none',
          }}>
          <Text fontWeight={600} color="gray.600">
            {label}
          </Text>
          {children && (
            <Icon
              as={HiChevronDown}
              transition={'all .25s ease-in-out'}
              transform={open ? 'rotate(180deg)' : ''}
              w={6}
              h={6}
            />
          )}
        </Box>
      </Link>

      {open && (
        <Stack
          mt={2}
          pl={4}
          borderLeft={1}
          borderStyle={'solid'}
          borderColor="gray.200"
          align={'start'}>
          {children &&
            children.map((child) => (
              <Link key={child.label} href={child.href || "#"}>
                <Box py={2}>
                  {child.label}
                </Box>
              </Link>
            ))}
        </Stack>
      )}
    </Stack>
  )
}
