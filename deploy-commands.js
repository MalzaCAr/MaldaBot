const fs = require('node:fs');
const path = require('node:path');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const { clientId } = require('./config.json');
const dotenv = require('dotenv');
const { get } = require('node:http');

dotenv.config();
const token = process.env.DISCORD_TOKEN;

function getCommands(clientCommands, folderPath) {
	let commands = [];
	const commandFolders = fs.readdirSync(`./${folderPath}`);

	for (const folder of commandFolders) {
		const commandFiles = fs.readdirSync(`./${folderPath}/${folder}`).filter(file => file.endsWith('.js'));

		for (const file of commandFiles) {
			const command = require(`./${folderPath}/${folder}/${file}`);
			command.category = folder;

			if (command.data !== undefined) {
				clientCommands.set(command.data.name, command);
				commands.push(command.data.toJSON());
			}
		}
	}
	return commands;
}

module.exports = {
	deployCommands: async(guildId, guildName, clientCommands) => {
		const commands = getCommands(clientCommands, 'Guild Commands');

		const rest = new REST({ version: '9' }).setToken(token);
		
		try {
			await rest.put(
				Routes.applicationGuildCommands(clientId, guildId),
				{ body: commands },
			).then(() => console.log(`\nCommands deployed for "${guildName}" (${guildId})`));
		} catch (error) {
			console.error(error);
			throw error;
		}
	},

	deployGlobalCommands: async(clientCommands) => {
		const commands = getCommands(clientCommands, 'Global Commands');

		const rest = new REST({ version: '9' }).setToken(token);
	
		try {
			await rest.put(
				Routes.applicationCommands(clientId),
				{ body: commands },
			).then(() => console.log(`\nCommands deployed globally`));
		} catch (error) {
			console.error(error);
			throw error;
		}
	}
}

