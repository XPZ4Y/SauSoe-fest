

const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

const uri = "mongolswerehere011012xpee";

const collectionName = "gamedebug";

// The name of the output file.
const outputFileName = "gaming.json";
// ----------------
const client = new MongoClient(uri);

async function run() { //fetch mongo data on the user, and load it in local drive
  try {
    // Connect the client to the server
    await client.connect();
    console.log("✅ Connected successfully to MongoDB server.");

    const database = client.db(dbName);
    const collection = database.collection(collectionName);

    console.log(`\nFetching all documents from the '${collectionName}' collection...`);

    const allDocuments = await collection.find({}).toArray();
    const count = allDocuments.length;

    console.log(`✅ Found ${count} document(s).`);
    const outputPath = path.join(__dirname, outputFileName);
    
    console.log(`\nWriting data to ${outputPath}...`);

    const jsonContent = JSON.stringify(allDocuments, null, 2);

    fs.writeFileSync(outputPath, jsonContent, 'utf8');

    console.log(`✅ Successfully saved data to ${outputFileName}.`);

  } catch (err) {
    console.error("❌ An error occurred:", err);
  } finally {
    await client.close();
    console.log("\nConnection to MongoDB closed.");
  }
}
run().catch(console.dir);
