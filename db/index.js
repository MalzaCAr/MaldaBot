const { MongoClient } = require("mongodb");
const dotenv = require('dotenv');
dotenv.config();

// Replace the uri string with your connection string.
const uri = process.env.MDBURI;
const client = new MongoClient(uri);

const database = client.db('stupidIdiotBotDB');
const reminders = database.collection('reminders');

module.exports = {
    reminders, 

    killClient: async() => {
        try {
            await client.close();
            return "MongoDB Client closed";
        } catch(err) {
            return err;
        }
    }
    
}