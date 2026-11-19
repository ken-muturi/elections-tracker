/** IEBC constituencies and wards per county (data/kenya-wards.json, built by data/build-wards.ts) */
import * as fs from "fs"
import * as path from "path"
import { fileURLToPath } from "url"

export interface ConstituencyWards { name: string; wards: string[] }
interface WardFile { counties: { countyCode: string; county: string; constituencies: ConstituencyWards[] }[] }

const FILE = path.join(path.dirname(fileURLToPath(import.meta.url)), "../data/kenya-wards.json")
let _data: WardFile | null = null

export function getCountyConstituencies(countyCode: string): ConstituencyWards[] {
  _data ??= JSON.parse(fs.readFileSync(FILE, "utf-8")) as WardFile
  return _data.counties.find((c) => c.countyCode === countyCode)?.constituencies ?? []
}
