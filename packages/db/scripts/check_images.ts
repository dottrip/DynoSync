import { prisma } from '../src'

async function check() {
    const vehicles = await prisma.vehicle.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5
    })

    console.log('=== LATEST 5 VEHICLES ===')
    for (const v of vehicles) {
        console.log(`ID: ${v.id} | MAKE: ${v.make} | URL: ${v.imageUrl}`)
    }
}

check().catch(console.error).finally(() => prisma.$disconnect())
