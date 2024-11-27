const { SlashCommandBuilder } = require('@discordjs/builders');
const { PermissionFlagsBits } = require('discord-api-types/v10');
const db = require('../../db/index');
const { random } = require('nanoid');
const fs = require('fs');
const path = require('path');

async function death_meme(filePath) {
	try {
		const data = await fs.promises.readFile(filePath, 'utf-8')
			.then(function (result) {
				const json = JSON.parse(result);
				const memes = json.links;
				const randid = Math.floor(Math.random() * memes.length);

				return memes[randid];
			})
			.catch(function (error) {
				console.error(error);
				return "Something went wrong.";
			})
		return data;
	} catch (error) {
		console.error(error);
		return "Something went wrong.";
	}
}

module.exports = {
	data: new SlashCommandBuilder()
    .setName(`kys`)
    .setDescription(`fucking kills the bot lol`)
	.setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
	async execute(interaction) {
		const memePath = path.join(__dirname, 'kys_memes.json');

		await interaction.reply({content: await death_meme(memePath)});
		console.log(await db.killClient());
		interaction.client.destroy();
		console.log("bot fucking killed itself :(");
		process.exit();
	},
};