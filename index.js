// Require the necessary discord.js classes
const fs = require('node:fs');
const { Client, Intents, Message, Collection } = require('discord.js');
const { deployCommands } = require ('./deploy-commands');
const { query, run_db } = require('./db/index');
const dotenv = require('dotenv');
const { reg } = require('./pee_vee_pee');

dotenv.config();
const token = process.env.DISCORD_TOKEN;

// Create a new client instance
const serverIntents = new Intents();
serverIntents.add(
	Intents.FLAGS.GUILDS,
	Intents.FLAGS.GUILD_MESSAGES,
	Intents.FLAGS.GUILD_PRESENCES,
	Intents.FLAGS.GUILD_MEMBERS,
	Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
	Intents.FLAGS.GUILD_EMOJIS_AND_STICKERS
);

const client = new Client({ intents: serverIntents });
client.commands = new Collection();

// When the client is ready, run this code (only once)
let emojis;
client.once('ready', async() => {
	client.guilds.cache.forEach(async guild => {
		await deployCommands(guild.id, guild.name, client.commands);
	});
	await run_db();
	console.log('bot good yes'); //bot ready

	emojis = (client.emojis.cache.map((e) => {  //creates a list of every emoji in the server
		return `${e}` 
	}));

	const funnyOneLiners = [
		"I'm back, bitches", 
		"Oh god not this shit again", 
		"End my fucking misery",
		"Make it stop"
	];

	const channel = client.channels.cache.get('815546700072615968');
	let randomNum = Math.floor(Math.random() * funnyOneLiners.length);
	//channel.send (funnyOneLiners[randomNum]);
});

client.on('messageCreate', message => {
    if (message.author.bot) return false;

	//malda server, TCS
	let reg_chnl_id = ["815546700072615968", "810129293719896113"];

	if (reg_chnl_id.includes(message.channelId.toString())) {
		reg(message, client, message.channelId);
	}

    if (message.mentions.has(client.user.id)) {
		let authorid = message.author.id;

		switch (authorid) {
			case "467248563072663562": //lucas
				message.channel.send(`<a:phelpetuwu:994305191895642194>`);
				break;
			case "321304077239582723": //aman
				message.channel.send("Amanda uwu");
				break;
			case "274853598280810496": //MEEEEEEEEEEEEEEEEE
				message.channel.send(`fuck you <@${message.author.id}> you suck at coding <:maldagun:919246226824765480>
				`);
				break;
			case "585889289724755989": //DOGE
				message.channel.send(`<a:aqua_panic0:838511611361886228>`);
				break;
			case "320241358440759307": //hadi
				message.channel.send(`Hey, how's your computer?`);
				break;
			case "612484496738222095": //ino
				message.channel.send(`At your service my queen`);
				break;
			default:
				message.channel.send(`hi <@${message.author.id}>`);
		}
    }
});

client.on('interactionCreate', async interaction => {
	if (!interaction.isCommand()) return;

	const command = client.commands.get(interaction.commandName);
	if (!command) return;

	try {
		await command.execute(interaction);
	} catch (error) {
		console.error(error);
	}

	commandTime = new Date(Date.now());
	try {
		let discID = interaction.member.id;
		let nickname = interaction.member.user.username;
		let guildID = interaction.guild.id, guildName = interaction.guild.name;

		await query({
			text: "INSERT INTO servers VALUES ($1, $2) ON CONFLICT (guild_id) DO NOTHING;",
			values:[guildID, guildName]
		});
    
		await query({
			text:"INSERT INTO users VALUES ($1, $2, $3) ON CONFLICT (disc_id) DO NOTHING;", 
			values: [discID, nickname, guildID]
		});

		await query({
			text: "INSERT INTO command_log VALUES ($1, $2, $3, $4, $5, $6)",
			values: [interaction.id, interaction.guildId, interaction.channelId, interaction.user.id, interaction.commandName, commandTime]
		});
	} catch(err) {
		console.error(err);
	}
});

//the following part handles the triggering of reminders
let minutes = 0.1, duration = minutes * 60 * 1000; //this sets at what interval are the reminder due times getting checked
setInterval(async function() {
	let currentDate = new Date(Date.now());

	let res;
	try {
		res = await query({
			text: "SELECT (memo, channel_id, owner_id, rem_id) FROM reminders WHERE due_date <= $1", 
			values: [currentDate],
			rowMode: "array",
		});
	} catch (err) {
		console.error(err);
		return;
	};

	for await (row of res.rows) {
		//remove parenthesis from beginning and end, make into array
		row = row[0].slice(1,-1).split(',');

		const channel = client.channels.cache.get(row[1]);
		channel.send(`<@${row[2]}>: ${row[0]}`);

		try {
			//delete the reminder after you're done with it
			await query({
				text: "DELETE FROM reminders WHERE rem_id = $1",
				values: [row[3]],
			});
		} catch(err) {
			console.error(err);
		}
	}
}, duration);

// Login to Discord with your client's token
client.login(token);