# HESABU — County Data Scraper & Seed Generator
## Claude Code Prompt: Real Service Delivery Gap Data for All 47 Counties

---

## OBJECTIVE

Build a data pipeline that scrapes real, verified budget and service delivery data for Kenya's 47 counties and outputs structured JSON seed files for the Hesabu platform. Every piece of data must be traceable to a real source — no fabrication.

---

## PROMPT FOR CLAUDE CODE

```
Build a data scraping and processing pipeline for the Hesabu budget transparency platform. The goal is to collect REAL, VERIFIED data for all 47 Kenyan counties from official government sources and credible news outlets, then output structured JSON seed files.

## WHAT WE NEED PER COUNTY

For each of Kenya's 47 counties, collect:

### 1. BUDGET DATA (from official sources)
- Total approved budget FY 2025/2026
- Recurrent expenditure amount and percentage
- Development expenditure amount and percentage
- Equitable share allocation from national government
- Own-source revenue target and collection rate
- Budget absorption rate (if available from Controller of Budget quarterly reports)

### 2. SECTOR ALLOCATIONS (from Programme Based Budgets)
For each county department/sector:
- Department name
- Allocated amount
- Spent amount (from most recent quarterly report)
- Absorption rate
- Key programmes under that sector

### 3. WARD DATA (from CIDP and CADP documents)
For each ward in the county:
- Ward name
- Sub-county it belongs to
- Population (from 2019 Census or latest KNBS projections)
- Number of development projects (from CADP)
- Completion status breakdown if available

### 4. REAL SERVICE DELIVERY GAP REPORTS (from news and audit reports)
For each county, find 5-10 real, reported issues:
- What the issue is (stalled project, missing equipment, abandoned construction, etc.)
- Which ward/sub-county it's in
- Which sector it falls under
- Source (news article URL, audit report reference)
- Date reported
- Status (resolved/unresolved/investigating) based on latest available info
- Financial amount involved if known

## DATA SOURCES TO SCRAPE (in priority order)

### Tier 1: Official Government Sources
These are the most authoritative. Always check these first.

1. **Controller of Budget Reports**
   - URL: https://cob.go.ke/reports/
   - Contains: Quarterly county budget implementation reviews, stalled projects lists, absorption rates
   - Format: PDF reports — extract tables and stalled project lists
   - CRITICAL: The Q1 FY 2025/2026 report (covering Jul-Sep 2025) lists stalled projects per county with values and amounts paid

2. **County Government Websites**
   Pattern: https://www.[countyname].go.ke
   - Finance/Economic Planning department pages have PBBs, CADPs, revenue statements
   - Key counties and their sites:
     - Baringo: baringo.go.ke
     - Wajir: wajir.go.ke  
     - Isiolo: isiolo.go.ke
     - Marsabit: marsabit.go.ke
     - Kilifi: kilifi.go.ke
     - Nairobi: nairobi.go.ke
     - Mombasa: mombasa.go.ke
     - Nakuru: nakuru.go.ke
     - Turkana: turkana.go.ke
     - Garissa: garissa.go.ke
   - Look for pages like /finance-and-economic-planning/ or /budget-documents/

3. **County Assembly Websites**
   Pattern: https://[countyname]assembly.go.ke
   - Budget cycle documents, approved estimates
   - Example: baringoassembly.go.ke has CADP downloads

4. **KIPPRA Budget Repository**
   - URL: https://repository.kippra.or.ke
   - Contains: Programme Based Budgets, CADPs, CBROPs for most counties
   - Search by county name to find documents
   - Most comprehensive single source for county budget documents

5. **National Treasury**
   - URL: https://www.treasury.go.ke
   - Contains: Division of Revenue Act (equitable share per county), Budget Policy Statements
   - The FY 2025/2026 equitable share allocations per county:
     Baringo: KSh 7.0B, Bomet: KSh 7.3B, Bungoma: KSh 11.7B, Busia: KSh 7.9B,
     Elgeyo Marakwet: KSh 5.0B, Embu: KSh 5.6B, Garissa: KSh 8.7B, Homa Bay: KSh 8.5B,
     Isiolo: KSh 5.1B, Kajiado: KSh 7.6B, Kakamega: KSh 13.5B, Kericho: KSh 7.1B,
     Kiambu: KSh 11.5B, Kilifi: KSh 10.1B, Kirinyaga: KSh 5.3B, Kisii: KSh 9.7B,
     Kisumu: KSh 8.5B, Kitui: KSh 9.5B, Kwale: KSh 6.5B, Laikipia: KSh 5.3B,
     Lamu: KSh 3.7B, Machakos: KSh 9.3B, Makueni: KSh 8.0B, Mandera: KSh 10.6B,
     Marsabit: KSh 7.7B, Meru: KSh 10.3B, Migori: KSh 7.9B, Mombasa: KSh 8.3B,
     Murang'a: KSh 7.8B, Nairobi: KSh 21.1B, Nakuru: KSh 14.3B, Nandi: KSh 7.7B,
     Narok: KSh 9.6B, Nyamira: KSh 5.6B, Nyandarua: KSh 6.2B, Nyeri: KSh 6.8B,
     Samburu: KSh 5.9B, Siaya: KSh 7.6B, Taita Taveta: KSh 5.3B, Tana River: KSh 7.1B,
     Tharaka Nithi: KSh 4.6B, Trans Nzoia: KSh 7.9B, Turkana: KSh 13.8B,
     Uasin Gishu: KSh 8.9B, Vihiga: KSh 5.5B, Wajir: KSh 10.3B, West Pokot: KSh 6.9B

6. **Kenya National Bureau of Statistics (KNBS)**
   - URL: https://www.knbs.or.ke
   - Contains: 2019 Census data (population by county, sub-county, ward), poverty rates
   - Ward-level population data is essential for per-capita analysis

7. **Auditor General Reports**
   - URL: https://www.oagkenya.go.ke
   - Contains: County audit reports flagging irregular expenditure, stalled projects, unaccounted funds
   - Extremely valuable for service delivery gap data

### Tier 2: Credible News Sources
For real service delivery complaints, stalled projects, and citizen grievances.

8. **Daily Nation (nation.africa)**
   - Search pattern: "[County name] stalled projects" OR "[County name] budget" OR "[County name] service delivery"
   - County-specific pages: nation.africa/kenya/counties/[countyname]
   - High quality investigative reporting on county governance

9. **The Standard (standardmedia.co.ke)**
   - Search pattern: "[County name] audit stalled projects"
   - Good coverage of Controller of Budget findings

10. **The Star (the-star.co.ke)**
    - Search pattern: "[County name] county projects incomplete"
    - Good coverage of county governance issues

11. **People Daily (peopledaily.digital)**
    - County budget coverage

12. **Kenya News Agency (kenyanews.go.ke)**
    - Official government news service — covers county project launches and completions

### Tier 3: Specialized Sources

13. **Kenya Open Data Portal**
    - URL: https://opendata.go.ke
    - Various county-level datasets

14. **IEBC Ward Data**
    - Ward boundaries and names per county

15. **Kenya Law (kenyalaw.org)**
    - County Finance Acts, Division of Revenue Acts

## SCRAPING STRATEGY

### Phase 1: Budget Totals (all 47 counties)
Use web search to find each county's approved FY 2025/2026 budget.
Search queries to use per county:
- "[County] County approved budget 2025/2026"
- "[County] County programme based budget 2025 2026"
- "[County] County equitable share 2025"

Output: counties_budget.json

### Phase 2: Sector Breakdowns (start with 5 priority counties)
Priority counties: Baringo, Wajir, Isiolo, Marsabit, Kilifi
For each, find the PBB document and extract department-level allocations.
Search queries:
- "[County] County programme based budget 2025/2026 sector allocation"
- "[County] County CADP 2026/2027" (these review the previous year's spending)
- site:repository.kippra.or.ke [County]

Output: sectors_by_county.json

### Phase 3: Ward Data (start with 5 priority counties)
For each priority county, get ward list with sub-counties and populations.
Sources:
- KNBS 2019 Census (Volume III has ward-level data)
- County CIDPs list all wards
Search queries:
- "[County] County wards list sub-counties population"
- "[County] County CIDP 2023-2027 wards"

Output: wards_by_county.json

### Phase 4: Real Service Delivery Reports (all counties where available)
For each county, search for real stalled projects and citizen complaints.
Search queries per county:
- "[County] County stalled projects 2024 2025"
- "[County] County Controller of Budget audit"
- "[County] County road health water incomplete abandoned"
- "[County] County residents protest service delivery"
- "[County] County Auditor General irregular expenditure"

Output: reports_by_county.json

## OUTPUT FORMAT

### counties_budget.json
{
  "counties": [
    {
      "name": "Baringo",
      "code": "030",
      "total_budget": 9459567317,
      "recurrent": 5788600834,
      "development": 3670966482,
      "recurrent_pct": 61,
      "development_pct": 39,
      "equitable_share": 7000000000,
      "own_source_revenue_target": null,
      "own_source_revenue_collected": null,
      "absorption_rate": 64,
      "fiscal_year": "2025/2026",
      "sources": [
        {
          "description": "Baringo County Approved Budget FY 2025/2026",
          "url": "https://baringo.go.ke/finance-and-economic-planning/",
          "date_accessed": "2026-04-25"
        },
        {
          "description": "National Treasury equitable share allocation",
          "url": "https://peopledaily.digital/news/2025-26-budget-national-govt-allocates-ksh405b-to-counties",
          "date_accessed": "2026-04-25"
        }
      ]
    }
  ]
}

### sectors_by_county.json
{
  "county": "Baringo",
  "fiscal_year": "2025/2026",
  "sectors": [
    {
      "name": "Agriculture & Livestock",
      "allocated": 1230000000,
      "spent": 782000000,
      "absorption_pct": 64,
      "description": "Livestock improvement, pasture/fodder, irrigation",
      "source": "Baringo County PBB FY 2025/2026"
    }
  ]
}

### wards_by_county.json
{
  "county": "Baringo",
  "wards": [
    {
      "name": "Baringo Central",
      "sub_county": "Baringo Central",
      "population": 82340,
      "population_source": "KNBS 2019 Census",
      "total_projects": 28,
      "completed": 21,
      "pending": 5,
      "stalled": 2,
      "projects_source": "CADP 2026/2027"
    }
  ]
}

### reports_by_county.json
{
  "county": "Baringo",
  "reports": [
    {
      "title": "16 development projects worth KSh 217M stalled as of Sep 2025 — zero development expenditure in Q1 FY 2025/2026",
      "ward": "Countywide",
      "sector": "County Administration",
      "status": "unresolved",
      "amount_involved": 217440000,
      "amount_paid": 126840000,
      "date_reported": "2026-01-07",
      "source_name": "The Standard",
      "source_url": "https://www.standardmedia.co.ke/rift-valley/article/2001537983/baringo-sh217m-projects-stall-audit-reveals-failure",
      "original_source": "Controller of Budget Q1 FY 2025/2026 Report"
    },
    {
      "title": "Kabarnet Stadium stalled since 2014 — over KSh 40M spent, 4 people dead from falls at exposed cliff",
      "ward": "Baringo Central",
      "sector": "Infrastructure & Roads",
      "status": "unresolved",
      "amount_involved": 63000000,
      "amount_paid": 47666000,
      "date_reported": "2025-09-13",
      "source_name": "Daily Nation",
      "source_url": "https://nation.africa/kenya/counties/baringo/stalled-kabarnet-stadium-project-5191890",
      "original_source": "Controller of Budget audit reports"
    },
    {
      "title": "KSh 2.8B Marigat-Mochongoi road abandoned midway — construction started 2018, contractor failed to deliver",
      "ward": "Baringo South / Mogotio",
      "sector": "Infrastructure & Roads",
      "status": "investigating",
      "amount_involved": 2800000000,
      "date_reported": "2025-10-28",
      "source_name": "Daily Nation",
      "source_url": "https://nation.africa/kenya/counties/baringo/baringo-set-for-multi-billion-shilling-projects-after-gideon-moi-deal-5248864",
      "original_source": "Presidential visit / KERRA records",
      "notes": "New contractor appointed Oct 2025 after Ruto-Gideon pact"
    },
    {
      "title": "9 ECD classrooms worth KSh 9M abandoned after contractors declined to proceed",
      "ward": "Multiple wards",
      "sector": "Education & Vocational Training",
      "status": "unresolved",
      "amount_involved": 9000000,
      "date_reported": "2025-10-24",
      "source_name": "Daily Nation",
      "source_url": "https://nation.africa/kenya/counties/audit-reveals-how-contractors-derail-development-in-counties-5243008",
      "original_source": "Controller of Budget FY 2024/2025 report"
    },
    {
      "title": "45+ health facilities built between 2013-2017 remain non-functional — no staff or equipment deployed",
      "ward": "Countywide (worst in Tiaty)",
      "sector": "Health Services",
      "status": "unresolved",
      "amount_involved": null,
      "date_reported": "2023-04-16",
      "source_name": "Daily Nation",
      "source_url": "https://nation.africa/kenya/counties/baringo/outcry-as-45-health-facilities-in-baringo-county-lie-in-ruins-4200784",
      "original_source": "County records and field reporting",
      "notes": "Toplen HC (KSh 6.7M, Tiaty East) and Nasorot dispensary (KSh 5.6M, Baringo-Turkana border) specifically named"
    },
    {
      "title": "Eldama Ravine residents block Nakuru-Eldoret Highway protesting failed Torongo-Tugumoi-Soibei road promise",
      "ward": "Eldama Ravine",
      "sector": "Infrastructure & Roads",
      "status": "unresolved",
      "amount_involved": null,
      "date_reported": "2024-07-15",
      "source_name": "The Standard",
      "source_url": "https://www.standardmedia.co.ke/rift-valley/article/2001502310/poor-roads-fuel-protests-in-baringo",
      "original_source": "On-ground reporting"
    },
    {
      "title": "Loyamorok Ward (Tiaty East) — only water source is Lake Baringo 15km away or a fluctuating solar borehole",
      "ward": "Tiaty East",
      "sector": "Water, Environment & Natural Resources",
      "status": "unresolved",
      "amount_involved": null,
      "date_reported": "2023-07-19",
      "source_name": "Northern Rangelands Trust / EU RangER",
      "source_url": "https://www.nrt-kenya.org/news-2/2023/7/18/flow-of-hope-transforming-lives-in-remote-baringo-county-through-reliable-water-solutions",
      "original_source": "NRT field assessment",
      "notes": "Only 10% of Tiaty East population has access to functional boreholes/wells"
    },
    {
      "title": "Baringo has highest value of stalled projects nationally at KSh 1.3B — only KSh 131M spent",
      "ward": "Countywide",
      "sector": "Multiple",
      "status": "unresolved",
      "amount_involved": 1300000000,
      "amount_paid": 131000000,
      "date_reported": "2025-10-24",
      "source_name": "Daily Nation",
      "source_url": "https://nation.africa/kenya/counties/audit-reveals-how-contractors-derail-development-in-counties-5243008",
      "original_source": "Controller of Budget FY 2024/2025 Annual Report"
    }
  ]
}

## TECH IMPLEMENTATION

### Dependencies
- node-fetch or axios (HTTP requests)
- cheerio (HTML parsing)
- pdf-parse (for extracting text from PDF budget documents)
- fs/path (file system operations)

### Architecture
/hesabu-data-scraper/
├── src/
│   ├── scrapers/
│   │   ├── cob-reports.ts          # Controller of Budget quarterly reports
│   │   ├── county-budgets.ts       # County PBB and CADP documents
│   │   ├── national-treasury.ts    # Equitable share allocations
│   │   ├── news-scraper.ts         # Nation, Standard, Star articles
│   │   ├── kippra.ts               # KIPPRA repository documents
│   │   └── knbs.ts                 # Census ward population data
│   ├── processors/
│   │   ├── budget-extractor.ts     # Parse budget figures from PDFs/HTML
│   │   ├── report-classifier.ts    # Classify reports by sector and ward
│   │   └── deduplicator.ts         # Remove duplicate reports across sources
│   ├── output/
│   │   ├── counties_budget.json
│   │   ├── sectors_by_county/
│   │   │   ├── baringo.json
│   │   │   ├── wajir.json
│   │   │   └── ...
│   │   ├── wards_by_county/
│   │   │   ├── baringo.json
│   │   │   └── ...
│   │   └── reports_by_county/
│   │       ├── baringo.json
│   │       └── ...
│   ├── constants/
│   │   ├── counties.ts             # All 47 counties with codes, names, websites
│   │   ├── sectors.ts              # Standard sector/department names
│   │   └── search-queries.ts       # Pre-built search queries per county
│   └── index.ts                    # Main orchestrator
├── package.json
└── README.md

### Key Implementation Notes

1. **Rate limiting**: Add 2-3 second delays between requests to avoid getting blocked. News sites especially will throttle aggressive scraping.

2. **PDF extraction**: Many county budget documents are PDFs. Use pdf-parse to extract text, then use regex or Claude API to structure the data from the extracted text.

3. **Claude API for structuring**: For messy PDF text or complex news articles, send the raw text to the Claude API with a structured extraction prompt:
   
   const response = await fetch("https://api.anthropic.com/v1/messages", {
     method: "POST",
     headers: { "Content-Type": "application/json" },
     body: JSON.stringify({
       model: "claude-sonnet-4-20250514",
       max_tokens: 1000,
       messages: [{
         role: "user",
         content: `Extract structured budget data from this county document text. Return ONLY valid JSON with fields: total_budget, recurrent, development, sectors (array of {name, allocated, spent}). If a value is not found, use null. Do not guess or fabricate numbers.\n\nDocument text:\n${pdfText}`
       }]
     })
   });

4. **Source tracking**: EVERY data point must have a source URL and access date. The platform's credibility depends on this. If you can't find a verified source for a data point, mark it as null rather than guessing.

5. **Freshness markers**: Add a "last_verified" date to each data point. Budget data from 2023 should be marked differently from 2025/2026 data.

6. **Deduplication**: The same stalled project may appear in multiple news articles. Deduplicate by matching project name + ward + sector, keeping the most recent report.

## SEARCH QUERY TEMPLATES

For each of the 47 counties, run these search patterns:

### Budget data queries:
- "{county} County approved budget 2025 2026"
- "{county} County programme based budget FY 2025"
- "{county} County budget estimates"

### Stalled projects queries:
- "{county} County stalled projects 2025"
- "{county} County Controller of Budget audit"
- "{county} County abandoned projects"
- "{county} County zero development expenditure"

### Service delivery queries:
- "{county} County water borehole incomplete"
- "{county} County health facility not operational"
- "{county} County road stalled abandoned"
- "{county} County residents protest service delivery"
- "{county} County school classrooms incomplete"

### Audit queries:
- "{county} County Auditor General report 2024"
- "{county} County irregular expenditure"
- "{county} County pending bills"

## ALL 47 COUNTIES LIST

Use this as your iteration list:

const COUNTIES = [
  "Baringo", "Bomet", "Bungoma", "Busia", "Elgeyo Marakwet",
  "Embu", "Garissa", "Homa Bay", "Isiolo", "Kajiado",
  "Kakamega", "Kericho", "Kiambu", "Kilifi", "Kirinyaga",
  "Kisii", "Kisumu", "Kitui", "Kwale", "Laikipia",
  "Lamu", "Machakos", "Makueni", "Mandera", "Marsabit",
  "Meru", "Migori", "Mombasa", "Murang'a", "Nairobi",
  "Nakuru", "Nandi", "Narok", "Nyamira", "Nyandarua",
  "Nyeri", "Samburu", "Siaya", "Taita Taveta", "Tana River",
  "Tharaka Nithi", "Trans Nzoia", "Turkana", "Uasin Gishu",
  "Vihiga", "Wajir", "West Pokot"
];

## PRIORITY ORDER

Start with the 5 Nuru Trust counties (Baringo, Wajir, Isiolo, Marsabit, Kilifi), then expand to remaining 42. For each county, do budget data first (fastest), then reports (most impactful for the demo), then sectors and wards.

## CRITICAL RULES

1. NEVER fabricate data. If a search returns nothing, output null and move on.
2. ALWAYS include source URLs. No source = no data point.
3. Prefer official government sources over news articles for budget figures.
4. Prefer news articles over government sources for service delivery gaps (governments don't self-report failures).
5. Cross-reference when possible: if the Controller of Budget says 16 projects stalled and a news article names them, link both sources.
6. Mark data confidence level: "verified" (from official docs), "reported" (from credible news), "estimated" (calculated from partial data).
```

---

## FOLLOW-UP PROMPTS

After the initial scraper is built, use these:

### Run for priority counties first:
```
Run the scraper for the 5 priority counties: Baringo, Wajir, Isiolo, Marsabit, Kilifi. Start with budget totals, then search for stalled projects and service delivery reports. Output the JSON files.
```

### Add a cron-style update mechanism:
```
Add a scheduled update system that re-runs searches monthly for new stalled project reports and Controller of Budget quarterly releases. Store a changelog of what data changed and when.
```

### Generate database seed SQL from the JSON:
```
Read all the JSON output files and generate a seed.sql file that populates the Hesabu PostgreSQL database with all counties, sectors, wards, and reports data. Include the source URLs in a sources table for transparency.
```

### Build an admin data entry UI for manual additions:
```
Build an admin page in the Hesabu app where I can manually add service delivery reports that were found through field research or community WhatsApp groups — sources that can't be scraped. Include fields for: county, ward, sector, issue title, description, source description, amount involved, photos (upload), and GPS coordinates.
```

### Validate data quality:
```
Write a validation script that checks all JSON output files for: missing source URLs, budget figures that don't add up (recurrent + development != total), duplicate reports, counties with zero reports (flag for manual research), and sectors with impossible absorption rates (>100% or negative).
```