import 'dotenv/config'
import { PrismaClient } from './generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
    throw new Error('DATABASE_URL is not set')
}

const adapter = new PrismaPg({ connectionString })
const prisma = new PrismaClient({ adapter })

async function main() {
    // upsert is like a "merge" operation: it will create a new record if it doesn't exist, or update the existing record if it does
    const user = await prisma.user.upsert({
        where: { email: 'alice@prisma.io' },
        update: { name: 'Alice' },
        create: {
            name: 'Alice',
            email: 'alice@prisma.io',
        },
    })

    console.log(user)
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })