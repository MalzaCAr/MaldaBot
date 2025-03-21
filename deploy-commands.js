const fs = require('node:fs');
const path = require('node:path');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord-api-types/v9');
const { clientId } = require('./config.json');
const dotenv = require('dotenv');

dotenv.config();
const token = process.env.DISCORD_TOKEN;

module.exports = {
	deployCommands: async(guildId, guildName, clientCommands) => {
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
					clientCommands.set(command.data.name, command);
					commands.push(command.data.toJSON());
				}
			}
		}

		const rest = new REST({ version: '9' }).setToken(token);
		
		try {
			await rest.put(
				Routes.applicationGuildCommands(clientId, guildId),
				{ body: commands },
			).then(() => console.log(`\ncommands deployed for "${guildName}" (${guildId})`));
		} catch (error) {
			//console.error(error);
			throw error;
		}

	}
}

