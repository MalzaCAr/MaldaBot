const { SlashCommandBuilder, time } = require('@discordjs/builders');
const db = require('../../db/index');

module.exports = {
	data: new SlashCommandBuilder()
                .setName(`showreminders`)
                .setDescription(`aaaaaaaaaaaa`),
	async execute(interaction) {
                let discID = interaction.member.id;

                let res = await db.queryReminder('SELECT * FROM reminders WHERE discID = $1', [discID])
                
                if (res.rowCount == 0) {
                        interaction.reply({content: "You have no reminders set"});
                        return;
                }

                let output = `Your reminders are: \n`;
                for (let row = 0; row < res.rowCount; row++) {
                        let timeDiff = new Date(res.rows[row].duetime).getTime() - new Date(Date.now()).getTime();

                        //this feels like such a stupid way to do this but im also stupid so it is what it is
                        //handles the output message containing in how many weeks/days/hours/minutes is the reminder due
                        let replyArray = [];
                        
                        const millisWeek = 604800000; //number of milliseconds in a week
                        const millisDay = 86400000; //number of milliseconds in a day
                        const millisHour = 3600000; //number of milliseconds in an hour
                        const millisMin = 60000; //number of milliseconds in a minute

                        if (timeDiff / millisWeek > 1) {
                                let weeks = parseInt(timeDiff / millisWeek);
                                timeDiff %= millisWeek;

                                if (weeks == 1) {
                                        replyArray.push(`1 week`);
                                }
                                else {
                                        replyArray.push(`${weeks} week`);
                                }
                        }
                        if (timeDiff / millisDay > 1) {
                                let days = parseInt(timeDiff / millisDay);
                                timeDiff %= millisDay;

                                if (days == 1) {
                                        replyArray.push(`1 day`);
                                }
                                else {
                                        replyArray.push(`${days} days`);
                                }
                        }
                        if (timeDiff / millisHour > 1) {
                                let hours = parseInt(timeDiff / millisHour);
                                timeDiff %= millisHour;

                                if (hours == 1) {
                                        replyArray.push(`1 hour`);
                                }
                                else {
                                        replyArray.push(`${hours} hours`);
                                }
                        }
                        if (timeDiff / millisMin > 1) {
                                let mins = parseInt(timeDiff / millisMin);
                                timeDiff %= millisMin;

                                if (mins == 1) {
                                        replyArray.push(`1 minute`);
                                }
                                else {
                                        replyArray.push(`${mins} minutes`);
                                }
                        }
                        else {
                                replyArray.push(`less than 1 minute`); //idk failsafe i guess
                        }

                        output += 
                        `**${res.rows[row].id}**: ${res.rows[row].memo}\n` + 
                        `**Due in**: ${new Intl.ListFormat('en-GB', {style: 'long', type: 'conjunction'}).format(replyArray)}\n\n`;
                }

                interaction.reply({content: output/*, ephemeral: true*/});
	}
};