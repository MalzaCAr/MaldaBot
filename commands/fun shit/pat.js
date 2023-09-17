const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('pat')
		.setDescription('pat')

		.addUserOption(option => option.setName('eeee')
		.setDescription("AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA")
		.setRequired(true)),
	async execute(interaction) {
		let name = interaction.options.data.find(arg => arg.name === 'eeee').value;
		await interaction.reply(`<@${name}>`);
		interaction.followUp(`<a:phelpetuwu:994305191895642194>`);
	},
};