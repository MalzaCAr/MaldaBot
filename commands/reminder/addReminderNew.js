const { SlashCommandBuilder} = require('@discordjs/builders');
const db = require('../../db/index');

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

module.exports = {
	data: new SlashCommandBuilder()
        .setName(`addreminder`)
        .setDescription(`Adds a new reminder. Type "help" in the time field`)

        .addStringOption(option => option.setName('memo')
        .setDescription('The text you want to be displayed when the reminder is due')
        .setRequired(true))
        
        .addStringOption(option => option.setName('time')
        .setDescription('Due date; Type "help" to see how to use this field')
        .setRequired(true))
        
        .addStringOption(option => option.setName('interval')
        .setDescription('Time interval at which the reminder will repeat (optional)')
        .setRequired(false)),

	async execute(interaction) {
        const reminderMemo = interaction.options.data.find(arg => arg.name === 'memo').value;

        let discID = interaction.member.id;
        let nickname = interaction.member.user.username;
        let channelID = interaction.channelId;

        let timeString = interaction.options.data.find(arg => arg.name === 'time').value; //example 1d6h30m
        timeString = timeString.toLowerCase(); //fuck case sensitivity lmao
        timeString = timeString.replace(/ /g, ""); //fuck spaces too

        let repeatInterval;
        if ( typeof interaction.options.data.find(arg => arg.name === 'interval') !== 'undefined') {
            repeatInterval =  interaction.options.data.find(arg => arg.name === 'interval').value;
            repeatInterval = repeatInterval.toLowerCase().replace(/ /g, ""); // -||-
        }
        else repeatInterval = null;


        if (timeString == "help") {
            await interaction.reply({content:"Type in a number followed by a keyword such as 'minutes', 'mins', 'm' etc. "/*, ephemeral: true*/});
            await interaction.followUp({content: "Example: '1 day 12 hours 30 m'"/*, ephemeral: true*/});
            return;
        }

        let reminderCap = 10; //the amount of reminders one can have at a time
        let res = await db.queryReminder(`SELECT * FROM reminders WHERE discid = $1`, [discID]);

        if (res.rowCount > reminderCap) {
            interaction.reply({content: `Sorry, you can't have more than ${reminderCap} reminders`});
            return;
        }

        let minRegex = [/minutes/i,/minute/i,/mins/i, /min/i, /m/i, ]; 
        let hourRegex = [/hours/i, /hour/i, /h/i];
        let dayRegex = [/days/i, /day/i, /d/i];
        let weekRegex = [/weeks/i, /week/i, /w/i];
        let monthRegex = [/months/i, /month/i, /mon/i]; //unused because length is inconsistent and I cba to code that in

        //Make sure to go from longer words to shorter, otherwise it'll e.g. find 'min' then 'mins'.
        //Also make sure to go from smallest unit of time to biggest, otherwise rip code
        let regexes = [
            new keywordRegex(minRegex, 60000, "minutes"), //mins
            new keywordRegex(hourRegex, 3600000, "hours"), //hours
            new keywordRegex(dayRegex, 86400000, "days"), //days
            new keywordRegex(weekRegex, 604800000, "weeks") //weeks
        ];

        let futureDateInMillis = 0;
        let intervalInMillis;

        function regexsmthidk(uhhhh, nuhuh) {
            for (let regex of regexes) {
                let position; //position of keyword
                for (let i of regex.regexArr) {
                    position = uhhhh.search(i);
    
                    if (position < 0) continue; //search returns -1 if not found, so checking that
    
                    let number = ""; 
    
                    for (let j = position - 1; j >= 0 && isNaN(parseInt(timeString[j])) == false; j--) { //goes backwards from keyword until it finds a non-digit
                        number += uhhhh[j];
                    }
    
                    if (number.length > 1) { //since the numbers are added backwards, the string must be inverted to display the right number
                        number = number.split("").reverse().join("")
                    }
                    nuhuh.num += number * regex.amountOfMs;
                    break;
                } 
            }
        }

        let futureDateObj = {num: 0};
        regexsmthidk(timeString, futureDateObj);
        futureDateInMillis = futureDateObj.num;
        if (repeatInterval !== null) {
            let intervalObj = {num: 0}; //i swear to god if this fucking works
            regexsmthidk(repeatInterval, intervalObj);
            intervalInMillis = intervalObj.num; //this is so fucking cursed
        }
        delete futureDateObj;
        delete intervalObj;

        if (futureDateInMillis <= 0) { //some idiot proofing :P
            interaction.reply({content: "No due time has been identified"});
            return;
        }
        if (futureDateInMillis > 31556926000) {
            interaction.reply({content: "Sorry, reminder can't be over 1 year into the future"});
            return;
        }

        let currentDate = new Date(Date.now())
        let dueDate = new Date(Date.now())

        dueDate.setTime(currentDate.getTime() + futureDateInMillis);

        try {
            res = await db.queryReminder(`INSERT INTO reminders (discID, nickname, memo, dueTime, channelID, interval) VALUES ($1, $2, $3, $4, $5, $6)`, [
                discID, nickname, reminderMemo, dueDate.toJSON(), channelID, intervalInMillis
            ])
        } catch (err) {
            console.log(err);
            interaction.reply({content: "Something went wrong with setting the reminder. Try again later"});
            return;
        } 

        let replyArray = []; //used for displaying the due time

        for (let i = regexes.length - 1; i >= 0; i--) {
            if (futureDateInMillis / regexes[i].amountOfMs >= 1) {
                let result = parseInt(futureDateInMillis / regexes[i].amountOfMs);
                futureDateInMillis -= result * regexes[i].amountOfMs;
    
                if (result == 1) {
                    replyArray.push(`1 ${regexes[i].name.slice(0, regexes[i].name.length - 1)}`);
                }
                else {
                    replyArray.push(`${result} ${regexes[i].name}`);
                }
            }
        }

        //node magic format methods
        interaction.reply({content: `Reminder set to go off in ${new Intl.ListFormat('en-GB', {style: 'long', type: 'conjunction'}).format(replyArray)}`});
	}
};