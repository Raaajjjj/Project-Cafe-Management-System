import { MongoClient } from 'mongodb';

// MongoDB connection URL
const url = 'mongodb+srv://raj:Me04%4002%21ta@cluster0.c5fvt.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
const client = new MongoClient(url); // Removed useNewUrlParser and useUnifiedTopology options

// Function to connect to MongoDB and return the 'Details' collection
async function dbConnect() {
    await client.connect(); // Ensure client is connected
    const db = client.db('Registration'); // Database name
    return db.collection('Details'); // Collection name
}


// Export the dbConnect function
export default dbConnect;
