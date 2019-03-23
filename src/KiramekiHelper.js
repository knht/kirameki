const KiramekiConfig = require('../config/KiramekiConfig');
const chalk = require('chalk');
const util = require('util');
const fs = require('fs');
const fetch = require('node-fetch');
const Embed = require('./extensions/Embed');
const ojsama = require('ojsama');
const KiramekiImages = require('./constants/Images');
const md5 = require('md5');

/**
 * Helper class for Kirameki.
 */
class KiramekiHelper {
    constructor() {
        this.Embed = Embed;
        this.images = KiramekiImages;
        this.LogLevel = {
            EVENT: 0,
            COMMAND: 1,
            ERROR: 2,
            DEBUG: 3
        };
    }

    /**
     * Get a random number from a set interval
     * @param {number} min Starting point 
     * @param {number} max Ending point
     * @returns {number} A random number from a given interval
     */
    randomIntFromInterval(min, max) {
        return parseInt(Math.floor(Math.random() * (max - min + 1) + min));
    }

    /**
     * Removes any markdown characters from a given string 
     * @param {string} text Text to be sanitized
     * @returns {string} Markdown-free text 
     */
    sanitizeMarkdown(text) {
        return text
            .toLowerCase()
            .replace(/\*/g, '')
            .replace(/~/g, '')
            .replace(/-/g, '')
            .replace(/_/g, '')
            .replace(/\|/g, '');
    }

    /**
     * Update the osu! Leaderboard for the guild part of the message object
     * @async
     * @param {object} kirAPI_DB The Kirameki Database instance 
     * @param {object} message The message object emitted from the Discord API 
     */
    async updateOsuLeaderboards(kirAPI_DB, message) {
        try {
            const osuDiscordLinks = await this.query(kirAPI_DB, 'SELECT * FROM osu_discord_links;');

            // Fetch all guild members
            message.guild.fetchAllMembers();

            let memberIDsWithLinkage = [];

            for (let i = 0; i < osuDiscordLinks.length; i++) {
                let guildMemberID = message.guild.members.find(member => member.id == osuDiscordLinks[i].discord_id);

                if (guildMemberID) memberIDsWithLinkage.push(guildMemberID.id);
            }

            const guildID = message.guild.id;
            const guildName = message.guild.name.replace(/[^\x00-\x7F]/g, "");
            const guildAvatar = (message.guild.iconURL) ? message.guild.iconURL : this.images.DEFAULT_DISCORD;
            const memberIDs = memberIDsWithLinkage.join(';');
            const hashedIDs = md5(memberIDs);
            const guildLB = await this.preparedQuery(kirAPI_DB, 'SELECT * FROM osu_leaderboards WHERE guild_id = ?;', [guildID]);

            // Check if the guild already has a leaderboard
            if (guildLB.length > 0) {
                // Guild already has a leaderboard, update their members and guild data
                this.preparedQuery(
                    kirAPI_DB,
                    'UPDATE `osu_leaderboards` SET `osu_ids` = ?, `osu_ids_hash` = ?, `guild_name` = ?, `guild_avatar` = ? WHERE `osu_leaderboards`.`guild_id` = ?;',
                    [memberIDs, hashedIDs, guildName, guildAvatar, guildID]
                );
            } else {
                // Guild has no leaderboard yet, create one
                this.preparedQuery(
                    kirAPI_DB,
                    'INSERT IGNORE INTO `osu_leaderboards` (`id`, `guild_id`, `guild_name`, `guild_avatar`, `osu_ids`, `osu_ids_hash`) VALUES (NULL, ?, ?, ?, ?, ?);',
                    [guildID, guildName, guildAvatar, memberIDs, hashedIDs]
                );
            }
        } catch (osuLeaderboardUpdateError) {
            this.log(this.LogLevel.ERROR, 'osu! LEADERBOARD UPDATE ERROR', `Updating the osu! leaderboards failed because of: ${osuLeaderboardUpdateError}`);
        }
    }

    /**
     * Takes a number and returns a string with separating commas for thousands
     * @param {number} x The number to format 
     * @returns {string} The formatted number with commas
     */
    numberWithCommas(x) {
        return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    }

    /**
     * Calculates how far a map was completed during a recent run 
     * @param {string} beatmapData An .osu beatmap metadata file content 
     * @param {number} totalHits The total amount of hits a player has made throughout the play
     * @returns {number} The map completion in percent 
     */
    getMapCompletion(beatmapData, totalHits) {
        let beatmapParser = new ojsama.parser();
            beatmapParser.feed(beatmapData);

        let parsedBeatmap       = beatmapParser.map;
        let beatmapHitObjects   = [];
        let parsedHits          = (!totalHits) ? parseInt(parsedBeatmap.objects.length) : parseInt(totalHits);
        let generalCount        = parseInt(parsedBeatmap.objects.length);

        parsedBeatmap.objects.forEach(singleObject => beatmapHitObjects.push(parseInt(singleObject.time)));

        const hitTiming     = parseInt(beatmapHitObjects[generalCount - 1]) - parseInt(beatmapHitObjects[0]);
        const hitPoint      = parseInt(beatmapHitObjects[parsedHits - 1]) - parseInt(beatmapHitObjects[0]);

        return (hitPoint / hitTiming) * 100;
    }

    /**
     * Retrieves an osu! Discord link user from the database
     * @async
     * @param {object} kirAPI_DB The Kirameki Database instance
     * @param {number} userId A Discord user ID snowflake
     * @returns {Promise} The resolved user or an empty array if none was found
     */
    async getOsuUser(kirAPI_DB, userId) {
        const result = await this.preparedQuery(kirAPI_DB, 'SELECT * FROM osu_discord_links WHERE discord_id = ? LIMIT 1;', [userId]);

        return (result) ? result[0] : [];
    }

    /**
     * Update an osu! user profile in the internal database
     * @async
     * @param {object} kirAPI_DB The Kirameki Database instance
     * @param {*} userObject An osu! user object from the osu!api
     */
    async updateOsuUser(kirAPI_DB, userObject) {
        const osuUsername = userObject.username;
        const osuUserID = userObject.user_id;
        const osuUserExists = await this.preparedQuery(kirAPI_DB, 'SELECT * FROM osu_accounts WHERE user_id = ?;', [userObject.user_id]);

        if (osuUserExists.length > 0) {
            try {
                this.preparedQuery(
                    kirAPI_DB,
                    'UPDATE `osu_accounts` SET `username` = ?, `country` = ?, `pp_raw` = ?, `pp_rank` = ?, `accuracy` = ?, `playcount` = ?, `score_ss` = ?, `score_s` = ?, `score_a` = ?, `last_update` = ? WHERE `osu_accounts`.`user_id` = ?',
                    [osuUsername, userObject.country, userObject.pp_raw, userObject.pp_rank, userObject.accuracy, userObject.playcount, parseInt(userObject.count_rank_ss) + parseInt(userObject.count_rank_ssh), parseInt(userObject.count_rank_s) + parseInt(userObject.count_rank_sh), userObject.count_rank_a, new Date().toISOString(), userObject.user_id]
                );
            } catch (osuUserUpdateError) {
                this.log(this.LogLevel.ERROR, "osu! UPDATE USER ERROR", `Couldn't update osu! user because of following MySQL Error: ${chalk.bold(osuUserUpdateError)}`);
            }
        } else {
            try {
                this.preparedQuery(
                    kirAPI_DB,
                    'INSERT INTO `osu_accounts` (`id`, `user_id`, `username`, `country`, `pp_raw`, `pp_rank`, `accuracy`, `playcount`, `score_ss`, `score_s`, `score_a`, `last_update`) VALUES (NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);',
                    [osuUserID, osuUsername, userObject.country, userObject.pp_raw, userObject.pp_rank, userObject.accuracy, userObject.playcount, parseInt(userObject.count_rank_ss) + parseInt(userObject.count_rank_ssh), parseInt(userObject.count_rank_s) + parseInt(userObject.count_rank_sh), userObject.count_rank_a, new Date().toISOString()]
                );
            } catch (osuUserInsertionError) {
                this.log(this.LogLevel.ERROR, "osu! INSERT USER ERROR", `Couldn't insert osu! user because of following MySQL Error: ${chalk.bold(osuUserInsertionError)}`);
            }
        }
    }

    /**
     * Saves the last checked beatmap ID in the database for later use e.g. comparing scores
     * @async
     * @param {object} kirAPI_DB The Kirameki Database instance
     * @param {string} messageAuthorID An original author's ID as a Discord snowflake 
     * @param {number} beatmapID A beatmap ID to be inserted into the database
     * @param {string} messageChannelID A message channel ID as a Discord snowflake
     */
    async updateLastOsuRecentBMID(kirAPI_DB, messageAuthorID, beatmapID, messageChannelID) {
        try {
            const usedInChannel = await this.preparedQuery(kirAPI_DB, 'SELECT * FROM osu_recents WHERE channel_id = ? ORDER BY ID DESC LIMIT 1;', [messageChannelID]);

            if (usedInChannel.length > 0) {
                await this.preparedQuery(kirAPI_DB, "UPDATE `osu_recents` SET `discord_id` = ?, `beatmap_id` = ?, `channel_id` = ? WHERE `osu_recents`.`id` = ?;", [messageAuthorID, beatmapID, messageChannelID, usedInChannel[0].id]);
            } else {
                await this.preparedQuery(kirAPI_DB, "INSERT INTO `osu_recents` (`id`, `discord_id`, `beatmap_id`, `channel_id`) VALUES (NULL, ?, ?, ?);", [messageAuthorID, beatmapID, messageChannelID]);
            }
        } catch (lastBMIDError) {
            this.log(this.LogLevel.ERROR, "BEATMAP ID UPDATE ERROR", `Updating the beatmap id failed because of: ${error}`);
        }
    }

    /**
     * Update the Kirameki beatmap database for fast internal lookups to be able to reduce the amount of (relatively slow) osu!api calls
     * @async
     * @param {object} kirAPI_DB The Kirameki Database instance
     * @param {object} mapObject An object containing all vital beatmap information for insertion 
     */
    async updateOsuBeatmaps(kirAPI_DB, mapObject) {
        try {
            const mapAlreadyExists = await this.preparedQuery(kirAPI_DB, 'SELECT * FROM osu_beatmaps_vt WHERE beatmap_id = ? AND mods = ? and beatmapset_id = ?;', [mapObject.beatmap_id, mapObject.mods, mapObject.beatmapset_id]);

            if (mapAlreadyExists.length > 0) {
                return;
            } else {
                await this.preparedQuery(
                    kirAPI_DB,
                    'INSERT INTO osu_beatmaps_vt (id, mods, beatmap_id, pp, beatmapset_id, beatmap_artist, beatmap_title, beatmap_difficulty, beatmap_length, beatmap_bpm, beatmap_stars) VALUES (NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);',
                    [
                        mapObject.mods,
                        mapObject.beatmap_id,
                        mapObject.pp,
                        mapObject.beatmapset_id,
                        mapObject.beatmap_artist,
                        mapObject.beatmap_title,
                        mapObject.beatmap_difficulty,
                        mapObject.beatmap_length,
                        mapObject.beatmap_bpm,
                        mapObject.beatmap_stars
                    ]
                );
            }
        } catch (error) {
            this.log(this.LogLevel.ERROR, "BEATMAP CACHE UPDATE ERROR", `Updating the beatmap cache failed because of: ${error}`);
        }
    }

    /**
     * Get an .osu beatmap file's metadata content needed for custom PP calculations.
     * If a beatmap file already exists it's read from cache for super fast lookups.
     * If it isn't cached yet, the file gets retrieved from the osu!api and then cached for further use.
     * @async
     * @param {number} beatmapID An osu! beatmap ID
     * @returns {string} A beatmap's metadata 
     */
    async obtainAndCacheOsuFile(beatmapID) {
        const osuFile = `${__dirname}/../beatmaps/${beatmapID}.osu`;

        if (fs.existsSync(osuFile)) {
            const result = fs.readFileSync(osuFile, 'utf8');

            return result;
        } else {
            const beatmapFetch = await fetch(`https://osu.ppy.sh/osu/${beatmapID}`);
            const result = await beatmapFetch.text();

            fs.writeFileSync(osuFile, result);

            return result;
        }
    }

    /**
     * Convert seconds to minutes
     * @param {number} s A number representating seconds
     * @returns {string} A minute representation in the style of mm:ss
     */
    secToMin(s) {
        return (s - (s %= 60)) / 60 + (9 < s ? ':' : ':0') + s;
    }

    /**
     * Parse a beatmap's difficulty to a simple textual representation
     * @param {number} diff A beatmap's difficulty rating
     * @returns {string} An internal textual representation of the difficulty needed for embed emojis. 
     */
    getOsuDiffIconDesc(diff) {
        let diffDesc = '';
        const diffSanitized = parseFloat(diff);

        if (diffSanitized > 0 && diffSanitized <= 1.5) {
            diffDesc = 'easy';
        } else if (diffSanitized >= 1.51 && diffSanitized <= 2.25) {
            diffDesc = 'normal';
        } else if (diffSanitized >= 2.26 && diffSanitized <= 3.75) {
            diffDesc = 'hard';
        } else if (diffSanitized >= 3.76 && diffSanitized <= 5.25) {
            diffDesc = 'insane';
        } else if (diffSanitized >= 5.26 && diffSanitized <= 6.75) {
            diffDesc = 'expert';
        } else if (diffSanitized >= 6.76) {
            diffDesc = 'expertplus';
        } else {
            diffDesc = 'invalid';
        }

        return diffDesc;
    }

    /**
     * Retrieve the beatmap ID from an osu! beatmap URL supporting both the old and new website
     * @param {string} link A potential osu! beatmap URL 
     * @returns {string} A beatmap ID
     */
    getBeatmapIDFromLink(link) {
        const parsedLink = this.obtainLink(link)[0];

        if (parsedLink.includes('#osu')) {
            const splitLink = parsedLink.split('/');

            return splitLink[splitLink.length - 1];
        } else {
            const splitLink = parsedLink.split('/');

            if (splitLink[splitLink.length - 1].includes('?')) {
                return splitLink[splitLink.length - 1].split('?')[0];
            } else {
                return splitLink[splitLink.length - 1];
            }
        }
    }

    /**
     * Obtains all links from a string
     * @param {string} text A string to search for links in
     * @returns {string[]|null} An array of all URLs found in a string or null if none were found  
     */
    obtainLink(text) {
        return text.match(/\bhttps?:\/\/\S+/gi);
    }

    /**
     * Check if a message possibly contains an osu! beatmap link
     * @param {string} message A Discord message's content
     * @returns {boolean} True if it is an osu! beatmap link 
     */
    containsBeatmapLink(message) {
        return message.includes('osu.ppy.sh/b/') || message.includes('osu.ppy.sh/beatmapsets/');
    }

    /**
     * Find an emoji on a specified guild for immediate use with proper emoji formatting
     * @param {object} kirCore The main bot instance 
     * @param {string} guildID A Discord guild ID snowflake 
     * @param {string} emojiName An emoji name to search for on the guild
     * @returns {string} Ready to input formatted emoji string 
     */
    getEmoji(kirCore, guildID, emojiName) {
        const emoji = kirCore.guilds.get(guildID).emojis.find(emoji => emoji.name == emojiName);

        return `<:${emoji.name}:${emoji.id}>`;
    }

    /**
     * Parse osu! mod bitflags to actual text with easy bit shifting operations.
     * NOTE: If Nightcore as a mod was picked, this automatically also includes Double Time. This implementation removes Double Time from the modList if Nightcore was picked.
     * @param {number|string} givenNumber A bitflag representation of applied game mods
     * @returns {string[]} An array with each mod in its shorthand syntax (e.g. "HR" for Hard Rock) 
     */
    numberToMod(givenNumber) {
        const number = parseInt(givenNumber);
        let modList = [];

        if (number & 1 << 0) modList.push('NF');
        if (number & 1 << 1) modList.push('EZ');
        if (number & 1 << 3) modList.push('HD');
        if (number & 1 << 4) modList.push('HR');
        if (number & 1 << 5) modList.push('SD');
        if (number & 1 << 9) modList.push('NC');
        if (number & 1 << 6) modList.push('DT');
        if (number & 1 << 7) modList.push('RX');
        if (number & 1 << 8) modList.push('HT');
        if (number & 1 << 10) modList.push('FL');
        if (number & 1 << 12) modList.push('SO');
        if (number & 1 << 14) modList.push('PF');

        if (modList.includes('NC')) {
            let dtIndex = modList.indexOf('DT');

            if (dtIndex > -1) {
                modList.splice(dtIndex, 1);
            }
        }

        return modList;
    }

    /**
     * Adds basic slash escaping for raw database insertions 
     * @param {string} str A string which needs to be escaped
     * @returns {string} The escaped string
     */
    addslashes(str) {
        str = str.replace(/\\/g, '\\\\');
        str = str.replace(/\'/g, '\\\'');
        str = str.replace(/\"/g, '\\"');
        str = str.replace(/\0/g, '\\0');

        return str;
    }

    /**
     * Utility method to promisify the regular mysql driver with bindings which originally uses callbacks
     * @async
     * @param {object} database A Kirameki database instance
     * @param {string} userQuery A raw SQL query to be executed
     * @param {string[]} bindings All associated bindings
     * @returns {Promise} The found rows after doing the query asynchronously
     */
    async preparedQuery(database, userQuery, bindings) {
        const query = util.promisify(database.query).bind(database);
        const rows = await query(userQuery, bindings);

        return rows;
    }

    /**
     * Utility method to promisify the regular mysql driver which originally uses callbacks
     * @async
     * @param {object} database A Kirameki database instance
     * @param {string} userQuery A raw SQL query to be executed
     * @returns {Promise} The found rows after doing the query asynchronously
     */
    async query(database, userQuery) {
        const query = util.promisify(database.query).bind(database);
        const rows = await query(userQuery);

        return rows;
    }

    /**
     * Simple argument handler for getting tailed arguments with custom length and delimeters
     * @param {string} string A string to be used 
     * @param {string} delimeter A delimeter to split a text by 
     * @param {number} count How often a string should be split by the delimeter before merging the contents
     * @returns {string[]} An array of all collected arguments
     */
    tailedArgs(string, delimeter, count) {
        const parts = string.split(delimeter);
        const tail = parts.slice(count).join(delimeter);
        const result = parts.slice(0, count);

        result.push(tail);

        return result;
    }

    /**
     * A simple utility method to retrieve a user's Discord tag
     * @param {object} user An Eris#User object
     * @returns {string} The user's tag (Username#Discriminator)
     */
    getUserTag(user) {
        return `${user.username}#${user.discriminator}`;
    }

    /**
     * A simple utility method to get a custom user log description
     * @param {object} user An Eris#User object
     * @returns {string} A ready to log user description  
     */
    userLogCompiler(user) {
        return `${this.getUserTag(user)} (${user.id})`;
    }

    /**
     * Check if a passed ID is the same as the predefined owner ID
     * @param {string} id A Discord user ID snowflake
     * @returns {boolean} True if the passed ID is equal to the bot's owner pre-configured in the config file
     */
    checkIfOwner(id) {
        return id == KiramekiConfig.botOwner;
    }

    /**
     * Pads a single digit number accordingly with 0's to align perfectly in logs
     * @param {number} number A number which should be force padded
     * @returns {string} A padded number 
     */
    forcePad(number) {
        return (number < 10 ? '0' : '') + number;
    }

    /**
     * Get the system's current time in days, months, years, hours, minutes & seconds
     * @returns {string} The system's current time
     */
    currentTime() {
        const now = new Date();
        const day = this.forcePad(now.getDate());
        const month = this.forcePad(now.getMonth() + 1);
        const year = this.forcePad(now.getFullYear());
        const hour = this.forcePad(now.getHours());
        const minute = this.forcePad(now.getMinutes());
        const second = this.forcePad(now.getSeconds());

        return `${day}.${month}.${year} ${hour}:${minute}:${second}`;
    }

    /**
     * Simple but effective custom logger with custom loglevels and corresponding colors
     * @param {number} level A KiramekiHelper#LogLevel for categorization of the log
     * @param {string} label A label or "heading" for a log entry
     * @param {string} text A string which should be logged as the main log's message
     */
    log(level, label, text) {
        if (level === 0) {
            console.log(chalk.yellow.bold(`[ ${this.currentTime()} ] [ ${label} ] `) + text);
        } else if (level === 1) {
            console.log(chalk.green.bold(`[ ${this.currentTime()} ] [ ${label} ] `) + text);
        } else if (level === 2) {
            console.log(chalk.red.bold(`[ ${this.currentTime()} ] [ ${label} ] `) + text);
        } else if (level === 3) {
            if (!KiramekiConfig.debug) return;
            console.log(chalk.magenta.bold(`[ ${this.currentTime()} ] [ ${label} ] `) + text);
        }
    }
}

module.exports = new KiramekiHelper();