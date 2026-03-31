import { PermissionsWithRelation } from "@/context/AuthContext";
import { IconType } from "react-icons";
import { FaHome, FaUserShield, FaChartBar } from "react-icons/fa";
import { MdOutlineSpaceDashboard, MdHowToVote } from "react-icons/md";
import { LiaUsersSolid } from "react-icons/lia";
import { PiUsersThreeDuotone } from "react-icons/pi";
import { SiVitest } from "react-icons/si";
import { FaMapLocationDot } from "react-icons/fa6";

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
      {
        label: "Results",
        abbreviation: "results",
        type: "link",
        icon: FaChartBar,
        href: "/results",
      },
    ],
  },
  {
    label: "Elections",
    abbreviation: "forms",
    type: "home",
    icon: MdHowToVote,
    children: [
      {
        label: "Election Forms",
        abbreviation: "forms",
        type: "link",
        icon: SiVitest,
        href: "/questionnaires",
      },
      {
        label: "Polling Stations",
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
    type: "Home",
    label: "Home",
    abbreviation: "home",
    icon: FaHome,
    href: "/",
  },
  {
    type: "Home",
    label: "Enter Results",
    abbreviation: "assessments",
    icon: MdHowToVote,
    href: "/assessments",
  },
  {
    type: "Home",
    label: "View Results",
    abbreviation: "results",
    icon: FaChartBar,
    href: "/election-results",
  },
];

export const hasNavPermission = (
  item: NavItem,
  permissionsByTab: Record<string, PermissionsWithRelation[]>
): boolean => {
  // Get the tab name (from item.tab or item.label)
  const tabName = (item.tab || item.label).toLowerCase();

  // Check if we have any permissions for this tab
  const tabPermissions = permissionsByTab[tabName];
  if (!tabPermissions) {
    // Check if the children have permissions
    if (item.children && item.children.length > 0) {
      return item.children.some((child) =>
        hasNavPermission(child, permissionsByTab)
      );
    }
    return false;
  }
  return true;
};
