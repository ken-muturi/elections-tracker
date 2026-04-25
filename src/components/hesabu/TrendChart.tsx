"use client"

import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts"
import { TrendPoint } from "@/services/Hesabu"

type Props = {
  data: TrendPoint[]
  currentYear: string
}

const fmtKES = (v: number) => `KSh ${(v / 1000).toFixed(1)}B`

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div
      style={{
        background: "white",
        border: "1px solid #e2e8f0",
        borderRadius: "10px",
        padding: "12px 16px",
        boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
        fontSize: "12px",
        minWidth: "200px",
      }}
    >
      <p style={{ fontWeight: 700, color: "#0f172a", marginBottom: 8, fontSize: 13 }}>
        FY 20{label}
      </p>
      {payload.map(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (entry: any) =>
          entry.name === "Absorption %" ? (
            <p key={entry.name} style={{ color: entry.color, marginBottom: 4 }}>
              <span style={{ fontWeight: 600 }}>{entry.name}:</span> {entry.value}%
            </p>
          ) : (
            <p key={entry.name} style={{ color: entry.color, marginBottom: 4 }}>
              <span style={{ fontWeight: 600 }}>{entry.name}:</span>{" "}
              {fmtKES(entry.value as number)}
            </p>
          ),
      )}
    </div>
  )
}

export const TrendChart = ({ data, currentYear }: Props) => {
  const currentLabel = currentYear.replace(/20(\d{2})\/20(\d{2})/, "$1/$2")

  return (
    <div style={{ width: "100%", height: 320 }}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 8, right: 24, left: 8, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: "#94a3b8" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            yAxisId="budget"
            orientation="left"
            tickFormatter={(v) => `${(v / 1000).toFixed(0)}B`}
            tick={{ fontSize: 11, fill: "#94a3b8" }}
            axisLine={false}
            tickLine={false}
            width={40}
          />
          <YAxis
            yAxisId="pct"
            orientation="right"
            domain={[0, 100]}
            tickFormatter={(v) => `${v}%`}
            tick={{ fontSize: 11, fill: "#94a3b8" }}
            axisLine={false}
            tickLine={false}
            width={36}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: 12, paddingTop: 8, color: "#64748b" }}
            iconType="circle"
            iconSize={8}
          />

          {/* Highlight currently selected year */}
          <ReferenceLine
            yAxisId="budget"
            x={currentLabel}
            stroke="#0d9488"
            strokeWidth={2}
            strokeDasharray="4 2"
          />

          {/* Budget bars */}
          <Bar
            yAxisId="budget"
            dataKey="recurrentExpenditure"
            name="Recurrent"
            stackId="budget"
            fill="#1e3a5f"
            radius={[0, 0, 0, 0]}
            maxBarSize={36}
          />
          <Bar
            yAxisId="budget"
            dataKey="developmentExpenditure"
            name="Development"
            stackId="budget"
            fill="#0d9488"
            radius={[4, 4, 0, 0]}
            maxBarSize={36}
          />

          {/* Development absorption rate line */}
          <Line
            yAxisId="pct"
            type="monotone"
            dataKey="devAbsorptionRate"
            name="Absorption %"
            stroke="#f59e0b"
            strokeWidth={2.5}
            dot={{ fill: "#f59e0b", r: 4, strokeWidth: 0 }}
            activeDot={{ r: 6 }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
