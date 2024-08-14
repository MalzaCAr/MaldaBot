const { SlashCommandBuilder, EmbedBuilder, time } = require('@discordjs/builders');
const { database } = require('../../db/index');

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
                let tasks = database.collection("tasks"),
                users = database.collection("users");
                let task_id = interaction.options.data.find(arg => arg.name === 'id'), 
                task_name = interaction.options.data.find(arg => arg.name === 'name');
                let doc = {owner_id: discid};

                await interaction.deferReply();

                if (task_id) {
                        Number(task_id = task_id.value);
                        doc["_id"] = task_id;
                }
                else if (task_name) {
                        task_name = task_name.value
                        doc["task_name"] = task_name;

                        try {
                                task_id = await tasks.findOne(doc);
                                task_id = task_id._id;
                        }catch (error) {
                                interaction.editReply({content: "Something went wrong with the deletion of the task."});
                                console.log(error);
                                return;
                        }
                } 
                else {
                        interaction.reply({content: "Please specify an `id` or a task `name`."});
                        return;
                }     

                let task_toDelete;

                try {
                       task_toDelete = await tasks.deleteOne(doc);

                } catch (error) {
                        interaction.editReply({content: "Something went wrong with the deletion of the task."});
                        console.log(error);
                        return;
                }
                
                let reply;
                if (task_name) reply = task_name;
                else reply = task_id;

                if (task_toDelete.deletedCount == 0) {
                        
                        interaction.editReply({content: `There is no task with the name/id ${'`'+ reply +'`'}.`});
                        return;
                }
                try {
                        await users.updateOne({ }, {$pull: { tasks: task_id}});
                } catch(error) {
                        interaction.editReply({content: "Something went wrong with the deletion of the task."});
                        console.log(err);
                        return;     
                }

                interaction.editReply({content: `Successfully deleted the task with the name/id ${'`'+ reply +'`'}.`});
	}
};