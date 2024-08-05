const { SlashCommandBuilder, EmbedBuilder, time } = require('@discordjs/builders');
const { database, regexes } = require('../../db/index');

module.exports = {
	data: new SlashCommandBuilder()
        .setName(`deltask`)
        .setDescription(`delete a task`)
        
        .addIntegerOption(option => option.setName('id')
        .setDescription("The id of the task you wish to delete"))
        
        .addStringOption(option => option.setName('name')
        .setDescription("The name of the task you wish to delete")),

	async execute(interaction) {
                let discid = BigInt(interaction.member.id);
                let tasks = database.collection("tasks");
                let toDelete = interaction.options.data.find(arg => arg.name === 'id'), doc = {owner_id: discid};

                if (toDelete) {
                        Number(toDelete = toDelete.value);
                        doc["_id"] = toDelete;
                }
                else {
                        toDelete = interaction.options.data.find(arg => arg.name === 'name');
                        if (toDelete) toDelete = toDelete.value;
                        else {
                                interaction.reply({content: "Please specify an `id` or a task `name`."});
                                return;
                        }
                        doc["task_name"] = toDelete;
                }       

                let task_toDelete;

                await interaction.deferReply();

                try {
                        task_toDelete = await tasks.deleteOne(doc);
                } catch (err) {
                        interaction.editReply({content: "Something went wrong with the deletion of the task."});
                        console.log(err);
                        return;
                }

                if (task_toDelete.deletedCount == 0) {
                        interaction.editReply({content: `There is no task with the name/id ${'`'}${toDelete}${'`'}.`});
                }
                else {
                        interaction.editReply({content: `Successfully deleted the task with the name/id ${'`'}${toDelete}${'`'}.`});
                }
	}
};