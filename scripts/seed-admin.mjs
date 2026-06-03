import dotenv from "dotenv"
dotenv.config({ path: ".env.local" })
import mongoose from "mongoose"
import bcrypt from "bcryptjs"

const MONGO_URI = process.env.MONGO_URI
if (!MONGO_URI) {
  console.error("MONGO_URI no está definida. Crea un archivo .env.local con MONGO_URI.")
  process.exit(1)
}

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@quiniela.com"
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123"
const ADMIN_NAME = process.env.ADMIN_NAME || "Admin"

async function seed() {
  await mongoose.connect(MONGO_URI)
  console.log("Conectado a MongoDB")

  const existing = await mongoose.connection.db
    .collection("users")
    .findOne({ email: ADMIN_EMAIL.toLowerCase() })

  if (existing) {
    console.log(`El admin ${ADMIN_EMAIL} ya existe. Actualizando contraseña...`)
    const hashed = await bcrypt.hash(ADMIN_PASSWORD, 12)
    await mongoose.connection.db
      .collection("users")
      .updateOne(
        { email: ADMIN_EMAIL.toLowerCase() },
        { $set: { password: hashed, role: "admin" } }
      )
    console.log("Admin actualizado.")
  } else {
    const hashed = await bcrypt.hash(ADMIN_PASSWORD, 12)
    await mongoose.connection.db.collection("users").insertOne({
      email: ADMIN_EMAIL.toLowerCase(),
      password: hashed,
      name: ADMIN_NAME,
      role: "admin",
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    console.log(`Admin creado: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`)
  }

  await mongoose.disconnect()
  console.log("Listo.")
}

seed().catch((err) => {
  console.error("Error:", err)
  process.exit(1)
})
