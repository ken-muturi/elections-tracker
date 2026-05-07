export type PreviewStream = { name: string; code: string }
export type PreviewStation = { name: string; code: string; streams: PreviewStream[] }
export type PreviewWard = {
  name: string; code: string; isNew: boolean
  countyName: string; constituencyName: string
  pollingStations: PreviewStation[]
}
export type PreviewResult = {
  wards: number; stations: number; streams: number; totalWards: number
  detail: PreviewWard[]
}
export type ElectionLight = { id: string; title: string; year: number; isActive: boolean }
