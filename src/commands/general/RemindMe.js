const KiramekiHelper = require('../../KiramekiHelper');
const juration = require('juration');

class RemindMe {
    constructor() {
        this.name = 'remindme';
        this.aliases = ['reminder', 'remind'];
        this.category = KiramekiHelper.categories.GENERAL;
        this.cooldown = 60;
        this.help = {
            message: 'Set a reminder for a later time. Please note that this reminder is **volatile**!',
            usage: 'remindme',
            example: 'remindme',
            inline: true
        }
    }

    async execute(message, kirCore, cooldowns) {
        const whenMessage = await message.channel.createEmbed(new KiramekiHelper.Embed()
            .setColor('GREEN')
            .setTitle('When should I remind you?')
            .setDescription(
                'You can directly reply your answer!\n' + 
                'For example: `3 minutes and 45 seconds` or `2 hours, 1 minute and 47 seconds`'
            )
            .setFooter('This menu will automatically close after 30 seconds.')
        );

        const answerWhen = await message.channel.awaitMessages((m) => message.author.id === m.author.id, { time: 30000, maxMatches: 1 });

        if (!answerWhen[0]) {
            KiramekiHelper.resetCommandCooldown(cooldowns, this.name, message.author.id);
            return whenMessage.delete();
        } 
        
        const parsedAnswerWhen = answerWhen[0].content;

        try {
            const parsedTime = juration.parse(parsedAnswerWhen);
            const whatMessage = await message.channel.createEmbed(new KiramekiHelper.Embed()
                .setColor('GREEN')
                .setTitle('What should I remind you about?')
            );

            const answerWhat = await message.channel.awaitMessages((m) => message.author.id === m.author.id, { time: 30000, maxMatches: 1 });
            
            if (!answerWhat[0]) {
                KiramekiHelper.resetCommandCooldown(cooldowns, this.name, message.author.id);
                whenMessage.delete();
                return whatMessage.delete();
            }
            
            const parsedAnswerWhat = answerWhat[0].content;

            whenMessage.delete();
            whatMessage.delete();

            const confirmationMessage = await message.channel.createEmbed(new KiramekiHelper.Embed()
                .setColor('GREEN')
                .setDescription(
                    `I will remind you in **${parsedAnswerWhen}** about **${parsedAnswerWhat}**!`
                )
            );

            setTimeout(() => {
                confirmationMessage.delete();
                message.channel.createMessage({ content: message.author.mention, embed: new KiramekiHelper.Embed().setColor('GREEN').setTitle('Ding Dong!').setDescription(`It's time! You wanted me to remind you about:\n\n**${parsedAnswerWhat}**`) });
            }, parsedTime * 1000);

        } catch (jurationError) {
            await whenMessage.delete();
            KiramekiHelper.createFlashEmbed(message, 5, new KiramekiHelper.Embed().setColor('RED').setTitle('Invalid time format! Aborting ...'));
            KiramekiHelper.resetCommandCooldown(cooldowns, this.name, message.author.id);
        }

        KiramekiHelper.log(KiramekiHelper.LogLevel.COMMAND, 'REMIND ME', `${KiramekiHelper.userLogCompiler(message.author)} used the ${this.name} command.`);
    }
}

module.exports = new RemindMe();