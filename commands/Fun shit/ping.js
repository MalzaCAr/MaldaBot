const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('ping')
		.setDescription('Check if the bot works xd'),
	async execute(interaction) {
		await interaction.reply('bruh');
	},
};