const { MongoClient, ServerApiVersion } = require("mongodb");
const { customAlphabet } = require('nanoid');
const nanoid = customAlphabet('1234567890', 8); //use arabic numbers, use 8 of them
const dotenv = require('dotenv');
dotenv.config();

//Reminder stuff
const uri = process.env.MDBURI;
const client = new MongoClient(uri, 
    {serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true
    }}, 
    { connectTimeoutMS: 30000 }, 
    { keepAlive: 1 }
);

console.log(client);

const database = client.db('stupidIdiotBotDB');
const reminders = database.collection('reminders');

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
//Also make sure to go from smallest unit of time to biggest, otherwise rip code
const minRegex = [/minutes/i,/minute/i,/mins/i, /min/i, /m/i, ]; 
const hourRegex = [/hours/i, /hour/i, /h/i];
const dayRegex = [/days/i, /day/i, /d/i];
const weekRegex = [/weeks/i, /week/i, /w/i];

const regexes = [
    new keywordRegex(minRegex, 60000, "minutes"), //minutes
    new keywordRegex(hourRegex, 3600000, "hours"), //hours
    new keywordRegex(dayRegex, 86400000, "days"), //days
    new keywordRegex(weekRegex, 604800000, "weeks") //weeks
];

module.exports = {
    database,
    reminders,
    regexes,
    /**
     * random id generator
     * @returns {string}
     */ 
    nanoid: function() {
        return nanoid();
    },

    /**
     * used to kill the mongodb client
     */
    killClient: async() => {
        try {
            await client.close();
            return "MongoDB Client closed";
        } catch(err) {
            return err;
        }
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

        //this feels like such a stupid way to do this but im also stupid so it is what it is
        //handles the output message containing in how many weeks/days/hours/minutes is the reminder due
        let replyArray = [];

        //the array is reversed so the loop divides by bigger time values first
        for (let i of regexes.reverse()) {
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