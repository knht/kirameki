const KiramekiHelper = require('../../KiramekiHelper');

class CustomCommandMessageHandler {
    constructor() {
        this.name = 'customcommandmessagehandler';
        this.wsEvent = 'MESSAGE_CREATE';
    }

    async execute(message, kirCore) {
        try {
            if (message.channel.type !== 0) return;
            if (message.author.bot) return;
            
            const isMuted = await KiramekiHelper.preparedQuery(kirCore.DB, 'SELECT * FROM mute WHERE discord_id = ? AND guild_id = ?;', [message.author.id, message.channel.guild.id]);

            if (isMuted.length > 0) return await message.delete();
            if (!message.content.startsWith(kirCore.prefix)) return;
            if (message.content === kirCore.prefix) return;

            const commandArguments   = message.content.slice(kirCore.prefix.length).split(/ +/);
            const commandName        = commandArguments.shift().toLowerCase();
            const nativeCommand      = kirCore.commands.get(commandName) || kirCore.commands.find(kirCommand => kirCommand.aliases && kirCommand.aliases.includes(commandName));

            if (nativeCommand) return;

            const customGuildCommand = await KiramekiHelper.preparedQuery(kirCore.DB, 'SELECT * FROM custom_commands WHERE guild_id = ? AND command_name = ?;', [message.channel.guild.id, commandName.toLowerCase()]);

            if (!customGuildCommand.length) return;

            message.channel.createMessage(customGuildCommand[0].command_value);
        } catch (messageListenerError) {
            KiramekiHelper.log(KiramekiHelper.LogLevel.ERROR, 'MESSAGE LISTENER ERROR', `A message couldn't be processed because of: ${messageListenerError}`);
        }
    }
}

module.exports = new CustomCommandMessageHandler();