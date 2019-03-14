const KiramekiConfig    = require('../config/KiramekiConfig');
const chalk             = require('chalk');
const util              = require('util');
const fs                = require('fs');
const fetch             = require('node-fetch');
const Embed             = require('./extensions/Embed');
const ojsama            = require('ojsama');
const KiramekiImages    = require('./constants/Images');
const md5               = require('md5');

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

    sanitizeMarkdown(text) {
        return text
            .toLowerCase()
            .replace(/\*/g, '')
            .replace(/~/g, '')
            .replace(/-/g, '')
            .replace(/_/g, '')
            .replace(/\|/g, '');
    }

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

            const guildID       = message.guild.id;
            const guildName     = message.guild.name.replace(/[^\x00-\x7F]/g, "");
            const guildAvatar   = (message.guild.iconURL) ? message.guild.iconURL : this.images.DEFAULT_DISCORD;
            const memberIDs     = memberIDsWithLinkage.join(';');
            const hashedIDs     = md5(memberIDs);
            const guildLB       = await this.preparedQuery(kirAPI_DB, 'SELECT * FROM osu_leaderboards WHERE guild_id = ?;', [guildID]);

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

    numberWithCommas(x) {
        return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    }

    map_completion(beatmapData, totalHits) {
        var beatmapParser = new ojsama.parser();
        beatmapParser.feed(beatmapData);
        var beatmapMap = beatmapParser.map;

        var hitObjects = [];
        var hits = (totalHits == 0) ? parseInt(beatmapMap.objects.length) : parseInt(totalHits);
        var numObj = hits - 1;
        var num = parseInt(beatmapMap.objects.length);

        for (var i = 0; i < beatmapMap.objects.length; i++) {
            hitObjects.push(parseInt(beatmapMap.objects[i].time));
        }

        var timing = parseInt(hitObjects[num - 1]) - parseInt(hitObjects[0]);
        var point = parseInt(hitObjects[numObj]) - parseInt(hitObjects[0]);

        const mapCompletion = (point / timing) * 100;

        return mapCompletion;
    }

    async getOsuUser(kirAPI_DB, userId) {
        const result = await this.preparedQuery(kirAPI_DB, 'SELECT * FROM osu_discord_links WHERE discord_id = ? LIMIT 1;', [userId]);

        return (result) ? result[0] : [];
    }

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

    secToMin(s) {
        return (s - (s %= 60)) / 60 + (9 < s ? ':' : ':0') + s;
    }

    getOsuDiffIconDesc(diff) {
        var diffDesc = '';
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

    obtainLink(text) {
        return text.match(/\bhttps?:\/\/\S+/gi);
    }

    containsBeatmapLink(message) {
        return message.includes('osu.ppy.sh/b/') || message.includes('osu.ppy.sh/beatmapsets/');
    }

    getEmoji(kirCore, guildID, emojiName) {
        const emoji = kirCore.guilds.get(guildID).emojis.find(emoji => emoji.name == emojiName);

        return `<:${emoji.name}:${emoji.id}>`;
    }

    numberToMod(givenNumber) {
        const number = parseInt(givenNumber);
        let mod_list = [];

        if (number & 1 << 0) mod_list.push('NF');
        if (number & 1 << 1) mod_list.push('EZ');
        if (number & 1 << 3) mod_list.push('HD');
        if (number & 1 << 4) mod_list.push('HR');
        if (number & 1 << 5) mod_list.push('SD');
        if (number & 1 << 9) mod_list.push('NC');
        if (number & 1 << 6) mod_list.push('DT');
        if (number & 1 << 7) mod_list.push('RX');
        if (number & 1 << 8) mod_list.push('HT');
        if (number & 1 << 10) mod_list.push('FL');
        if (number & 1 << 12) mod_list.push('SO');
        if (number & 1 << 14) mod_list.push('PF');

        if (mod_list.includes('NC')) {
            let dtIndex = mod_list.indexOf('DT');

            if (dtIndex > -1) {
                mod_list.splice(dtIndex, 1);
            }
        }

        return mod_list;
    }

    addslashes(str) {
        str = str.replace(/\\/g, '\\\\');
        str = str.replace(/\'/g, '\\\'');
        str = str.replace(/\"/g, '\\"');
        str = str.replace(/\0/g, '\\0');
        return str;
    }

    async preparedQuery(database, userQuery, bindings) {
        const query = util.promisify(database.query).bind(database);
        const rows = await query(userQuery, bindings);

        return rows;
    }

    async query(database, userQuery) {
        const query = util.promisify(database.query).bind(database);
        const rows = await query(userQuery);

        return rows;
    }

    tailedArgs(string, delimeter, count) {
        const parts = string.split(delimeter);
        const tail = parts.slice(count).join(delimeter);
        const result = parts.slice(0, count);

        result.push(tail);

        return result;
    }

    getUserTag(user) {
        return `${user.username}#${user.discriminator}`;
    }

    userLogCompiler(user) {
        return `${user.username}#${user.discriminator} (${user.id})`;
    }

    checkIfOwner(id) {
        return id == KiramekiConfig.botOwner;
    }

    forcePad(number) {
        return (number < 10 ? '0' : '') + number;
    }

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