# MaldaBot

Hi, this is my bot that's (at least so far) for personal use.
I mainly use it to learn new stuff. So far, the most impressive thing this bot can do is reminders. You give it a time in the future, and when it arrives, it pings you with a custom message.
**This bot uses Postgres for its database.**

## Installation

If you, for some reason, wanna give the bot a shot, it's about as difficult as setting up any discord bot.
It'll be a manual installation for now. I might make a script for it later.

### 1. Make your own bot and install node.js

First things first, make your copy of a bot.
Install node.js and discord.js, then go to the discord dev portal and make a bot. Make sure to copy the token somewhere.
For more details about making a discord bot, head [here](https://discordjs.guide/preparations/)

### 2. Make a Postgres database

If you've never used postgres, I used [this guide](https://node-postgres.com/) for setting up my database. The details for connecting your cluster are located in `/db/index.js`.

As for the DB's schema, it looks something like this:

```SQL
CREATE TABLE IF NOT EXISTS servers (
    guild_id BIGINT PRIMARY KEY,
    guild_name varchar(32)
);

CREATE TABLE IF NOT EXISTS users (
    disc_id BIGINT PRIMARY KEY,
    nickname VARCHAR(32),
    server_id BIGINT,
    FOREIGN KEY (server_id) REFERENCES servers(guild_id)
);

CREATE TABLE IF NOT EXISTS reminders (
    rem_id BIGINT PRIMARY KEY,
    memo VARCHAR(255),
    due_date TIMESTAMP,
    channel_id BIGINT,
    owner_id BIGINT,
    FOREIGN KEY (owner_id) REFERENCES users(disc_id)
);
```

### 3. Make config.json and .env

Once you have your bot token and connection string, you'll have to make 2 more files where you'll store all the information the bot needs.
The files look like this:

#### Config.json

```json
{
    "clientId": "<your_bot's_id>"
}
```

Where `<your_server_id>` is the server id you can get by right clicking the server your bot is in (you'll have to activate developer mode in your user settings under advanced) and <your_bot's_id> is the bot's id you can also get by right clicking the bot (it's also `client id` in the discord dev portal)

#### .env

```env
DISCORD_TOKEN=<your_bot_token>
MDBURI=<your_connection_string>
```

Where `<your_connection_string>` is your cluster's connection string.

### 4. ~~Suffer~~ Enjoy the bot

After all that, that's it really. The bot is simple enough so there're not many hoops you have to go through.

## Commands

This section will list all the bot's commands and what they do:

### Reminder commands

#### `addReminder (time: String, memo: String)`

- make a new reminder.
- `time`: The time when the reminder is supposed to trigger. Time is relative to when the command is called (so, in X hours).
- `memo`: The text displayed when the reminder triggers.

#### `showReminders`

- Shows all of users ongoing reminders.

#### `deleteRemidner (reminderid: Int)`

- Deletes a user's reminder.
- `reminderid`: see a reminder's id with `showReminders` and use it to delete it.

### Admin stuff

#### `addKysMeme (memeurl: String)`

- Adds a meme to the bot's vast meme library.
- `memeurl`: the url to the image/gif.

#### `kys`

- Kills the bot. The bot also sends a random meme percieving it's horrible demise.

#### `reload (command: String)`

- Reloads a command, updating any changes you made while the bot is online.
- `command`: The name of the command.

### Fun shit

#### `kysMeme`

- The bot sends a random meme from it's vast meme library.

#### `ping`

- A simple ping command.
