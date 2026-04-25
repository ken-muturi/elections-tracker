import type { ResultStat } from "../ResultsSummary"

export type Entity = ResultStat["entities"][number]
export type LcColors = { bg: string; color: string; border: string }
export type ConstituencyGroup = { constituencyName: string | null; entities: Entity[] }
export type CountyGroup = { countyName: string; constituencies: ConstituencyGroup[] }
