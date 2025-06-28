import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI!

if (!MONGODB_URI) {
    throw new Error("No connection string")
}

let cached = global.mongoose;
//if its not running on edge
if (!cached) {
    cached = global.mongoose = {
        conn: null,
        promise: null
    }
}

export async function connectToDB() {
    if (cached.conn) return cached.conn;

    //handling duplicate requests by me
    if (!cached.promise) {
        const opts = {
            bufferCommands: true,
            //how many connections in one gos
            maxPoolSize: 10
        };
        cached.promise = mongoose
            .connect(MONGODB_URI, opts)
            .then(() => mongoose.connection)
    }

    try{
        cached.conn = await cached.promise;
    }
    catch(e){
        cached.promise = null;
        throw new Error("Check database file")
    }

    return cached.conn;

}