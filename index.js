const KiramekiConfig    = require('./config/KiramekiConfig');
const KiramekiHelper    = require('./src/KiramekiHelper');
const MessageHandler    = require('./src/MessageHandler');
const Eris              = require('eris-additions')(require('eris'));
const fs                = require('fs');
const mysql             = require('mysql');
const nodesu            = require('nodesu');
const ojsama            = require("ojsama");
const read              = require('fs-readdir-recursive');

class Kirameki extends Eris.Client {
    constructor() {
        super(KiramekiConfig.token);
        this.eligibleForXp  = new Set();
        this.commands       = new Eris.Collection();
        this.messageHandler = new MessageHandler(this);
        this.osu            = new nodesu.Client(KiramekiConfig.osuApiKey);

        this.prefix         = KiramekiConfig.prefix;
        this.commandFiles   = read('./src/commands').filter(file => file.endsWith('.js'));
        this.DB             = mysql.createConnection(KiramekiConfig.mysqlOptions);

        this.DB.connect(this._initKiramekiDatabase);
        this._addEventListeners();
        this._addIntervals();
        this._registerKiramekiCommands();
        this._catchUnhandledRejections();
        this.connect();
    }

    _catchUnhandledRejections() {
        process.on('unhandledRejection', (err, p) => {
            console.log('An unhandledRejection occurred');
            console.log(`Rejected Promise: ${p}`);
            console.log(`Rejection: ${err}`);
        });
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

    _registerKiramekiCommands() {
        for (const kiramekiCommandFile of this.commandFiles) {
            const kiramekiCommand = require(`./src/commands/${kiramekiCommandFile}`);
            this.commands.set(kiramekiCommand.name, kiramekiCommand);
        }
    }

    _readyEmitter() {
        this.editStatus("online", { name: 'kirameki.one | &help' });
        KiramekiHelper.log(KiramekiHelper.LogLevel.EVENT, "STARTUP", "Kirameki was restarted successfully and is now ready!");
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

    async _beatmapFlashcards(message) {
        if (message.channel.type != 0) return;
        if (message.author.bot) return;
        if (message.content.startsWith(this.prefix)) return;
        if (message.content == this.prefix) return;

        try {
            const isEnabled = await KiramekiHelper.preparedQuery(this.DB, 'SELECT * FROM osu_bmlink_cards WHERE channel_id = ?;', [message.channel.id]);

            if (isEnabled.length < 1) return;
            if (!KiramekiHelper.containsBeatmapLink(message.content)) return;

            const beatmapID = KiramekiHelper.getBeatmapIDFromLink(message.content);
            const beatmapData = await this.osu.beatmaps.getByBeatmapId(beatmapID);

            if (beatmapData.length < 1) {
                return message.channel.createEmbed({
                    color: 0xF06DA8,
                    author: {
                        name: 'osu! Beatmap Data',
                        icon_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/Osulogo.png/286px-Osulogo.png'
                    },
                    description: "I have noticed that you linked an osu! Beatmap that hasn't been converted already to the new osu! Beatmap System. Please use the beatmap link of the new osu! Website for those few maps, which still need to be converted by the osu! Staff team."
                });
            }

            const beatmapSetID = beatmapData[0].beatmapset_id;
            const beatmapRender = `${beatmapData[0].artist} - ${beatmapData[0].title} [${beatmapData[0].version}]`;
            const difficultyIcon = KiramekiHelper.getEmoji(this, '333219713872297986', `yachty_osu_${KiramekiHelper.getOsuDiffIconDesc(parseFloat(beatmapData[0].difficultyrating))}`);
            const beatmapOsuFile = await KiramekiHelper.obtainAndCacheOsuFile(beatmapID);
            const beatmapParser = new ojsama.parser();

            beatmapParser.feed(beatmapOsuFile);

            const ppPossible    = ojsama.ppv2({ map: beatmapParser.map });
            const ppPossibleF   = ppPossible.toString().split(" ", 1)[0];
            
            message.channel.createEmbed({
                color: 0xF06DA8,
                author: {
                    name: 'osu! Beatmap Data',
                    icon_url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e3/Osulogo.png/286px-Osulogo.png'
                },
                thumbnail: {
                    url: `https://b.ppy.sh/thumb/${beatmapSetID}l.jpg?uts=${Math.floor(new Date() / 1000)}`
                },
                fields: [
                    {
                        name: 'Artist',
                        value: beatmapData[0].artist,
                        inline: true
                    },
                    {
                        name: 'Mapper',
                        value: beatmapData[0].creator,
                        inline: true
                    },
                    {
                        name: 'Max Combo',
                        value: beatmapData[0].max_combo,
                        inline: true
                    },
                    {
                        name: 'Max PP',
                        value: `**${ppPossibleF}pp** for 100%`,
                        inline: true
                    },
                    {
                        name: 'Beatmap Title & Difficulty',
                        value: `**${beatmapData[0].title} [${beatmapData[0].version}]**`,
                        inline: false
                    },
                    {
                        name: 'Beatmap Information',
                        value: `**${parseFloat(beatmapData[0].difficultyrating).toFixed(2)}**${difficultyIcon}Length: **${KiramekiHelper.secToMin(beatmapData[0].total_length)}**, AR: **${beatmapData[0].diff_approach}**, OD: **${beatmapData[0].diff_overall}**, CS: **${beatmapData[0].diff_size}**, BPM: **${beatmapData[0].bpm}**, HP: **${beatmapData[0].diff_drain}**`,
                        inline: false
                    },
                    {
                        name: 'Download Links',
                        value: `[osu! Direct](https://kirameki.one/api/osu/osuDirectDownload.php?osu_bms_id=${beatmapSetID})  •  [osu! Website](https://osu.ppy.sh/b/${beatmapID}?m=0)  •  [Bloodcat](https://bloodcat.com/osu/s/${beatmapSetID})`,
                        inline: false
                    }
                ],
                footer: {
                    text: `osu! Beatmap has been posted by: ${message.author.username}`,
                    icon_url: message.author.staticAvatarURL
                }
            });

            const mapObject = {
                mods: 0,
                beatmap_id: beatmapData[0].beatmap_id,
                pp: ppPossibleF,
                beatmapset_id: beatmapData[0].beatmapset_id,
                beatmap_artist: beatmapData[0].artist,
                beatmap_title: beatmapData[0].title,
                beatmap_difficulty: beatmapData[0].version,
                beatmap_length: beatmapData[0].total_length,
                beatmap_bpm: beatmapData[0].bpm,
                beatmap_stars: parseFloat(beatmapData[0].difficultyrating).toFixed(2)
            };
        
            KiramekiHelper.updateOsuBeatmaps(this.DB, mapObject);
            KiramekiHelper.updateLastOsuRecentBMID(this.DB, message.author.id, beatmapID, message.channel.id);
            KiramekiHelper.log(KiramekiHelper.LogLevel.EVENT, "osu! BMFC", `${KiramekiHelper.userLogCompiler(message.author)} used the Beatmap Flashcards module!`);
        } catch (osuBMFCError) {
            KiramekiHelper.log(KiramekiHelper.LogLevel.ERROR, "osu! BMFC ERROR", `Rendering a beatmap flashcard failed because of: ${osuBMFCError.sta}`);
        }
    }

    _runMessageOperators(message) {
        this._messageListener(message);
        this._beatmapFlashcards(message);
    }

    _addEventListeners() {
        this.on('ready', this._readyEmitter);
        this.on('messageCreate', this._runMessageOperators);
        this.on('guildCreate', this._checkBlacklistedGuild);
        this.on('userUpdate', this._updateKiramekiUsers);
    }
}

module.exports = new Kirameki();