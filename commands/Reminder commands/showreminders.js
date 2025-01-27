const { SlashCommandBuilder } = require('@discordjs/builders');
const { database, msToRelTime } = require('../../db/index');

module.exports = {
	data: new SlashCommandBuilder()
        .setName(`showreminders`)
        .setDescription(`Show all of your active reminders`),

	async execute(interaction) {
        let discID = interaction.member.id;
        let reminders = database.collection("reminders");

        let res = await reminders.find({ discID: discID, }).toArray();

        if (res.length == 0) {
            interaction.reply({content: "You have no reminders set"});
            return;
        }

        let output = `Your reminders are: \n\n`;

        for (let row of res) {
            output += 
                `**${row.remid}**: ${row.reminderMemo}\n` + 
                `**Due**: ${msToRelTime(row.dueDate)}\n\n`;
        }   

        interaction.reply({content: output/*, ephemeral: true*/});
	}
};