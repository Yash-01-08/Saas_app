import "dotenv/config";
import mongoose from "mongoose";
import Workspace from "../src/models/Workspace.js";

const INDEX_NAME = "organization_1_name_1";
const INDEX_KEYS = { organization: 1, name: 1 };

const sameKeys = (keys) =>
    keys &&
    Object.keys(keys).length === 2 &&
    keys.organization === 1 &&
    keys.name === 1;

const migrate = async () => {
    if (!process.env.MONGO_URI) {
        throw new Error("MONGO_URI is not configured");
    }

    // Prevent Mongoose from racing this explicit index migration with autoIndex.
    mongoose.set("autoIndex", false);
    await mongoose.connect(process.env.MONGO_URI);
    const collection = Workspace.collection;

    // Never drop an existing index until duplicate data has been ruled out.
    const duplicates = await collection.aggregate([
        {
            $group: {
                _id: { organization: "$organization", name: "$name" },
                count: { $sum: 1 },
                workspaceIds: { $push: "$_id" }
            }
        },
        { $match: { count: { $gt: 1 } } }
    ]).toArray();

    if (duplicates.length > 0) {
        console.error("Duplicate workspace names exist. Resolve these before creating the unique index:");
        console.error(JSON.stringify(duplicates, null, 2));
        throw new Error("Workspace index migration aborted; duplicate records were found");
    }

    const indexes = await collection.indexes();

    const existingUniqueIndex = indexes.find(
        (index) => sameKeys(index.key) && index.unique
    );

    if (existingUniqueIndex) {
        console.log("Workspace unique index is already enforced:", existingUniqueIndex.name);
        return;
    }

    for (const index of indexes) {
        if (sameKeys(index.key) && !index.unique) {
            console.log(`Dropping legacy non-unique index: ${index.name}`);
            await collection.dropIndex(index.name);
        }
    }

    await collection.createIndex(INDEX_KEYS, {
        name: INDEX_NAME,
        unique: true
    });

    console.log("Workspace unique index is now enforced:", INDEX_NAME);
};

try {
    await migrate();
} catch (error) {
    console.error("Workspace index migration failed:", error.message);
    process.exitCode = 1;
} finally {
    await mongoose.disconnect();
}
