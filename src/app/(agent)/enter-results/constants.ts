import {
  FiClock, FiSend, FiCheckCircle, FiAlertCircle, FiX,
} from "react-icons/fi"
import { createElement } from "react"

/* ── Result-status styling ─────────────────────────────────── */

export const STATUS_STYLES: Record<
  string,
  { bg: string; color: string; icon: React.ReactNode; label: string }
> = {
  DRAFT: {
    bg: "#fef3c7",
    color: "#92400e",
    icon: createElement(FiClock, { fontSize: "0.7rem" }),
    label: "Draft",
  },
  SUBMITTED: {
    bg: "#dbeafe",
    color: "#1e40af",
    icon: createElement(FiSend, { fontSize: "0.7rem" }),
    label: "Submitted",
  },
  VERIFIED: {
    bg: "#d1fae5",
    color: "#065f46",
    icon: createElement(FiCheckCircle, { fontSize: "0.7rem" }),
    label: "Verified",
  },
  DISPUTED: {
    bg: "#fef2f2",
    color: "#dc2626",
    icon: createElement(FiAlertCircle, { fontSize: "0.7rem" }),
    label: "Disputed",
  },
  REJECTED: {
    bg: "#fef2f2",
    color: "#991b1b",
    icon: createElement(FiX, { fontSize: "0.7rem" }),
    label: "Rejected",
  },
}

/* ── Shared card styles ────────────────────────────────────── */

export const CARD_STYLES = {
  bg: "white",
  borderRadius: "xl",
  borderWidth: "1px",
  borderColor: "gray.100",
  boxShadow: "0 1px 3px 0 rgba(0,0,0,0.06)",
  p: 5,
  textAlign: "left" as const,
  _hover: { borderColor: "#0ea5e9", boxShadow: "0 0 0 1px #0ea5e9" },
  transition: "all 0.15s",
  cursor: "pointer",
}
