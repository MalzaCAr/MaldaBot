const { SlashCommandBuilder } = require('@discordjs/builders');
const { database } = require('../../db/index');

module.exports = {
	data: new SlashCommandBuilder()
    .setName(`completetask`)
    .setDescription(`mark a task complete :D (TO BE IMPLEMENTED)`)
	
	.addIntegerOption(option => option.setName('id')
	.setDescription("The id of the task you wish to complete"))
	
	.addStringOption(option => option.setName('name') //TODO
	.setDescription("The name of the task you wish to complete (TO BE IMPLEMENTED)")),

	async execute(interaction) {
		let discid = BigInt(interaction.member.id),
		taskID = interaction.options.data.find(arg => arg.name === "id"),
		taskName = interaction.options.data.find(arg => arg.name === "name");

		let db_tasks = database.collection("tasks"),
		db_users = database.collection("users");

		await interaction.deferReply();

		let doc = { owner_id: discid }, query;
		if(taskID) {
			query = taskID.value;
			doc._id = query;
		}
		else if(taskName) {
			query = taskName.value;
			doc.task_name = query;

			try {
					taskID = await db_tasks.findOne(doc);
					taskID = taskID._id;
			}catch (error) {
					interaction.editReply({content: "Something went wrong"});
					console.log(error);
					return;
			}
		}
		else {
			interaction.editReply({content: "Please specify an `id` or a `name`"});
			return;
		}

		let res
		try {
			res = await db_tasks.findOne(doc);

			if (res == undefined) {
				interaction.editReply({content: `There is no task with the id/name ${'`' + query + '`'}`});
				return;
			}

			await db_users.updateOne({ discid: discid }, {
				$inc: { points: res.points },
				$pull: { tasks: taskID}
			});
			await db_tasks.deleteOne(doc);
		} catch (err) {
			interaction.editReply({content: "Something went wrong"});
			console.log(err);
			return;
		}

		interaction.editReply("<a:yippee:1180899943184076920>");
	}
};