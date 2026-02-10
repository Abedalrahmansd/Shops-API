// tests/globalSetup.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import dns from "node:dns/promises";


dotenv.config({ path: '.env' }); // Use .env.test with DB_URI=testdb
dns.setServers(["1.1.1.1"]);

export default async () => {
  await mongoose.connect(process.env.DB_URI_TEST);
};