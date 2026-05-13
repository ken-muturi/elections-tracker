import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
const [c, con] = await Promise.all([prisma.county.count(), prisma.constituency.count()])
console.log('counties:', c, 'constituencies:', con)
if (con > 0) {
  const s = await prisma.constituency.findFirst({ include: { county: true } })
  console.log('sample:', s?.name, '->', s?.county?.name)
}
await prisma.$disconnect()
