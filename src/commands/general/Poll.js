const KiramekiHelper = require('../../KiramekiHelper');

class Poll {
    constructor() {
        this.name = 'poll';
        this.aliases = ['startpoll', 'vote', 'startvote'];
        this.permissions = ['addReactions', 'externalEmojis'];
        this.category = KiramekiHelper.categories.GENERAL;
        this.cooldown = 15;
        this.help = {
            message: 'Start a poll with a specified topic which users can vote on.',
            usage: 'poll <topic>',
            example: 'poll Should I stream?',
            inline: true
        }
    }

    async execute(message, kirCore, cooldowns) {
        const [command, topic] = KiramekiHelper.tailedArgs(message.content, ' ', 1);

        if (!topic) {
            KiramekiHelper.resetCommandCooldown(cooldowns, this.name, message.author.id);
            return message.channel.createEmbed(KiramekiHelper.generateHelpEmbed(this.help, this.help.inline));
        }

        const voteMessage = await message.channel.createEmbed(new KiramekiHelper.Embed()
            .setColor('DEFAULT')
            .setThumbnail(message.author.dynamicAvatarURL('gif', 256))
            .setTitle(`**${message.author.username}** started a vote!`)
            .setDescription(`React with the corresponding emojis to cast your vote.`)
            .addField('Topic', topic, false)
            .setFooter('This vote was originally started')
            .setTimestamp()
        );

        await voteMessage.addReaction(KiramekiHelper.emojis.VOTE.AS_REACTION.YES);
        await voteMessage.addReaction(KiramekiHelper.emojis.VOTE.AS_REACTION.NO);

        KiramekiHelper.log(KiramekiHelper.LogLevel.COMMAND, 'POLL', `${KiramekiHelper.userLogCompiler(message.author)} used the ${this.name} command.`);
    }
}

module.exports = new Poll();