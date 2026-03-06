const mongoose = require('mongoose');

const connectDB = async () => {
  // allow a fallback to a local database for dev if no URI is provided
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/foody';
  try {
    const conn = await mongoose.connect(uri, {
      // you can add mongoose options here if needed
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('Failed to connect to MongoDB.');
    console.error('URI:', uri);
    console.error('Error message:', error.message);
    console.error('Make sure your Atlas IP is whitelisted or a local MongoDB instance is running.');
    process.exit(1);
  }
};

module.exports = connectDB;
