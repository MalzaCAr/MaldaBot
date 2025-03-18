const { random } = require("nanoid");

let reg_queue = [], last_queue = [];
let xVx = 2;
let reg_channel_id = "815546700072615968";
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

function findUsrIndex(array, id) {
    for (let i = 0; i < array.length; i++) {
        if (array[i].id == id) return i;
    }
    return -1;
}

module.exports = {
    reg: function(message, client) {
        let channel = client.channels.cache.get(reg_channel_id);
        let msg_command = message.content;

        switch (msg_command) {
			case "?reg":
			case "?r":
				reg_queue.push({
					id: message.author.id,
					name: message.author.displayName
				});

                channel.send(`Player added to queue. Queue size is now: ${'`' + reg_queue.length + '`'}`)

                if (reg_queue.length == xVx * 2) {
                    channel.send("Preparing match");
                    
                    last_queue = reg_queue.slice();

                    no_more_cnt = 0;
                    let order = shuffleArray(reg_queue);
                    reg_queue = [];

                    let res = 
                        `Match is ${xVx} v ${xVx}\n`;
                    
                    let team1 = `Team 1: `, team2 = `Team 2: `;

                    for (let i = 0; i < order.length; i++) {
                        if (i % 2 == 0) team1 += `<@${order[i].id}>, `;

                        else team2 += `<@${order[i].id}>, `;
                    }
                    res += team1.slice(0, team1.length - 2) + "\n" + team2.slice(0, team1.length - 2);
                    channel.send(res);
                }
				break;

			case "?unreg":
			case "?ureg":
			case "?ur":
				let index = findUsrIndex(reg_queue, message.author.id);
                if (index == -1) {
                    message.channel.send("You aren't in the queue >:(");
                    break;
                }
                let user = reg_queue.pop(index);
                message.channel.send(`No more @<${user.id}> in queue`);
				break;
			
			case "?clear":
			case "?c":
				reg_queue = [];
                message.channel.send("No more queue");
				break;

			case "?show":
			case "?s":
                if (reg_queue.length == 0) {
                    message.channel.send("There's noone in queue");
                    break;
                }
                let out = "";
				for (let user of reg_queue) {
                    out += user.name + ", ";
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
                    if (i % 2 == 0) team1 += `<@${order[i].id}>, `;

                    else team2 += `<@${order[i].id}>, `;
                }
                res += team1.slice(0, team1.length - 2) + "\n" + team2.slice(0, team1.length - 2);
                channel.send(res);
				break;
			
			default:
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
                    xVx = amount;

                    channel.send(`Queue is now a ${xVx} v ${xVx}`);
                }
		}
    }
}