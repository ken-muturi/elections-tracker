// prisma/seed_election.ts
// Seeds the database with all 47 Kenya counties, constituencies, wards, stations, streams + election data
import { PrismaClient } from '@prisma/client'
import { hash } from "bcrypt-ts";

const prisma = new PrismaClient()

// ─── Kenya Geographic Data ────────────────────────────────────────────────────
// All 47 counties with real constituency names and 2022 registered voter counts.
// Voter totals are respected: votersPerStream = floor(countyVoters / (constituencies * 3 wards * 3 stations * 2 streams))

const KENYA_COUNTIES = [
  { code: '001', name: 'Mombasa',         voters: 641913,  constituencies: ['Changamwe','Jomvu','Kisauni','Nyali','Likoni','Mvita'] },
  { code: '002', name: 'Kwale',           voters: 328253,  constituencies: ['Msambweni','Lungalunga','Matuga','Kinango'] },
  { code: '003', name: 'Kilifi',          voters: 588602,  constituencies: ['Kilifi North','Kilifi South','Kaloleni','Rabai','Ganze','Malindi','Magarini'] },
  { code: '004', name: 'Tana River',      voters: 141096,  constituencies: ['Garsen','Galole','Bura'] },
  { code: '005', name: 'Lamu',            voters: 81453,   constituencies: ['Lamu East','Lamu West'] },
  { code: '006', name: 'Taita Taveta',    voters: 181827,  constituencies: ['Tavita','Mwatate','Wundanyi','Voi'] },
  { code: '007', name: 'Garissa',         voters: 201473,  constituencies: ['Garissa Township','Balambala','Lagdera','Dadaab','Fafi','Ijara'] },
  { code: '008', name: 'Wajir',           voters: 207758,  constituencies: ['Wajir North','Wajir East','Tarbaj','Wajir West','Eldas','Wajir South'] },
  { code: '009', name: 'Mandera',         voters: 217030,  constituencies: ['Mandera North','Banissa','Mandera South','Mandera East','Lafey','Mandera West'] },
  { code: '010', name: 'Marsabit',        voters: 166912,  constituencies: ['North Horr','Saku','Laisamis','Moyale'] },
  { code: '011', name: 'Isiolo',          voters: 89504,   constituencies: ['Isiolo North','Isiolo South'] },
  { code: '012', name: 'Meru',            voters: 772139,  constituencies: ['Igembe South','Igembe Central','Igembe North','Tigania West','Tigania East','North Imenti','Buuri','Central Imenti','South Imenti'] },
  { code: '013', name: 'Tharaka-Nithi',   voters: 231932,  constituencies: ['Chuka/Igambang\'ombe','Tharaka','Maara'] },
  { code: '014', name: 'Embu',            voters: 334302,  constituencies: ['Manyatta','Runyenjes','Mbeere South','Mbeere North'] },
  { code: '015', name: 'Kitui',           voters: 532758,  constituencies: ['Mwingi North','Mwingi West','Mwingi Central','Kitui West','Kitui Rural','Kitui Central','Kitui East','Kitui South'] },
  { code: '016', name: 'Machakos',        voters: 687565,  constituencies: ['Masinga','Yatta','Kangundo','Matungulu','Kathiani','Mavoko','Machakos Town','Mwala'] },
  { code: '017', name: 'Makueni',         voters: 479401,  constituencies: ['Mbooni','Kilome','Kaiti','Makueni','Kibwezi West','Kibwezi East'] },
  { code: '018', name: 'Nyandarua',       voters: 361165,  constituencies: ['Kinangop','Kipipiri','Ol Kalou','Ol Jorok','Ndaragwa'] },
  { code: '019', name: 'Nyeri',           voters: 481632,  constituencies: ['Tetu','Kieni','Mathira','Othaya','Mukurweini','Nyeri Town'] },
  { code: '020', name: 'Kirinyaga',       voters: 376001,  constituencies: ['Mwea','Gichugu','Ndia','Kirinyaga Central'] },
  { code: '021', name: "Murang'a",        voters: 620929,  constituencies: ['Kandara','Gatanga','Kiharu','Kigumo','Maragwa','Kangema','Mathioya'] },
  { code: '022', name: 'Kiambu',          voters: 1275008, constituencies: ['Gatundu South','Gatundu North','Juja','Thika Town','Ruiru','Githunguri','Kiambu','Kiambaa','Kabete','Kikuyu','Limuru','Lari'] },
  { code: '023', name: 'Turkana',         voters: 238528,  constituencies: ['Turkana North','Turkana West','Turkana Central','Loima','Turkana South','Turkana East'] },
  { code: '024', name: 'West Pokot',      voters: 220026,  constituencies: ['Kapenguria','Sigor','Kacheliba','Pokot South'] },
  { code: '025', name: 'Samburu',         voters: 100014,  constituencies: ['Samburu North','Samburu East','Samburu West'] },
  { code: '026', name: 'Trans Nzoia',     voters: 398981,  constituencies: ['Kwanza','Endebess','Saboti','Kiminini','Cherangany'] },
  { code: '027', name: 'Uasin Gishu',     voters: 506138,  constituencies: ['Soy','Turbo','Moiben','Ainabkoi','Kapseret','Kesses'] },
  { code: '028', name: 'Elgeyo/Marakwet', voters: 213884,  constituencies: ['Marakwet East','Marakwet West','Keiyo North','Keiyo South'] },
  { code: '029', name: 'Nandi',           voters: 406288,  constituencies: ['Tinderet','Aldai','Nandi Hills','Chesumei','Emgwen','Mosop'] },
  { code: '030', name: 'Baringo',         voters: 281053,  constituencies: ['Tiaty','Baringo North','Baringo Central','Baringo South','Mogotio','Eldama Ravine'] },
  { code: '031', name: 'Laikipia',        voters: 263012,  constituencies: ['Laikipia West','Laikipia East','Laikipia North'] },
  { code: '032', name: 'Nakuru',          voters: 1054856, constituencies: ['Molo','Njoro','Mau Narok','Kuresoi South','Kuresoi North','Subukia','Rongai','Bahati','Nakuru Town West','Nakuru Town East','Naivasha'] },
  { code: '033', name: 'Narok',           voters: 398784,  constituencies: ['Kilgoris','Emurua Dikirr','Narok North','Narok East','Narok South','Narok West'] },
  { code: '034', name: 'Kajiado',         voters: 463273,  constituencies: ['Kajiado North','Kajiado Central','Kajiado East','Kajiado West','Kajiado South'] },
  { code: '035', name: 'Kericho',         voters: 428067,  constituencies: ['Kipkelion East','Kipkelion West','Ainamoi','Bureti','Belgut','Sigowet/Soin'] },
  { code: '036', name: 'Bomet',           voters: 376985,  constituencies: ['Sotik','Chepalungu','Bomet East','Bomet Central','Konoin'] },
  { code: '037', name: 'Kakamega',        voters: 844551,  constituencies: ['Lugari','Likuyani','Malava','Lurambi','Navakholo','Mumias West','Mumias East','Matungu','Butere','Khwisero','Shinyalu','Ikolomani'] },
  { code: '038', name: 'Vihiga',          voters: 310043,  constituencies: ['Vihiga','Sabatia','Hamisi','Luanda','Emuhaya'] },
  { code: '039', name: 'Bungoma',         voters: 646598,  constituencies: ['Mt. Elgon','Sirisia','Kabuchai','Bumula','Kanduyi','Webuye East','Webuye West','Kimilili','Tongaren'] },
  { code: '040', name: 'Busia',           voters: 416756,  constituencies: ['Teso North','Teso South','Nambale','Matayos','Butula','Funyula',"Budalang'i"] },
  { code: '041', name: 'Siaya',           voters: 533595,  constituencies: ['Ugenya','Ugunja','Alego Usonga','Gem','Bondo','Rarieda'] },
  { code: '042', name: 'Kisumu',          voters: 606754,  constituencies: ['Kisumu East','Kisumu West','Kisumu Central','Seme','Nyando','Muhoroni','Nyakach'] },
  { code: '043', name: 'Homa Bay',        voters: 551071,  constituencies: ['Kasipul','Kabondo Kasipul','Karachuonyo','Rangwe','Homa Bay Town','Ndhiwa','Mbita','Suba'] },
  { code: '044', name: 'Migori',          voters: 469019,  constituencies: ['Rongo','Awendo','Suna East','Suna West','Uriri','Nyatike','Kuria West','Kuria East'] },
  { code: '045', name: 'Kisii',           voters: 637010,  constituencies: ['Bonchari','South Mugirango','Bomachoge Borabu','Bobasi','Bomachoge Chache','Nyaribari Masaba','Nyaribari Chache','Kitutu Chache North','Kitutu Chache South'] },
  { code: '046', name: 'Nyamira',         voters: 323283,  constituencies: ['Kitutu Masaba','West Mugirango','North Mugirango','Borabu'] },
  { code: '047', name: 'Nairobi City',    voters: 2415310, constituencies: ['Westlands','Dagoretti North','Dagoretti South','Langata','Kibra','Roysambu','Kasarani','Ruaraka','Embakasi South','Embakasi North','Embakasi Central','Embakasi East','Embakasi West','Makadara','Kamukunji','Starehe','Mathare'] },
]

// ─── Fake name data ───────────────────────────────────────────────────────────

const MALE_FIRST = [
  'James','John','Peter','Paul','Samuel','David','Moses','Joseph','Daniel','Michael',
  'Stephen','George','Francis','Patrick','Charles','Robert','Richard','Thomas','Henry','Simon',
  'Philip','Anthony','Bernard','Gabriel','Elijah','Ezekiel','Nathan','Isaac','Aaron','Joshua',
  'Kiprotich','Kipchoge','Kiptoo','Baraka','Hassan','Mohamed','Ibrahim','Omar','Abdi','Suleiman',
]
const FEMALE_FIRST = [
  'Mary','Grace','Faith','Agnes','Elizabeth','Joyce','Alice','Catherine','Florence','Margaret',
  'Jane','Anne','Rose','Esther','Naomi','Ruth','Sarah','Rebecca','Hannah','Mercy',
  'Wanjiru','Achieng','Atieno','Njeri','Wambui','Charity','Beatrice','Lydia','Deborah','Miriam',
  'Chebet','Jebet','Jepkosgei','Fatuma','Amina','Halima','Zawadi','Zipporah','Millicent','Carolyne',
]
const SURNAMES = [
  'Kamau','Ochieng','Mwangi','Otieno','Njoroge','Odhiambo','Kimani','Auma','Waweru','Owino',
  'Kariuki','Mutua','Gitau','Onyango','Mugo','Akinyi','Ngugi','Omondi','Wanjiku','Njenga',
  'Ogola','Karanja','Awino','Kiprotich','Koech','Langat','Bett','Rotich','Mutai','Jebet',
  'Hassan','Mohamed','Ibrahim','Ali','Abdullahi','Abdi','Suleiman','Omar','Galgalo','Duba',
  'Mutiso','Musyoka','Kasyoka','Muema','Makau','Ndung\'u','Gatheru','Kuria','Githinji','Wachira',
  'Oteno','Achola','Adhiambo','Ogendo','Okello','Omolo','Ouma','Anditi','Otiende','Obiero',
]

function fakeName(seed: number, female = false): string {
  const firsts = female ? FEMALE_FIRST : MALE_FIRST
  return `${firsts[seed % firsts.length]} ${SURNAMES[(seed * 7 + 3) % SURNAMES.length]}`
}

// Party lists ordered by county tendency (first = dominant party)
const RUTO_PARTIES  = ['UDA', 'Jubilee', 'Independent', 'ANC']
const ODINGA_PARTIES = ['ODM', 'ANC', 'Wiper', 'Independent']
const SWING_PARTIES  = ['UDA', 'ODM', 'Independent', 'Jubilee']

function partyList(countyCode: string): string[] {
  if (RUTO_COUNTIES.has(countyCode))   return RUTO_PARTIES
  if (ODINGA_COUNTIES.has(countyCode)) return ODINGA_PARTIES
  return SWING_PARTIES
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function pad2(n: number): string {
  return n.toString().padStart(2, '0')
}


async function clearDatabase() {
  console.log("🗑️  Clearing existing data...");
  await prisma.levelCandidateVote.deleteMany();
  await prisma.levelResult.deleteMany();
  await prisma.streamCandidateVote.deleteMany();
  await prisma.streamResult.deleteMany();
  await prisma.agentStream.deleteMany();
  await prisma.candidate.deleteMany();
  await prisma.electionPosition.deleteMany();
  await prisma.stream.deleteMany();
  await prisma.pollingStation.deleteMany()
  await prisma.ward.deleteMany();
  await prisma.election.deleteMany();
  await prisma.constituency.deleteMany();
  await prisma.county.deleteMany();
  await prisma.session.deleteMany()
  await prisma.account.deleteMany()
  await prisma.user.deleteMany()
  await prisma.role.deleteMany()
  console.log('✅ Database cleared')
}

async function seedRoles() {
  console.log('🔑 Seeding roles...')
  await prisma.role.createMany({
    data: [
      { title: "super admin", description: "Super Administrator" },
      { title: "admin", description: "Administrator" },
      { title: "agent", description: "Polling Station Agent" },
    ],
  });
  return await prisma.role.findMany()
}

async function seedUsers(roles: { id: string; title: string }[]) {
  console.log('👥 Seeding users...')
  const hashed = await hash("password123", 10);
  const adminRole = roles.find((r) => r.title === 'super admin')!
  const agentRole = roles.find((r) => r.title === 'agent')!

  const admin = await prisma.user.create({
    data: {
      roleId: adminRole.id,
      email: "admin@election.ke",
      password: hashed,
      firstname: "Admin",
      othernames: "User",
      dateOfBirth: "1990-01-01",
      gender: "Male",
      nationalId: "ADMIN00001",
      phone: "+254700000001",
      nextOfKin: "Emergency Contact",
      nextOfKinContacts: "+254700000000",
      address: "Nairobi, Kenya",
    },
  });

  const agents = [];
  for (let i = 1; i <= 5; i++) {
    const agent = await prisma.user.create({
      data: {
        roleId: agentRole.id,
        email: `agent${i}@election.ke`,
        password: hashed,
        firstname: "Agent",
        othernames: `User ${i}`,
        dateOfBirth: "1995-01-01",
        gender: i % 2 === 0 ? "Female" : "Male",
        nationalId: `AGENT0000${i}`,
        phone: `+25470000000${i}`,
        nextOfKin: "Emergency Contact",
        nextOfKinContacts: "+254700000000",
        address: "Kenya",
      },
    });
    agents.push(agent);
  }

  console.log("✅ Created 1 admin + 5 agents");
  return { admin, agents };
}

type ConstituencyEntry = {
  id: string;
  name: string;
  code: string;
  countyName: string;
  countyCode: string;
  votersPerStream: number;
};

async function seedPermanentGeography(): Promise<
  Map<string, ConstituencyEntry>
> {
  console.log(
    "🗺️  Seeding permanent geographic hierarchy (47 counties, all constituencies)...",
  );

  const constituencyMap = new Map<string, ConstituencyEntry>();

  for (const countyData of KENYA_COUNTIES) {
    const county = await prisma.county.create({
      data: { name: countyData.name, code: countyData.code },
    });

    const numConst = countyData.constituencies.length;
    // voters per stream so county total is not exceeded
    // formula: countyVoters / (constituencies × 3 wards × 3 stations × 2 streams)
    const votersPerStream = Math.floor(
      countyData.voters / (numConst * 3 * 3 * 2),
    );

    for (let ci = 0; ci < numConst; ci++) {
      const constName = countyData.constituencies[ci];
      const constCode = `${countyData.code}-${pad2(ci + 1)}`;

      const constituency = await prisma.constituency.create({
        data: { countyId: county.id, name: constName, code: constCode },
      });

      constituencyMap.set(constCode, {
        id: constituency.id,
        name: constName,
        code: constCode,
        countyName: countyData.name,
        countyCode: countyData.code,
        votersPerStream,
      });
    }
  }

  const countyCount = await prisma.county.count();
  const constCount = await prisma.constituency.count();
  console.log(
    `✅ Seeded ${countyCount} counties, ${constCount} constituencies`,
  );
  return constituencyMap;
}

async function seedElectionGeography(
  electionId: string,
  adminId: string,
  constituencyMap: Map<string, ConstituencyEntry>,
) {
  console.log(
    "🏘️  Seeding election-scoped hierarchy (Ward → PollingStation → Stream)...",
  );

  // Build all ward data first
  const wardInputs: {
    electionId: string;
    constituencyId: string;
    name: string;
    code: string;
  }[] = [];
  for (const entry of constituencyMap.values()) {
    for (let w = 1; w <= 3; w++) {
      wardInputs.push({
        electionId,
        constituencyId: entry.id,
        name: `${entry.name} Ward ${w}`,
        code: `${entry.code}-W${w}`,
      });
    }
  }

  // Insert wards in batches of 100
  const BATCH = 100;
  for (let i = 0; i < wardInputs.length; i += BATCH) {
    await prisma.ward.createMany({ data: wardInputs.slice(i, i + BATCH) });
  }
  console.log(`  → ${wardInputs.length} wards inserted`);

  // Fetch all wards back to get their IDs
  const wards = await prisma.ward.findMany({
    where: { electionId },
    select: { id: true, code: true, name: true, constituencyId: true },
  });

  // Build a lookup: wardCode → { id, name, entry }
  const constByConstId = new Map<string, ConstituencyEntry>();
  for (const entry of constituencyMap.values()) {
    constByConstId.set(entry.id, entry);
  }

  // Build station inputs
  const stationInputs: {
    wardId: string;
    name: string;
    code: string;
    county: string;
    constituency: string;
    ward: string;
    registeredVoters: number;
    createdBy: string;
  }[] = [];

  for (const ward of wards) {
    const entry = constByConstId.get(ward.constituencyId)!;
    for (let s = 1; s <= 3; s++) {
      stationInputs.push({
        wardId: ward.id,
        name: `${ward.name} PS ${s}`,
        code: `${ward.code}-PS${s}`,
        county: entry.countyName,
        constituency: entry.name,
        ward: ward.name,
        registeredVoters: entry.votersPerStream * 2,
        createdBy: adminId,
      });
    }
  }

  for (let i = 0; i < stationInputs.length; i += BATCH) {
    await prisma.pollingStation.createMany({
      data: stationInputs.slice(i, i + BATCH),
    });
  }
  console.log(`  → ${stationInputs.length} polling stations inserted`);

  // Fetch all stations back to get IDs
  const stations = await prisma.pollingStation.findMany({
    where: { wardRef: { electionId } },
    select: { id: true, code: true, wardId: true },
  });

  // Build wardId → votersPerStream lookup
  const wardVoters = new Map<string, number>();
  for (const ward of wards) {
    const entry = constByConstId.get(ward.constituencyId)!;
    wardVoters.set(ward.id, entry.votersPerStream);
  }

  // Build stream inputs
  const streamInputs: {
    pollingStationId: string;
    name: string;
    code: string;
    registeredVoters: number;
  }[] = [];

  for (const station of stations) {
    const vps = wardVoters.get(station.wardId) ?? 0;
    for (let st = 1; st <= 2; st++) {
      streamInputs.push({
        pollingStationId: station.id,
        name: `Stream ${st}`,
        code: `${station.code}-S${st}`,
        registeredVoters: vps,
      });
    }
  }

  for (let i = 0; i < streamInputs.length; i += BATCH) {
    await prisma.stream.createMany({ data: streamInputs.slice(i, i + BATCH) });
  }
  console.log(`  → ${streamInputs.length} streams inserted`);
  console.log(
    `✅ Election hierarchy: ${wardInputs.length} wards, ${stationInputs.length} stations, ${streamInputs.length} streams`,
  );
}

/** Distribute `total` votes across `n` candidates; first candidate is the frontrunner */
function distributeVotes(
  total: number,
  n: number,
  frontShare: number,
): number[] {
  const secondShare = (1 - frontShare) * 0.65;
  const otherShare = n > 2 ? (1 - frontShare - secondShare) / (n - 2) : 0;
  const shares = [
    frontShare,
    secondShare,
    ...Array(Math.max(n - 2, 0)).fill(otherShare),
  ];
  const votes = shares.slice(0, n).map((s) => Math.floor(total * s));
  // Give rounding remainder to frontrunner
  votes[0] += total - votes.reduce((a, b) => a + b, 0);
  return votes;
}

/** Frontrunner share — 50–65% in strongholds, 40–55% in swing areas */
function frontShare(countyCode: string): number {
  if (RUTO_COUNTIES.has(countyCode) || ODINGA_COUNTIES.has(countyCode)) {
    return 0.5 + Math.random() * 0.15;
  }
  return 0.4 + Math.random() * 0.15;
}

/** Create candidates for all non-PRESIDENT positions */
async function seedCandidates(electionId: string) {
  console.log("👤 Seeding candidates for all positions...");

  const positions = await prisma.electionPosition.findMany({
    where: { electionId },
  });
  const posMap = new Map(positions.map((p) => [p.type, p]));

  const counties = await prisma.county.findMany({
    select: { id: true, code: true, name: true },
  });
  const constituencies = await prisma.constituency.findMany({
    select: { id: true, code: true, name: true, countyId: true },
  });
  const wards = await prisma.ward.findMany({
    where: { electionId },
    select: { id: true, code: true, constituencyId: true },
  });

  // county.id → county.code (for party tendency lookup)
  const countyCodeById = new Map(counties.map((c) => [c.id, c.code]));
  // constituency.id → county.code
  const countyCodeByConstId = new Map(
    constituencies.map((c) => [c.id, countyCodeById.get(c.countyId) ?? "047"]),
  );

  const BATCH = 200;
  let total = 0;

  // ── GOVERNOR, SENATOR (4 candidates per county, mixed gender) ──────────────
  for (const posType of ["GOVERNOR", "SENATOR"] as const) {
    const pos = posMap.get(posType);
    if (!pos) continue;
    const inputs: {
      positionId: string;
      name: string;
      party: string;
      entityId: string;
      sortOrder: number;
    }[] = [];
    for (const county of counties) {
      const parties = partyList(county.code);
      for (let i = 0; i < 4; i++) {
        inputs.push({
          positionId: pos.id,
          name: fakeName(
            counties.indexOf(county) * 4 +
              i +
              (posType === "SENATOR" ? 500 : 0),
            i === 2,
          ),
          party: parties[i % parties.length],
          entityId: county.id,
          sortOrder: i,
        });
      }
    }
    for (let i = 0; i < inputs.length; i += BATCH) {
      await prisma.candidate.createMany({ data: inputs.slice(i, i + BATCH) });
    }
    total += inputs.length;
    console.log(`  → ${posType}: ${inputs.length} candidates`);
  }

  // ── WOMEN_REP (3 female candidates per county) ────────────────────────────
  const womenRepPos = posMap.get("WOMEN_REP");
  if (womenRepPos) {
    const inputs: {
      positionId: string;
      name: string;
      party: string;
      entityId: string;
      sortOrder: number;
    }[] = [];
    for (const county of counties) {
      const parties = partyList(county.code);
      for (let i = 0; i < 3; i++) {
        inputs.push({
          positionId: womenRepPos.id,
          name: fakeName(counties.indexOf(county) * 3 + i + 1000, true),
          party: parties[i % parties.length],
          entityId: county.id,
          sortOrder: i,
        });
      }
    }
    for (let i = 0; i < inputs.length; i += BATCH) {
      await prisma.candidate.createMany({ data: inputs.slice(i, i + BATCH) });
    }
    total += inputs.length;
    console.log(`  → WOMEN_REP: ${inputs.length} candidates`);
  }

  // ── MP (4 candidates per constituency) ────────────────────────────────────
  const mpPos = posMap.get("MP");
  if (mpPos) {
    const inputs: {
      positionId: string;
      name: string;
      party: string;
      entityId: string;
      sortOrder: number;
    }[] = [];
    for (const con of constituencies) {
      const countyCode = countyCodeById.get(con.countyId) ?? "047";
      const parties = partyList(countyCode);
      for (let i = 0; i < 4; i++) {
        inputs.push({
          positionId: mpPos.id,
          name: fakeName(constituencies.indexOf(con) * 4 + i + 2000, i === 1),
          party: parties[i % parties.length],
          entityId: con.id,
          sortOrder: i,
        });
      }
    }
    for (let i = 0; i < inputs.length; i += BATCH) {
      await prisma.candidate.createMany({ data: inputs.slice(i, i + BATCH) });
    }
    total += inputs.length;
    console.log(`  → MP: ${inputs.length} candidates`);
  }

  // ── MCA (3 candidates per ward) ────────────────────────────────────────────
  const mcaPos = posMap.get("MCA");
  if (mcaPos) {
    const inputs: {
      positionId: string;
      name: string;
      party: string;
      entityId: string;
      sortOrder: number;
    }[] = [];
    for (const ward of wards) {
      const countyCode = countyCodeByConstId.get(ward.constituencyId) ?? "047";
      const parties = partyList(countyCode);
      for (let i = 0; i < 3; i++) {
        inputs.push({
          positionId: mcaPos.id,
          name: fakeName(wards.indexOf(ward) * 3 + i + 5000, i === 2),
          party: parties[i % parties.length],
          entityId: ward.id,
          sortOrder: i,
        });
      }
    }
    for (let i = 0; i < inputs.length; i += BATCH) {
      await prisma.candidate.createMany({ data: inputs.slice(i, i + BATCH) });
    }
    total += inputs.length;
    console.log(`  → MCA: ${inputs.length} candidates`);
  }

  console.log(`✅ ${total} candidates seeded across all positions`);
}

async function seedElection(adminId: string) {
  console.log("🗳️  Seeding sample election...");

  const election = await prisma.election.create({
    data: {
      title: "Kenyan General Election 2027",
      year: 2027,
      electionDate: new Date("2027-08-09"),
      isActive: true,
      description:
        "The fifth general election under the 2010 Constitution of Kenya.",
      createdBy: adminId,
      positions: {
        create: [
          {
            type: "PRESIDENT",
            title: "President",
            aggregationLevel: "NATIONAL",
            sortOrder: 0,
          },
          {
            type: "GOVERNOR",
            title: "Governor",
            aggregationLevel: "COUNTY",
            sortOrder: 1,
          },
          {
            type: "SENATOR",
            title: "Senator",
            aggregationLevel: "COUNTY",
            sortOrder: 2,
          },
          {
            type: "WOMEN_REP",
            title: "Women Representative",
            aggregationLevel: "COUNTY",
            sortOrder: 3,
          },
          {
            type: "MP",
            title: "Member of Parliament",
            aggregationLevel: "CONSTITUENCY",
            sortOrder: 4,
          },
          { type: "MCA", title: "MCA", aggregationLevel: "WARD", sortOrder: 5 },
        ],
      },
    },
    include: { positions: true },
  });

  const presidentPosition = election.positions.find(
    (p: { type: string }) => p.type === "PRESIDENT",
  )!;
  await prisma.candidate.createMany({
    data: [
      {
        positionId: presidentPosition.id,
        name: "Raila Odinga",
        party: "ODM",
        sortOrder: 1,
      },
      {
        positionId: presidentPosition.id,
        name: "William Ruto",
        party: "UDA",
        sortOrder: 2,
      },
      {
        positionId: presidentPosition.id,
        name: "George Wajackoyah",
        party: "Roots",
        sortOrder: 3,
      },
    ],
  });

  console.log(
    `✅ Election "${election.title}" — ${election.positions.length} positions, 3 presidential candidates`,
  );
  return election;
}

// ─── County voting tendency ───────────────────────────────────────────────────
// Ruto-leaning: Central, Rift Valley, North Eastern, Eastern
// Odinga-leaning: Nyanza, Western, Coast, Kisii/Nyamira
// Swing: Nairobi, Laikipia

const RUTO_COUNTIES = new Set([
  "007",
  "008",
  "009",
  "010",
  "011", // North Eastern + Isiolo
  "012",
  "013",
  "014",
  "015",
  "016",
  "017", // Eastern
  "018",
  "019",
  "020",
  "021",
  "022", // Central (Mt Kenya)
  "023",
  "024",
  "025",
  "026",
  "027",
  "028",
  "029", // Rift Valley North
  "030",
  "032",
  "033",
  "034",
  "035",
  "036", // Rift Valley South
]);

const ODINGA_COUNTIES = new Set([
  "001",
  "002",
  "003",
  "004",
  "005",
  "006", // Coast
  "037",
  "038",
  "039",
  "040", // Western
  "041",
  "042",
  "043",
  "044", // Nyanza
  "045",
  "046", // Kisii / Nyamira
]);
// Swing: '031' Laikipia, '047' Nairobi

type AggEntry = {
  totalVotes: number;
  rejectedVotes: number;
  candidateVotes: Map<string, number>;
};

async function insertLevelResults(
  positionId: string,
  level: "WARD" | "CONSTITUENCY" | "COUNTY" | "NATIONAL",
  agg: Map<string, AggEntry>,
  validatorId: string,
) {
  const BATCH = 100;
  const inputs = Array.from(agg.entries()).map(([entityId, d]) => ({
    positionId,
    level,
    entityId,
    validatorId,
    status: "VERIFIED" as const,
    totalVotes: d.totalVotes,
    rejectedVotes: d.rejectedVotes,
    submittedAt: new Date(),
  }));

  for (let i = 0; i < inputs.length; i += BATCH) {
    await prisma.levelResult.createMany({ data: inputs.slice(i, i + BATCH) });
  }

  const inserted = await prisma.levelResult.findMany({
    where: { positionId, level },
    select: { id: true, entityId: true },
  });
  const idMap = new Map(inserted.map((r) => [r.entityId, r.id]));

  const voteInputs: {
    levelResultId: string;
    candidateId: string;
    votes: number;
  }[] = [];
  for (const [entityId, d] of agg.entries()) {
    const resultId = idMap.get(entityId)!;
    for (const [candidateId, votes] of d.candidateVotes.entries()) {
      voteInputs.push({ levelResultId: resultId, candidateId, votes });
    }
  }
  for (let i = 0; i < voteInputs.length; i += BATCH) {
    await prisma.levelCandidateVote.createMany({
      data: voteInputs.slice(i, i + BATCH),
    });
  }
  console.log(
    `  → ${level}: ${inputs.length} results, ${voteInputs.length} candidate vote rows`,
  );
}

async function seedAllVoteData(electionId: string, adminId: string) {
  console.log("📊 Seeding vote data for all positions...");

  const BATCH = 200;
  const countyCodeByName = new Map(KENYA_COUNTIES.map((c) => [c.name, c.code]));

  // ── Fetch geographic lookups ────────────────────────────────────────────────
  const dbCounties = await prisma.county.findMany({
    select: { id: true, code: true },
  });
  const countyIdByCode = new Map(dbCounties.map((c) => [c.code, c.id]));

  // ── Fetch all streams with geography ───────────────────────────────────────
  const rawStreams = await prisma.stream.findMany({
    where: { pollingStation: { wardRef: { electionId } } },
    select: {
      id: true,
      registeredVoters: true,
      pollingStation: {
        select: {
          wardId: true,
          county: true,
          wardRef: { select: { id: true, constituencyId: true } },
        },
      },
    },
  });

  type StreamInfo = {
    streamId: string;
    wardId: string;
    constituencyId: string;
    countyId: string;
    countyCode: string;
    registered: number;
  };

  const streamInfos: StreamInfo[] = rawStreams.map((s) => {
    const ps = s.pollingStation!;
    const countyCode = countyCodeByName.get(ps.county) ?? "047";
    return {
      streamId: s.id,
      wardId: ps.wardId,
      constituencyId: ps.wardRef!.constituencyId,
      countyId: countyIdByCode.get(countyCode) ?? "",
      countyCode,
      registered: s.registeredVoters ?? 500,
    };
  });

  // ── Fetch all positions + candidates ───────────────────────────────────────
  const positions = await prisma.electionPosition.findMany({
    where: { electionId },
    include: { candidates: { orderBy: { sortOrder: "asc" } } },
  });

  // candidatesByEntity: positionId → Map<entityId, candidateId[]>
  // PRESIDENT uses 'national' as entityId
  const candidatesByEntity = new Map<string, Map<string, string[]>>();
  for (const pos of positions) {
    const entityMap = new Map<string, string[]>();
    for (const c of pos.candidates) {
      const key = c.entityId ?? "national";
      if (!entityMap.has(key)) entityMap.set(key, []);
      entityMap.get(key)!.push(c.id);
    }
    candidatesByEntity.set(pos.id, entityMap);
  }

  // ── Helper: aggregate stream votes ─────────────────────────────────────────
  type CandidateVote = { candidateId: string; votes: number };
  type StreamVoteRow = {
    streamId: string;
    wardId: string;
    constituencyId: string;
    countyId: string;
    totalVotes: number;
    rejectedVotes: number;
    candidateVotes: CandidateVote[];
  };

  function buildAgg(
    rows: StreamVoteRow[],
    keyFn: (r: StreamVoteRow) => string,
  ): Map<string, AggEntry> {
    const map = new Map<string, AggEntry>();
    for (const r of rows) {
      const key = keyFn(r);
      if (!map.has(key))
        map.set(key, {
          totalVotes: 0,
          rejectedVotes: 0,
          candidateVotes: new Map(),
        });
      const agg = map.get(key)!;
      agg.totalVotes += r.totalVotes;
      agg.rejectedVotes += r.rejectedVotes;
      for (const cv of r.candidateVotes) {
        agg.candidateVotes.set(
          cv.candidateId,
          (agg.candidateVotes.get(cv.candidateId) ?? 0) + cv.votes,
        );
      }
    }
    return map;
  }

  // ── Process each position ───────────────────────────────────────────────────
  for (const pos of positions) {
    const entityMap = candidatesByEntity.get(pos.id)!;
    if (entityMap.size === 0) {
      console.log(`  ⚠️  ${pos.type}: no candidates, skipping`);
      continue;
    }

    const level = pos.aggregationLevel; // 'WARD' | 'CONSTITUENCY' | 'COUNTY' | 'NATIONAL'

    // For NATIONAL positions, build a party lookup so we can order candidates by county tendency
    const candidateParty = new Map<string, string | null>(
      pos.candidates.map((c) => [c.id, c.party]),
    );

    // For each stream, find the right entity key and generate votes
    const streamVoteRows: StreamVoteRow[] = [];

    for (const si of streamInfos) {
      const entityKey =
        level === "WARD"
          ? si.wardId
          : level === "CONSTITUENCY"
            ? si.constituencyId
            : level === "COUNTY"
              ? si.countyId
              : "national";

      const candidates = entityMap.get(entityKey);
      if (!candidates || candidates.length === 0) continue;

      const turnout = Math.floor(si.registered * (0.55 + Math.random() * 0.2));
      const rejected = Math.floor(turnout * (0.005 + Math.random() * 0.015));
      const valid = turnout - rejected;

      let orderedCandidates = [...candidates];
      let voteCounts: number[];

      if (level === "NATIONAL") {
        // For national positions (PRESIDENT): order candidates by county tendency so
        // the dominant-party candidate gets the frontrunner share
        const isRuto = RUTO_COUNTIES.has(si.countyCode);
        const isOdinga = ODINGA_COUNTIES.has(si.countyCode);
        const winnerParty = isRuto
          ? "UDA"
          : isOdinga
            ? "ODM"
            : Math.random() > 0.5
              ? "UDA"
              : "ODM";
        const loserParty = winnerParty === "UDA" ? "ODM" : "UDA";

        orderedCandidates = [
          ...candidates.filter(
            (cid) => candidateParty.get(cid) === winnerParty,
          ),
          ...candidates.filter((cid) => candidateParty.get(cid) === loserParty),
          ...candidates.filter(
            (cid) =>
              candidateParty.get(cid) !== winnerParty &&
              candidateParty.get(cid) !== loserParty,
          ),
        ];

        // Winner 50–68%, runner-up 28–45%, minor candidates split remainder (~2–5%)
        const winnerShare = 0.5 + Math.random() * 0.18;
        const minorTotal =
          candidates.length > 2 ? 0.01 + Math.random() * 0.04 : 0;
        const runnerShare = 1 - winnerShare - minorTotal;
        const minorShare =
          candidates.length > 2 ? minorTotal / (candidates.length - 2) : 0;

        voteCounts = orderedCandidates.map((_, i) => {
          if (i === 0) return Math.floor(valid * winnerShare);
          if (i === 1) return Math.floor(valid * runnerShare);
          return Math.floor(valid * minorShare);
        });
        // Assign remainder to winner
        voteCounts[0] += valid - voteCounts.reduce((a, b) => a + b, 0);
      } else {
        const fs = frontShare(si.countyCode);
        voteCounts = distributeVotes(valid, candidates.length, fs);
      }

      streamVoteRows.push({
        streamId: si.streamId,
        wardId: si.wardId,
        constituencyId: si.constituencyId,
        countyId: si.countyId,
        totalVotes: turnout,
        rejectedVotes: rejected,
        candidateVotes: orderedCandidates.map((cid, i) => ({
          candidateId: cid,
          votes: voteCounts[i],
        })),
      });
    }

    if (streamVoteRows.length === 0) continue;

    // Insert StreamResults
    const srInputs = streamVoteRows.map((r) => ({
      streamId: r.streamId,
      positionId: pos.id,
      agentId: adminId,
      status: "VERIFIED" as const,
      totalVotes: r.totalVotes,
      rejectedVotes: r.rejectedVotes,
      submittedAt: new Date(),
    }));
    for (let i = 0; i < srInputs.length; i += BATCH) {
      await prisma.streamResult.createMany({
        data: srInputs.slice(i, i + BATCH),
      });
    }

    // Fetch back IDs
    const srRows = await prisma.streamResult.findMany({
      where: { positionId: pos.id },
      select: { id: true, streamId: true },
    });
    const srIdMap = new Map(srRows.map((r) => [r.streamId, r.id]));

    // Insert StreamCandidateVotes
    const scvInputs: {
      streamResultId: string;
      candidateId: string;
      votes: number;
    }[] = [];
    for (const r of streamVoteRows) {
      const rid = srIdMap.get(r.streamId)!;
      for (const cv of r.candidateVotes) {
        scvInputs.push({
          streamResultId: rid,
          candidateId: cv.candidateId,
          votes: cv.votes,
        });
      }
    }
    for (let i = 0; i < scvInputs.length; i += BATCH) {
      await prisma.streamCandidateVote.createMany({
        data: scvInputs.slice(i, i + BATCH),
      });
    }

    // Aggregate level results
    if (
      level === "WARD" ||
      level === "CONSTITUENCY" ||
      level === "COUNTY" ||
      level === "NATIONAL"
    ) {
      await insertLevelResults(
        pos.id,
        "WARD",
        buildAgg(streamVoteRows, (r) => r.wardId),
        adminId,
      );
    }
    if (
      level === "CONSTITUENCY" ||
      level === "COUNTY" ||
      level === "NATIONAL"
    ) {
      await insertLevelResults(
        pos.id,
        "CONSTITUENCY",
        buildAgg(streamVoteRows, (r) => r.constituencyId),
        adminId,
      );
    }
    if (level === "COUNTY" || level === "NATIONAL") {
      await insertLevelResults(
        pos.id,
        "COUNTY",
        buildAgg(streamVoteRows, (r) => r.countyId),
        adminId,
      );
    }
    if (level === "NATIONAL") {
      await insertLevelResults(
        pos.id,
        "NATIONAL",
        buildAgg(streamVoteRows, () => "national"),
        adminId,
      );
    }

    console.log(
      `  ✅ ${pos.type}: ${srRows.length} stream results, ${scvInputs.length} candidate votes`,
    );
  }

  // ── National presidential summary ───────────────────────────────────────────
  const presPos = positions.find((p) => p.type === "PRESIDENT");
  if (presPos) {
    const natResult = await prisma.levelResult.findFirst({
      where: {
        positionId: presPos.id,
        level: "NATIONAL",
        entityId: "national",
      },
      include: { votes: { include: { candidate: true } } },
    });
    if (natResult) {
      const total = natResult.totalVotes ?? 0;
      console.log(`\n🏆 National presidential results:`);
      for (const v of natResult.votes.sort((a, b) => b.votes - a.votes)) {
        console.log(
          `   ${v.candidate.name} (${v.candidate.party}): ${v.votes.toLocaleString()} (${((v.votes / total) * 100).toFixed(1)}%)`,
        );
      }
    }
  }
}

async function displaySummary() {
  const totalStreams = await prisma.stream.count();
  const totalVoters = await prisma.stream.aggregate({
    _sum: { registeredVoters: true },
  });

  console.log('\n📊 SEEDING SUMMARY')
  console.log('==================')
  console.log(`✅ Roles:           ${await prisma.role.count()}`);
  console.log(`✅ Users:           ${await prisma.user.count()}`);
  console.log(`✅ Counties:        ${await prisma.county.count()}`);
  console.log(`✅ Constituencies:  ${await prisma.constituency.count()}`);
  console.log(`✅ Wards:           ${await prisma.ward.count()}`);
  console.log(`✅ Stations:        ${await prisma.pollingStation.count()}`);
  console.log(`✅ Streams:         ${totalStreams}`);
  console.log(`✅ Elections:       ${await prisma.election.count()}`);
  console.log(
    `✅ Total Voters:    ${(totalVoters._sum.registeredVoters ?? 0).toLocaleString()} (Kenya total: 22,120,458)`,
  );

  console.log('\n🔐 LOGIN CREDENTIALS')
  console.log("====================");
  console.log("Admin: admin@election.ke  / password123");
  console.log('Agent: agent1@election.ke / password123')
  console.log('')
}

async function main() {
  console.log("🌱 Starting Kenya election database seeding...");
  try {
    await clearDatabase()
    const roles = await seedRoles()
    const { admin } = await seedUsers(roles);
    const constituencyMap = await seedPermanentGeography();
    const election = await seedElection(admin.id);
    await seedElectionGeography(election.id, admin.id, constituencyMap);
    await seedCandidates(election.id);
    await seedAllVoteData(election.id, admin.id);
    await displaySummary()
    console.log('🎉 Database seeding completed successfully!')
  } catch (error) {
    console.error('❌ Seeding failed:', error)
    throw error
  }
}

main()
  .catch((e) => {
    console.error("❌", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
