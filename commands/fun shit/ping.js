const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('ping')
		.setDescription('fat stupid idiot bot work bruh'),
	async execute(interaction) {
		console.log(interaction.member.user.username);
		await interaction.reply('bruh');
	},
};