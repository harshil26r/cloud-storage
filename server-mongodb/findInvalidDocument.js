import { MongoClient } from 'mongodb';

const client = new MongoClient('mongodb://127.0.0.1:27017/storageDB');

await client.connect();

const db = client.db();
const collection = db.collection('users');
const collectionInfo = await db.listCollections({ name: 'users' }).toArray();
const schema = collectionInfo[0].options.validator.$jsonSchema;

const invalidDocuments = await collection
  .find({
    $nor: [
      {
        $jsonSchema: schema,
      },
    ],
  })
  .toArray();

console.log(invalidDocuments);
client.close();
