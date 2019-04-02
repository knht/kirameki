const KiramekiHelper = require('./KiramekiHelper');
const Eris           = require('eris');

class MessageHandler {
    constructor(kirCore) {
        this.kirCore = kirCore;
        this.cooldowns = new Eris.Collection();
        this.minimumPermissions = ['readMessages', 'sendMessages', 'embedLinks'];
    }

    /**
     * The main method which is running for each message received that's passed the initial filtration
     * @param {object} message The message object emitted from Discord 
     * @param {object} commands An Eris collection containing all loaded commands
     */
    async handle(message, commands) {
        const commandArguments  = message.content.slice(this.kirCore.prefix.length).split(/ +/);
        const commandName       = commandArguments.shift().toLowerCase();
        const command           = commands.get(commandName) || commands.find(kirCommand => kirCommand.aliases && kirCommand.aliases.includes(commandName));

        // Stop handling if no registered command was found
        if (!command) return;

        // Check if the bot has adequate permissions
        const pendingPermissions = (!command.permissions) ? this.minimumPermissions : this.minimumPermissions.concat(command.permissions);
        let missingPermissions = [];

        for (let i = 0; i < pendingPermissions.length; i++) {
            if (!message.channel.permissionsOf(this.kirCore.user.id).has(pendingPermissions[i])) {
                missingPermissions.push(pendingPermissions[i]);
            }
        }

        if (missingPermissions.length) {
            return message.channel.createMessage(`Can't run command **${command.name}** because I lack following permissions: **${missingPermissions.join(', ')}**`);
        }

        // Check if the user has adequate permissions
        const pendingUserPermissions = (!command.userPermissions) ? false : command.userPermissions;
        let missingUserPermissions = [];

        if (pendingUserPermissions) {
            for (let x = 0; x < pendingUserPermissions.length; x++) {
                if (!message.member.permission.has(pendingUserPermissions[x])) {
                    missingUserPermissions.push(pendingUserPermissions[x]);
                }
            }

            if (missingUserPermissions.length) {
                return message.channel.createEmbed(new KiramekiHelper.Embed()
                    .setColor("RED")
                    .setTitle("Insufficient Permissions!")
                    .setDescription(`You lack following permissions to use this command: **${missingUserPermissions.join(', ')}**`)
                );
            }
        } 

        // Check if the command is restricted to the bot owner 
        if (command.owner && !KiramekiHelper.checkIfOwner(message.author.id)) {
            return message.channel.createEmbed(new KiramekiHelper.Embed().setColor("RED").setTitle("Insufficient Permissions!"));
        }

        // Check if an NSFW command is only used in an NSFW channel
        if (command.nsfw && !message.channel.nsfw) {
            return message.channel.createEmbed(new KiramekiHelper.Embed().setColor("RED").setTitle(`Command **${command.name}** is only available in NSFW channels!`));
        }

        // Command cooldowns 
        if (!this.cooldowns.has(command.name)) {
            this.cooldowns.set(command.name, new Eris.Collection());
        }

        const now = Date.now();
        const timestamps = this.cooldowns.get(command.name);
        const cooldownAmount = (command.cooldown || 2) * 1000;

        if (timestamps.has(message.author.id)) {
            const expirationTime = timestamps.get(message.author.id) + cooldownAmount;

            if (now < expirationTime) {
                const timeLeft = (expirationTime - now) / 1000;

                return message.channel.createEmbed(new KiramekiHelper.Embed()
                    .setColor(0xFF9185)
                    .setTitle(`Please wait **${timeLeft.toFixed(1)}** seconds before using **${command.name}** again`)
                );
            }
        }

        timestamps.set(message.author.id, now);
        setTimeout(() => timestamps.delete(message.author.id), cooldownAmount);

        // Execute the command and register statistics in the database
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