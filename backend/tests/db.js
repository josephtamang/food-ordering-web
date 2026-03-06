const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongod;

/**
 * Connect to a fresh in-memory MongoDB before tests.
 */
const connect = async () => {
  // Set required env vars before any model/controller loads
  process.env.JWT_SECRET = 'foody_test_jwt_secret_2024_supertest';
  process.env.JWT_EXPIRE = '7d';
  process.env.COOKIE_EXPIRE = '7';
  process.env.NODE_ENV = 'test';

  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  await mongoose.connect(uri);
};

/**
 * Drop database, close connection, stop mongod.
 */
const close = async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  if (mongod) await mongod.stop();
};

/**
 * Remove all documents from all collections (use between tests).
 */
const clear = async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
};

module.exports = { connect, close, clear };
