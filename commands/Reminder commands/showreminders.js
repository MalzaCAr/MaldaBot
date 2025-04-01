const { SlashCommandBuilder } = require('@discordjs/builders');
const { query, msToRelTime } = require('../../db/index');

module.exports = {
	data: new SlashCommandBuilder()
        .setName(`showreminders`)
        .setDescription(`Show all of your active reminders`),

	async execute(interaction) {
        let discID = interaction.member.id;

        let res = await query({
            text: "SELECT rem_id, memo, due_date FROM reminders WHERE owner_id = $1", 
            values: [discID],
            rowMode: 'array',
        });

        if (res.rowCount == 0) {
            interaction.reply({content: "You have no reminders set"});
            return;
        }

        let output = `Your reminders are: \n\n`;

        for (let row of res.rows) {
            output += 
                `**${row[0]}**: ${row[1]}\n` + 
                `**Due**: ${msToRelTime(row[2])}\n\n`;
        }   

        interaction.reply({content: output, ephemeral: true});
        }
};