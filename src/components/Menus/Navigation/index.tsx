"use client";

import React from "react";
import {
  Box,
  BoxProps,
  List,
  FlexProps,
  ListItem,
  Flex,
  CloseButton,
  IconButton,
  Text,
  HStack,
  Menu,
  Avatar,
  VStack,
  useDisclosure,
  Drawer,
} from "@chakra-ui/react";
import NavItem from "./Item";
import {
  adminItems,
  clientItems,
  NavItem as NavItemProp,
  hasNavPermission,
} from "../menus";
import { useUX } from "@/context/UXContext";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { usePermissions } from "@/context/AuthContext";
import { ucwords } from "@/utils/util";
import { FiBell, FiChevronDown, FiMenu } from "react-icons/fi";
import { AiOutlineUser } from "react-icons/ai";

type NavigationProps = {
  onClose: () => void;
} & BoxProps;

type MobileProps = {
  onOpen: () => void;
} & FlexProps;

const SidebarContent = ({ onClose, ...rest }: NavigationProps) => {
  const { showSidebar } = useUX();
  const url = usePathname();
  const [isClosed, setIsClosed] = React.useState<string[]>([]);
  const { permissions, role, user } = usePermissions();
  console.log({ permissions, role, user });

  const baseMenuItems: NavItemProp[] = React.useMemo(() => {
    return role && role === ucwords("client")
      ? clientItems
      : role
      ? adminItems
      : [];
  }, [role]);

  // Filter menu items based on permissions using the abstracted `hasPermission` function
  const menuItems = React.useMemo(() => {
    if (!permissions || Object.keys(permissions).length === 0) {
      // return [];
      return baseMenuItems;
    }

    return baseMenuItems.filter((item) => {
      if (hasNavPermission(item, permissions)) {
        // If the item has permission, also filter its children
        if (item.children) {
          item.children = item.children.filter((child) => {
            const hasPerm = hasNavPermission(child, permissions);
            const childTabName = (child.tab || child.label).toLowerCase();
            let isMenuWriteAction = true;
            if (child.isWriteAction) {
              isMenuWriteAction = Boolean(
                permissions[childTabName]?.find(
                  (p) => p.action.toLowerCase() === "edit"
                )
              );
            }
            return hasPerm && isMenuWriteAction;
          });
        }
        return true;
      }
      return false;
    });
  }, [baseMenuItems, permissions]);

  return (
    <Box
      as="aside"
      transition="3s ease"
      w={{ base: "full", md: 60 }}
      bg="green.fg"
      borderRightColor="gray.200"
      pos="fixed"
      boxShadow={{ base: "none", md: "base" }}
      px={4}
      h="full"
      overflowY="auto"
      style={{
        scrollbarWidth: "thin",
        scrollbarColor: "#aab7cf transparent",
      }}
      {...rest}
    >
      <Flex
        h="20"
        alignItems="center"
        m="8"
        justifyContent={{ base: "space-between" }}
      >
        <Avatar.Root
          size="xl"
          bg="white"
          color="orange.50"
          fontSize="2xl"
          fontWeight="bold"
        >
          <Avatar.Fallback>OCAT</Avatar.Fallback>
        </Avatar.Root>
        <CloseButton display={{ base: "flex", md: "none" }} onClick={onClose} />
      </Flex>
      <List.Root w="full" my={8}>
        {menuItems.map((item, index) => (
          <React.Fragment key={index}>
            <ListItem position="relative">
              <NavItem
                setIsClosed={setIsClosed}
                isClosed={isClosed}
                item={item}
                isActive={url === item.href}
              />
            </ListItem>
            {showSidebar &&
              !isClosed.includes(item.label) &&
              item.children &&
              item.children.map((child, index) => (
                <ListItem key={index}>
                  <NavItem
                    item={child}
                    parent={item.label}
                    isActive={
                      url === child.href || url.startsWith(child.href ?? "")
                    }
                  />
                </ListItem>
              ))}
          </React.Fragment>
        ))}
      </List.Root>
    </Box>
  );
};
const TopNav = ({ onOpen, ...rest }: MobileProps) => {
  const { data: session } = useSession();
  const user = session ? session.user : undefined;
  return (
    <Flex
      ml={{ base: 0, md: 60 }}
      px={{ base: 4 }}
      alignItems="center"
      bg="gray.100"
      borderBottomWidth="1px"
      borderBottomColor="gray.200"
      justifyContent={{ base: "space-between", md: "flex-end" }}
      boxShadow={{ base: "none", md: "base" }}
      {...rest}
    >
      <IconButton
        display={{ base: "flex", md: "none" }}
        onClick={onOpen}
        variant="ghost"
        aria-label="open menu"
      >
        <FiMenu />
      </IconButton>
      <HStack gap={4} display={{ base: "flex", md: "none" }}>
        <Avatar.Root
          size="xl"
          bg="white"
          color="orange.50"
          fontSize="2xl"
          fontWeight="bold"
        >
          <Avatar.Fallback>OCAT</Avatar.Fallback>
        </Avatar.Root>
        <Text fontSize="2xl" letterSpacing="tight" fontWeight="bold">
          Organization Capacity Assessment Tool
        </Text>
      </HStack>

      <HStack gap={{ base: "0", md: "6" }}>
        <IconButton
          size="lg"
          variant="ghost"
          aria-label="open menu"
        >
          <FiBell />
        </IconButton>
        <Flex alignItems={"center"}>
          <Menu.Root>
            <Menu.Trigger
              py={1}
              transition="all 0.3s"
              _focus={{ boxShadow: "none" }}
            >
              <HStack>
                <Avatar.Root
                  bg="red.500"
                  size="sm"
                >
                  <Avatar.Fallback>
                    <AiOutlineUser fontSize="1.5rem" />
                  </Avatar.Fallback>
                </Avatar.Root>
                <VStack
                  display={{ base: "none", md: "flex" }}
                  alignItems="flex-start"
                  gap="1px"
                  ml="2"
                >
                  <Text fontSize="sm">{user?.name}</Text>
                  <Text fontSize="xs" color="gray.600">
                    {user?.role}
                  </Text>
                </VStack>
                <Box display={{ base: "none", md: "flex" }}>
                  <FiChevronDown />
                </Box>
              </HStack>
            </Menu.Trigger>
            <Menu.Content
              zIndex={5}
              bg="white"
              borderColor="gray.200"
            >
              <Menu.Item value="profile">
                <a href={`/users/profile/${user?.id ?? ""}`}>Profile</a>
              </Menu.Item>
              <Menu.Separator />
              <Menu.Item
                value="signout"
                onClick={async () => {
                  await signOut({
                    callbackUrl: "/",
                  });
                }}
              >
                Sign out
              </Menu.Item>
            </Menu.Content>
          </Menu.Root>
        </Flex>
      </HStack>
    </Flex>
  );
};

const Navigation = () => {
  const { open, onOpen, onClose } = useDisclosure();
  return (
    <>
      <SidebarContent
        onClose={() => onClose}
        display={{ base: "none", md: "block" }}
      />
      <Drawer.Root
        open={open}
        placement="start"
        onOpenChange={(e) => e.open ? onOpen() : onClose()}
        size="xl"
      >
        <Drawer.Content>
          <SidebarContent onClose={onClose} />
        </Drawer.Content>
      </Drawer.Root>
      <TopNav pos={"sticky"} top={0} zIndex={2} onOpen={onOpen} />
    </>
  );
};
export default Navigation;
