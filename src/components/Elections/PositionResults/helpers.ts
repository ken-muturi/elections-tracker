import type { Entity, CountyGroup } from "./types"

export function groupByParent(entities: Entity[]): CountyGroup[] | null {
  if (!entities.some((e) => e.countyName)) return null;

  const countyMap = new Map<string, Map<string, Entity[]>>();
  for (const entity of entities) {
    const county = entity.countyName ?? "Other";
    const constituency = entity.constituencyName ?? "";
    if (!countyMap.has(county)) countyMap.set(county, new Map());
    const constMap = countyMap.get(county)!;
    if (!constMap.has(constituency)) constMap.set(constituency, []);
    constMap.get(constituency)!.push(entity);
  }

  return Array.from(countyMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([countyName, constMap]) => ({
      countyName,
      constituencies: Array.from(constMap.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([constituencyName, ents]) => ({
          constituencyName: constituencyName || null,
          entities: ents,
        })),
    }));
}
