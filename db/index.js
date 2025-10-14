//const { MongoClient, ServerApiVersion } = require("mongodb");
const { Pool } = require ('pg');
const { customAlphabet } = require('nanoid');
const nanoid = customAlphabet('1234567890', 8); //use arabic numbers, use 8 of them
const dotenv = require('dotenv');
dotenv.config();

//Reminder stuff
const pool = new Pool({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    database: 'maldadb',
    max: 20,
    connectionTimeoutMillis: 20000
});

class keywordRegex {
    constructor(inputArr, amount, name) {
        this.regexArr = this.regexArr.concat(inputArr);
        this.amountOfMs = amount;
        this.name = name;
    };
    regexArr = [];
    amountOfMs = 60000; //lowest possible
    name = "minute"; 
}

//List of regexes for the keywords for time input
//Make sure to go from longer words to shorter, otherwise it'll e.g. find 'min' then 'mins'.
//Also make sure to go from biggest unit of time to smallest, otherwise rip code
const minRegex = [/minutes/i,/minute/i,/mins/i, /min/i, /m/i, ]; 
const hourRegex = [/hours/i, /hour/i, /h/i];
const dayRegex = [/days/i, /day/i, /d/i];
const weekRegex = [/weeks/i, /week/i, /w/i];

const regexes = [
    new keywordRegex(weekRegex, 604800000, "weeks"), //weeks
    new keywordRegex(dayRegex, 86400000, "days"), //days
    new keywordRegex(hourRegex, 3600000, "hours"), //hours
    new keywordRegex(minRegex, 60000, "minutes") //minutes
];

module.exports = {
    /**
     * Used to query the database
     * @param {string} text //the query text
     * @param {array} params //the parameters for the query
     * @param {function} callback //the callback function
     * @returns {Promise}
     */
    query: async(text, params, callback) => {
        return pool.query(text, params, callback);
    },
    /**
     * Used to setup the database tables
     */
    run_db: async() => {
        const client = await pool.connect();

        try {
            await client.query('BEGIN');

            /*await client.query('DROP TABLE IF EXISTS Servers CASCADE;');
            await client.query('DROP TABLE IF EXISTS Channels CASCADE;');
            await client.query('DROP TABLE IF EXISTS Users CASCADE;');
            await client.query('DROP TABLE IF EXISTS Users_Servers CASCADE;');
            await client.query('DROP TABLE IF EXISTS Reminders CASCADE;');
            await client.query('DROP TABLE IF EXISTS reg CASCADE;');*/
            
            await client.query(
                `CREATE TABLE IF NOT EXISTS Servers(
                    guild_id BIGINT PRIMARY KEY,
                    guild_name VARCHAR(100) NOT NULL
                );`
            );

            await client.query(
                `CREATE TABLE IF NOT EXISTS Channels(
                    channel_id BIGINT PRIMARY KEY,
                    channel_name VARCHAR(32) NOT NULL,
                    guild_id BIGINT NOT NULL,FOREIGN KEY (guild_id) REFERENCES Servers(guild_id)
                );`
            );

            await client.query(
                `CREATE TABLE IF NOT EXISTS Users(
                    disc_id BIGINT PRIMARY KEY,
                    nickname VARCHAR(32) NOT NULL);`
            );

            await client.query(
                `CREATE TABLE IF NOT EXISTS Users_Servers(
                    disc_id BIGINT NOT NULL,
                    guild_id BIGINT NOT NULL,
                    PRIMARY KEY (disc_id, guild_id),
                    FOREIGN KEY (disc_id) REFERENCES Users(disc_id),
                    FOREIGN KEY (guild_id) REFERENCES Servers(guild_id)
                );`
            );

            await client.query(
                `CREATE TABLE IF NOT EXISTS Reminders(
                    rem_id INT PRIMARY KEY,
                    memo VARCHAR(255) NOT NULL,
                    due_date TIMESTAMP NOT NULL,
                    channel_id BIGINT NOT NULL,
                    FOREIGN KEY (channel_id) REFERENCES Channels(channel_id),
                    disc_id BIGINT NOT NULL,
                    FOREIGN KEY (disc_id) REFERENCES Users(disc_id)
                );`
            );

            await client.query(
                `CREATE TABLE IF NOT EXISTS reg (
                    reg_id SERIAL PRIMARY KEY,
                    disc_id BIGINT NOT NULL,
                    FOREIGN KEY(disc_id) REFERENCES Users(disc_id),
                    channel_id BIGINT NOT NULL,
                    FOREIGN KEY (channel_id) REFERENCES Channels(channel_id),
                    CONSTRAINT unique_pair UNIQUE (disc_id, channel_id)
                );`
            );

            await client.query('COMMIT');

            await client.release();
        } catch (error) {
            await client.query('ROLLBACK');
            console.error(error);
        }
    },

    /**
     * random id generator
     * @returns {string}
     */ 
    nanoid: function() {
        return nanoid();
    },

    /**
     * used to get a client from the connection pool
     * @returns {Promise<import('pg').PoolClient>} 
     */
    getClient: function() {
        return pool.connect();
    },

    /**
     * used to parse an input string and convert it to milliseconds (int).
     * @param {string} inputString //the string you wish to parse
     * @returns {int}
     */
    cmdInptToMs: function(inputString) {
        inputString = inputString.toLowerCase().replace(/ /g, ""); //fuck case sensitivity & spaces
        let result = 0;
        for (let regex of regexes) {
            let position; //position of keyword
            for (let i of regex.regexArr) {
                position = inputString.search(i);
                if (position == -1) continue; //search returns -1 if not found, so checking that
            
                let number = ""; 
            
                for (let j = position - 1; j >= 0 && !isNaN(parseInt(inputString[j])); j--) { //goes backwards from keyword until it finds a non-digit
                    number += inputString[j];
                }

                if (number.length > 1) { //since the numbers are added backwards, the string must be inverted to display the right number
                    number = number.split("").reverse().join("")
                }
                result += number * regex.amountOfMs;
                break;
            } 
        }
        return result;
    },

    /**
     * Used to convert a given amount of time in milliseconds into relative time from now.
     * @param {Int} dueDateMs
     * @returns {String}
     */
    msToRelTime: function(dueDateMs) {
        let timeDiff = new Date(dueDateMs).getTime() - new Date(Date.now()).getTime();

        let replyArray = [];

        for (let i of regexes) {
            if (timeDiff / i.amountOfMs < 1) continue;

            let amount = parseInt(timeDiff / i.amountOfMs);
            timeDiff %= i.amountOfMs;

            if (amount == 1) {
                replyArray.push(`1 ${i.name.slice(0, i.name.length - 1)}`);
            }                                        
            else {
                replyArray.push(`${amount} ${i.name}`);
            }
        }

        //if the number is smaller than a minute the array will be empty, so just say "less than 1 minute"
        if (replyArray.length == 0) {
            replyArray.push("less than 1 minute");
        }

        return `in ${new Intl.ListFormat('en-GB', {style: 'long', type: 'conjunction'}).format(replyArray)}, on <t:${Math.floor(dueDateMs/1000)}:F>`;
    }
}