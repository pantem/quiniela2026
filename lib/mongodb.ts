import mongoose from "mongoose"

interface MongooseCache {
  conn: typeof mongoose | null
  promise: Promise<typeof mongoose> | null
}

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache | undefined
}

const cached: MongooseCache = global.mongooseCache ?? { conn: null, promise: null }

if (!global.mongooseCache) {
  global.mongooseCache = cached
}

function getMongoUri(): string {
  const uri = process.env.MONGO_URI
  if (!uri) {
    throw new Error(
      "MONGO_URI no está definida. " +
      "En desarrollo: crea un archivo .env.local con MONGO_URI. " +
      "En Vercel: agrega MONGO_URI en Settings → Environment Variables."
    )
  }
  return uri
}

export async function connectDB(): Promise<typeof mongoose> {
  if (cached.conn) return cached.conn

  if (!cached.promise) {
    cached.promise = mongoose.connect(getMongoUri(), {
      bufferCommands: false,
    })
  }

  cached.conn = await cached.promise
  return cached.conn
}
