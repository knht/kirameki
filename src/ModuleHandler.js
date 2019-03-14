const KiramekiHelper = require('./KiramekiHelper');

class ModuleHandler {
    constructor(kirCore) {
        this.kirCore = kirCore;
        this.wsEvents = {
            READY: 0,
            MESSAGE_CREATE: 1,
            USER_UPDATE: 2,
            GUILD_CREATE: 3
        }
    }

    handle(message, modules, wsEvent, other) {
        switch(wsEvent) {
            case this.wsEvents.READY: {
                const readyModules = modules.filter(readyModule => readyModule.wsEvent === 'READY');
                      readyModules.forEach(rm => rm.execute(message, this.kirCore));
                break;
            }

            case this.wsEvents.MESSAGE_CREATE: {
                if (message.channel.type != 0) return;
                if (message.author.bot) return;
                if (message.content.startsWith(this.kirCore.prefix)) return;
                if (message.content == this.kirCore.prefix) return;

                const messageCreateModules = modules.filter(messageCreateModule => messageCreateModule.wsEvent === 'MESSAGE_CREATE');
                      messageCreateModules.forEach(mcm => mcm.execute(message, this.kirCore));
                break;
            }

            case this.wsEvents.GUILD_CREATE: {
                const guildCreateModules = modules.filter(guildCreateModule => guildCreateModule.wsEvent === 'GUILD_CREATE');
                      guildCreateModules.forEach(gcm => gcm.execute(other.guild, this.kirCore));
                break;
            }
        }
    }
}

module.exports = ModuleHandler;