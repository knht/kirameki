const KiramekiHelper = require('../../KiramekiHelper');

class BirthdaySystemMuter {
    constructor() {
        this.category = KiramekiHelper.categories.MANAGEMENT;
        this.name = 'birthdaymessages';
        this.aliases = ['bdaymessages', 'xpmessages', 'xpmsgs', 'bdmsgs'];
        this.userPermissions = ['administrator'];
        this.help = {
            message: 'Disable and enable level up messages of the Birthday System!',
            usage: 'birthdaymessages <option[enable|disable]>',
            example: 'birthdaymessages enable'
        }
    }

    async execute(message, kirCore) {
        const [command, option] = KiramekiHelper.tailedArgs(message.content, ' ', 1);
        
        if (!option) {
            return message.channel.createEmbed(KiramekiHelper.generateHelpEmbed(this.help));
        }

        const isAlreadyInserted = await KiramekiHelper.preparedQuery(kirCore.DB, 'SELECT * FROM birthday_ignores WHERE guild_id = ?;', [message.channel.guild.id]);

        switch (option.toLowerCase()) {
            case 'disable': {
                if (isAlreadyInserted.length) {
                    return message.channel.createEmbed(new KiramekiHelper.Embed()
                        .setColor('RED')
                        .setTitle('Birthday Messages are already disabled for this guild!')
                    );
                }

                await KiramekiHelper.preparedQuery(kirCore.DB, 'INSERT INTO birthday_ignores (id, guild_id) VALUES (NULL, ?);', [message.channel.guild.id]);
                message.channel.createEmbed(new KiramekiHelper.Embed()
                    .setColor('GREEN')
                    .setTitle('Birthday Message Administration')
                    .setDescription(`Successfully disabled Birthday Messages for guild **${message.channel.guild.name}**!`)
                );

                KiramekiHelper.log(KiramekiHelper.LogLevel.COMMAND, 'BIRTHDAY IGNORE', `${KiramekiHelper.userLogCompiler(message.author)} just disabled Birthday Messages for guild ${message.channel.guild.name}`);
                break;
            }

            case 'enable': {
                if (!isAlreadyInserted.length) {
                    return message.channel.createEmbed(new KiramekiHelper.Embed()
                        .setColor('RED')
                        .setTitle('Birthday Messages are already enabled for this guild!')
                    );
                }

                await KiramekiHelper.preparedQuery(kirCore.DB, 'DELETE FROM birthday_ignores WHERE guild_id = ?;', [message.channel.guild.id]);
                message.channel.createEmbed(new KiramekiHelper.Embed()
                    .setColor('GREEN')
                    .setTitle('Birthday Message Administration')
                    .setDescription(`Successfully enabled Birthday Messages for guild **${message.channel.guild.name}**!`)
                );

                KiramekiHelper.log(KiramekiHelper.LogLevel.COMMAND, 'BIRTHDAY IGNORE', `${KiramekiHelper.userLogCompiler(message.author)} just enabled Birthday Messages for guild ${message.channel.guild.name}`);
                break;
            }

            default: {
                return message.channel.createEmbed(KiramekiHelper.generateHelpEmbed(this.help));
            }
        }
    }
}

module.exports = new BirthdaySystemMuter();