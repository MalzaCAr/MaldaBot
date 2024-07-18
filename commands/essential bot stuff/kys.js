const { SlashCommandBuilder } = require('@discordjs/builders');
const { PermissionFlagsBits } = require('discord-api-types/v10');
const db = require('../../db/index');

module.exports = {
	data: new SlashCommandBuilder()
    .setName(`kys`)
    .setDescription(`fucking kills the bot lol`)
	.setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
	async execute(interaction) {
		await interaction.reply({content: "Thank you for putting me out of my misery"});
		console.log(await db.killClient());
		interaction.client.destroy();
		console.log("bot fucking killed itself :(");
		process.exit();
	},
};