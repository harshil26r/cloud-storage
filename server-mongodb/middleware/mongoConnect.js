import { MongoClient } from 'mongodb';

// Connection URL
const url = 'mongodb://localhost:27017/storageDB';
export const client = new MongoClient(url, { maxPoolSize: 10 });

// Database Name
// const dbName = 'storageDB';

export async function connectDB() {
  // Use connect method to connect to the server
  await client.connect();
  console.log('Connected successfully to server');
  const db = client.db();

  return db;
}
