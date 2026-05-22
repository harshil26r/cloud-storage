import { connectDB, client } from './middleware/mongoConnect.js';

try {
  const db = await connectDB();

  await db.command({
    collMod: 'users',
    validator: {
      $jsonSchema: {
        bsonType: 'object',
        required: ['_id', 'email', 'password', 'rootDirId', 'username'],
        properties: {
          _id: {
            bsonType: 'objectId',
          },
          email: {
            bsonType: 'string',
            // pattern: '/^[^\s@]+@[^\s@]+\.[^\s@]+$/',
            // description: 'Please enter valid email',
          },
          password: {
            bsonType: 'string',
            minLength: 3,
          },
          rootDirId: {
            bsonType: 'objectId',
          },
          username: {
            bsonType: 'string',
            minLength: 3,
            description: 'Minimum 3 character requiers',
          },
        },
        additionalProperties: false,
      },
    },
    validationAction: 'error',
    validationLevel: 'strict',
  });

  await db.command({
    collMod: 'files',
    validator: {
      $jsonSchema: {
        bsonType: 'object',
        required: ['_id', 'extension', 'name', 'parentDirId'],
        properties: {
          _id: {
            bsonType: 'objectId',
          },
          extension: {
            bsonType: 'string',
          },
          name: {
            bsonType: 'string',
          },
          parentDirId: {
            bsonType: 'objectId',
          },
        },
        additionalProperties: false,
      },
    },
    validationAction: 'error',
    validationLevel: 'strict',
  });

  await db.command({
    collMod: 'directories',
    validator: {
      $jsonSchema: {
        bsonType: 'object',
        required: ['_id', 'name', 'parentDirId', 'userId'],
        properties: {
          _id: {
            bsonType: 'objectId',
          },
          name: {
            bsonType: 'string',
          },
          parentDirId: {
            bsonType: ['objectId', 'null'],
          },
          userId: {
            bsonType: 'objectId',
          },
        },
      },
    },
    validationAction: 'error',
    validationLevel: 'strict',
  });
  await client.close();
} catch (error) {
  console.log(error);
}
