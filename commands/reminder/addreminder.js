const { SlashCommandBuilder} = require('@discordjs/builders');
const { PermissionFlagsBits } = require('discord-api-types/v10');
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

const tableName = "reminders";
module.exports = {
	data: new SlashCommandBuilder()
        .setName(`addreminder`)
        .setDescription(`Adds a new reminder.`)
        
        .addStringOption(option => option.setName('time')
        .setDescription('Due date (type "help" to see how to use this field)')
        .setRequired(true))
        
        .addStringOption(option => option.setName('memo')
        .setDescription('The text you want to be displayed when the reminder is due')
        .setRequired(true)),
        //.setDefaultMemberPermissions(PermissionFlagsBits.Administrator), //ppl in server are assholes lol

	async execute(interaction) {
        function keywordSearch(inputString) {
            let result = 0;
            for (let regex of regexes) {
                let position; //position of keyword
                for (let i of regex.regexArr) {
                    position = inputString.search(i);
        
                    if (position == -1) continue; //search returns -1 if not found, so checking that
        
                    let number = ""; 
        
                    for (let j = position - 1; j >= 0 && !isNaN(parseInt(timeString[j])); j--) { //goes backwards from keyword until it finds a non-digit
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
        }
        //List of regexes for the keywords for time input
        //Make sure to go from longer words to shorter, otherwise it'll e.g. find 'min' then 'mins'.
        //Also make sure to go from smallest unit of time to biggest, otherwise rip code
        const minRegex = [/minutes/i,/minute/i,/mins/i, /min/i, /m/i, ]; 
        const hourRegex = [/hours/i, /hour/i, /h/i];
        const dayRegex = [/days/i, /day/i, /d/i];
        const weekRegex = [/weeks/i, /week/i, /w/i];

        const regexes = [
            new keywordRegex(minRegex, 60000, "minutes"), //mins
            new keywordRegex(hourRegex, 3600000, "hours"), //hours
            new keywordRegex(dayRegex, 86400000, "days"), //days
            new keywordRegex(weekRegex, 604800000, "weeks") //weeks
        ];

        let reminderMemo = interaction.options.data.find(arg => arg.name === 'memo').value;
        let discID = interaction.member.id;
        let nickname = interaction.member.user.username;
        let channelID = interaction.channelId;

        const nonoterms = [/@everyone/i, /@here/i, /<@&\d+>/g]; //no funny @everyone @here, or role pings
        for (let nonoterm of nonoterms) {
            if (reminderMemo.search(nonoterm) != -1) {
                interaction.reply({content: `no, fuck off <@${discID}>`});
                return;
            }
        }

        const mentionRegex = /<@\d+>/g;
        reminderMemo = reminderMemo.replace(mentionRegex, `<@${discID}>`); //replaces any ping in the reminder with a ping of the command user, we do a little bit of trolling

        let timeString = interaction.options.data.find(arg => arg.name === 'time').value; //example 1d6h30m
        timeString = timeString.toLowerCase(); //fuck case sensitivity lmao
        timeString = timeString.replace(/ /g, ""); //fuck spaces too

        if (timeString == "help") {
            await interaction.reply({content:"Type in a number followed by a keyword such as `minutes`, `mins`, `m` etc. \nThis command supports `minutes`, `hours`, `days` and `weeks`."/*, ephemeral: true*/});
            await interaction.followUp({content: "Example: '5 weeks 1 day 12 hours 30 mins', \nor: '5w1d12h30m'"/*, ephemeral: true*/});
            return;
        }

        let reminderCap = 10; //the amount of reminders one can have at a time

        //discord has an API that times out after 3 seconds, but the DB takes longer to time out, so with this function the bot does "bot is thinking" and can wait for more than 3 sec.
        await interaction.deferReply(); 

        let res;
        try {
            res = await db.queryReminder(`SELECT * FROM ${tableName} WHERE discid = $1`, [discID]);
        } catch (err) {
            console.log(err);
            await interaction.editReply("Something went wrong with setting the reply :(");
            return;
        };
        
        if (res.rowCount > reminderCap) {
            await interaction.editReply({content: `Sorry, you can't have more than ${reminderCap} reminders`});
            return;
        }

        let futureDateInMillis = keywordSearch(timeString);

        if (futureDateInMillis <= 0) { //some idiot proofing :P
            await interaction.editReply({content: "No due time has been identified"});
            return;
        }
        if (futureDateInMillis > 31556926000) {
            await interaction.editReply({content: "Sorry, the reminder can't be over 1 year into the future"});
            return;
        }

        let currentDate = new Date(Date.now())
        let dueDate = new Date(Date.now())

        dueDate.setTime(currentDate.getTime() + futureDateInMillis);

        try {
            res = await db.queryReminder(`INSERT INTO ${tableName} (discID, nickname, memo, dueTime, channelID) VALUES ($1, $2, $3, $4, $5)`, [
                discID, nickname, reminderMemo, dueDate.toJSON(), channelID
            ])
        } catch (err) {
            console.log(err);
            await interaction.editReply({content: "Something went wrong with setting the reminder. Try again later :("});
            return;
        } 

        let replyArray = []; //used for displaying the due time

        //divide the total amount of ms by chunks of amount of ms in weeks, days, hours and minutes
        //then convert to amount of weeks, days, hours and minutes
        for (let i = regexes.length - 1; i >= 0; i--) {
            if (futureDateInMillis / regexes[i].amountOfMs < 1) continue;
            
            let result = parseInt(futureDateInMillis / regexes[i].amountOfMs);
            futureDateInMillis -= result * regexes[i].amountOfMs;
    
            //the display names for the regexes are in plural ("minutes, hours and such")
            //which doesn't work if there's only 1 minute or 1 hour or such
            //so if it's not plural, cut off the last "s" on the words
            if (result == 1) {
                replyArray.push(`1 ${regexes[i].name.slice(0, regexes[i].name.length - 1)}`);
            }
            else {
                replyArray.push(`${result} ${regexes[i].name}`);
            }
            
        }

        const discTimestamp = Math.floor(dueDate.getTime()/1000); //discord timestamp to show date in the user's timezone
        const replyString = new Intl.ListFormat('en-GB', {style: 'long', type: 'conjunction'}).format(replyArray)

        //node magic format methods
        interaction.editReply({content: `Reminder set to go off in ${replyString}, at <t:${discTimestamp}:f>`});
	}
};