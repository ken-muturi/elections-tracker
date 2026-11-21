"use client"

import { chakra } from "@chakra-ui/react"
import { useRouter, usePathname } from "next/navigation"

type Props = {
  availableYears: string[]
  currentYear: string
}

export const YearSelector = ({ availableYears, currentYear }: Props) => {
  const router = useRouter()
  const pathname = usePathname()

  const onChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const year = e.target.value
    router.push(`${pathname}?year=${encodeURIComponent(year)}`)
  }

  return (
    <chakra.select
      minH={{ base: "40px", md: "auto" }}
      value={currentYear}
      onChange={onChange}
      style={{
        background: "rgba(255,255,255,0.15)",
        border: "1px solid rgba(255,255,255,0.3)",
        borderRadius: "8px",
        color: "white",
        fontSize: "13px",
        fontWeight: 600,
        padding: "6px 10px",
        cursor: "pointer",
        outline: "none",
        minWidth: "120px",
        backdropFilter: "blur(4px)",
      }}
    >
      {availableYears.map((y) => (
        <option key={y} value={y} style={{ background: "#0f172a", color: "white" }}>
          FY {y}
        </option>
      ))}
    </chakra.select>
  )
}
