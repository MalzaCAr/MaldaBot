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

	.addStringOption(option => option.setName('name') //TODO
    .setDescription('Give your task a short name (single word)'))

	.addStringOption(option => option.setName('repeattime') //TODO
    .setDescription('Do you want this task to repeat (NOT YET IMPLEMENTED)')),

	async execute(interaction) {
		let goal = interaction.options.data.find(arg => arg.name === 'goal').value,
		dueTime = interaction.options.data.find(arg => arg.name === 'due_time').value,
		points = interaction.options.data.find(arg => arg.name === 'points').value,
		repeatTime = interaction.options.data.find(arg => arg.name === 'repeattime'),
		taskName = interaction.options.data.find(arg => arg.name === 'name');
		if (repeatTime != undefined) repeatTime = repeatTime.value;

		let discid = BigInt(interaction.member.id),
		nickname = interaction.member.user.username,
		channelID = interaction.channelId;

		let dueTimeMS = cmdInptToMs(dueTime);
		if (dueTimeMS <= 0) {
			interaction.reply({content: `Idk wtf "${dueTime}" means.`});
			return;
		}
		if (dueTimeMS > 31556926000) {
			interaction.reply({content: "Sorry, the task can't be over 1 year in the future"});
			return;
		}

		let currentDate = new Date(Date.now()), 
		dueDate = new Date(Date.now());
		dueDate.setTime(currentDate.getTime() + dueTimeMS);

		let db_tasks = database.collection("tasks"), 
		db_users = database.collection("users");
		let task_id = Number(nanoid());

		if (goal.length > 256) {
			interaction.reply({content: "Sorry, the `goal` field length must be 256 or fewer."});
			return;
		}

		await interaction.deferReply();

		let res;
		if (taskName) { //if the option isn't used, the function returns `undefined`
			taskName = taskName.value;

			res = await db_tasks.find({task_name: taskName, owner_id: discid}).toArray();

			if (res.length > 0) {
				interaction.editReply({content: `Sorry, there already exists a task with the name ${taskName}.`});
				return;
			}

			if (taskName.search(/ /g) != -1) {
				interaction.editReply({content: "The `name` field mustn't contain any spaces"});
				return;
			}
		}

		try {
			res = await db_tasks.insertOne({
				_id: task_id, owner_id: discid, text: goal, due_date: dueDate, points: points, channel_id: channelID, task_name: taskName
			});

		} catch(err) {
			//err.code 11000 means the id you're trying to insert already exists. If the stars align and you get 2 identical 8 digit numbers, try generating a new id and inserting that.
			if (err.code == 11000) { 
				try {
					task_id = Number(nanoid());
					res = await db_tasks.insertOne({
						_id: new_taskid, owner_id: discid, text: goal, due_date: dueDate, points: points, channel_id: channelID
					});
				} catch (error) { //if you somehow get 3 identical 8 digit numbers then idk go buy a lottery ticket
					interaction.editReply({content: "Something went wrong"});
					console.log(error);
					return;
				}
			}

			else {
				interaction.editReply({content: "Something went wrong"});
				console.log(err);
				return;
			}
		}

		let dbuser;
		try {
			dbuser = await db_users.find({discid: discid, }).toArray();

			if (dbuser.length === 0) {
				await db_users.insertOne({
					discid: discid, nickname: nickname, points: 0, tasks: []
				});
			}
			await db_users.updateOne({discid}, {$push: {tasks: res.insertedId}});

		} catch (error) {
			interaction.editReply({content: "Something went wrong"});
			console.log(err);
			return;
		}
		
		interaction.editReply({content: `Successfully added the task`});

	}
};