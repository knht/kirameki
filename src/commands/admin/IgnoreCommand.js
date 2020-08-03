const KiramekiHelper = require('../../KiramekiHelper');

class IgnoreCommand {
    constructor() {
        this.name = 'commandhandler';
        this.aliases = ['ignorecommand', 'igcmd'];
        this.subCommands = ['ignore', 'unignore', 'list'];
        this.userPermissions = ['administrator'];
        this.category = KiramekiHelper.categories.MANAGEMENT;
        this.cooldown = 3;
        this.help = {
            message: 'Tell Kirameki to ignore a certain command within a channel. Users may still gain experience and use enabled event modules.',
            usage: 'commandhandler <option[list|ignore|unignore]> [commandName]',
            example: ['commandhandler list', 'commandhandler ignore weather', 'commandhandler unignore weather'],
            inline: false
        }
    }

    async execute(message, kirCore) {
        const [command, option, commandName] = KiramekiHelper.tailedArgs(message.content, ' ', 2);

        if (!option || !this.subCommands.includes(option.toLowerCase()) || (option.toLowerCase() !== 'list' && !commandName)) {
            return message.channel.createEmbed(KiramekiHelper.generateHelpEmbed(this.help, this.help.inline));
        }

        const foundCommand = kirCore.commands.get(commandName.toLowerCase()) || kirCore.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandName.toLowerCase()));

        if (!foundCommand && option.toLowerCase() !== 'list') {
            return message.channel.createEmbed(new KiramekiHelper.Embed()
                .setColor('RED')
                .setTitle(`Couldn't find command **${commandName}**!`)
                .setDescription(`Check \`${kirCore.prefix}commands\` for a full command list.`)
            );
        }

        switch (option.toLowerCase()) {
            case 'list': {
                const ignoredCommandList = await KiramekiHelper.preparedQuery(kirCore.DB, 'SELECT * FROM ignored_commands WHERE channel_id = ?;', [message.channel.id]);
                const formattedCommandList = (ignoredCommandList.length > 0) ? ignoredCommandList.map((igndcmnd) => `\`${igndcmnd.command_name}\``).join(', ') : 'No commands yet.';

                message.channel.createEmbed(new KiramekiHelper.Embed()
                    .setColor('GREEN')
                    .setTitle(`Ignored commands`)
                    .setDescription(`Currently **${(ignoredCommandList.length === 0) ? 'no' : ignoredCommandList.length} ${(ignoredCommandList.length === 1) ? 'command** is' : 'commands** are'} being ignored in channel **${message.channel.name}**${(ignoredCommandList.length > 0) ? `:\n\n${formattedCommandList}` : ''}`)
                );

                return KiramekiHelper.log(KiramekiHelper.LogLevel.COMMAND, 'COMMAND MUTE LIST', `${KiramekiHelper.userLogCompiler(message.author)} used the ${this.name} command.`);
            }

            case 'ignore': {
                const isAlreadyInserted = await KiramekiHelper.preparedQuery(kirCore.DB, 'SELECT * FROM ignored_commands WHERE channel_id = ? AND command_name = ?;', [message.channel.id, foundCommand.name.toLowerCase()]);

                if (isAlreadyInserted.length > 0) {
                    return message.channel.createEmbed(new KiramekiHelper.Embed()
                        .setColor('RED')
                        .setTitle(`Kirameki already ignores command **${foundCommand.name}** in channel **${message.channel.name}**!`)
                    );
                }

                try {
                    await KiramekiHelper.preparedQuery(kirCore.DB, 'INSERT INTO ignored_commands (id, channel_id, command_name) VALUES (NULL, ?, ?);', [message.channel.id, foundCommand.name.toLowerCase()]);
                    message.channel.createEmbed(new KiramekiHelper.Embed()
                        .setColor('GREEN')
                        .setTitle(`I will ignore command **${foundCommand.name}** in channel **${message.channel.name}** from now on!`)
                    );

                    return KiramekiHelper.log(KiramekiHelper.LogLevel.COMMAND, 'COMMAND MUTE', `${KiramekiHelper.userLogCompiler(message.author)} used the ${this.name} command.`);
                } catch (mysqlError) {
                    message.channel.createEmbed(new KiramekiHelper.Embed()
                        .setColor('RED')
                        .setDescription(`Something went wrong while trying to ignore the command. Please try again.\n\nIf this error persists please join the [Kirameki help server](${KiramekiHelper.links.INVITE}) and report this error. Thanks!`)
                    );

                    return KiramekiHelper.log(KiramekiHelper.LogLevel.ERROR, 'COMMAND MUTE ERROR', `Inserting into the DB failed because of: ${mysqlError}`);
                }
            }

            case 'unignore': {
                const isAlreadyInserted = await KiramekiHelper.preparedQuery(kirCore.DB, 'SELECT * FROM ignored_commands WHERE channel_id = ? AND command_name = ?;', [message.channel.id, foundCommand.name.toLowerCase()]);

                if (isAlreadyInserted.length < 1) {
                    return message.channel.createEmbed(new KiramekiHelper.Embed()
                        .setColor('RED')
                        .setTitle(`Kirameki currently isn't ignoring command **${foundCommand.name}** in channel **${message.channel.name}**!`)
                    );
                }

                try {
                    await KiramekiHelper.preparedQuery(kirCore.DB, 'DELETE FROM ignored_commands WHERE channel_id = ? AND command_name = ?;', [message.channel.id, foundCommand.name.toLowerCase()]);
                    message.channel.createEmbed(new KiramekiHelper.Embed()
                        .setColor('GREEN')
                        .setTitle(`Successfully removed command **${foundCommand.name}** from this channel's ignore list!`)
                    );

                    return KiramekiHelper.log(KiramekiHelper.LogLevel.COMMAND, 'COMMAND MUTE', `${KiramekiHelper.userLogCompiler(message.author)} used the ${this.name} command.`);
                } catch (mysqlError) {
                    message.channel.createEmbed(new KiramekiHelper.Embed()
                        .setColor('RED')
                        .setDescription(`Something went wrong while trying to unignore the command. Please try again.\n\nIf this error persists please join the [Kirameki help server](${KiramekiHelper.links.INVITE}) and report this error. Thanks!`)
                    );

                    return KiramekiHelper.log(KiramekiHelper.LogLevel.ERROR, 'COMMAND MUTE ERROR', `Deleting from the DB failed because of: ${mysqlError}`);
                }
            }
        }
    }
}

module.exports = new IgnoreCommand();