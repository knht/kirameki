const KiramekiHelper = require('./KiramekiHelper');

class MessageHandler {
    constructor(kirCore) {
        this.kirCore = kirCore;
    }

    async handle(message, commands) {
        const commandArguments  = message.content.slice(this.kirCore.prefix.length).split(/ +/);
        const commandName       = commandArguments.shift().toLowerCase();
        const command           = commands.get(commandName) || commands.find(kirCommand => kirCommand.aliases && kirCommand.aliases.includes(commandName));

        if (!command) return;
        if (command.owner && !KiramekiHelper.checkIfOwner(message.author.id)) {
            return message.channel.sendEmbed({
                title: "Insufficient permissions!",
                color: 0xFF0000
            });
        }

        try {
            command.execute(message, this.kirCore);

            const doesCommandExist = await KiramekiHelper.preparedQuery(this.kirCore.DB, 'SELECT commandname FROM command_usage WHERE commandname = ?;', [commandName]);

            if (doesCommandExist.length > 0) {
                KiramekiHelper.preparedQuery(this.kirCore.DB, 'UPDATE command_usage SET commandcount = commandcount + 1 WHERE commandname = ?;', [commandName]);
            } else {
                KiramekiHelper.preparedQuery(this.kirCore.DB, 'INSERT INTO command_usage (id, commandname, commandcount) VALUES (NULL, ?, ?);', [commandName, 1]);
            }
        } catch (commandExecutionError) {
            KiramekiHelper.log(KiramekiHelper.LogLevel.ERROR, "COMMAND EXECUTION ERROR", `A command couldn't be executed because of: ${commandExecutionError}`);
        }
    }
}

module.exports = MessageHandler;