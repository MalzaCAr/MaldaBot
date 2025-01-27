const { SlashCommandBuilder} = require('@discordjs/builders');
const { PermissionFlagsBits } = require('discord-api-types/v10');
const { database, cmdInptToMs, nanoid, msToRelTime } = require('../../db/index');

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
        let reminderMemo = interaction.options.data.find(arg => arg.name === 'memo').value;
        let discID = interaction.member.id;
        let nickname = interaction.member.user.username;
        let channelID = interaction.channelId;
        let reminders = database.collection("reminders");

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

        if (timeString == "help") {
            await interaction.reply({content:"Type in a number followed by a keyword such as `minutes`, `mins`, `m` etc. \nThis command supports `minutes`, `hours`, `days` and `weeks`."/*, ephemeral: true*/});
            await interaction.followUp({content: "Example: '5 weeks 1 day 12 hours 30 mins', \nor: '5w1d12h30m'"/*, ephemeral: true*/});
            return;
        }

        //this does the "the bot is thinking ..." so the command doesn't time out if the db is lagging or smth
        await interaction.deferReply(); 

        let futureDateInMillis = cmdInptToMs(timeString);

        if (futureDateInMillis <= 0) { //some idiot proofing :P
            await interaction.editReply({content: "Wrong syntax in `time` field"});
            return;
        }
        if (futureDateInMillis > 31556926000) {
            await interaction.editReply({content: "Sorry, the reminder can't be over 1 year into the future"});
            return;
        }

        let res, reminderCap = 10; //the amount of reminders one can have at a time
        try {
            res = await reminders.find({discID: discID}).toArray();
        } catch (err) {
            console.log(err);
            await interaction.editReply("Something went wrong with setting the reply :(");
            return;
        };
        
        if (res.length > reminderCap) {
            await interaction.editReply({content: `Sorry, you can't have more than ${reminderCap} reminders`});
            return;
        }

        let currentDate = new Date(Date.now())
        let dueDate = new Date(Date.now())
        dueDate.setTime(currentDate.getTime() + futureDateInMillis);
        
        try {
            let remid = Number(nanoid());
            res = await reminders.insertOne({
                remid, discID, nickname, reminderMemo, dueDate, channelID
            });
        } catch (err) {
            console.log(err);
            await interaction.editReply({content: "Something went wrong with setting the reminder. Try again later :("});
            return;
        } 

        interaction.editReply({content: `Reminder set to go off in ${msToRelTime(dueDate)}`});
	}
};