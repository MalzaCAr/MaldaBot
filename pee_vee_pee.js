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

module.exports = {
    reg: async(message, client, channelID) => {
        let channel = client.channels.cache.get(channelID);
        let msg_command = message.content;
        
        if (/^\?setupqueue /.test(msg_command)) {
            let amount = parseInt(msg_command.slice(12)); //?setupqueue x
            
            if (isNaN(amount)) {
                channel.send("https://tenor.com/view/patrick-star-minor-s-spongebob-spongebob-meme-spongebob-squarepants-gif-10940848928744248792");
                return;
            }
            if (amount <= 0 || amount > 4 ) {
                channel.send(`Why the fuck do you want a ${amount} v ${amount}`);
                return;
            }
            
            await query({
                text: "INSERT INTO channels VALUES ($1, $2) ON CONFLICT(channel_id) DO UPDATE SET queue_type = $2 WHERE channels.channel_id = $1",
                values: [channelID, amount]
            });
           
            await query({
                text: "DELETE FROM reg WHERE channel_id = $1",
                values: [channelID]
            });

            channel.send(`Queue is now a ${amount} v ${amount}`);
        }
        else if (/^\?deletequeue/.test(msg_command)) {
            await query({
                text: "DELETE FROM reg WHERE channel_id = $1",
                values: [channelID]
            });
            await query({
                text: "DELETE FROM channels WHERE channel_id = $1",
                values: [channelID]
            });
            channel.send("This channel is no longer a queue");
        } 

        let reg_chnl_id = await query("SELECT COUNT(*) FROM channels WHERE channel_id = $1", [channelID]);
        if (reg_chnl_id.rows[0].count == 0) return;

        let xVx = await query({
            text: "SELECT queue_type FROM channels WHERE channel_id = $1",
                values: [channelID]
        });
        xVx = xVx.rows[0].queue_type;
            
        switch (msg_command) {
			case "?reg":
			case "?r":
                try {
                    await query({
                        text: "INSERT INTO reg(disc_id, nickname, channel_id) VALUES ($1, $2, $3)",
                        values:[message.author.id, message.author.displayName, channelID]
                    });
                } catch(err) {
                    if (err.code == '23505') {
                        channel.send("You are already in queue");
                        return;
                    }
                    else {
                        console.error(err);
                    } 
                } 
                
                let queue_lenght = await query("SELECT COUNT(*) FROM reg WHERE channel_id = $1", [channelID]);
                queue_lenght = queue_lenght.rows[0].count;

                channel.send(`Player added to queue. Queue size is now: ${'`' + queue_lenght + '`'}`);

                if (queue_lenght >= xVx * 2) {
                    channel.send("Preparing match");
                    
                    let reg_queue = await query({
                        text: "SELECT disc_id, nickname FROM reg WHERE channel_id = $1",
                        values: [channelID]
                    });

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

                    query({text: "DELETE FROM reg WHERE channel_id = $1", values: [channelID]});

                    channel.send(res);
                }
				break;

			case "?unreg":
			case "?ureg":
			case "?ur":
                let to_delete = await query({
                    text: "DELETE FROM reg WHERE disc_id = $1 AND channel_id = $2",
                    values: [message.author.id, channelID]
                });
                if (to_delete.rowCount == 0) {
                    channel.send("You aren't in the queue >:(");
                }
                else {
                    channel.send(`No more <@${message.author.id}>`);
                }
				break;
			
			case "?clear":
			case "?c":
                await query("DELETE FROM reg WHERE channel_id = $1", [channelID]);
                message.channel.send("No more queue");
				break;

			case "?show":
			case "?s":
                let reg_queue = await query({
                    text: "SELECT nickname FROM reg WHERE channel_id = $1",
                    values: [channelID]
                });

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
			
			default:
                
		}
    }
}