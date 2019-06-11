const KiramekiHelper = require('../../KiramekiHelper');

class ChannelHandler {
    constructor() {
        this.name = 'channel';
        this.aliases = ['channelhandler'];
        this.userPermissions = ['administrator'];
        this.subCommands = ['ignore', 'unignore'];
        this.category = KiramekiHelper.categories.MANAGEMENT;
        this.cooldown = 3;
        this.help = {
            message: 'Tell Kirameki to ignore a channel. This only affects commands. Users may still gain experience and use enabled event modules.',
            usage: 'channel <action[ignore|unignore]>',
            example: ['channel ignore', 'channel unignore'],
            inline: false
        }
    }

    async execute(message, kirCore) {
        const [command, option] = KiramekiHelper.tailedArgs(message.content, ' ', 1);
        const isAlreadyInserted = await KiramekiHelper.preparedQuery(kirCore.DB, 'SELECT * FROM ignored_channels WHERE channel_id = ?;', [message.channel.id]);

        if (!option || !this.subCommands.includes(option.toLowerCase())) {
            return message.channel.createEmbed(KiramekiHelper.generateHelpEmbed(this.help, this.help.inline));
        }

        switch (option.toLowerCase()) {
            case 'ignore': {
                if (isAlreadyInserted.length > 0) {
                    return message.channel.createEmbed(new KiramekiHelper.Embed()
                        .setColor('RED')
                        .setTitle(`Kirameki already ignores channel **${message.channel.name}**!`)
                    );
                }

                try {
                    await KiramekiHelper.preparedQuery(kirCore.DB, 'INSERT INTO ignored_channels (id, channel_id) VALUES (NULL, ?);', [message.channel.id]);
                    message.channel.createEmbed(new KiramekiHelper.Embed()
                        .setColor('GREEN')
                        .setTitle(`I will ignore commands in channel **${message.channel.name}** from now on!`)
                    );

                    return KiramekiHelper.log(KiramekiHelper.LogLevel.COMMAND, 'CHANNEL MUTE', `${KiramekiHelper.userLogCompiler(message.author)} used the ${this.name} command.`);
                } catch (mysqlError) {
                    message.channel.createEmbed(new KiramekiHelper.Embed()
                        .setColor('RED')
                        .setDescription(`Something went wrong while trying to ignore the channel. Please try again.\n\nIf this error persists please join the [Kirameki help server](${KiramekiHelper.links.INVITE}) and report this error. Thanks!`)
                    );

                    return KiramekiHelper.log(KiramekiHelper.LogLevel.ERROR, 'CHANNEL MUTE ERROR', `Inserting into the DB failed because of: ${mysqlError}`);
                }
            }

            case 'unignore': {
                if (isAlreadyInserted.length < 1) {
                    return message.channel.createEmbed(new KiramekiHelper.Embed()
                        .setColor('RED')
                        .setTitle(`Kirameki currently isn't ignoring channel **${message.channel.name}**!`)
                    );
                }

                try {
                    await KiramekiHelper.preparedQuery(kirCore.DB, 'DELETE FROM ignored_channels WHERE channel_id = ?;', [message.channel.id]);
                    message.channel.createEmbed(new KiramekiHelper.Embed()
                        .setColor('GREEN')
                        .setTitle(`Successfully removed channel **${message.channel.name}** from the ignore list!`)
                    );

                    return KiramekiHelper.log(KiramekiHelper.LogLevel.COMMAND, 'CHANNEL MUTE', `${KiramekiHelper.userLogCompiler(message.author)} used the ${this.name} command.`);
                } catch (mysqlError) {
                    message.channel.createEmbed(new KiramekiHelper.Embed()
                        .setColor('RED')
                        .setDescription(`Something went wrong while trying to unignore the channel. Please try again.\n\nIf this error persists please join the [Kirameki help server](${KiramekiHelper.links.INVITE}) and report this error. Thanks!`)
                    );

                    return KiramekiHelper.log(KiramekiHelper.LogLevel.ERROR, 'CHANNEL MUTE ERROR', `Deleting from the DB failed because of: ${mysqlError}`);
                }
            }
        }
    }
}

module.exports = new ChannelHandler();