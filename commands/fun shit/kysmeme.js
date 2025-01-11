const { SlashCommandBuilder } = require('@discordjs/builders');
const { PermissionFlagsBits } = require('discord-api-types/v10');
const URL = require('url').URL;
const { database } = require('../../db/index');

module.exports = {
	data: new SlashCommandBuilder()
    .setName(`kysmeme`)
    .setDescription(`aObtain a random meme from the bot's vast meme collection`),
	
	async execute(interaction) {
		const memes = database.collection('memes');

		await interaction.deferReply();

		//return a random meme(document) from the collection
		let meme;
		try {
			meme = await memes.aggregate([ { $sample: { size: 1 } } ]).toArray();	
		} catch (err) {
			console.error(err);
			meme = [{url: "https://cdn.discordapp.com/attachments/815546700072615968/1327431906266058752/image.png?ex=67830acc&is=6781b94c&hm=66e062d9fe35030554fc18c38b74b67149c336665c3657cc58fdf98a2b1e85f2&"}];
		}

		/* 
		prints out every meme and spams the channel for debug purposes
		
		let library = [];
		library.push("a"); //i fucking hate javascript with a passion
		await memes.find({}).stream().on('data', function(doc) {library.push(doc.url)});

		await interaction.editReply(library[0]);

		for (let i = 1; i < library.length; i++) {
			await interaction.followUp(library[i]);
		}*/ 

		await interaction.editReply(meme[0].url);
	},
};