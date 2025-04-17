// MongoDB connection
import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

const db_password = process.env.DB_PASSWORD;
const uri = `mongodb+srv://a2zeejey:${db_password}@cluster0.pdlu66z.mongodb.net/noteapp?retryWrites=true&w=majority`;
const clientOptions = {
  serverApi: { version: '1', strict: true, deprecationErrors: true }
};

async function connectDB() {
  try {
    await mongoose.connect(uri, clientOptions);
    await mongoose.connection.db.admin().command({ ping: 1 });
    console.log("✅ Pinged your deployment. Successfully connected to MongoDB!");
  } catch (err) {
    console.error("❌ Failed to connect to MongoDB:", err);
    process.exit(1); // Exit the app if connection fails
  }
}

export default connectDB;
