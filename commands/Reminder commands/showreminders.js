const { SlashCommandBuilder } = require('@discordjs/builders');
const { query, msToRelTime } = require('../../db/index');

module.exports = {
	data: new SlashCommandBuilder()
        .setName(`showreminders`)
        .setDescription(`Show all of your active reminders`),

	async execute(interaction) {
        let discID = interaction.member.id, guildId = interaction.member.guild.id;

        let res = await query({
            text: `
                SELECT r.rem_id, r.memo, r.due_date 
                FROM Reminders r
                JOIN Channels c ON r.channel_id = c.channel_id
                JOIN Servers s on c.guild_id = s.guild_id
                WHERE r.disc_id = $1 AND s.guild_id = $2`, 
            values: [discID, guildId],
            rowMode: 'array',
        });

        if (res.rowCount == 0) {
            interaction.reply({content: "You have no reminders set", ephemeral: true});
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