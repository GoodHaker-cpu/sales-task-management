import { MongoClient, ObjectId, Db, Document } from "mongodb";

const globalForMongo = globalThis as unknown as { mongoClient: MongoClient | undefined };

function getUri(): string {
  const uri = process.env.DATABASE_URL;
  if (!uri) {
    throw new Error("DATABASE_URL is not set");
  }
  return uri;
}

export async function getMongoClient(): Promise<MongoClient> {
  if (!globalForMongo.mongoClient) {
    globalForMongo.mongoClient = new MongoClient(getUri());
    await globalForMongo.mongoClient.connect();
  }
  return globalForMongo.mongoClient;
}

export async function getDb(): Promise<Db> {
  const client = await getMongoClient();
  const uri = getUri();
  const dbName = uri.split("/").pop()?.split("?")[0] || "sales-task-management";
  return client.db(dbName);
}

export function toObjectId(id: string): ObjectId {
  return new ObjectId(id);
}

export function mapDoc<T extends Document>(doc: Document | null): (T & { id: string }) | null {
  if (!doc) return null;
  const { _id, ...rest } = doc;
  return { ...rest, id: _id.toString() } as T & { id: string };
}

export async function insertDoc(collection: string, doc: Record<string, unknown>) {
  const db = await getDb();
  const prepared = prepareDoc(doc);
  const result = await db.collection(collection).insertOne(prepared);
  const inserted = await db.collection(collection).findOne({ _id: result.insertedId });
  return mapDoc(inserted!)!;
}

export async function updateDocById(collection: string, id: string, data: Record<string, unknown>) {
  const db = await getDb();
  const prepared = prepareDoc(data, false);
  await db.collection(collection).updateOne({ _id: toObjectId(id) }, { $set: prepared });
  const updated = await db.collection(collection).findOne({ _id: toObjectId(id) });
  return mapDoc(updated!)!;
}

export async function deleteDocById(collection: string, id: string) {
  const db = await getDb();
  const existing = await db.collection(collection).findOne({ _id: toObjectId(id) });
  if (!existing) throw new Error("Document not found");
  await db.collection(collection).deleteOne({ _id: toObjectId(id) });
  return mapDoc(existing)!;
}

export async function updateManyDocs(
  collection: string,
  filter: Record<string, unknown>,
  data: Record<string, unknown>
) {
  const db = await getDb();
  const preparedFilter = prepareFilter(filter);
  const preparedData = prepareDoc(data, false);
  return db.collection(collection).updateMany(preparedFilter, { $set: preparedData });
}

const OBJECT_ID_FIELDS = new Set([
  "managerId",
  "assignedById",
  "assignedToId",
  "userId",
  "uploadedById",
]);

function prepareDoc(doc: Record<string, unknown>, forInsert = true): Document {
  const result: Document = {};
  for (const [key, value] of Object.entries(doc)) {
    if (value === undefined) continue;
    if (key === "manager" || key === "assignedBy" || key === "assignedTo") continue;
    if (OBJECT_ID_FIELDS.has(key) && typeof value === "string") {
      result[key] = toObjectId(value);
    } else if (value === null) {
      result[key] = null;
    } else {
      result[key] = value;
    }
  }
  return result;
}

function prepareFilter(filter: Record<string, unknown>): Document {
  const result: Document = {};
  for (const [key, value] of Object.entries(filter)) {
    if (key === "id" && value && typeof value === "object" && "in" in (value as object)) {
      result._id = { $in: ((value as { in: string[] }).in).map(toObjectId) };
    } else if (key === "id" && typeof value === "string") {
      result._id = toObjectId(value);
    } else if (OBJECT_ID_FIELDS.has(key) && typeof value === "string") {
      result[key] = toObjectId(value);
    } else {
      result[key] = value;
    }
  }
  return result;
}
