const { MongoClient } = require('mongodb');
const { Parser } = require('json2csv');
const fs = require('fs');

// --- make sure to sanitize off the API key, kpnc
const uri = "myappleAPIchri.com"; // Your MongoDB API
const dbName = "registration_db";
const collectionName = 'registrations';
const outputFilePath = 'output.csv';

// The fields you want to export. This is important for nested objects.
// Use dot notation for nested fields, e.g., 'user.name'
const fields = [
  'fullName',
  'school',
  'contactNumber',
  'email',
  'quizParticipant1',
  'quizParticipant2',
  'quizParticipant3',
  'quizParticipant4',
  'kartkraftParticipant1',
  'kartkraftParticipant2',
  'kartkraftParticipant3',
  'kartkraftParticipant4',
  'reelgearParticipant1',
  'reelgearParticipant2',
  'reelgearParticipant3',
  'reelgearParticipant4',
  'ideajamParticipant1',
  'ideajamParticipant2',
  'ideajamParticipant3',
  'ideajamParticipant4',
  'escapeParticipant1',
  'escapeParticipant2',
  'escapeParticipant3',
  'escapeParticipant4',
  'wealthParticipant1',
  'wealthParticipant2',
  'wealthParticipant3',
  'wealthParticipant4',
  'varietyParticipant1',
  'varietyParticipant2',
  'varietyParticipant3',
  'varietyParticipant4',
  'varietyParticipant5',
  'varietyParticipant6',
  'varietyParticipant7',
  'varietyParticipant8',
  'varietyParticipant9',
  'varietyParticipant10'
];

async function run() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log("Connected successfully to MongoDB server");

    const database = client.db(dbName);
    const collection = database.collection(collectionName);
    const data = await collection.find({}).toArray();

    if (data.length === 0) {
      console.log("No documents found in the collection.");
      return;
    }
    
    console.log(`Found ${data.length} documents. Converting to CSV...`);

    // Convert JSON to CSV
    const json2csvParser = new Parser({ fields });
    const csv = json2csvParser.parse(data);

    // Write CSV to a file
    fs.writeFileSync(outputFilePath, csv);

    console.log(`Successfully exported data to ${outputFilePath}`);

  } catch (err) {
    console.error("An error occurred:", err);
  } finally {
    await client.close();
  }
}

run().catch(console.dir);
