import { execSync } from "child_process"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function checkIfSeeded(): Promise<boolean> {
  try {
    const adminUser = await prisma.user.findUnique({
      where: { email: "admin@example.com" },
    })
    return !!adminUser
  } catch (error) {
    // If table doesn't exist yet, we need to seed
    return false
  }
}

async function runMigrations() {
  console.log("Running database migrations...")
  try {
    execSync("npx prisma migrate deploy", {
      stdio: "inherit",
      env: { ...process.env },
    })
    console.log("✓ Migrations completed")
  } catch (error) {
    console.error("Failed to run migrations:", error)
    throw error
  }
}

async function seedDatabase() {
  console.log("Seeding database...")
  try {
    execSync("npx prisma db seed", {
      stdio: "inherit",
      env: { ...process.env },
    })
    console.log("✓ Database seeded successfully")
  } catch (error) {
    console.error("Failed to seed database:", error)
    throw error
  }
}

async function initializeDatabase() {
  try {
    // Run migrations first
    await runMigrations()

    // Check if database needs seeding
    const isSeeded = await checkIfSeeded()

    if (!isSeeded) {
      console.log("Database is empty, seeding...")
      await seedDatabase()
    } else {
      console.log("Database already seeded, skipping seed step")
    }

    console.log("✓ Database initialization completed")
  } catch (error) {
    console.error("Database initialization failed:", error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Run initialization
initializeDatabase()
