import { MongoClient, ServerApiVersion } from "mongodb";

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || "opendecks";

let client: MongoClient | null = null;
let mongoUnavailable = false;
let warnedOnce = false;

export function isMongoConfigured() {
  return Boolean(uri);
}

export function canAttemptMongo() {
  return Boolean(uri) && !mongoUnavailable;
}

export async function getDatabase() {
  if (!uri) {
    throw new Error("MONGODB_URI non configurato");
  }

  if (mongoUnavailable) {
    throw new Error("MongoDB temporaneamente non disponibile");
  }

  if (!client) {
    client = new MongoClient(uri, {
      serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true
      }
    });
  }

  try {
    await client.connect();
    return client.db(dbName);
  } catch (error) {
    mongoUnavailable = true;

    if (!warnedOnce) {
      warnedOnce = true;
      console.warn("MongoDB non raggiungibile. Fallback automatico ai dati mock.", error);
    }

    throw error;
  }
}
