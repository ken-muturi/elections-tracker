/**
 * Hesabu scraper constants — all 47 Kenya counties
 * Equitable share figures from National Treasury DoRA FY 2025/2026
 * Source: peopledaily.digital/news/2025-26-budget-national-govt-allocates-ksh405b-to-counties
 */

export interface CountyMeta {
  name: string
  code: string
  equitableShare2026: number // KES (from NT DoRA 2025)
  website: string
  assemblyWebsite: string
  region: string
  profile: "asal" | "urban" | "agricultural" | "mixed" | "central" | "nairobi"
}

export const COUNTIES: CountyMeta[] = [
  { name: "Baringo",          code: "030", equitableShare2026: 7_000_000_000,  website: "baringo.go.ke",         assemblyWebsite: "baringoassembly.go.ke",       region: "Rift Valley",    profile: "mixed" },
  { name: "Bomet",            code: "036", equitableShare2026: 7_300_000_000,  website: "bomet.go.ke",           assemblyWebsite: "bometassembly.go.ke",         region: "Rift Valley",    profile: "agricultural" },
  { name: "Bungoma",          code: "039", equitableShare2026: 11_700_000_000, website: "bungoma.go.ke",         assemblyWebsite: "bungomaassembly.go.ke",       region: "Western",        profile: "agricultural" },
  { name: "Busia",            code: "040", equitableShare2026: 7_900_000_000,  website: "busia.go.ke",           assemblyWebsite: "busiaassembly.go.ke",         region: "Western",        profile: "agricultural" },
  { name: "Elgeyo Marakwet",  code: "028", equitableShare2026: 5_000_000_000,  website: "elgeyomarakwet.go.ke",  assemblyWebsite: "elgeyomarakwetassembly.go.ke",region: "Rift Valley",    profile: "agricultural" },
  { name: "Embu",             code: "014", equitableShare2026: 5_600_000_000,  website: "embu.go.ke",            assemblyWebsite: "embuassembly.go.ke",          region: "Eastern",        profile: "central" },
  { name: "Garissa",          code: "007", equitableShare2026: 8_700_000_000,  website: "garissa.go.ke",         assemblyWebsite: "garissaassembly.go.ke",       region: "North Eastern",  profile: "asal" },
  { name: "Homa Bay",         code: "043", equitableShare2026: 8_500_000_000,  website: "homabay.go.ke",         assemblyWebsite: "homabayassembly.go.ke",       region: "Nyanza",         profile: "agricultural" },
  { name: "Isiolo",           code: "011", equitableShare2026: 5_100_000_000,  website: "isiolo.go.ke",          assemblyWebsite: "isioloassembly.go.ke",        region: "Eastern",        profile: "asal" },
  { name: "Kajiado",          code: "034", equitableShare2026: 7_600_000_000,  website: "kajiado.go.ke",         assemblyWebsite: "kajiadoassembly.go.ke",       region: "Rift Valley",    profile: "mixed" },
  { name: "Kakamega",         code: "037", equitableShare2026: 13_500_000_000, website: "kakamega.go.ke",        assemblyWebsite: "kakamegaassembly.go.ke",      region: "Western",        profile: "agricultural" },
  { name: "Kericho",          code: "035", equitableShare2026: 7_100_000_000,  website: "kericho.go.ke",         assemblyWebsite: "keirchoassembly.go.ke",       region: "Rift Valley",    profile: "agricultural" },
  { name: "Kiambu",           code: "022", equitableShare2026: 11_500_000_000, website: "kiambu.go.ke",          assemblyWebsite: "kiambuassembly.go.ke",        region: "Central",        profile: "central" },
  { name: "Kilifi",           code: "003", equitableShare2026: 10_100_000_000, website: "kilifi.go.ke",          assemblyWebsite: "kilifiassembly.go.ke",        region: "Coast",          profile: "urban" },
  { name: "Kirinyaga",        code: "020", equitableShare2026: 5_300_000_000,  website: "kirinyaga.go.ke",       assemblyWebsite: "kirinyagaassembly.go.ke",     region: "Central",        profile: "central" },
  { name: "Kisii",            code: "045", equitableShare2026: 9_700_000_000,  website: "kisii.go.ke",           assemblyWebsite: "kisiiassembly.go.ke",         region: "Nyanza",         profile: "agricultural" },
  { name: "Kisumu",           code: "042", equitableShare2026: 8_500_000_000,  website: "kisumu.go.ke",          assemblyWebsite: "kisumuassembly.go.ke",        region: "Nyanza",         profile: "urban" },
  { name: "Kitui",            code: "015", equitableShare2026: 9_500_000_000,  website: "kitui.go.ke",           assemblyWebsite: "kituiassembly.go.ke",         region: "Eastern",        profile: "mixed" },
  { name: "Kwale",            code: "002", equitableShare2026: 6_500_000_000,  website: "kwale.go.ke",           assemblyWebsite: "kwaleassembly.go.ke",         region: "Coast",          profile: "urban" },
  { name: "Laikipia",         code: "031", equitableShare2026: 5_300_000_000,  website: "laikipia.go.ke",        assemblyWebsite: "laikipiaassembly.go.ke",      region: "Rift Valley",    profile: "mixed" },
  { name: "Lamu",             code: "005", equitableShare2026: 3_700_000_000,  website: "lamu.go.ke",            assemblyWebsite: "lamuassembly.go.ke",          region: "Coast",          profile: "asal" },
  { name: "Machakos",         code: "016", equitableShare2026: 9_300_000_000,  website: "machakos.go.ke",        assemblyWebsite: "machakosassembly.go.ke",      region: "Eastern",        profile: "mixed" },
  { name: "Makueni",          code: "017", equitableShare2026: 8_000_000_000,  website: "makueni.go.ke",         assemblyWebsite: "makueniassembly.go.ke",       region: "Eastern",        profile: "mixed" },
  { name: "Mandera",          code: "009", equitableShare2026: 10_600_000_000, website: "mandera.go.ke",         assemblyWebsite: "manderaassembly.go.ke",       region: "North Eastern",  profile: "asal" },
  { name: "Marsabit",         code: "010", equitableShare2026: 7_700_000_000,  website: "marsabit.go.ke",        assemblyWebsite: "marsabitassembly.go.ke",      region: "Eastern",        profile: "asal" },
  { name: "Meru",             code: "012", equitableShare2026: 10_300_000_000, website: "meru.go.ke",            assemblyWebsite: "meruassembly.go.ke",          region: "Eastern",        profile: "agricultural" },
  { name: "Migori",           code: "044", equitableShare2026: 7_900_000_000,  website: "migori.go.ke",          assemblyWebsite: "migoriassembly.go.ke",        region: "Nyanza",         profile: "agricultural" },
  { name: "Mombasa",          code: "001", equitableShare2026: 8_300_000_000,  website: "mombasa.go.ke",         assemblyWebsite: "mombasaassembly.go.ke",       region: "Coast",          profile: "urban" },
  { name: "Murang'a",         code: "021", equitableShare2026: 7_800_000_000,  website: "muranga.go.ke",         assemblyWebsite: "murangaassembly.go.ke",       region: "Central",        profile: "central" },
  { name: "Nairobi",          code: "047", equitableShare2026: 21_100_000_000, website: "nairobi.go.ke",         assemblyWebsite: "nairobiassembly.go.ke",       region: "Nairobi",        profile: "nairobi" },
  { name: "Nakuru",           code: "032", equitableShare2026: 14_300_000_000, website: "nakuru.go.ke",          assemblyWebsite: "nakuruassembly.go.ke",        region: "Rift Valley",    profile: "mixed" },
  { name: "Nandi",            code: "029", equitableShare2026: 7_700_000_000,  website: "nandi.go.ke",           assemblyWebsite: "nandiassembly.go.ke",         region: "Rift Valley",    profile: "agricultural" },
  { name: "Narok",            code: "033", equitableShare2026: 9_600_000_000,  website: "narok.go.ke",           assemblyWebsite: "narokassembly.go.ke",         region: "Rift Valley",    profile: "mixed" },
  { name: "Nyamira",          code: "046", equitableShare2026: 5_600_000_000,  website: "nyamira.go.ke",         assemblyWebsite: "nyamiraassembly.go.ke",       region: "Nyanza",         profile: "agricultural" },
  { name: "Nyandarua",        code: "018", equitableShare2026: 6_200_000_000,  website: "nyandarua.go.ke",       assemblyWebsite: "nyandaruaassembly.go.ke",     region: "Central",        profile: "central" },
  { name: "Nyeri",            code: "019", equitableShare2026: 6_800_000_000,  website: "nyeri.go.ke",           assemblyWebsite: "nyeriassembly.go.ke",         region: "Central",        profile: "central" },
  { name: "Samburu",          code: "025", equitableShare2026: 5_900_000_000,  website: "samburu.go.ke",         assemblyWebsite: "samburuassembly.go.ke",       region: "Rift Valley",    profile: "asal" },
  { name: "Siaya",            code: "041", equitableShare2026: 7_600_000_000,  website: "siaya.go.ke",           assemblyWebsite: "siayaassembly.go.ke",         region: "Nyanza",         profile: "agricultural" },
  { name: "Taita Taveta",     code: "006", equitableShare2026: 5_300_000_000,  website: "taitataveta.go.ke",     assemblyWebsite: "taitatavataassembly.go.ke",   region: "Coast",          profile: "mixed" },
  { name: "Tana River",       code: "004", equitableShare2026: 7_100_000_000,  website: "tanariver.go.ke",       assemblyWebsite: "tanariverassembly.go.ke",     region: "Coast",          profile: "asal" },
  { name: "Tharaka Nithi",    code: "013", equitableShare2026: 4_600_000_000,  website: "tharaka-nithi.go.ke",   assemblyWebsite: "tharakanithi.assembly.go.ke", region: "Eastern",        profile: "agricultural" },
  { name: "Trans Nzoia",      code: "026", equitableShare2026: 7_900_000_000,  website: "transnzoia.go.ke",      assemblyWebsite: "transnzoiaassembly.go.ke",    region: "Rift Valley",    profile: "agricultural" },
  { name: "Turkana",          code: "023", equitableShare2026: 13_800_000_000, website: "turkana.go.ke",         assemblyWebsite: "turkanaassembly.go.ke",       region: "Rift Valley",    profile: "asal" },
  { name: "Uasin Gishu",      code: "027", equitableShare2026: 8_900_000_000,  website: "uasingishu.go.ke",      assemblyWebsite: "uasingishuassembly.go.ke",    region: "Rift Valley",    profile: "mixed" },
  { name: "Vihiga",           code: "038", equitableShare2026: 5_500_000_000,  website: "vihiga.go.ke",          assemblyWebsite: "vihigaassembly.go.ke",        region: "Western",        profile: "agricultural" },
  { name: "Wajir",            code: "008", equitableShare2026: 10_300_000_000, website: "wajir.go.ke",           assemblyWebsite: "wajircountyassembly.go.ke",   region: "North Eastern",  profile: "asal" },
  { name: "West Pokot",       code: "024", equitableShare2026: 6_900_000_000,  website: "westpokot.go.ke",       assemblyWebsite: "westpokotassembly.go.ke",     region: "Rift Valley",    profile: "asal" },
]

export const PRIORITY_COUNTIES = ["Baringo", "Wajir", "Isiolo", "Marsabit", "Kilifi"]

export const STANDARD_SECTORS = [
  "Agriculture & Livestock",
  "Health Services",
  "Infrastructure & Public Works",
  "Education & ICT",
  "Water & Environment",
  "Lands & Physical Planning",
  "County Administration",
  "Trade & Tourism",
  "Other Programmes",
]

export const NEWS_SOURCES = [
  { name: "Daily Nation",   domain: "nation.africa",          countyPath: "/kenya/counties/" },
  { name: "The Standard",   domain: "standardmedia.co.ke",    countyPath: "/rift-valley/" },
  { name: "The Star",       domain: "the-star.co.ke",         countyPath: "/counties/" },
  { name: "People Daily",   domain: "peopledaily.digital",    countyPath: "/" },
  { name: "KNA",            domain: "kenyanews.go.ke",        countyPath: "/" },
]

export const SEARCH_QUERIES = {
  budget: (county: string) => [
    `"${county} County" approved budget 2025 2026`,
    `"${county} County" programme based budget FY 2025`,
    `"${county} County" budget estimates 2025/2026`,
  ],
  stalledProjects: (county: string) => [
    `"${county} County" stalled projects 2024 2025`,
    `"${county} County" Controller of Budget stalled`,
    `"${county} County" abandoned construction projects`,
    `"${county} County" zero development expenditure audit`,
  ],
  serviceDelivery: (county: string) => [
    `"${county} County" health facility not operational 2024`,
    `"${county} County" borehole water project incomplete`,
    `"${county} County" road stalled abandoned contractor`,
    `"${county} County" residents protest service delivery`,
    `"${county} County" school classroom incomplete abandoned`,
  ],
  audit: (county: string) => [
    `"${county} County" Auditor General report 2024`,
    `"${county} County" irregular expenditure audit`,
    `"${county} County" pending bills Controller of Budget`,
  ],
}
