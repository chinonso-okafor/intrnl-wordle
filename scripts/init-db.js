const { execSync } = require("child_process")
const { PrismaClient } = require("@prisma/client")
const fs = require("fs")
const path = require("path")

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

async function checkIfTablesExist() {
  try {
    // Try to query a table to see if schema exists
    await prisma.$queryRaw`SELECT 1 FROM users LIMIT 1`
    return true
  } catch (error) {
    return false
  }
}

async function runMigrations() {
  console.log("Setting up database schema...")
  
  // Check if migrations directory exists
  const migrationsDir = path.join(process.cwd(), "prisma", "migrations")
  const hasMigrations = fs.existsSync(migrationsDir) && fs.readdirSync(migrationsDir).length > 0

  try {
    if (hasMigrations) {
      console.log("Migrations found, deploying...")
      execSync("npx prisma migrate deploy", {
        stdio: "inherit",
        env: { ...process.env },
      })
      console.log("✓ Migrations deployed")
    } else {
      console.log("No migrations found, using db push...")
      execSync("npx prisma db push --accept-data-loss", {
        stdio: "inherit",
        env: { ...process.env },
      })
      console.log("✓ Database schema synced")
    }

    // Verify tables were created
    const tablesExist = await checkIfTablesExist()
    if (!tablesExist) {
      throw new Error("Database schema setup completed but tables do not exist")
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
