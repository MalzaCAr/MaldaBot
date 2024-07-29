const { SlashCommandBuilder, EmbedBuilder, time } = require('@discordjs/builders');
const { database, regexes } = require('../../db/index');

module.exports = {
	data: new SlashCommandBuilder()
        .setName(`deltask`)
        .setDescription(`delete a task`)
        
        .addIntegerOption(option => option.setName('id')
        .setDescription("The id of the task you wish to delete")
        .setRequired(true)),

	async execute(interaction) {
                let discid = BigInt(interaction.member.id);
                let tasks = database.collection("tasks");
                let toDelete = interaction.options.data.find(arg => arg.name === 'id').value, task_toDelete;

                await interaction.deferReply();
                try {
                        task_toDelete = await tasks.deleteOne({owner_id: discid, _id: toDelete});
                } catch (err) {
                        interaction.editReply({content: "Something went wrong with the deletion of the task."});
                        console.log(err);
                        return;
                }
                if (task_toDelete.deletedCount == 0) {
                        interaction.editReply({content: `There is no task with the id ${toDelete}.`});
                }
                else {
                        interaction.editReply({content: `Successfully deleted the task with the id ${toDelete}.`});
                }
	}
};