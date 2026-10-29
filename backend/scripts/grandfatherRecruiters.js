import "dotenv/config";
import mongoose from "mongoose";
import User from "../models/User.js";

await mongoose.connect(process.env.MONGO_URI);

const result = await User.updateMany(
  { role: "recruiter", verificationStatus: { $in: [null, "none"] } },
  { $set: { verificationStatus: "verified", emailVerified: true, verificationReviewedAt: new Date() } }
);

console.log(`Grandfathered ${result.modifiedCount} existing recruiter(s).`);
await mongoose.disconnect();