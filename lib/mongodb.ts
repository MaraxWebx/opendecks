import { MongoClient, ServerApiVersion } from "mongodb";

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || "opendecks";

declare global {
  var __opendecksMongoClient__: MongoClient | undefined;
  var __opendecksMongoClientPromise__: Promise<MongoClient> | undefined;
  var __opendecksMongoSchemaPromise__: Promise<void> | undefined;
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
  const db = client.db(dbName);

  if (!global.__opendecksMongoSchemaPromise__) {
    global.__opendecksMongoSchemaPromise__ = ensureMongoSchema(db);
  }

  await global.__opendecksMongoSchemaPromise__;
  return db;
}

async function ensureMongoSchema(db: ReturnType<MongoClient["db"]>) {
  await ensureDjRosterIndexes(db);
}

async function ensureDjRosterIndexes(db: ReturnType<MongoClient["db"]>) {
  const collection = db.collection("dj_roster");

  try {
    await collection.dropIndex("applicationId_1");
  } catch (error) {
    if (!isMissingIndexError(error)) {
      throw error;
    }
  }

  try {
    await collection.dropIndex("eventId_1");
  } catch (error) {
    if (!isMissingIndexError(error)) {
      throw error;
    }
  }

  await collection.createIndex({ id: 1 }, { unique: true });
  await collection.createIndex(
    { applicationId: 1 },
    {
      unique: true,
      partialFilterExpression: {
        applicationId: { $type: "string" },
      },
    },
  );
}

function isMissingIndexError(error: unknown) {
  if (!(error instanceof Error)) {
    return false;
  }

  return (
    error.message.includes("index not found") ||
    error.message.includes("ns not found")
  );
}
