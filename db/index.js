const { Pool } = require('pg')
const dotenv = require('dotenv');
const { time } = require('@discordjs/builders');

dotenv.config();

const pool = new Pool({
    connectionString: process.env.DBURL,
});

module.exports = {
    queryReminder: async(text, params, callback) => {
        try {
            let res = pool.query(text, params, callback);
            return res;
        } catch {
            return "Failed";
        }
    }
}