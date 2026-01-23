const { execSync } = require("child_process")
const { PrismaClient } = require("@prisma/client")

const prisma = new PrismaClient()

async function checkIfSeeded() {
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
  console.log("Setting up database schema...")
  try {
    // Try migrate deploy first (for production with migrations)
    try {
      execSync("npx prisma migrate deploy", {
        stdio: "pipe",
        env: { ...process.env },
      })
      console.log("✓ Migrations deployed")
      return
    } catch (migrateError) {
      // If migrate deploy fails (no migrations), use db push
      console.log("No migrations found, using db push...")
      execSync("npx prisma db push --accept-data-loss", {
        stdio: "inherit",
        env: { ...process.env },
      })
      console.log("✓ Database schema synced")
    }
  } catch (error) {
    console.error("Failed to set up database schema:", error)
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
    // Run migrations/schema sync first
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
