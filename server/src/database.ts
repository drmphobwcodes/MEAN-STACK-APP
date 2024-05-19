//to connect to the database

import * as mongodb from "mongodb";
import { Employee } from "./employee";

// Define a collections object to store our collections once we've connected to the database
export const collections: {
    // Define a property for each collection we want to use
    employees?: mongodb.Collection<Employee>;
} = {};

// Connect to the database and store the collections in the collections object
export async function connectToDatabase(uri: string) {
    // Create a new MongoClient to connect to the database
    const client = new mongodb.MongoClient(uri);
    // Connect to the database
    await client.connect();
    // Get the database object
    const db = client.db("meanStackExample");
    // Store the collections in the collections object
    await applySchemaValidation(db);

    // Get the employees collection and store it in the collections object
    const employeesCollection = db.collection<Employee>("employees");
    collections.employees = employeesCollection;
}

// Update our existing collection with JSON schema validation so we know our documents will always match the shape of our Employee model, even if added elsewhere.
// For more information about schema validation, see this blog series: https://www.mongodb.com/blog/post/json-schema-validation--locking-down-your-model-the-smart-way
async function applySchemaValidation(db: mongodb.Db) {
    const jsonSchema = {
        $jsonSchema: {
            bsonType: "object",
            required: ["name", "position", "level"],
            additionalProperties: false,
            properties: {
                _id: {},
                name: {
                    bsonType: "string",
                    description: "'name' is required and is a string",
                },
                position: {
                    bsonType: "string",
                    description: "'position' is required and is a string",
                    minLength: 5
                },
                level: {
                    bsonType: "string",
                    description: "'level' is required and is one of 'junior', 'mid', or 'senior'",
                    enum: ["junior", "mid", "senior"],
                },
            },
        },
    };

    // Try applying the modification to the collection, if the collection doesn't exist, create it
   await db.command({
        collMod: "employees",
        validator: jsonSchema
    }).catch(async (error: mongodb.MongoServerError) => {
        if (error.codeName === "NamespaceNotFound") {
            await db.createCollection("employees", {validator: jsonSchema});
        }
    });
}