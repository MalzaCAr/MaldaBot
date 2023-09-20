const fs = require('node:fs');
const path = require('node:path');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const { clientId, guildId, token } = require('./config.json');

module.exports = {
	deployCommands: async() => {
		// const commands = [];

		// const commandsPath = path.join(__dirname, 'commands');
		// const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

		// for (const file of commandFiles) {
		// 	const filePath = path.join(commandsPath, file);
		// 	console.log(filePath);
		// 	const command = require(filePath);
		// 	commands.push(command.data.toJSON());
		// }

		// const rest = new REST({ version: '9' }).setToken(token);

		// try {
		// 	await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: commands })
		// 	.then(() => console.log('commands good'))

		// } catch (error) {
		// 	console.error(error);
		// }

		const commands = [];
		const commandFolders = fs.readdirSync('./commands');
		for (const folder of commandFolders) {
			const commandFiles = fs.readdirSync(`./commands/${folder}`).filter(file => file.endsWith('.js'));
			for (const file of commandFiles) {
				const command = require(`./commands/${folder}/${file}`);
				command.category = folder;
				if (command.data !== undefined) {
					commands.push(command.data.toJSON());
				}
			}
		}

		const rest = new REST({ version: '9' }).setToken(token);
		
		try {
			await rest.put(
				Routes.applicationGuildCommands(clientId, guildId),
				{ body: commands },
			).then(() => console.log('commands good yes'));
		} catch (error) {
			console.error(error);
		}

	}
}

