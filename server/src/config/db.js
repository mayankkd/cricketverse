const mongoose = require('mongoose');

let isConnected = false;

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/cricketverse';
  
  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 2000,
      connectTimeoutMS: 2000,
    });
    isConnected = true;
    console.log(`[CricketVerse DB] Connected to MongoDB host: ${conn.connection.host}`);
    return conn;
  } catch (err) {
    isConnected = false;
    console.warn(`[CricketVerse DB] Notice: MongoDB at ${uri} was unreachable (${err.message}).`);
    console.log(`[CricketVerse DB] Running with Resilient Data Store for seamless execution without requiring external mongod daemon.`);
    return null;
  }
};

const getDBStatus = () => ({
  connected: isConnected,
  type: isConnected ? 'MongoDB (Mongoose)' : 'Resilient File/Memory Store'
});

module.exports = {
  connectDB,
  getDBStatus,
  isMongoConnected: () => isConnected
};
