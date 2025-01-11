const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('ping')
		.setDescription('Check if the bot works xd'),
	async execute(interaction) {
		console.log(interaction.member.user.username);
		await interaction.reply('bruh');
	},
};