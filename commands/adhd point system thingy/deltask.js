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
        let discid = interaction.member.id;
        let users = database.collection("users");
        let tasks = database.collection("tasks");
        let toDelete = interaction.options.data.find(arg => arg.name === 'id');
        
        let res = await 

        interaction.reply({embeds: [resEmbed]/*, ephemeral: true*/});
	}
};