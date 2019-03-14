const KiramekiConfig    = require('./config/KiramekiConfig');
const KiramekiHelper    = require('./src/KiramekiHelper');
const MessageHandler    = require('./src/MessageHandler');
const ModuleHandler     = require('./src/ModuleHandler');
const Eris              = require('eris-additions')(require('eris'));
const mysql             = require('mysql');
const nodesu            = require('nodesu');
const read              = require('fs-readdir-recursive');

class Kirameki extends Eris.Client {
    constructor() {
        super(KiramekiConfig.token);
        this.eligibleForXp  = new Set();
        this.commands       = new Eris.Collection();
        this.modules        = new Eris.Collection();
        this.messageHandler = new MessageHandler(this);
        this.moduleHandler  = new ModuleHandler(this);
        this.osu            = new nodesu.Client(KiramekiConfig.osuApiKey);

        this.prefix         = KiramekiConfig.prefix;
        this.commandFiles   = read('./src/commands').filter(file => file.endsWith('.js'));
        this.moduleFiles    = read('./src/modules').filter(file => file.endsWith('.js'));
        this.DB             = mysql.createConnection(KiramekiConfig.mysqlOptions);

        this.DB.connect(this._initKiramekiDatabase);
        this._addEventListeners();
        this._addIntervals();
        this._registerKiramekiCommands();
        this._registerKiramekiModules();
        this._catchUnhandledRejections();
        this.connect();
    }

    _registerKiramekiModules() {
        for (const kiramekiModuleFile of this.moduleFiles) {
            const kiramekiModule = require(`./src/modules/${kiramekiModuleFile}`);
            this.modules.set(kiramekiModule.name, kiramekiModule);
        }
    }

    _registerKiramekiCommands() {
        for (const kiramekiCommandFile of this.commandFiles) {
            const kiramekiCommand = require(`./src/commands/${kiramekiCommandFile}`);
            this.commands.set(kiramekiCommand.name, kiramekiCommand);
        }
    }

    _catchUnhandledRejections() {
        /*process.on('unhandledRejection', (err, p) => {
            console.log('An unhandledRejection occurred');
            console.log(`Rejected Promise: ${p}`);
            console.log(`Rejection: ${err}`);
        });*/
    }

    _initKiramekiDatabase(connectionError) {
        if (connectionError) {
            KiramekiHelper.log(KiramekiHelper.LogLevel.ERROR, "DATABASE ERROR", `A connection error surfaced: ${connectionError}`);
        }

        KiramekiHelper.log(KiramekiHelper.LogLevel.EVENT, "DATABASE CONNECTION", "Successfully connected to the database!");
    }

    _addIntervals() {
        setInterval(async () => {
            try {
                const databaseHeartbeat = await KiramekiHelper.query(this.DB, "SELECT 1;");

                if (databaseHeartbeat) {
                    KiramekiHelper.log(KiramekiHelper.LogLevel.EVENT, "KIRAMEKI HEARTBEAT", "Queried the database to keep connection alive!");
                }
            } catch (kirDBError) {
                KiramekiHelper.log(KiramekiHelper.LogLevel.ERROR, "KIRAMEKI HEARTBEAT", `Querying the database failed because of ${kirDBError}!`);
            }
        }, 1800000);
    }

    async _checkBlacklistedGuild(guild) {
        const isBlacklisted = await KiramekiHelper.preparedQuery(this.DB, 'SELECT * FROM blacklisted_guild WHERE guild_id = ?;', [guild.id]);

        if (isBlacklisted.length > 0) {
            await this.leaveGuild(guild.id);
            KiramekiHelper.log(KiramekiHelper.LogLevel.EVENT, "BLACKLISTED GUILD", `Someone tried to make Kirameki join a blacklisted guild: ${guild.name} (${guild.id})`);
        }
    }

    async _updateKiramekiUsers(newUser, oldUser) {
        try {
            const userExists = await KiramekiHelper.preparedQuery(this.DB, "SELECT * FROM profile_xp WHERE discord_id = ?;", [newUser.id]);

            if (userExists.length < 1) return;

            await KiramekiHelper.preparedQuery(
				this.DB, 
				'UPDATE profile_xp SET discord_id = ?, discord_tag = ?, discord_avatar = ? WHERE discord_id = ?;',
				[newUser.id, KiramekiHelper.getUserTag(newUser), newUser.staticAvatarURL, newUser.id]
			);

            KiramekiHelper.log(KiramekiHelper.LogLevel.DEBUG, "USER UPDATE", `${KiramekiHelper.userLogCompiler(newUser)} updated their Discord profile. Changes have been synced to the database!`);
        } catch (updatingUsersError) {
            KiramekiHelper.log(KiramekiHelper.LogLevel.ERROR, "USER UPDATE ERROR", `The user update event was fired but the database update failed because of: ${updatingUsersError}`);
        }
    }

    _moduleListener(message, wsEvent) {
        try {
            this.moduleHandler.handle(message, this.modules, wsEvent);
        } catch (moduleListenerError) {
            KiramekiHelper.log(KiramekiHelper.LogLevel.ERROR, "MODULE LISTENER ERROR", `A module couldn't be processed because of: ${moduleListenerError}`);
        }
    }

    _messageListener(message) {
        try {
            if (message.channel.type != 0) return;
            if (message.author.bot) return;
            if (!message.content.startsWith(this.prefix)) return;
            if (message.content == this.prefix) return;

            this.messageHandler.handle(message, this.commands);
        } catch (messageListenerError) {
            KiramekiHelper.log(KiramekiHelper.LogLevel.ERROR, "MESSAGE LISTENER ERROR", `A message couldn't be processed because of: ${messageListenerError}`);
        }
    }

    _runMessageOperators(message) {
        this._messageListener(message);
        this._moduleListener(message, this.moduleHandler.wsEvents.MESSAGE_CREATE);
    }

    _runReadyOperators() {
        this._moduleListener(undefined, this.moduleHandler.wsEvents.READY);
    }

    _addEventListeners() {
        this.on('ready', this._runReadyOperators);
        this.on('messageCreate', this._runMessageOperators);
        this.on('guildCreate', this._checkBlacklistedGuild);
        this.on('userUpdate', this._updateKiramekiUsers);
    }
}

module.exports = new Kirameki();