import mongoose from "mongoose";

export function mongooseConnect() {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection.asPromise();
  } else {
    const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/meera-mall";
    return mongoose.connect(uri);
  }
}

mongoose.set('strictQuery', true);
