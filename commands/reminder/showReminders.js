const { SlashCommandBuilder, time } = require('@discordjs/builders');
const { reminders } = require('../../db/index');

class WDHM {
        constructor(name, amountOfMS) {
                this.name = name;
                this.amountOfMS = amountOfMS;
        };
        name = "";
        amountOfMS = 60000;
}

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
                        
                const millisWeek = 604800000; //number of milliseconds in a week
                const millisDay = 86400000; //number of milliseconds in a day
                const millisHour = 3600000; //number of milliseconds in an hour
                const millisMin = 60000; //number of milliseconds in a minute

                let millisArray = [
                        new WDHM ("weeks", millisWeek), 
                        new WDHM ("days", millisDay), 
                        new WDHM ("hours", millisHour), 
                        new WDHM ("minutes", millisMin)
                ];

                let output = `Your reminders are: \n\n`;

                for (let row = 0; row < res.length; row++) {
                        let timeDiff = new Date(res[row].dueDate).getTime() - new Date(Date.now()).getTime();

                        //this feels like such a stupid way to do this but im also stupid so it is what it is
                        //handles the output message containing in how many weeks/days/hours/minutes is the reminder due
                        let replyArray = [];

                        for (let i of millisArray) {
                                if (timeDiff / i.amountOfMS < 1) continue;

                                let amount = parseInt(timeDiff / i.amountOfMS);
                                timeDiff %= i.amountOfMS;

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
                        `**${res[row].remid}**: ${res[row].reminderMemo}\n` + 
                        `**Due**: in ${new Intl.ListFormat('en-GB', {style: 'long', type: 'conjunction'}).format(replyArray)}, on <t:${parseInt(res[row].dueDate.getTime() / 1000)}:F>\n`;
                }

                interaction.reply({content: output/*, ephemeral: true*/});
	}
};