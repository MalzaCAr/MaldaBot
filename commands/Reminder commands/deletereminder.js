const { SlashCommandBuilder } = require('@discordjs/builders');
const { query } = require('../../db/index');

module.exports = {
	data: new SlashCommandBuilder()
        .setName(`deletereminder`)
        .setDescription(`Deletes your reminder (use /showreminders to check which id corresponds to which reminder)`)
    .addIntegerOption(option => option.setName('reminderid')
        .setDescription('the id of the reminder')
        .setRequired(true)),

	async execute(interaction) {
        let reqID = Number(interaction.options.data.find(arg => arg.name === "reminderid").value); //requested id
        let discID = interaction.member.id;

        let res;
        try {
            res = await query("DELETE FROM reminders WHERE owner_id = $1 AND rem_id = $2", [discID, reqID]);
        } catch(err) {
            console.error(err);
            interaction.reply({content: `Something went wrong with the deletion of the reminder`, ephemeral: true});
            return;
        }

        if (res.rowCount === 0) {
            interaction.reply({content: `The id "${reqID}" doesn't match any of your reminder ids`, ephemeral: true});
            return;
        }
    
        interaction.reply({content: `Successfully deleted the reminder with the id: ${'`' + reqID + '`'}.`, ephemeral: true})
	}
};