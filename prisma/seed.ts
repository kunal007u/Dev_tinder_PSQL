import "dotenv/config";
import { prisma } from "../src/config/client.ts";

async function seed() {
    await prisma.user.createMany({
        data: [
            {
                firstName: 'Alice',
                lastName: 'Smith',
                email: 'aa@gmail.com',
                password: 'password123',
                age: 25,
                gender: "Female"

            },
            {
                firstName: 'Bob',
                lastName: 'Johnson',
                email: 'bob@gmail.com',
                password: 'password456',
                age: 30,
                gender: "Male"
            },
        ],
       
    })
}

seed().then(() => {
    console.log('Seeding completed.')
}).catch((error) => {
    console.error('Error seeding data:', error)
}).finally(async () => {
    await prisma.$disconnect()
})