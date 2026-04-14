import { MongoClient, ServerApiVersion } from "mongodb";

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || "opendecks";

declare global {
  var __opendecksMongoClient__: MongoClient | undefined;
  var __opendecksMongoClientPromise__: Promise<MongoClient> | undefined;
}

let mongoUnavailable = false;
let warnedOnce = false;

export function isMongoConfigured() {
  return Boolean(uri);
}

export function canAttemptMongo() {
  return Boolean(uri) && !mongoUnavailable;
}

function createMongoClient() {
  if (!uri) {
    throw new Error("MONGODB_URI non configurato");
  }

  return new MongoClient(uri, {
    maxPoolSize: 10,
    minPoolSize: 1,
    maxIdleTimeMS: 30000,
    serverSelectionTimeoutMS: 5000,
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    },
  });
}

async function getClient() {
  if (!uri) {
    throw new Error("MONGODB_URI non configurato");
  }

  if (mongoUnavailable) {
    throw new Error("MongoDB temporaneamente non disponibile");
  }

  if (global.__opendecksMongoClient__) {
    return global.__opendecksMongoClient__;
  }

  if (!global.__opendecksMongoClientPromise__) {
    const client = createMongoClient();
    global.__opendecksMongoClientPromise__ = client.connect();
  }

  try {
    const connectedClient = await global.__opendecksMongoClientPromise__;
    global.__opendecksMongoClient__ = connectedClient;
    return connectedClient;
  } catch (error) {
    global.__opendecksMongoClientPromise__ = undefined;
    mongoUnavailable = true;

    if (!warnedOnce) {
      warnedOnce = true;
      console.warn(
        "MongoDB non raggiungibile. Fallback automatico ai dati mock.",
        error,
      );
    }

    throw error;
  }
}

export async function getDatabase() {
  const client = await getClient();
  return client.db(dbName);
}
