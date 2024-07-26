const { SlashCommandBuilder } = require('@discordjs/builders');
const { PermissionFlagsBits } = require('discord-api-types/v10');
const { database, cmdInptToMs, nanoid } = require('../../db/index');

//users: nickname(string), discid(bigint), tasks array(refference to tasks), point sum() 
//tasks: repeating(date), text(string), due time(date format), point reward()

module.exports = {
	data: new SlashCommandBuilder()
    .setName(`addtask`)
    .setDescription(`add a task`)
	.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
	
	.addStringOption(option => option.setName('goal')
    .setDescription('The goal you wish to accomplish')
    .setRequired(true))
	
	.addStringOption(option => option.setName('due_time')
    .setDescription('When do you need to accomplish this task')
    .setRequired(true))

	.addIntegerOption(option => option.setName('points')
    .setDescription('The amount of points this task rewards')
    .setRequired(true))

	.addStringOption(option => option.setName('repeattime') //TODO
    .setDescription('Do you want this to repeat (WIP)')),

	async execute(interaction) {
		let goal = interaction.options.data.find(arg => arg.name === 'goal').value,
		dueTime = interaction.options.data.find(arg => arg.name === 'due_time').value,
		points = interaction.options.data.find(arg => arg.name === 'points').value,
		repeatTime = interaction.options.data.find(arg => arg.name === 'repeattime');
		if (repeatTime != undefined) repeatTime = repeatTime.value;

		let discid = interaction.member.id,
		nickname = interaction.member.user.username,
		channelID = interaction.channelId;

		let dueTimeMS = cmdInptToMs(dueTime);

		let currentDate = new Date(Date.now()), 
		dueDate = new Date(Date.now());
		dueDate.setTime(currentDate.getTime() + dueTimeMS);

		let db_tasks = database.collection("tasks"), 
		db_users = database.collection("users");
		let task_id = Number(nanoid());

		try {
			let res = await db_tasks.insertOne({
				task_id: task_id, text: goal, due_date: dueDate, points: points, channel_id: channelID
			});

			let dbuser = await db_users.find({discid: discid, });
			dbuser = await dbuser.toArray();

			if (dbuser.length === 0) {
				await db_users.insertOne({
					discid: discid, nickname: nickname, points: 0, tasks: []
				});
			}

			await db_users.updateOne({discid}, {$push: {tasks: res.insertedId}})


		} catch(err) {
			console.log(err);
		}

		interaction.reply("");

	}
};