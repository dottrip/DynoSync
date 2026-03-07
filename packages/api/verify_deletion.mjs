import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function verifyDeletion(email) {
    console.log(`🔍 Checking database for: ${email}`)

    const user = await prisma.user.findUnique({
        where: { email },
        include: {
            vehicles: true,
            feedbacks: true,
            advisorLogs: true
        }
    })

    if (!user) {
        console.log('✅ SUCCESS: User record NOT found in database.')

        // Also check if any orphaned vehicles exist (should be 0 due to cascade)
        const orphans = await prisma.vehicle.count({
            where: { user: { email: email } }
        })
        console.log(`📊 Associated vehicles found: ${orphans}`)
    } else {
        console.log('❌ FAILURE: User record still exists!')
        console.log(JSON.stringify(user, null, 2))
    }
}

verifyDeletion('joyeyan432+dyno@gmail.com')
    .catch(console.error)
    .finally(() => prisma.$disconnect())
