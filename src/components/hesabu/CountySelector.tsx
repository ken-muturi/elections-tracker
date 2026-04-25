"use client"

import { useRouter, usePathname, useSearchParams } from "next/navigation"

type Props = {
  counties: { code: string; name: string }[]
  currentCode: string
}

export const CountySelector = ({ counties, currentCode }: Props) => {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const onChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const code = e.target.value
    const params = new URLSearchParams()
    params.set("county", code)
    // Keep year param if it exists, otherwise page will default to latest for new county
    const year = searchParams.get("year")
    if (year) params.set("year", year)
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <select
      value={currentCode}
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
        minWidth: "140px",
        backdropFilter: "blur(4px)",
      }}
    >
      {counties.map((c) => (
        <option key={c.code} value={c.code} style={{ background: "#0f172a", color: "white" }}>
          {c.name}
        </option>
      ))}
    </select>
  )
}
