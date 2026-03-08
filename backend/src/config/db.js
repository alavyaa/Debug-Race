  const mongoose = require('mongoose');

  const connectDB = async () => {
    try {
      const conn = await mongoose.connect(process.env.MONGO_URI);
      console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
      console.error(`❌ MongoDB Error: ${error.message}`);
      process.exit(1);
    }
  };

  module.exports = connectDB;

  // const mongoose = require("mongoose");

  // async function connectDB(){
  //   try{
  //     await mongoose.connect(process.env.MONGODB_URI);
  //     console.log("✅ MongoDB Connected");
  //   }catch(err){
  //     console.error("DB Error:", err.message);
  //   }
  // }

  // module.exports = connectDB;