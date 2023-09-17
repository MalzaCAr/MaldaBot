// Require the necessary discord.js classes
const fs = require('node:fs');
const path = require('node:path');
const { Client, Intents, Message, Collection } = require('discord.js');
const { token } = require('./config.json');
const { deployCommands } = require ('./deploy-commands');
const { queryReminder } = require('./db');
//const { EventEmitter } = require('node:stream');
//const { syncBuiltinESMExports } = require('node:module');

// Create a new client instance
const serverIntents = new Intents();
serverIntents.add(
	Intents.FLAGS.GUILDS,
	Intents.FLAGS.GUILD_MESSAGES
	/*Intents.FLAGS.GUILD_PRESENCES,
	Intents.FLAGS.GUILD_MEMBERS,
	Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
	Intents.FLAGS.GUILD_EMOJIS_AND_STICKERS*/
);

const client = new Client({ intents: serverIntents });

client.commands = new Collection();
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

// for (const file of commandFiles) { //load all files
// 	const filePath = path.join(commandsPath, file);
// 	const command = require(filePath);
// 	client.commands.set(command.data.name, command);
// }

const commandFolders = fs.readdirSync('./commands');
	for (const folder of commandFolders) {
		const commandFiles = fs.readdirSync(`./commands/${folder}`).filter(file => file.endsWith('.js'));
		for (const file of commandFiles) {
			const command = require(`./commands/${folder}/${file}`);
			command.category = folder;
			if (command.data !== undefined) {
				client.commands.set(command.data.name, command);
			}
		}
	}

// When the client is ready, run this code (only once)
var emojis;
client.once('ready', async() => {
	await deployCommands(); 
	console.log('eeeeeeeeeeeeeeeeeeee\n'); //bot ready

	emojis = (client.emojis.cache.map((e) => {  //creates a list of every emoji in the server
		return `${e}` //`${e} **-** \`:${e.name}:\``
	}));
});

client.on('messageCreate', message => { //ignore this lmao, having a bit of fun in my dev server
    if (message.author.bot) return false;

	if (message.channelId == 1001931553959579729) {
		const channel = client.channels.cache.get("815546700072615968");
		channel.send(message);
	}

	if (message.mentions.has("274853598280810496")) { //malzers' id
		var randomID = Math.floor(Math.random() * emojis.length);
		message.channel.send(`<@${message.author.id}>`);
		message.channel.send(emojis[randomID]);
	}

    if (message.mentions.has(client.user.id)) {
		let authorid = message.author.id;
		//console.log(message.author.id);
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
				for (let i = 0; i < 5; i++) {
					message.react(message.guild.emojis.cache.find(emoji => emoji.name === `aqua_panic${i}`));
				}
				message.channel.send(`<a:aqua_panic0:838511611361886228>`);
				break;
			case "320241358440759307": //hadi
				message.channel.send(`CLEAN YOUR FUCKING COMPUTER`);
				break;
			case "612484496738222095":
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
		await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
	}
});

//the following part handles the triggering of reminders
let minutes = 0.1, the_interval = minutes * 60 * 1000; //this sets at what interval are the reminder due times getting checked
setInterval(async function() {
	let currentDate = new Date(Date.now());

	let res = await queryReminder("SELECT * FROM reminders WHERE duetime < $1", [currentDate]);

	if (res.rowCount == 0) return; //if there are no due reminders, exit the function

	for (let row = 0; row < res.rowCount; row++) { //send all
		const channel = await client.channels.cache.get(res.rows[row].channelid);
		channel.send(`<@${res.rows[row].discid}>: ${res.rows[row].memo}`);
	}	

	try {
		res = await queryReminder("DELETE FROM reminders WHERE duetime < $1 AND interval = NULL", [currentDate]);
	} catch (err) {
		console.log(err);
	}
}, the_interval);

// Login to Discord with your client's token
client.login(token);