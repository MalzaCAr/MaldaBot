// Require the necessary discord.js classes
const fs = require('node:fs');
const path = require('node:path');
const { Client, Intents, Message, Collection } = require('discord.js');
const { token } = require('./config.json');
const { deployCommands } = require ('./deploy-commands');
const { queryReminder} = require('./db');
const { isNull } = require('node:util');
//const { EventEmitter } = require('node:stream');
//const { syncBuiltinESMExports } = require('node:module');

class Node {
    constructor(discID, timeStamp, next = null) {
        this.discID = discID;
        this.timeStamp = timeStamp;
        this.next = next;
    }
}

class linkedList {
    constructor() {
        this.head = null;
        this.size = 0;
    }

    insertHead(discID, timeStamp) {
        this.head = new Node(discID, timeStamp, this.head);
        this.size++
    }

    pingshit(currentDate) {
		let pings = []; //ping array to return
        let current = this.head; 
		if (current == null) return pings; //if the list is empty, get the fuck out

		let previous;
		while (current.timeStamp < currentDate) { //linked lists give me a headache
			pings.push(current.discID);
			this.size--;
			this.head = current.next;
			current = current.next;

			if (current == null) return pings; //if the next node is empty, aka the current one now, gtfo
		};
		//this executes if the head isn't due yet
		previous = current; 
		current = current.next;
		if (current == null) return pings; //same as above

		//otherwise, check nodes after the head
		do {
			if (current.timeStamp < currentDate) { 
				pings.push(current.discID);
				this.size--;
				previous.next = current.next; //we "delete" a node by making the previous node point to the next node instead of this current node
			}
			else {
				previous = current; //move the previous to the current one, then move the current to the next one
			}
			current = current.next;

		} while (current.next != null); //repeat until you reach the end

		return pings;
    }
}

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
const pingList = new linkedList();
var emojis;
client.once('ready', async() => {
	await deployCommands(); 
	console.log('bot good yes'); //bot ready

	emojis = (client.emojis.cache.map((e) => {  //creates a list of every emoji in the server
		return `${e}` 
	}));

	const funnyOneLiners = [
		"I'm back, bitches", 
		"Oh god not this shit again", 
		"End my fucking misery",
		"The missile knows where it is at all times, it knows this because it knows where it isnt.",
		"Zǎoshang hǎo zhōngguó xiànzài wǒ yǒu BING CHILLING 🥶🍦 wǒ hěn xǐhuān BING CHILLING 🥶🍦 dànshì sùdù yǔ jīqíng 9 bǐ BING CHILLING 🥶🍦 sùdù yǔ jīqíng sùdù yǔ jīqíng 9 wǒ zuì xǐhuān suǒyǐ…xiànzài shì yīnyuè shíjiān zhǔnbèi 1 2 3 liǎng gè lǐbài yǐhòu sùdù yǔ jīqíng 9 ×3 bùyào wàngjì bùyào cu òguò jìdé qù diànyǐngyuàn kàn sùdù yǔ jīqíng 9 yīn wéi fēicháng hǎo diànyǐng dòngzuò fēicháng hǎo chàbùduō yīyàng BING CHILLING 🥶🍦zàijiàn 🥶🍦"
	]

	const channel = client.channels.cache.get('815546700072615968');
	let randomNum = Math.floor(Math.random() * funnyOneLiners.length);
	channel.send (funnyOneLiners[randomNum]);
});

client.on('messageCreate', message => { //ignore this lmao, having a bit of fun in my dev server
    if (message.author.bot) return false;

	if (message.mentions.has("274853598280810496")) { //malzers' id
		let randomID = Math.floor(Math.random() * emojis.length);
		let theCulprit = message.author.id
		message.channel.send(`<@${theCulprit}>`);
		message.channel.send(emojis[randomID]);

		let min = 5 * 60 * 1000; //number of ms in 5 minutes
		let max = 12 * 60 * 60 * 1000; //number of ms in 12 hours
		let futurePingDate = new Date(Date.now()).getTime() + Math.random() * (max - min) + min;

		let pingDate = futurePingDate;
		
		pingList.insertHead(theCulprit, pingDate);
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
				message.channel.send(`CLEAN YOUR FUCKING COMPUTER`);
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
let minutes = 0.5, the_interval = minutes * 60 * 1000; //this sets at what interval are the reminder due times getting checked
setInterval(async function() {
	let currentDate = new Date(Date.now());

	let res;
	try {
		res = await queryReminder("SELECT * FROM reminders WHERE duetime < $1", [currentDate]);
	} catch (err) {
		console.log (err);
		return;
	};

	if (res.rowCount != 0) { 
		for (let row = 0; row < res.rowCount; row++) { //send all
			const channel = await client.channels.cache.get(res.rows[row].channelid);
			channel.send(`<@${res.rows[row].discid}>: ${res.rows[row].memo}`);
		}	

		try {
			res = await queryReminder("DELETE FROM reminders WHERE duetime < $1", [currentDate]);
		} catch (err) {
			console.log(err);
		}
	}

	const channel = client.channels.cache.get('815546700072615968');
	
	pings = pingList.pingshit(currentDate.getTime());

	if (pings.length != 0) {
		for (ping of pings) {
			channel.send(`<@${ping}>`);
		} 
	}
	
}, the_interval);

// Login to Discord with your client's token
client.login(token);