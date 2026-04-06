"use client";

import React from "react";
import {
  Box,
  Flex,
  Text,
  HStack,
  VStack,
  IconButton,
  Menu,
  Avatar,
  Badge,
  Separator,
  Link as ChakraLink,
} from "@chakra-ui/react";
import Link from "next/link";
import { Tooltip } from "@/components/ui/tooltip";
import { adminItems, clientItems, NavItem as NavItemType } from "../menus";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { usePermissions } from "@/context/AuthContext";
import { useUX } from "@/context/UXContext";
import {
  FiBell,
  FiChevronDown,
  FiChevronLeft,
  FiChevronRight,
  FiMenu,
  FiLogOut,
  FiUser,
  FiX,
} from "react-icons/fi";
import { MdHowToVote } from "react-icons/md";

/* ── Design tokens ─────────────────────────────────────────────── */
const SIDEBAR_BG = "#0f172a";
const SIDEBAR_HOVER = "#1e293b";
const SIDEBAR_BORDER = "#1e293b";
const ACCENT = "#C9D927";
const ACCENT_BG = "rgba(201,217,39,0.12)";
const TEXT_DIM = "#64748b";
const TEXT_MUTED = "#94a3b8";
const TEXT_ACTIVE = "#ffffff";
const SIDEBAR_W = "240px";
const SIDEBAR_W_COLLAPSED = "72px";
const TOPNAV_H = "56px";

/* ── Sidebar ───────────────────────────────────────────────────── */

function SidebarContent({
  collapsed,
  onToggleCollapse,
  onClose,
  isMobile,
}: {
  collapsed: boolean;
  onToggleCollapse: () => void;
  onClose?: () => void;
  isMobile?: boolean;
}) {
  const url = usePathname();
  const { role, user } = usePermissions();

  const menuItems: NavItemType[] = React.useMemo(() => {
    if (role.toLowerCase() === "agent") return clientItems;
    return adminItems;
  }, [role]);

  const isActive = (href?: string) =>
    href ? url === href || url.startsWith(href + "/") : false;

  const isCollapsed = collapsed && !isMobile;
  const sidebarW = isMobile ? "full" : isCollapsed ? SIDEBAR_W_COLLAPSED : SIDEBAR_W;

  return (
    <Flex
      as="aside"
      w={sidebarW}
      bg={SIDEBAR_BG}
      pos={isMobile ? "relative" : "fixed"}
      h="full"
      flexDir="column"
      borderRightWidth="1px"
      borderRightColor={SIDEBAR_BORDER}
      transition="width 0.2s ease"
      overflow="hidden"
      zIndex={20}
    >
      {/* ── Logo ───────────────────────────────────────────── */}
      <Flex
        h={TOPNAV_H}
        alignItems="center"
        px={isCollapsed ? 0 : 4}
        justifyContent={isCollapsed ? "center" : "space-between"}
        borderBottomWidth="1px"
        borderBottomColor={SIDEBAR_BORDER}
        flexShrink={0}
      >
        {isCollapsed ? (
          <Flex
            w={9} h={9} borderRadius="lg" bg={ACCENT}
            align="center" justify="center" flexShrink={0}
          >
            <Box as={MdHowToVote} fontSize="1.1rem" color={SIDEBAR_BG} />
          </Flex>
        ) : (
          <>
            <HStack gap={3}>
              <Flex
                w={9} h={9} borderRadius="lg" bg={ACCENT}
                align="center" justify="center" flexShrink={0}
              >
                <Box as={MdHowToVote} fontSize="1.1rem" color={SIDEBAR_BG} />
              </Flex>
              <VStack alignItems="flex-start" gap={0}>
                <Text fontWeight="800" fontSize="sm" color="white" letterSpacing="tight" lineHeight="1.2">
                  ETS
                </Text>
                <Text fontSize="9px" color={TEXT_DIM} lineHeight="1" fontWeight="500" letterSpacing="wide" textTransform="uppercase">
                  Election Tracking
                </Text>
              </VStack>
            </HStack>
            {isMobile && onClose && (
              <IconButton
                aria-label="Close menu"
                variant="ghost"
                size="sm"
                color={TEXT_DIM}
                _hover={{ color: "white", bg: SIDEBAR_HOVER }}
                borderRadius="md"
                onClick={onClose}
              >
                <FiX />
              </IconButton>
            )}
          </>
        )}
      </Flex>

      {/* ── Nav groups ────────────────────────────────────── */}
      <Box
        flex={1} overflowY="auto" py={3}
        px={isCollapsed ? 2 : 3}
        css={{ scrollbarWidth: "thin", scrollbarColor: SIDEBAR_BORDER + " transparent" }}
      >
        {menuItems.map((group, gi) => {
          // Flat items (no children) — e.g. agent menus
          if (!group.children || group.children.length === 0) {
            return (
              <NavLink
                key={gi}
                href={group.href ?? "/"}
                icon={group.icon}
                label={group.label}
                active={isActive(group.href)}
                collapsed={isCollapsed}
              />
            );
          }

          // Group with children
          return (
            <Box key={gi} mb={2}>
              {/* Section label (hidden when collapsed) */}
              {!isCollapsed ? (
                <HStack gap={2} px={3} pt={gi > 0 ? 4 : 1} pb={1.5}>
                  {group.icon && (
                    <Box as={group.icon} fontSize="0.7rem" color={TEXT_DIM} />
                  )}
                  <Text
                    fontSize="10px" fontWeight="700" color={TEXT_DIM}
                    textTransform="uppercase" letterSpacing="widest" lineHeight="1"
                  >
                    {group.label}
                  </Text>
                </HStack>
              ) : (
                gi > 0 && <Separator borderColor={SIDEBAR_BORDER} my={2} />
              )}

              {/* Child items */}
              <VStack gap={0.5} alignItems="stretch">
                {group.children.map((child, ci) => (
                  <NavLink
                    key={ci}
                    href={child.href ?? "/"}
                    icon={child.icon}
                    label={child.label}
                    active={isActive(child.href)}
                    collapsed={isCollapsed}
                  />
                ))}
              </VStack>
            </Box>
          );
        })}
      </Box>

      {/* ── Collapse toggle (desktop only) ────────────────── */}
      {!isMobile && (
        <Flex px={isCollapsed ? 0 : 3} py={2} justify={isCollapsed ? "center" : "flex-end"}>
          <Tooltip
            content={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            positioning={{ placement: "right" }}
          >
            <IconButton
              aria-label={isCollapsed ? "Expand" : "Collapse"}
              variant="ghost"
              size="xs"
              color={TEXT_DIM}
              _hover={{ color: "white", bg: SIDEBAR_HOVER }}
              borderRadius="md"
              onClick={onToggleCollapse}
            >
              {isCollapsed ? <FiChevronRight /> : <FiChevronLeft />}
            </IconButton>
          </Tooltip>
        </Flex>
      )}

      {/* ── User card ─────────────────────────────────────── */}
      <Box
        px={isCollapsed ? 2 : 3}
        py={3}
        borderTopWidth="1px"
        borderTopColor={SIDEBAR_BORDER}
        flexShrink={0}
      >
        <Menu.Root>
          <Tooltip
            content={user?.names ?? "User"}
            positioning={{ placement: "right" }}
            disabled={!isCollapsed}
          >
            <Menu.Trigger
              w="full"
              borderRadius="lg"
              px={isCollapsed ? 0 : 2.5}
              py={2}
              display="flex"
              justifyContent={isCollapsed ? "center" : "flex-start"}
              _hover={{ bg: SIDEBAR_HOVER }}
              transition="background 0.15s"
            >
              <HStack gap={2.5} w="full" justify={isCollapsed ? "center" : "flex-start"}>
                <Avatar.Root bg={ACCENT} size="sm" flexShrink={0}>
                  <Avatar.Fallback color={SIDEBAR_BG} fontWeight="700" fontSize="xs">
                    {user?.names?.charAt(0)?.toUpperCase() ?? "U"}
                  </Avatar.Fallback>
                </Avatar.Root>
                {!isCollapsed && (
                  <>
                    <VStack alignItems="flex-start" gap={0} flex={1} overflow="hidden">
                      <Text
                        fontSize="sm" fontWeight="600" color="white" lineHeight="1.3"
                        overflow="hidden" textOverflow="ellipsis" whiteSpace="nowrap" maxW="130px"
                      >
                        {user?.names ?? "User"}
                      </Text>
                      <Text fontSize="xs" color={TEXT_DIM} lineHeight="1.2">
                        {role ?? "Member"}
                      </Text>
                    </VStack>
                    <Box as={FiChevronDown} fontSize="0.8rem" color={TEXT_DIM} />
                  </>
                )}
              </HStack>
            </Menu.Trigger>
          </Tooltip>
          <Menu.Positioner>
            <Menu.Content
              bg={SIDEBAR_HOVER} borderColor="#334155" borderWidth="1px"
              boxShadow="xl" borderRadius="xl" minW="180px" zIndex={30}
            >
              <Menu.Item
                value="profile" color={TEXT_MUTED}
                _hover={{ bg: "#334155", color: "white" }}
                borderRadius="lg" fontSize="sm"
              >
                <HStack gap={2}>
                  <Box as={FiUser} />
                  <a href={"/users/profile/" + (user?.id ?? "")}>Profile</a>
                </HStack>
              </Menu.Item>
              <Menu.Separator borderColor="#334155" />
              <Menu.Item
                value="signout" color="#f87171"
                _hover={{ bg: "#7f1d1d22", color: "#f87171" }}
                borderRadius="lg" fontSize="sm"
                onClick={async () => { await signOut({ callbackUrl: "/" }); }}
              >
                <HStack gap={2}>
                  <Box as={FiLogOut} />
                  <span>Sign out</span>
                </HStack>
              </Menu.Item>
            </Menu.Content>
          </Menu.Positioner>
        </Menu.Root>
      </Box>
    </Flex>
  );
}

/* ── Single nav link ───────────────────────────────────────────── */

function NavLink({
  href,
  icon,
  label,
  active,
  collapsed,
}: {
  href: string;
  icon?: React.ElementType;
  label: string;
  active: boolean;
  collapsed: boolean;
}) {
  const inner = (
    <ChakraLink
      as={Link}
      href={href}
      display="flex"
      alignItems="center"
      gap={2.5}
      px={collapsed ? 0 : 3}
      py={2}
      borderRadius="lg"
      textDecoration="none"
      position="relative"
      justifyContent={collapsed ? "center" : "flex-start"}
      bg={active ? SIDEBAR_HOVER : "transparent"}
      color={active ? TEXT_ACTIVE : TEXT_MUTED}
      fontWeight={active ? "600" : "500"}
      fontSize="sm"
      transition="all 0.15s ease"
      _hover={{ textDecoration: "none", bg: SIDEBAR_HOVER, color: "#f1f5f9" }}
      _before={
        active
          ? {
              content: '""',
              position: "absolute",
              left: collapsed ? "50%" : 0,
              bottom: collapsed ? 0 : "auto",
              top: collapsed ? "auto" : "20%",
              transform: collapsed ? "translateX(-50%)" : "none",
              height: collapsed ? "3px" : "60%",
              width: collapsed ? "50%" : "3px",
              bg: ACCENT,
              borderRadius: "full",
            }
          : undefined
      }
    >
      <Flex
        w={7} h={7} borderRadius="md"
        align="center" justify="center"
        bg={active ? ACCENT_BG : "transparent"}
        flexShrink={0}
      >
        {icon && <Box as={icon} fontSize="1rem" color={active ? ACCENT : "inherit"} />}
      </Flex>

      {!collapsed && (
        <Text fontSize="sm" lineHeight="1.3" color="inherit" whiteSpace="nowrap">
          {label}
        </Text>
      )}
    </ChakraLink>
  );

  if (collapsed) {
    return (
      <Tooltip content={label} positioning={{ placement: "right" }}>
        {inner}
      </Tooltip>
    );
  }
  return inner;
}

/* ── Top nav bar ───────────────────────────────────────────────── */

function TopNav({
  onOpen,
  collapsed,
}: {
  onOpen: () => void;
  collapsed: boolean;
}) {
  const { data: session } = useSession();
  const user = session?.user;

  return (
    <Flex
      ml={{ base: 0, md: collapsed ? SIDEBAR_W_COLLAPSED : SIDEBAR_W }}
      px={{ base: 4, md: 5 }}
      h={TOPNAV_H}
      alignItems="center"
      bg="white"
      borderBottomWidth="1px"
      borderBottomColor="gray.100"
      justifyContent={{ base: "space-between", md: "flex-end" }}
      boxShadow="0 1px 3px 0 rgba(0,0,0,0.04)"
      pos="sticky"
      top={0}
      zIndex={10}
      transition="margin-left 0.2s ease"
    >
      <IconButton
        display={{ base: "flex", md: "none" }}
        onClick={onOpen}
        variant="ghost"
        aria-label="open menu"
        color="gray.600"
        _hover={{ bg: "gray.100" }}
        borderRadius="lg"
      >
        <FiMenu />
      </IconButton>

      <HStack gap={2} display={{ base: "flex", md: "none" }}>
        <Flex w={8} h={8} borderRadius="lg" bg={SIDEBAR_BG} align="center" justify="center">
          <Box as={MdHowToVote} fontSize="1rem" color={ACCENT} />
        </Flex>
        <Text fontSize="sm" fontWeight="800" color="gray.900">ETS</Text>
      </HStack>

      <HStack gap={2}>
        <Box position="relative">
          <IconButton
            size="sm" variant="ghost" aria-label="notifications"
            color="gray.500" _hover={{ bg: "gray.100", color: "gray.800" }}
            borderRadius="lg"
          >
            <FiBell />
          </IconButton>
          <Badge
            position="absolute" top="4px" right="4px"
            bg={ACCENT} color={SIDEBAR_BG} borderRadius="full"
            w="8px" h="8px" minW="unset" p={0}
          />
        </Box>

        <Separator orientation="vertical" h={5} borderColor="gray.200" />

        <Menu.Root>
          <Menu.Trigger
            borderRadius="lg" px={2} py={1}
            _hover={{ bg: "gray.50" }} transition="background 0.15s"
          >
            <HStack gap={2}>
              <Avatar.Root bg={SIDEBAR_BG} size="sm">
                <Avatar.Fallback color={ACCENT} fontWeight="700" fontSize="xs">
                  {user?.name?.charAt(0)?.toUpperCase() ?? "U"}
                </Avatar.Fallback>
              </Avatar.Root>
              <VStack display={{ base: "none", md: "flex" }} alignItems="flex-start" gap={0}>
                <Text fontSize="sm" fontWeight="600" color="gray.800" lineHeight="1.3">{user?.name}</Text>
                <Text fontSize="xs" color="gray.400" lineHeight="1.2">{user?.role}</Text>
              </VStack>
              <Box as={FiChevronDown} fontSize="0.8rem" color="gray.400" display={{ base: "none", md: "flex" }} />
            </HStack>
          </Menu.Trigger>
          <Menu.Positioner>
            <Menu.Content
              bg="white" borderColor="gray.100" borderWidth="1px"
              boxShadow="lg" borderRadius="xl" minW="180px" zIndex={30}
            >
              <Menu.Item value="profile" fontSize="sm" color="gray.700" _hover={{ bg: "gray.50" }} borderRadius="lg">
                <HStack gap={2}>
                  <Box as={FiUser} color="gray.500" />
                  <a href={"/users/profile/" + (user?.id ?? "")}>Profile</a>
                </HStack>
              </Menu.Item>
              <Menu.Separator borderColor="gray.100" />
              <Menu.Item
                value="signout" fontSize="sm" color="red.500" _hover={{ bg: "red.50" }} borderRadius="lg"
                onClick={async () => { await signOut({ callbackUrl: "/" }); }}
              >
                <HStack gap={2}>
                  <Box as={FiLogOut} />
                  <span>Sign out</span>
                </HStack>
              </Menu.Item>
            </Menu.Content>
          </Menu.Positioner>
        </Menu.Root>
      </HStack>
    </Flex>
  );
}

/* ── Main export ───────────────────────────────────────────────── */

export default function Navigation() {
  const { showSidebar, toggleSidebar } = useUX();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const collapsed = !showSidebar;

  return (
    <>
      {/* Desktop sidebar */}
      <Box display={{ base: "none", md: "block" }}>
        <SidebarContent
          collapsed={collapsed}
          onToggleCollapse={() => toggleSidebar()}
        />
      </Box>

      {/* Mobile overlay */}
      {mobileOpen && (
        <>
          <Box
            pos="fixed" inset={0} bg="blackAlpha.600"
            zIndex={19} onClick={() => setMobileOpen(false)}
          />
          <Box pos="fixed" left={0} top={0} bottom={0} zIndex={20} w="280px">
            <SidebarContent
              collapsed={false}
              onToggleCollapse={() => {}}
              onClose={() => setMobileOpen(false)}
              isMobile
            />
          </Box>
        </>
      )}

      {/* Top nav */}
      <TopNav onOpen={() => setMobileOpen(true)} collapsed={collapsed} />
    </>
  );
}

export { SIDEBAR_W, SIDEBAR_W_COLLAPSED };
