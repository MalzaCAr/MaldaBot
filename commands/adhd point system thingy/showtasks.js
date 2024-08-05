const { SlashCommandBuilder, EmbedBuilder, time } = require('@discordjs/builders');
const { database, msToRelTime } = require('../../db/index');

module.exports = {
	data: new SlashCommandBuilder()
        .setName(`showtasks`)
        .setDescription(`aaaaaaaaaaaa`),

	async execute(interaction) {
        let discid = BigInt(interaction.member.id);
        let users = database.collection("users");
        let tasks = database.collection("tasks");

        let member = await interaction.guild.members.fetch(discid.toString());
        let roleids = member._roles;

        let roles = roleids.map(id => interaction.guild.roles.cache.get(id)).filter(role => role);

        let roleColor = roles
            .filter(role => role.color !== 0)
            .sort((a, b) => b.position - a.position)
            .shift()
            .color;
        
        await interaction.deferReply();

        let res;
        try {
            res = await users.findOne({discid: discid});
        } catch (err) {
            interaction.editReply({content: "Something went wrong"});
            console.log(err);
            return;
        }
        
        let usrTasks;
        try {
            usrTasks = await tasks.find({_id: {$in: res.tasks}}).toArray();
        } catch (err) {
            interaction.editReply({content: "Something went wrong"});
            console.log(err);
            return;
        }

        if (usrTasks == 0) {
            interaction.editReply({content: "You have no set tasks."});
            return;
        }

        const resEmbed = {color: roleColor, title: "Your tasks:", fields: []};
        let displayTaskName;
        for (let task of usrTasks) {
            if (!task.task_name) displayTaskName = "";
            else displayTaskName = task.task_name;
            resEmbed.fields.push({ name: `(${task._id}) ${displayTaskName}\n${task.text}`, value: `**Due: **${msToRelTime(task.due_date.getTime()) } \n **Points: **${task.points}` });
        }

        interaction.editReply({embeds: [resEmbed]/*, ephemeral: true*/});
	}
};