const { SlashCommandBuilder, EmbedBuilder, time } = require('@discordjs/builders');
const { database, regexes } = require('../../db/index');

module.exports = {
	data: new SlashCommandBuilder()
        .setName(`showtasks`)
        .setDescription(`aaaaaaaaaaaa`),

	async execute(interaction) {
        let discid = interaction.member.id;
        let users = database.collection("users");
        let tasks = database.collection("tasks");

        let member = await interaction.guild.members.fetch(discid);
        let roleids = member._roles;

        let roles = roleids.map(id => interaction.guild.roles.cache.get(id)).filter(role => role);


        let roleColor = roles
            .filter(role => role.color !== 0)
            .sort((a, b) => b.position - a.position)
            .shift()
            .color;


        let res = await users.findOne({discid: discid});
        //console.log(res);
        let usrTasks = await tasks.find({_id: {$in: res.tasks}}).toArray();
        //console.log(usrTasks);

        const resEmbed = {color: roleColor, title: "your tasks", fields: []}
        for (let task of usrTasks) {
            resEmbed.fields.push({ name: `${task.text} (${task.task_id})`, value: `**Due date: **${task.due_date.toString()} \n **Points: **${task.points}` });
        }

        interaction.reply({embeds: [resEmbed]/*, ephemeral: true*/});
	}
};