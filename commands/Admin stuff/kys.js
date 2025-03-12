const { SlashCommandBuilder } = require('@discordjs/builders');
const { PermissionFlagsBits } = require('discord-api-types/v10');
const db = require('../../db/index');
const { database } = require('../../db/index');

module.exports = {
	data: new SlashCommandBuilder()
    .setName(`kys`)
    .setDescription(`fucking kills the bot lol`)
	.setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
	async execute(interaction) {
		/*const memes = database.collection('memes');

		//return a random meme(document) from the collection
		let meme;
		try {
			meme = await memes.aggregate([ { $sample: { size: 1 } } ]).toArray();	
		} catch (err) {
			console.error(err);
			meme = [{url: "https://cdn.discordapp.com/attachments/815546700072615968/1327431906266058752/image.png?ex=67830acc&is=6781b94c&hm=66e062d9fe35030554fc18c38b74b67149c336665c3657cc58fdf98a2b1e85f2&"}];
		}*/

		//await interaction.reply(meme[0].url);
		await interaction.deferReply();

		db.killClient();
		console.log("pool closed");

		await interaction.editReply("a");
		await interaction.client.destroy();
		console.log("bot fucking killed itself :(");

		process.exit();	
	},
};