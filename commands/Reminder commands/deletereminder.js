const { SlashCommandBuilder } = require('@discordjs/builders');
const { database } = require('../../db/index');

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
        let reminders = database.collection("reminders");

        //returns a reminder that belongs to the user
        let res = await reminders.find({ discID: discID, remid: reqID, }).toArray();

        if (res[0] === undefined) {
            interaction.reply({content: `The id "${reqID}" doesn't match any of your reminder ids`});
            return;
        }

        try {
            await reminders.deleteOne({remid: reqID, });
            interaction.reply({content: `Successfully deleted the reminder with the id: ${'`' + reqID + '`'}.`/*ephemeral: true*/})
        }catch (err) {
            console.log(err);
            interaction.reply({content: `Something went wrong with the deletion of the reminder`});
        }
	}
};