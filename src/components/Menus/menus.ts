import { IconType } from "react-icons";
import { FaHome, FaUserShield, FaChartBar } from "react-icons/fa";
import { MdOutlineSpaceDashboard, MdHowToVote } from "react-icons/md";
import { LiaUsersSolid } from "react-icons/lia";
import { PiUsersThreeDuotone } from "react-icons/pi";
import { FaMapLocationDot } from "react-icons/fa6";
import { FiCalendar, FiUsers, FiLayers } from "react-icons/fi";

export type Item = {
  type: string;
  label: string;
  href?: string;
  icon?: IconType;
  notifications?: number;
  messages?: number;
  tab?: string;
  isWriteAction?: boolean;
  abbreviation: string;
};

export type NavItem = {
  children?: Array<NavItem>;
} & Item;

export const adminItems: NavItem[] = [
  {
    type: "home",
    label: "Dashboard",
    abbreviation: "dashboard",
    icon: MdOutlineSpaceDashboard,
    children: [
      {
        label: "Overview",
        abbreviation: "dashboard",
        type: "link",
        icon: FaHome,
        href: "/dashboard",
      },
    ],
  },
  {
    label: "Elections",
    abbreviation: "elections",
    type: "home",
    icon: MdHowToVote,
    children: [
      {
        label: "All Elections",
        abbreviation: "elections",
        type: "link",
        icon: FiCalendar,
        href: "/elections",
      },
      {
        label: "Hierarchy",
        abbreviation: "hierarchy",
        type: "link",
        icon: FiLayers,
        href: "/hierarchy",
      },
      {
        label: "Agent Assignments",
        abbreviation: "agents",
        type: "link",
        icon: FiUsers,
        href: "/elections/agents",
      },
      {
        label: "Enter Results",
        abbreviation: "enter-results",
        type: "link",
        icon: MdHowToVote,
        href: "/enter-results",
      },
    ],
  },
  {
    label: "Polling Stations",
    abbreviation: "polling-stations",
    type: "home",
    icon: FaMapLocationDot,
    children: [
      {
        label: "All Stations",
        abbreviation: "polling-stations",
        type: "link",
        icon: FaMapLocationDot,
        href: "/polling-stations",
      },
    ],
  },
  {
    label: "Users",
    type: "home",
    abbreviation: "users",
    icon: LiaUsersSolid,
    children: [
      {
        label: "Users",
        abbreviation: "users",
        type: "link",
        icon: PiUsersThreeDuotone,
        href: "/users",
      },
      {
        label: "Roles",
        abbreviation: "roles",
        type: "link",
        icon: FaUserShield,
        href: "/roles",
      },
    ],
  },
];

export const clientItems: NavItem[] = [
  {
    type: "link",
    label: "Home",
    abbreviation: "home",
    icon: FaHome,
    href: "/enter-results",
  },
  {
    type: "link",
    label: "Enter Results",
    abbreviation: "enter-results",
    icon: MdHowToVote,
    href: "/enter-results",
  },
  {
    type: "link",
    label: "View Results",
    abbreviation: "results",
    icon: FaChartBar,
    href: "/results",
  },
];

/** Role-based nav — no permission table needed. */
export const hasNavPermission = (): boolean => true;
