const KiramekiHelper = require('./KiramekiHelper');

class ModuleHandler {
    constructor(kirCore) {
        this.kirCore = kirCore;
        this.wsEvents = {
            READY: 0,
            MESSAGE_CREATE: 1,
            USER_UPDATE: 2,
            GUILD_CREATE: 3,
            MESSAGE_UPDATE: 4
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
                const messageCreateModules = modules.filter(messageCreateModule => messageCreateModule.wsEvent === 'MESSAGE_CREATE');
                      messageCreateModules.forEach(mcm => mcm.execute(message, this.kirCore));
                break;
            }

            case this.wsEvents.GUILD_CREATE: {
                const guildCreateModules = modules.filter(guildCreateModule => guildCreateModule.wsEvent === 'GUILD_CREATE');
                      guildCreateModules.forEach(gcm => gcm.execute(other.guild, this.kirCore));
                break;
            }

            case this.wsEvents.MESSAGE_UPDATE: {
                const messageUpdateModules = modules.filter(messageUpdateModule => messageUpdateModule.wsEvent === 'MESSAGE_UPDATE');
                      messageUpdateModules.forEach(mum => mum.execute(message, other.oldMessage, this.kirCore));
                break;
            }

            case this.wsEvents.USER_UPDATE: {
                const userUpdateModules = modules.filter(userUpdateModule => userUpdateModule.wsEvent === 'USER_UPDATE');
                      userUpdateModules.forEach(uum => uum.execute(other.newUser, this.kirCore));
                break;
            }
        }
    }
}

module.exports = ModuleHandler;