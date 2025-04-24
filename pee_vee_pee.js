const { random } = require("nanoid");
const { query } = require("./db/index");

let last_queue = [];
let no_more_cnt = 0;

/**
 * @param {Array} array array you want to shuffle
 * @returns {Array} returns a shuffled copy of the input array
 */
function shuffleArray(array) {
    let res = array.slice();
    for (var i = res.length - 1; i >= 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = res[i];
        res[i] = res[j];
        res[j] = temp;
    }
    return res;
}

async function addUser(channel, user, xVx) {
    let channelID = channel.id;
    try {
        await query({
            text: "INSERT INTO reg(disc_id, nickname, channel_id) VALUES ($1, $2, $3)",
            values:[user.id, user.displayName, channelID]
        });
    } catch(err) {
        if (err.code == '23505') {
            channel.send("You are already in queue");
            return;
        }
        
        console.error(err);
        return;
    } 
    
    let queue_lenght;
    try {
        queue_lenght = await query("SELECT COUNT(*) FROM reg WHERE channel_id = $1", [channelID]);
    } catch(err) {
        console.error(err);
        channel.send("Something went wrong :(");
        return;
    }
    queue_lenght = queue_lenght.rows[0].count;

    channel.send(`Player added to queue. Queue size is now: ${'`' + queue_lenght + '`'}`);

    if (queue_lenght >= xVx * 2) {
        channel.send("Preparing match");
        
        let reg_queue;
        try {
            reg_queue = await query({
                text: "SELECT disc_id, nickname FROM reg WHERE channel_id = $1",
                values: [channelID]
            });
        } catch (err) {
            console.error(err);
            channel.send("Something went wrong :(");
            return;
        }

        last_queue = reg_queue.rows.slice();
        no_more_cnt = 0;
        
        let order = shuffleArray(reg_queue.rows);

        let res = 
            `Match is ${xVx} v ${xVx}\n`;
        
        let team1 = `Team 1: `, team2 = `Team 2: `;

        for (let i = 0; i < order.length; i++) {
            if (i % 2 == 0) team1 += `<@${order[i].disc_id}>, `;

            else team2 += `<@${order[i].disc_id}>, `;
        }
        res += team1.slice(0, team1.length - 2) + "\n" + team2.slice(0, team1.length - 2);

        try {
            query({text: "DELETE FROM reg WHERE channel_id = $1", values: [channelID]});
        } catch(err) {
            console.error(err);
            channel.send("Something went wrong :(");
            return;
        }

        channel.send(res);
    }
}

module.exports = {
    reg: async(message, client) => {
        let channelID = message.channelId;
        let channel = client.channels.cache.get(channelID);
        let msg_command = message.content;
        msg_command = msg_command.toLowerCase();
        
        if (/^\?setupqueue /.test(msg_command)) {
            let amount = parseInt(msg_command.slice(12)); //?setupqueue x
            
            //meme on user if the input is gibberish
            if (isNaN(amount)) {
                channel.send("https://tenor.com/view/patrick-star-minor-s-spongebob-spongebob-meme-spongebob-squarepants-gif-10940848928744248792");
                return;
            }
            if (amount <= 0 || amount > 4 ) {
                channel.send(`Why the fuck do you want a ${amount} v ${amount}`);
                return;
            }
            try {
                await query({
                    text: "INSERT INTO channels VALUES ($1, $2) ON CONFLICT(channel_id) DO UPDATE SET queue_type = $2 WHERE channels.channel_id = $1",
                    values: [channelID, amount]
                });

                await query({
                    text: "DELETE FROM reg WHERE channel_id = $1",
                    values: [channelID]
                });
            } catch(err) {
                console.error(err);
                channel.send("Something went wrong :(");
                return;
            }
           
            channel.send(`Queue is now a ${amount} v ${amount}`);
            return;
        }

        let reg_chnl_id;
        try { 
            reg_chnl_id = await query("SELECT COUNT(*) FROM channels WHERE channel_id = $1", [channelID]);
        } catch(err) {
            console.error(err);
            channel.send("Something went wrong :(");
            return;
        }
        if (reg_chnl_id.rows[0].count == 0) return;

        let xVx;
        try {
            xVx = await query({
                text: "SELECT queue_type FROM channels WHERE channel_id = $1",
                values: [channelID]
            });
        } catch(err) {
            console.error(err);
            channel.send("Something went wrong :(");
            return;
        }
        xVx = xVx.rows[0].queue_type;

        if (/^\?mpreg /.test(msg_command)) {
            channel.send("https://tenor.com/view/what-happened-what-happened-to-you-as-a-child-what-kind-of-trauma-makes-you-act-like-this-stare-stare-cat-gif-2454779732634892782");
            return;
        }

        if (/^\?freg /.test(msg_command)) {
            let person = msg_command.slice(6);

            //regexes are magic
            if (!/^<@.*>$/.test(person)) {
                channel.send(`idk who the fuck ${person} is`);
                return;
            }

            //remove <@ and >
            let personId = person.slice(2, (person.length - 1)); 
            
            let guild = client.guilds.cache.find(guild => guild.id === message.guildId);

            //try to fetch the user to see if they're actually in the server
            let user;
            try {
                user = await guild.members.fetch(personId);
            } catch(err) {
                if (err.code == 10013) {
                    channel.send(`There's no user with the id ${personId} in this server`);
                    return;
                }
                if (err.code == 50035) {
                    channel.send("You really think you're clever.");
                    return;
                }

                console.error(err);
                channel.send("Something went wrong :(");
                return;
            }
            addUser(channel, user, xVx);
        }
            
        switch (msg_command) {
			case "?reg":
			case "?r":
                addUser(channel, message.author, xVx);
				break;

			case "?unreg":
			case "?ureg":
			case "?ur":
                let to_delete;
                try {
                    await query({
                        text: "DELETE FROM reg WHERE disc_id = $1 AND channel_id = $2",
                        values: [message.author.id, channelID]
                    });
                } catch(err) {
                    console.error(err);
                    channel.send("Something went wrong :(");
                    return;
                }

                if (to_delete.rowCount == 0) {
                    channel.send("You aren't in the queue >:(");
                }
                else {
                    channel.send(`No more <@${message.author.id}>`);
                }
				break;
			
			case "?clear":
			case "?c":
                try {
                    await query("DELETE FROM reg WHERE channel_id = $1", [channelID]);
                } catch(err) {
                    console.error(err);
                    channel.send("Something went wrong :(");
                    return;
                }
                message.channel.send("No more queue");
				break;

			case "?show":
			case "?s":
                let reg_queue;
                try {
                    reg_queue = await query({
                        text: "SELECT nickname FROM reg WHERE channel_id = $1",
                        values: [channelID]
                    });
                } catch(err) {
                    console.error(err);
                    channel.send("Something went wrong :(");
                    return;
                }

                if (reg_queue.rowCount == 0) {
                    message.channel.send("There's noone in queue");
                    break;
                }

                let out = "";
				for (let user of reg_queue.rows) {
                    out += user.nickname + ", ";
                }
                message.channel.send(out.slice(0, out.length - 2));
				break;

			case "?reroll":
			case "?rr":
                if (last_queue.length == 0) {
                    channel.send("Nothing to requeue");
                    break;
                }
                if (no_more_cnt > 1) {
                    channel.send("No more");
                    break;
                }
                no_more_cnt++;            

                let order = shuffleArray(last_queue);

                let res = 
                    `Match is ${xVx} v ${xVx}\n`;
                
                let team1 = `Team 1: `, team2 = `Team 2: `;

                for (let i = 0; i < order.length; i++) {
                    if (i % 2 == 0) team1 += `<@${order[i].disc_id}>, `;

                    else team2 += `<@${order[i].disc_id}>, `;
                }
                res += team1.slice(0, team1.length - 2) + "\n" + team2.slice(0, team1.length - 2);
                channel.send(res);
				break;

            case "?deletequeue":
                try {
                    await query({
                    text: "DELETE FROM reg WHERE channel_id = $1",
                        values: [channelID]
                    });
                    await query({
                        text: "DELETE FROM channels WHERE channel_id = $1",
                        values: [channelID]
                    });
                } catch(err) {
                    console.error(err);
                    channel.send("Something went wrong :(");
                    return;
                }
                channel.send("This channel is no longer a queue");
                break;
			
			default:
                
		}
    }
}