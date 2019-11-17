const KiramekiHelper = require('../../KiramekiHelper');

class CustomCommandsHandler {
    constructor() {
        this.name = 'customcommands';
        this.aliases = ['customcommand', 'cc'];
        this.subCommands = ['add', 'remove', 'edit', 'list'];
        this.userPermissions = ['administrator'];
        this.category = KiramekiHelper.categories.MANAGEMENT;
        this.cooldown = 3;
        this.help = {
            message: 'Add up to 25 custom commands unique to your guild containing any information or links desired. Maximum text length is 1500 characters!',
            usage: 'customcommands <toggle[add|remove|edit|list]> <commandName> [<text>]',
            example: ['cc add math Rembmer that 2+2 equals 4', 'cc remove math', 'cc edit math 3+2 equals 5', 'cc list'],
            inline: false
        }
    }

    async execute(message, kirCore) {
        const [command, toggle, commandName, commandValue] = KiramekiHelper.tailedArgs(message.content, ' ', 3);

        if ((!commandName && toggle.toLowerCase() !== 'list') || (['add', 'edit'].includes(toggle.toLowerCase())  && !commandValue)) {
            return message.channel.createEmbed(KiramekiHelper.generateHelpEmbed(this.help, this.help.inline));
        }

        if (commandName.length > 50) {
            return message.channel.createEmbed(new KiramekiHelper.Embed()
                .setColor('RED')
                .setDescription(`Command names mustn't be longer than **50** characters!`)
            );
        }

        if (['add', 'edit'].includes(toggle.toLowerCase()) && commandValue.length > 1500) {
            return message.channel.createEmbed(new KiramekiHelper.Embed()
                .setColor('RED')
                .setDescription(`Command values mustn't be longer than **1500** characters!`)
            );
        }

        const customGuildCommand = await KiramekiHelper.preparedQuery(kirCore.DB, 'SELECT * FROM custom_commands WHERE guild_id = ? AND command_name = ?;', [message.channel.guild.id, commandName.toLowerCase()]);
        const customGuildCommands = await KiramekiHelper.preparedQuery(kirCore.DB, 'SELECT * FROM custom_commands WHERE guild_id = ?;', [message.channel.guild.id]);

        switch (toggle.toLowerCase()) {
            default: {
                return message.channel.createEmbed(KiramekiHelper.generateHelpEmbed(this.help, this.help.inline));
            }

            case 'add': {
                const internalCommand = kirCore.commands.get(commandName.toLowerCase()) || kirCore.commands.find(kirCommand => kirCommand.aliases && kirCommand.aliases.includes(commandName.toLowerCase()));
                
                if (internalCommand) {
                    return message.channel.createEmbed(new KiramekiHelper.Embed()
                        .setColor('RED')
                        .setDescription(`A **native** Kirameki command usable under **"${commandName}"** already exists!`)
                    );
                }

                if (customGuildCommand.length > 0) {
                    return message.channel.createEmbed(new KiramekiHelper.Embed()
                        .setColor('RED')
                        .setDescription(`A **custom** Kirameki command usable under **"${commandName}"** already exists!`)
                    );
                }

                if (customGuildCommands.length > 25) {
                    return message.channel.createEmbed(new KiramekiHelper.Embed()
                        .setColor('RED')
                        .setDescription(`Guild **${message.channel.guild.name}** already has 25 custom commands!`)
                    );
                }

                try {
                    await KiramekiHelper.preparedQuery(
                        kirCore.DB,
                        'INSERT INTO `custom_commands` (`id`, `guild_id`, `command_name`, `command_value`) VALUES (NULL, ?, ?, ?);',
                        [message.channel.guild.id, commandName.toLowerCase(), commandValue]
                    );

                    message.channel.createEmbed(new KiramekiHelper.Embed()
                        .setColor('GREEN')
                        .setDescription(`Successfully added custom command **${commandName.toLowerCase()}** to guild **${message.channel.guild.name}**!\n\nUse **${kirCore.prefix + commandName.toLowerCase()}** to use your custom command!`)
                    );
                } catch (customCommandAddError) {
                    message.channel.createEmbed(new KiramekiHelper.Embed()
                        .setColor('RED')
                        .setDescription(`Something went wrong adding a custom command. Please try again later!`)
                    );

                    return KiramekiHelper.log(KiramekiHelper.LogLevel.ERROR, 'CUSTOM COMMANDS ERROR', customCommandAddError);
                }

                break;
            }

            case 'delete':
            case 'remove': {
                if (!customGuildCommand.length) {
                    return message.channel.createEmbed(new KiramekiHelper.Embed()
                        .setColor('RED')
                        .setDescription(`There is no custom command called **${commandName}** on guild **${message.channel.guild.name}**!`)
                    );
                }

                try {
                    await KiramekiHelper.preparedQuery(
                        kirCore.DB,
                        'DELETE FROM custom_commands WHERE guild_id = ? AND command_name = ?;',
                        [message.channel.guild.id, commandName.toLowerCase()]
                    );

                    message.channel.createEmbed(new KiramekiHelper.Embed()
                        .setColor('GREEN')
                        .setDescription(`Successfully removed custom command **${commandName.toLowerCase()}** from guild **${message.channel.guild.name}**!`)
                    );
                } catch (customCommandRemoveError) {
                    message.channel.createEmbed(new KiramekiHelper.Embed()
                        .setColor('RED')
                        .setDescription(`Something went wrong removing a custom command. Please try again later!`)
                    );

                    return KiramekiHelper.log(KiramekiHelper.LogLevel.ERROR, 'CUSTOM COMMANDS ERROR', customCommandRemoveError);
                }

                break;
            }

            case 'edit': {
                if (!customGuildCommand.length) {
                    return message.channel.createEmbed(new KiramekiHelper.Embed()
                        .setColor('RED')
                        .setDescription(`There is no custom command called **${commandName}** on guild **${message.channel.guild.name}**!`)
                    );
                }

                try {
                    await KiramekiHelper.preparedQuery(
                        kirCore.DB,
                        'UPDATE custom_commands SET command_value = ? WHERE guild_id = ? AND command_name = ?;',
                        [commandValue, message.channel.guild.id, commandName.toLowerCase()]
                    );

                    message.channel.createEmbed(new KiramekiHelper.Embed()
                        .setColor('GREEN')
                        .setDescription(`Successfully updated custom command **${commandName.toLowerCase()}** on guild **${message.channel.guild.name}**!`)
                    );
                } catch (customCommandEditError) {
                    message.channel.createEmbed(new KiramekiHelper.Embed()
                        .setColor('RED')
                        .setDescription(`Something went wrong updating a custom command. Please try again later!`)
                    );

                    return KiramekiHelper.log(KiramekiHelper.LogLevel.ERROR, 'CUSTOM COMMANDS ERROR', customCommandEditError);
                }

                break;
            }

            case 'list': {
                const customCommandNames = customGuildCommands.map(cgc => `**${cgc.command_name}**`);
                
                message.channel.createEmbed(new KiramekiHelper.Embed()
                    .setColor('GREEN')
                    .setDescription(`**${message.channel.guild.name}'s** custom commands:\n\n` + (customCommandNames.length > 0 ? customCommandNames.join(', ') : 'No custom commands yet.'))
                );

                break;
            }
        }

        KiramekiHelper.log(KiramekiHelper.LogLevel.COMMAND, 'CUSTOM COMMANDS', `${KiramekiHelper.userLogCompiler(message.author)} used the ${this.name} command.`);
    }
}

module.exports = new CustomCommandsHandler();