const KiramekiHelper = require('../../KiramekiHelper');
const KiramekiConfig = require('../../../config/KiramekiConfig');

class MuteHandler {
    constructor() {
        this.name = 'mutehandler';
        this.aliases = ['muteuser', 'mutemember', 'mute'];
        this.permissions = ['manageMessages'];
        this.userPermissions = ['administrator'];
        this.subCommands = ['mute', 'unmute'];
        this.category = KiramekiHelper.categories.MANAGEMENT;
        this.cooldown = 3;
        this.help = {
            message: 'Mute or unmute a user on the current guild',
            usage: 'mutehandler <action[mute|unmute]> <userMention>',
            example: ['mutehandler mute @Ayreth#3412', 'mutehandler unmute @Riya#0001'],
            inline: false
        }
    }

    async execute(message, kirCore) {
        const [command, action, user] = KiramekiHelper.tailedArgs(message.content, ' ', 2);
        const mentionedUser = message.mentions[0];

        if (!action || !mentionedUser || !this.subCommands.includes(action.toLowerCase())) {
            return message.channel.createEmbed(KiramekiHelper.generateHelpEmbed(this.help, this.help.inline));
        }

        switch (action.toLowerCase()) {
            case 'mute': {
                const isMutedAlready = await KiramekiHelper.preparedQuery(kirCore.DB, 'SELECT * FROM mute WHERE discord_id = ? AND guild_id = ?;', [mentionedUser.id, message.channel.guild.id]);

                if (mentionedUser.id === kirCore.user.id) {
                    return message.channel.createEmbed(new KiramekiHelper.Embed()
                        .setColor('RED')
                        .setDescription(`You can't mute me. Please use the **${KiramekiConfig.prefix}channel** command if you want me to stop responding to commands in channel **${message.channel.name}**.`)
                    );
                }

                if (mentionedUser.id === message.author.id) {
                    return message.channel.createEmbed(new KiramekiHelper.Embed()
                        .setColor('RED')
                        .setTitle('You can\'t mute yourself!')
                    );
                }

                if (isMutedAlready.length > 0) {
                    return message.channel.createEmbed(new KiramekiHelper.Embed()
                        .setColor('RED')
                        .setTitle(`**${KiramekiHelper.getUserTag(mentionedUser)}** is already muted on **${message.channel.guild.name}**!`)
                    );
                }

                try {
                    await KiramekiHelper.preparedQuery(kirCore.DB, 'INSERT INTO mute (id, discord_id, guild_id) VALUES (NULL, ?, ?);', [mentionedUser.id, message.channel.guild.id]);
                    message.channel.createEmbed(new KiramekiHelper.Embed()
                        .setColor('GREEN')
                        .setTitle(`Successfully muted **${KiramekiHelper.getUserTag(mentionedUser)}** on guild **${message.channel.guild.name}**!`)
                    );

                    return KiramekiHelper.log(KiramekiHelper.LogLevel.COMMAND, 'MUTE HANDLER', `${KiramekiHelper.userLogCompiler(message.author)} used the ${this.name} command.`);
                } catch (mysqlError) {
                    message.channel.createEmbed(new KiramekiHelper.Embed()
                        .setColor('RED')
                        .setDescription(`Something went wrong while trying to mute the user. Please try again.\n\nIf this error persists please join the [Kirameki help server](${KiramekiHelper.links.INVITE}) and report this error. Thanks!`)
                    );
                    
                    return KiramekiHelper.log(KiramekiHelper.LogLevel.ERROR, 'MUTE HANDLER ERROR', `Inserting the user into the database failed because of: ${mysqlError}`);
                }
            }

            case 'unmute': {
                const isMutedAlready = await KiramekiHelper.preparedQuery(kirCore.DB, 'SELECT * FROM mute WHERE discord_id = ? AND guild_id = ?;', [mentionedUser.id, message.channel.guild.id]);

                if (isMutedAlready.length > 0) {
                    try {
                        await KiramekiHelper.preparedQuery(kirCore.DB, 'DELETE FROM mute WHERE discord_id = ? AND guild_id = ?;', [mentionedUser.id, message.channel.guild.id]);
                        message.channel.createEmbed(new KiramekiHelper.Embed()
                            .setColor('GREEN')
                            .setTitle(`Successfully unmuted **${KiramekiHelper.getUserTag(mentionedUser)}** on guild **${message.channel.guild.name}**!`)
                        );

                        return KiramekiHelper.log(KiramekiHelper.LogLevel.COMMAND, 'MUTE HANDLER', `${KiramekiHelper.userLogCompiler(message.author)} used the ${this.name} command.`);
                    } catch (mysqlError) {
                        message.channel.createEmbed(new KiramekiHelper.Embed()
                            .setColor('RED')
                            .setDescription(`Something went wrong while trying to unmute the user. Please try again.\n\nIf this error persists please join the [Kirameki help server](${KiramekiHelper.links.INVITE}) and report this error. Thanks!`)
                        );
                    
                        return KiramekiHelper.log(KiramekiHelper.LogLevel.ERROR, 'MUTE HANDLER ERROR', `Deleting the user from the database failed because of: ${mysqlError}`);
                    }
                } else {
                    return message.channel.createEmbed(new KiramekiHelper.Embed()
                        .setColor('RED')
                        .setTitle(`**${KiramekiHelper.getUserTag(mentionedUser)}** isn't muted on guild **${message.channel.guild.name}**!`)
                    );
                }
            }
        }
    }
}

module.exports = new MuteHandler();