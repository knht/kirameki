const KiramekiHelper = require('../../KiramekiHelper');

class CommandClassName {
    constructor() {
        this.name = 'purge';
        this.category = KiramekiHelper.categories.MANAGEMENT;
        this.owner = false;
        this.aliases = ['bulkdelete', 'clear', 'massdelete'];
        this.permissions = ['manageMessages', 'readMessageHistory'];
        this.userPermissions = ['manageMessages'];
        this.help = {
            message: 'Delete up to 100 messages in bulk if they aren\'t older than 2 weeks.',
            usage: 'purge <messageCount>',
            example: ['purge 3', 'purge 87'],
            inline: true
        }
    }

    async execute(message, kirCore) {
        const [command, messageCount] = KiramekiHelper.tailedArgs(message.content, ' ', 1);

        if (!messageCount || parseInt(messageCount) < 1 || parseInt(messageCount) > 100 || isNaN(parseInt(messageCount))) {
            return message.channel.createEmbed(KiramekiHelper.generateHelpEmbed(this.help, this.help.inline));
        }

        const parsedMessageCount    = parseInt(messageCount) + 1;
        const messagePlural         = ((parsedMessageCount - 1) === 1) ? 'message' : 'messages';
        const lastMessages          = await message.channel.getMessages(parsedMessageCount);
        const messageIDs            = lastMessages.map(messageObject => messageObject.id);

        try {
            await message.channel.deleteMessages(messageIDs);

            KiramekiHelper.createFlashEmbed(message, 5, new KiramekiHelper.Embed()
                .setColor('GREEN')
                .setTitle(`Successfully purged **${parsedMessageCount - 1}** ${messagePlural} in channel **${message.channel.name}**!`)
            );

            KiramekiHelper.log(KiramekiHelper.LogLevel.COMMAND, 'MESSAGE PURGE', `${KiramekiHelper.userLogCompiler(message.author)} just purged ${messageCount} ${messagePlural}`);
        } catch (messageDeleteError) {
            message.channel.createEmbed(new KiramekiHelper.Embed()
                .setColor('RED')
                .setDescription('Something went wrong trying to bulk delete messages. This is probably caused because a message within the deletion range is older than 2 weeks.')
            );

            KiramekiHelper.log(KiramekiHelper.LogLevel.COMMAND, 'MESSAGE PURGE ERROR', `Purging messages failed because of: ${messageDeleteError}`);
        }
    }
}

module.exports = new CommandClassName();