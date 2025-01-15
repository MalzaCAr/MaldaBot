// Require the necessary discord.js classes
const fs = require('node:fs');
const { Client, Intents, Message, Collection } = require('discord.js');
const { token } = require('./config.json');
const { deployCommands } = require ('./deploy-commands');
const { reminders, run_db } = require('./db/index');

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
let emojis;
client.once('ready', async() => {
	await deployCommands(); 
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
	]

	const channel = client.channels.cache.get('815546700072615968');
	let randomNum = Math.floor(Math.random() * funnyOneLiners.length);
	channel.send (funnyOneLiners[randomNum]);
});

client.on('messageCreate', message => {
    if (message.author.bot) return false;

	if (message.mentions.has("274853598280810496")) { //malzers' id
		message.channel.send(emojis[randomID]);
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
				for (let i = 0; i < 5; i++) {
					message.react(message.guild.emojis.cache.find(emoji => emoji.name === `aqua_panic${i}`));
				}
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
});

//the following part handles the triggering of reminders
let minutes = 0.1, duration = minutes * 60 * 1000; //this sets at what interval are the reminder due times getting checked
setInterval(async function() {
	let currentDate = new Date(Date.now());

	let res;
	try {
		let doc = { dueDate: { $lt: currentDate,},};
		res = reminders.find(doc);
	} catch (err) {
		console.log (err);
		return;
	};

	for await (const resDoc of res) {
		const channel = client.channels.cache.get(resDoc.channelID);
		channel.send(`<@${resDoc.discID}>: ${resDoc.reminderMemo}`);

		try {
			let resDel = await reminders.deleteOne({ _id: resDoc._id });
			//console.log(resDel);
		} catch(err) {
			console.log(err);
		}
	}
}, duration);

// Login to Discord with your client's token
client.login(token);