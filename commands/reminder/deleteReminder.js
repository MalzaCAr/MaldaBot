const { SlashCommandBuilder } = require('@discordjs/builders');
const { reminders } = require('../../db/index');

module.exports = {
	data: new SlashCommandBuilder()
        .setName(`deletereminder`)
        .setDescription(`Deletes your reminder (use /showreminders to check which id corresponds to which reminder)`)
    .addIntegerOption(option => option.setName('reminderid')
        .setDescription('the id of the reminder')
        .setRequired(true)),

	async execute(interaction) {
        let reqID = interaction.options.data.find(arg => arg.name === "reminderid").value; //requested id
        let discID = interaction.member.id;
        reqID = Number(reqID);
        //returns a reminder that belongs to the user
        let res = await reminders.find({ discID: discID, remid: reqID, });

        res = await res.toArray();

        if (res[0] === undefined) { //checks if the query found an id matching the requested id
            interaction.reply({content: `The id "${reqID}" doesn't match any of your reminder ids`});
            return;
        }

        try {
            await reminders.deleteOne({remid: reqID, });
            interaction.reply({content: `Successfully deleted the reminder (id: ${reqID}).`/*ephemeral: true*/})
        }catch (err) {
            console.log(err);
            interaction.reply({content: `Something went wrong with the deletion of the reminder`});
        }
	}
};