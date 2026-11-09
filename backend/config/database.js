const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/agriconnect', {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    console.log(`💡 Atlas Notice: If using MongoDB Atlas, ensure your IP address is whitelisted in Atlas Network Access (https://cloud.mongodb.com/).`);
    console.log(`💡 Local Notice: If running locally, ensure the local MongoDB service is started.`);
    return null;
  }
};

module.exports = connectDB;
