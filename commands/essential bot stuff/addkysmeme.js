const { SlashCommandBuilder } = require('@discordjs/builders');
const { PermissionFlagsBits } = require('discord-api-types/v10');
const URL = require('url').URL;
const { database } = require('../../db/index');

module.exports = {
	data: new SlashCommandBuilder()
    .setName(`addkysmeme`)
    .setDescription(`add a funny meme to the bot's vast meme collection`)

	.addStringOption(option => option.setName('meme')
		.setDescription('pls give url to the image')
		.setRequired(true))

	.setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
	async execute(interaction) {
		const memes = database.collection('memes');

		let meme = interaction.options.data.find(arg => arg.name === 'meme').value;	

		//funky way to check if the string is a valid URL
		try {
			new URL(meme);
		}catch(err) {
			interaction.reply("Error: input is not a valid URL");
			return;
		}

		try {
			await memes.insertOne({url: meme});
		} catch(err) {
			console.err(err);
		}

		interaction.reply(":thumbsup:");
	},
};