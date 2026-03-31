// prisma/seed_election.ts
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const KENYAN_COUNTIES = [
  { county: 'Nairobi', constituencies: ['Westlands', 'Dagoretti North', 'Dagoretti South', 'Langata', 'Kibra', 'Roysambu', 'Kasarani', 'Starehe', 'Mathare', 'Embakasi South', 'Embakasi North', 'Embakasi Central', 'Embakasi East', 'Embakasi West', 'Makadara', 'Kamukunji', 'Ruaraka'] },
  { county: 'Kiambu', constituencies: ['Gatundu South', 'Gatundu North', 'Juja', 'Thika Town', 'Ruiru', 'Githunguri', 'Kiambu', 'Kiambaa', 'Kabete', 'Kikuyu', 'Limuru', 'Lari'] },
  { county: 'Nakuru', constituencies: ['Molo', 'Njoro', 'Naivasha', 'Gilgil', 'Kuresoi South', 'Kuresoi North', 'Subukia', 'Rongai', 'Bahati', 'Nakuru Town West', 'Nakuru Town East'] },
  { county: 'Mombasa', constituencies: ['Changamwe', 'Jomvu', 'Kisauni', 'Nyali', 'Likoni', 'Mvita'] },
  { county: 'Kisumu', constituencies: ['Kisumu East', 'Kisumu West', 'Kisumu Central', 'Seme', 'Nyando', 'Muhoroni', 'Nyakach'] },
]

const WARDS = ['Ward A', 'Ward B', 'Ward C', 'Ward D', 'Ward E']

async function clearDatabase() {
  console.log('🗑️ Clearing existing data...')
  await prisma.answer.deleteMany()
  await prisma.submission.deleteMany()
  await prisma.pollingStation.deleteMany()
  await prisma.questionnairePermission.deleteMany()
  await prisma.question.deleteMany()
  await prisma.unit.deleteMany()
  await prisma.section.deleteMany()
  await prisma.questionnaire.deleteMany()
  await prisma.permission.deleteMany()
  await prisma.tab.deleteMany()
  await prisma.module.deleteMany()
  await prisma.note.deleteMany()
  await prisma.session.deleteMany()
  await prisma.account.deleteMany()
  await prisma.user.deleteMany()
  await prisma.role.deleteMany()
  console.log('✅ Database cleared')
}

async function seedRoles() {
  console.log('🔑 Seeding roles...')
  const roles = await prisma.role.createMany({
    data: [
      { title: 'super admin', description: 'Super Administrator' },
      { title: 'admin', description: 'Administrator' },
      { title: 'agent', description: 'Polling Station Agent' },
    ],
  })
  console.log(`✅ Created ${roles.count} roles`)
  return await prisma.role.findMany()
}

async function seedUsers(roles: { id: string; title: string }[]) {
  console.log('👥 Seeding users...')
  const hashedPassword = await bcrypt.hash('password123', 10)

  const adminRole = roles.find((r) => r.title === 'super admin')!
  const agentRole = roles.find((r) => r.title === 'agent')!

  await prisma.user.create({
    data: {
      roleId: adminRole.id,
      email: 'admin@election.ke',
      password: hashedPassword,
      firstname: 'Admin',
      othernames: 'User',
      dateOfBirth: '1990-01-01',
      gender: 'Male',
      nationalId: 'ADMIN00001',
      phone: '+254700000001',
      nextOfKin: 'Emergency Contact',
      nextOfKinContacts: '+254700000000',
      address: 'Nairobi, Kenya',
    },
  })

  // Create some agents
  for (let i = 1; i <= 5; i++) {
    await prisma.user.create({
      data: {
        roleId: agentRole.id,
        email: `agent${i}@election.ke`,
        password: hashedPassword,
        firstname: `Agent`,
        othernames: `User ${i}`,
        dateOfBirth: '1995-01-01',
        gender: i % 2 === 0 ? 'Female' : 'Male',
        nationalId: `AGENT0000${i}`,
        phone: `+25470000000${i}`,
        nextOfKin: 'Emergency Contact',
        nextOfKinContacts: '+254700000000',
        address: 'Kenya',
      },
    })
  }

  console.log('✅ Created users (1 admin + 5 agents)')
  return await prisma.user.findMany()
}

async function seedModulesAndPermissions(adminUser: { id: string }, roles: { id: string; title: string }[]) {
  console.log('📦 Seeding modules & permissions...')
  
  const dashboardModule = await prisma.module.create({
    data: { title: 'Dashboard', description: 'Dashboard module', createdBy: adminUser.id },
  })
  const formsModule = await prisma.module.create({
    data: { title: 'Forms', description: 'Election forms module', createdBy: adminUser.id },
  })
  const usersModule = await prisma.module.create({
    data: { title: 'Users', description: 'User management', createdBy: adminUser.id },
  })

  const tabs = [
    { moduleId: dashboardModule.id, title: 'dashboard', description: 'Dashboard' },
    { moduleId: dashboardModule.id, title: 'results', description: 'Results' },
    { moduleId: formsModule.id, title: 'forms', description: 'Election forms' },
    { moduleId: formsModule.id, title: 'polling-stations', description: 'Polling stations' },
    { moduleId: usersModule.id, title: 'users', description: 'Users' },
    { moduleId: usersModule.id, title: 'roles', description: 'Roles' },
  ]

  for (const tab of tabs) {
    const createdTab = await prisma.tab.create({
      data: { ...tab, createdBy: adminUser.id },
    })

    // Give all roles read permission, admin roles write permission
    for (const role of roles) {
      await prisma.permission.create({
        data: {
          roleId: role.id,
          moduleId: tab.moduleId,
          tabId: createdTab.id,
          action: 'read',
          createdBy: adminUser.id,
        },
      })
      if (role.title !== 'agent') {
        await prisma.permission.create({
          data: {
            roleId: role.id,
            moduleId: tab.moduleId,
            tabId: createdTab.id,
            action: 'write',
            createdBy: adminUser.id,
          },
        })
      }
    }
  }
  console.log('✅ Created modules, tabs, and permissions')
}

async function seedPollingStations(adminUser: { id: string }) {
  console.log('🏛 Seeding polling stations...')
  let count = 0
  let globalIdx = 0

  for (const countyData of KENYAN_COUNTIES) {
    for (const constituency of countyData.constituencies) {
      for (let w = 0; w < 2; w++) {
        const ward = WARDS[w]
        for (let s = 1; s <= 3; s++) {
          globalIdx++
          const code = `PS-${globalIdx.toString().padStart(4, '0')}`
          await prisma.pollingStation.create({
            data: {
              name: `${constituency} ${ward} Station ${s}`,
              code,
              county: countyData.county,
              constituency,
              ward,
              registeredVoters: Math.floor(Math.random() * 3000) + 500,
              createdBy: adminUser.id,
            },
          })
          count++
        }
      }
    }
  }

  console.log(`✅ Created ${count} polling stations`)
  return await prisma.pollingStation.findMany()
}

async function seedElectionForm(adminUser: { id: string }) {
  console.log('📋 Seeding election form...')

  const questionnaire = await prisma.questionnaire.create({
    data: {
      title: [
        { body: { language: 'en', text: 'Presidential Election 2027' } },
        { body: { language: 'fr', text: 'Élection présidentielle 2027' } },
      ],
      description: [
        { body: { language: 'en', text: 'Enter the results from your polling station for the 2027 Presidential Election' } },
        { body: { language: 'fr', text: 'Saisissez les résultats de votre bureau de vote pour l\'élection présidentielle 2027' } },
      ],
      startDate: new Date('2027-08-09'),
      endDate: new Date('2027-08-10'),
      createdBy: adminUser.id,
    },
  })

  // Section: Presidential Results
  const section = await prisma.section.create({
    data: {
      questionnaireId: questionnaire.id,
      sortOrder: 1,
      title: [
        { body: { language: 'en', text: 'Presidential Race' } },
        { body: { language: 'fr', text: 'Course présidentielle' } },
      ],
      description: [
        { body: { language: 'en', text: 'Enter the number of votes each candidate received' } },
        { body: { language: 'fr', text: 'Entrez le nombre de voix obtenues par chaque candidat' } },
      ],
      createdBy: adminUser.id,
    },
  })

  const unit = await prisma.unit.create({
    data: {
      sectionId: section.id,
      sortOrder: 1,
      title: [
        { body: { language: 'en', text: 'Vote Counts' } },
        { body: { language: 'fr', text: 'Décompte des voix' } },
      ],
      description: [
        { body: { language: 'en', text: 'Enter the total valid votes for each candidate' } },
        { body: { language: 'fr', text: 'Entrez le total des votes valides pour chaque candidat' } },
      ],
      createdBy: adminUser.id,
    },
  })

  const candidates = [
    'Candidate Alpha',
    'Candidate Beta',
    'Candidate Gamma',
    'Candidate Delta',
  ]

  for (let i = 0; i < candidates.length; i++) {
    await prisma.question.create({
      data: {
        unitId: unit.id,
        sortOrder: i + 1,
        title: [
          { body: { language: 'en', text: `Votes for ${candidates[i]}` } },
        ],
        description: [
          { body: { language: 'en', text: `Enter the total number of valid votes cast for ${candidates[i]}` } },
        ],
        details: {
          type: 'number',
          required: true,
          note: `Enter the exact count from the tally sheet for ${candidates[i]}`,
          options: [],
          conditions: [],
        },
        createdBy: adminUser.id,
      },
    })
  }

  // Add rejected/spoilt ballots
  await prisma.question.create({
    data: {
      unitId: unit.id,
      sortOrder: candidates.length + 1,
      title: [
        { body: { language: 'en', text: 'Rejected/Spoilt Ballots' } },
      ],
      description: [
        { body: { language: 'en', text: 'Enter the total number of rejected or spoilt ballots' } },
      ],
      details: {
        type: 'number',
        required: true,
        note: 'Enter the count of rejected ballots from the tally sheet',
        options: [],
        conditions: [],
      },
      createdBy: adminUser.id,
    },
  })

  // Section 2: Station Details
  const section2 = await prisma.section.create({
    data: {
      questionnaireId: questionnaire.id,
      sortOrder: 2,
      title: [
        { body: { language: 'en', text: 'Station Details' } },
      ],
      description: [
        { body: { language: 'en', text: 'Additional details about the voting process at your station' } },
      ],
      createdBy: adminUser.id,
    },
  })

  const unit2 = await prisma.unit.create({
    data: {
      sectionId: section2.id,
      sortOrder: 1,
      title: [
        { body: { language: 'en', text: 'Turnout & Notes' } },
      ],
      description: [
        { body: { language: 'en', text: 'Enter voter turnout information and any observations' } },
      ],
      createdBy: adminUser.id,
    },
  })

  await prisma.question.create({
    data: {
      unitId: unit2.id,
      sortOrder: 1,
      title: [
        { body: { language: 'en', text: 'Total Voters Who Turned Up' } },
      ],
      description: [
        { body: { language: 'en', text: 'The total number of registered voters who came to vote' } },
      ],
      details: {
        type: 'number',
        required: true,
        note: 'This should match the total on the voter register',
        options: [],
        conditions: [],
      },
      createdBy: adminUser.id,
    },
  })

  await prisma.question.create({
    data: {
      unitId: unit2.id,
      sortOrder: 2,
      title: [
        { body: { language: 'en', text: 'Observations/Notes' } },
      ],
      description: [
        { body: { language: 'en', text: 'Any observations or incidents during the voting process' } },
      ],
      details: {
        type: 'textarea',
        required: false,
        note: 'Optional: Note any irregularities or incidents',
        options: [],
        conditions: [],
      },
      createdBy: adminUser.id,
    },
  })

  console.log('✅ Created election form with candidates and sections')
  return questionnaire
}

async function displaySummary() {
  console.log('\n📊 SEEDING SUMMARY')
  console.log('==================')
  const roleCount = await prisma.role.count()
  const userCount = await prisma.user.count()
  const stationCount = await prisma.pollingStation.count()
  const formCount = await prisma.questionnaire.count()

  console.log(`✅ Roles: ${roleCount}`)
  console.log(`✅ Users: ${userCount}`)
  console.log(`✅ Polling Stations: ${stationCount}`)
  console.log(`✅ Election Forms: ${formCount}`)

  console.log('\n🔐 LOGIN CREDENTIALS')
  console.log('==================')
  console.log('Admin: admin@election.ke / password123')
  console.log('Agent: agent1@election.ke / password123')
  console.log('')
}

async function main() {
  console.log('🌱 Starting election database seeding...')
  try {
    await clearDatabase()
    const roles = await seedRoles()
    const users = await seedUsers(roles)
    const adminUser = users.find((u) => u.email === 'admin@election.ke')!
    await seedModulesAndPermissions(adminUser, roles)
    await seedPollingStations(adminUser)
    await seedElectionForm(adminUser)
    await displaySummary()
    console.log('🎉 Database seeding completed successfully!')
  } catch (error) {
    console.error('❌ Seeding failed:', error)
    throw error
  }
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
