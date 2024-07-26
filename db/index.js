const { MongoClient } = require("mongodb");
const { customAlphabet } = require('nanoid');
const nanoid = customAlphabet('1234567890', 8);
const dotenv = require('dotenv');
dotenv.config();

//Reminder stuff
const uri = process.env.MDBURI;
const client = new MongoClient(uri);

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
     * used to parse an input string and convert it to milliseconds (int)
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
            return result;
        }
    }
    
}