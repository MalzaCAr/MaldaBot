const { SlashCommandBuilder} = require('@discordjs/builders');
const { PermissionFlagsBits } = require('discord-api-types/v10');
const { query, cmdInptToMs, nanoid, msToRelTime } = require('../../db/index');

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
        let guildID = interaction.guild.id, guildName = interaction.guild.name;

        //no funny @everyone @here, or role pings
        const nonoterms = [/@everyone/i, /@here/i, /<@&\d+>/g]; 
        for (let nonoterm of nonoterms) {
            if (reminderMemo.search(nonoterm) != -1) {
                interaction.reply({content: `no, fuck off <@${discID}>`, ephemeral: true});
                return;
            }
        }

        //replaces any ping in the reminder with a ping of the command user, we do a little bit of trolling
        const mentionRegex = /<@\d+>/g;
        reminderMemo = reminderMemo.replace(mentionRegex, `<@${discID}>`); 

        let timeString = interaction.options.data.find(arg => arg.name === 'time').value; //example 1d6h30m

        if (timeString == "help") {
            await interaction.reply({content:"Type in a number followed by a keyword such as `minutes`, `mins`, `m` etc. \nThis command supports `minutes`, `hours`, `days` and `weeks`.", ephemeral: true});
            await interaction.followUp({content: "Example: '5 weeks 1 day 12 hours 30 mins', \nor: '5w1d12h30m'", ephemeral: true});
            return;
        }

        //this does the "the bot is thinking ..." so the command doesn't time out if the db is lagging or smth
        await interaction.deferReply(); 

        let futureDateInMillis = cmdInptToMs(timeString);

        //some idiot proofing :P
        if (futureDateInMillis <= 0) { 
            await interaction.editReply({content: "Wrong syntax in `time` field", ephemeral: true});
            return;
        }
        if (futureDateInMillis > 31556926000) {
            await interaction.editReply({content: "Sorry, the reminder can't be over 1 year into the future", ephemeral: true});
            return;
        }

        //DATABASE STUFF
        let res;
        try {
            res = await query("INSERT INTO servers VALUES ($1, $2) ON CONFLICT (guild_id) DO NOTHING;", [guildID, guildName]);
            res = await query("INSERT INTO users VALUES ($1, $2, $3) ON CONFLICT (disc_id) DO NOTHING;", [discID, nickname, guildID]);
        } catch(err) {
            console.error(err);
            await interaction.editReply({content: "Something went wrong with setting the reply :(", ephemeral: true});
            return;
        }

        let reminderCap = 10; //the amount of reminders one can have at a time
        try {
            res = await query("SELECT COUNT(*) FROM reminders WHERE owner_id = $1", [discID]);
        } catch (err) {
            console.error(err);
            await interaction.editReply({content: "Something went wrong with setting the reply :(", ephemeral: true});
            return;
        };

        if (res.rows[0].count >= reminderCap) {
            await interaction.editReply({content: `Sorry, you can't have more than ${reminderCap} reminders`, ephemeral: true});
            return;
        }

        let currentDate = new Date(Date.now())
        let dueDate = new Date(Date.now())
        dueDate.setTime(currentDate.getTime() + futureDateInMillis + 1000);

        //since my way of doing ids *can* result in primary key conflicts, this will try multiple times to insert
        for (let i = 0; true; i++) {
            try {
                let remid = Number(nanoid());
                res = await query("INSERT INTO reminders VALUES ($1, $2, $3, $4, $5)", 
                    [remid, reminderMemo, dueDate, channelID, discID]
                );
                break;
            } catch (err) {
                //code 2305 is "key already exists" error
                if (err.code == '23505' && i <= 10) {
                    console.error("Primary key conflict");
                    continue;
                }

                console.log(err);
                await interaction.editReply({content: "Something went wrong with setting the reminder. Try again later :(", ephemeral: true});
                return;
            }
        }

        interaction.editReply({content: `Reminder set to go off in ${msToRelTime(dueDate)}`});
	}
};