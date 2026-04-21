import { createHash } from "node:crypto";
import { MongoClient, ServerApiVersion } from "mongodb";
import seedData from "../data/seed-data.json" with { type: "json" };

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || "opendecks";
const adminUsername = process.env.ADMIN_USERNAME || "admin";
const adminPassword = process.env.ADMIN_PASSWORD || "opendecks123";
const adminName = process.env.ADMIN_NAME || adminUsername;

if (!uri) {
  throw new Error("MONGODB_URI non configurato.");
}

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true
  }
});

try {
  await client.connect();
  const db = client.db(dbName);
  const rosterSeed = buildRosterSeed(seedData);

  await upsertMany(db, "events", seedData.events, "id");
  await upsertMany(db, "tags", seedData.tags || [], "id");
  await upsertMany(db, "applications", seedData.applications, "id");
  await upsertMany(db, "dj_roster", rosterSeed, "id");
  await upsertMany(db, "archive", seedData.archive, "id");
  await upsertMany(
    db,
    "admin_users",
    [
      {
        username: adminUsername,
        name: adminName,
        passwordHash: createHash("sha256").update(adminPassword).digest("hex"),
        role: "admin"
      }
    ],
    "username"
  );

  await db.collection("events").createIndex({ id: 1 }, { unique: true });
  await db.collection("events").createIndex({ slug: 1 }, { unique: true });
  await db.collection("applications").createIndex({ id: 1 }, { unique: true });
  await db.collection("tags").createIndex({ id: 1 }, { unique: true });
  await db.collection("tags").createIndex({ slug: 1 }, { unique: true });
  await db.collection("dj_roster").createIndex({ id: 1 }, { unique: true });
  await safelyDropIndex(db.collection("dj_roster"), "applicationId_1");
  await safelyDropIndex(db.collection("dj_roster"), "eventId_1");
  await db.collection("dj_roster").createIndex(
    { applicationId: 1 },
    {
      unique: true,
      partialFilterExpression: {
        applicationId: { $type: "string" }
      }
    }
  );
  await db.collection("archive").createIndex({ id: 1 }, { unique: true });
  await db.collection("admin_users").createIndex({ username: 1 }, { unique: true });

  console.log(`Seed completato su database "${dbName}".`);
  console.log(`Eventi: ${seedData.events.length}`);
  console.log(`Candidature: ${seedData.applications.length}`);
  console.log(`Tag: ${(seedData.tags || []).length}`);
  console.log(`Roster DJ: ${rosterSeed.length}`);
  console.log(`Archivio: ${seedData.archive.length}`);
  console.log(`Utente admin: ${adminUsername}`);
} finally {
  await client.close();
}

async function upsertMany(db, collectionName, items, key) {
  const collection = db.collection(collectionName);

  for (const item of items) {
    await collection.updateOne({ [key]: item[key] }, { $set: item }, { upsert: true });
  }
}

function buildRosterSeed(seedData) {
  const explicitRoster = seedData.djRoster || [];
  const selectedApplications = (seedData.applications || [])
    .filter((application) => application.status === "selected")
    .map((application) => ({
      id: application.id,
      applicationId: application.id,
      sourceApplicationEventId: application.eventId,
      sourceApplicationEventTitle: application.eventTitle,
      name: application.name,
      city: application.city,
      province: application.province || "",
      region: application.region || "",
      email: application.email || "",
      phone: application.phone || "",
      photoUrl: application.photoUrl || "",
      instagram: application.instagram,
      setLink: application.setLink,
      bio: application.bio,
      approvedAt: application.submittedAt,
      membershipCardEnabled: false
    }));

  const merged = [...explicitRoster];

  for (const record of selectedApplications) {
    if (!merged.some((item) => item.applicationId === record.applicationId)) {
      merged.push(record);
    }
  }

  return merged;
}

async function safelyDropIndex(collection, name) {
  try {
    await collection.dropIndex(name);
  } catch (error) {
    if (!(error instanceof Error)) {
      throw error;
    }

    if (
      error.message.includes("index not found") ||
      error.message.includes("ns not found")
    ) {
      return;
    }

    throw error;
  }
}
