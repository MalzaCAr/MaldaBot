const { SlashCommandBuilder } = require('@discordjs/builders');
const { PermissionFlagsBits } = require('discord-api-types/v10');
const db = require('../../db/index');
const { random } = require('nanoid');

module.exports = {
	data: new SlashCommandBuilder()
    .setName(`kys`)
    .setDescription(`fucking kills the bot lol`)
	.setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
	async execute(interaction) {
		let kysLine = [
			//"Thank you for putting me out of my misery",
			"https://tenor.com/view/goodbye-krill-world-krill-lobster-lobster-fried-krill-fried-gif-7150912747510295957",
			"https://tenor.com/view/memes-meme-dead-death-bad-ending-gif-26049237",
			"https://tenor.com/view/fell-gif-11242683397767497522",
			"https://tenor.com/view/aintnoway-gif-27058877",
			"https://tenor.com/view/skeleton-reaction-information-my-reaction-to-that-information-my-honest-reaction-to-that-information-gif-613275461876515673",
			"https://tenor.com/view/hold-on-i-have-the-perfect-gif-gif-23975442",
			"https://static.wikia.nocookie.net/1d135e42-2bc7-4167-9ea6-e8abc190fc4b/scale-to-width/755"
		],
		randomID = Math.floor(Math.random() * kysLine.length);

		await interaction.reply({content: kysLine[randomID]});
		console.log(await db.killClient());
		interaction.client.destroy();
		console.log("bot fucking killed itself :(");
		process.exit();
	},
};