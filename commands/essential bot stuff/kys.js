const { SlashCommandBuilder } = require('@discordjs/builders');
const { PermissionFlagsBits } = require('discord-api-types/v10');

module.exports = {
	data: new SlashCommandBuilder()
    .setName(`kys`)
    .setDescription(`fucking kills the bot lol`)
	.setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
	async execute(interaction) {
		await interaction.reply({content: "Thank you for putting me out of my misery"});
		console.log("bot fucking killed itself :(");
		interaction.client.destroy();
		process.exit();
	},
};