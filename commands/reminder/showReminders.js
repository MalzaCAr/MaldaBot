const { SlashCommandBuilder, time } = require('@discordjs/builders');
const { reminders, regexes } = require('../../db/index');



module.exports = {
	data: new SlashCommandBuilder()
                .setName(`showreminders`)
                .setDescription(`aaaaaaaaaaaa`),

	async execute(interaction) {
                let discID = interaction.member.id;

                let res = await reminders.find({ discID: discID, });

                res = await res.toArray();

                if (res.length == 0) {
                        interaction.reply({content: "You have no reminders set"});
                        return;
                }


                let output = `Your reminders are: \n\n`;

                for (let row of res) {
                        let timeDiff = new Date(row.dueDate).getTime() - new Date(Date.now()).getTime();

                        //this feels like such a stupid way to do this but im also stupid so it is what it is
                        //handles the output message containing in how many weeks/days/hours/minutes is the reminder due
                        let replyArray = [];

                        for (let i of regexes) {
                                if (timeDiff / i.amountOfMs < 1) continue;

                                let amount = parseInt(timeDiff / i.amountOfMs);
                                timeDiff %= i.amountOfMs;

                                if (amount == 1) {
                                        replyArray.push(`1 ${i.name.slice(0, i.name.length - 1)}`);
                                }                                        
                                else {
                                               replyArray.push(`${amount} ${i.name}`);
                                }
                        }

                        if (replyArray.length == 0) {
                                replyArray.push("less than 1 minute");
                        }

                        output += 
                        `**${row.remid}**: ${row.reminderMemo}\n` + 
                        `**Due**: in ${new Intl.ListFormat('en-GB', {style: 'long', type: 'conjunction'}).format(replyArray)}, on <t:${parseInt(row.dueDate.getTime() / 1000)}:F>\n`;
                }

                interaction.reply({content: output/*, ephemeral: true*/});
	}
};