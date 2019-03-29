const KiramekiHelper = require('../../KiramekiHelper');

class Help {
    constructor() {
        this.category = KiramekiHelper.categories.GENERAL;
        this.name = 'help';
        this.help = {
            message: 'Get either a general Help card or instructions for specified commands! Specifying a command is optional. If a command was specified its help text will show up.',
            usage: 'help <command>',
            example: ['help', 'help profile'],
            inline: true
        }
    }

    async execute(message, kirCore) {
        const [command, helpCommand] = KiramekiHelper.tailedArgs(message.content, ' ', 1);

        if (!helpCommand) {
            return message.channel.createEmbed(new KiramekiHelper.Embed()
                .setColor('DEFAULT')
                .setAuthor('Kirameki Help', KiramekiHelper.images.KIRAMEKI_MASCOT)
                .addField('Command List', `[Click Here](${KiramekiHelper.links.WEBSITE.COMMANDS})`, true)
                .addField('Help Discord', `[Join Here](${KiramekiHelper.links.INVITE})`, true)
                .addField('Dashboard', `[Click Here](${KiramekiHelper.links.WEBSITE.DASHBOARD})`, true)
                .addField('Pro Tip', `You can use \`${kirCore.prefix}help <command>\` for more detailed command help!`)
                .setFooter(`Help requested by ${message.author.username}`, message.author.dynamicAvatarURL('jpg', 128))
            );
        } else {
            const foundCommand = kirCore.commands.get(helpCommand) || kirCore.commands.find(cmd => cmd.aliases && cmd.aliases.includes(helpCommand));

            if (!foundCommand) {
                return message.channel.createEmbed(new KiramekiHelper.Embed()
                    .setColor("RED")
                    .setTitle(`Couldn't find command **${helpCommand}**.`)
                );
            }

            if (foundCommand.category === KiramekiHelper.categories.OWNER && !KiramekiHelper.checkIfOwner(message.author.id)) {
                return message.channel.createEmbed(new KiramekiHelper.Embed()
                    .setColor("RED")
                    .setTitle("Insufficient Permissions")
                );
            }

            if (foundCommand && !foundCommand.help) {
                return message.channel.createEmbed(new KiramekiHelper.Embed()
                    .setColor("DEFAULT")
                    .setAuthor("Kirameki Help", KiramekiHelper.images.KIRAMEKI_MASCOT)
                    .setDescription(`Unfortunately command **${foundCommand.name}** has no integrated help text yet. Please head on over to the [Kirameki Website](${KiramekiHelper.links.WEBSITE.COMMANDS}) for detailed instructions and examples.`)
                );
            }

            const helpEmbed = KiramekiHelper.generateHelpEmbed(foundCommand.help, (foundCommand.help.inline) ? true : false);
            message.channel.createEmbed(helpEmbed);
        }
        
        KiramekiHelper.log(KiramekiHelper.LogLevel.COMMAND, 'HELP', `${KiramekiHelper.userLogCompiler(message.author)} used the Help command!`);
    }
}

module.exports = new Help();