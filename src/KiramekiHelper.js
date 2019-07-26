const KiramekiConfig = require('../config/KiramekiConfig');
const KiramekiLinks = require('./constants/Links');
const KiramekiCategories = require('./constants/Categories');
const KiramekiLogLevels = require('./constants/LogLevels');
const KiramekiEmojis = require('./constants/Emojis');
const KiramekiOther = require('./constants/Other');
const KiramekiReactionHandler = require('./extensions/ReactionHandler');
const KiramekiPaginationEmbed = require('./extensions/PaginationEmbed');
const KiramekiImages = require('./constants/Images');
const chalk = require('chalk');
const fs = require('fs');
const fetch = require('node-fetch');
const Embed = require('./extensions/Embed');
const ojsama = require('./extensions/OjsamaPlus');
const md5 = require('md5');
const Taihou = require('taihou');
const ud = require('urban');
const cheerio = require('cheerio');
const axios = require('axios');
const tesseract = require('node-tesseract');

/**
 * Helper class for Kirameki.
 */
class KiramekiHelper {
    constructor() {
        this.Embed = Embed;
        this.images = KiramekiImages;
        this.links = KiramekiLinks;
        this.emojis = KiramekiEmojis;
        this.other = KiramekiOther;
        this.LogLevel = KiramekiLogLevels;
        this.categories = KiramekiCategories;
        this.reactionHandler = KiramekiReactionHandler;
        this.PaginationEmbed = KiramekiPaginationEmbed;
        this.weebSH = new Taihou(KiramekiConfig.weebSHApiKey, true, { userAgent: KiramekiConfig.userAgent });
    }

    /**
     * OwOify any given text
     * @param {string} text The text that should be owoified
     * @returns {string} The owoified text 
     */
    owoify(text) {
        const suffixes = ['(*^ω^)', '(◕‿◕✿)', '(◕ᴥ◕)', 'ʕ•ᴥ•ʔ', 'ʕ￫ᴥ￩ʔ', '(*^.^*)', 'owo', 'OwO', '(｡♥‿♥｡)', 'uwu', 'UwU', '(*￣з￣)', '>w<', '^w^', '(つ✧ω✧)つ', '(/ =ω=)/'];

        text = text.replace(/(?:l|r)/g, 'w');
        text = text.replace(/(?:L|R)/g, 'W');
        text = text.replace(/n([aeiou])/g, 'ny$1');
        text = text.replace(/N([aeiou])/g, 'Ny$1');
        text = text.replace(/N([AEIOU])/g, 'Ny$1');
        text = text.replace(/ove/g, 'uv');
        text = text.replace(/!+/g, ` ${this.getRandomElementFromArray(suffixes)} `);

        return text;
    }

    /**
     * Turns a beatmap result object from the Kirameki database into a neatly organized array
     * @param {object} beatmapQuery Kirameki database beatmap results object
     * @returns {Array<string>} An array containg all provided beatmaps formatted nicely for Rich Embeds
     */
    formatOsuSearchResults(beatmapQuery) {
        let beatmaps = [];
        let sanitizedBeatmaps = [];
        
        for (let i = 0; i < beatmapQuery.length; i++) {
            beatmaps.push(`\`${i + 1}.\` ${beatmapQuery[i].beatmap_artist} - ${beatmapQuery[i].beatmap_title} [${beatmapQuery[i].beatmap_difficulty}]`)
        }

        for (let beatmap of beatmaps) {
            if (beatmap.length > 75) {
                sanitizedBeatmaps.push(`${beatmap.substring(0, 35)}**...**${beatmap.substring(beatmap.length - 35)}`);
            } else {
                sanitizedBeatmaps.push(beatmap);
            }
        }

        return sanitizedBeatmaps;
    }

    /**
     * Calculate the accuracy of a score in osu! Standard
     * @param {object} resultObject A score result object from the osu! API
     * @returns {string} The calculated accuracy with two decimal points 
     */
    calculateOsuAccuracy(resultObject) {
        return (((
            (parseInt(resultObject.count300)  * 300) +
            (parseInt(resultObject.count100)  * 100) +
            (parseInt(resultObject.count50)   * 50)  +
            (parseInt(resultObject.countmiss) * 0))  /
            ((
                parseInt(resultObject.count300) +
                parseInt(resultObject.count100) +
                parseInt(resultObject.count50)  +
                parseInt(resultObject.countmiss)
            ) * 300)) * 100).toFixed(2);
    }

    /**
     * Generate a user not found information Embed for osu! commands and modules
     * @param {string} moduleName Which osu! Module this Embed should be generated for
     * @returns {object} A finished user not found Rich Embed
     */
    generateOsuUserNotFoundEmbed(moduleName, username) {
        return new this.Embed()
            .setColor(0xF06DA8)
            .setAuthor(moduleName, this.images.OSU_LOGO)
            .setDescription(
                `***We couldn't find the user you were looking for. (${username})***\n\n` +
                `There are a few possible reasons for this:\n\n` +
                `*• They may have changed their username.*\n` +
                `*• The account may be temporarily unavailable.*\n` +
                `*• You may have made a typo!*` 
            )
            .setThumbnail(this.images.OSU_PIPPI_SAD)
    }

    /**
     * Generate a linkage information Embed for osu! commands and modules
     * @param {string} moduleName Which osu! Module this Embed should be generated for
     * @returns {object} A finished linkage help Rich Embed
     */
    generateOsuLinkageEmbed(moduleName) {
        return new this.Embed()
            .setColor(0xF06DA8)
            .setAuthor(moduleName, this.images.OSU_LOGO)
            .setDescription(
                `You haven't provided an osu! username. Please link your osu! account with your Discord account or provide a username when using this command!\n\n` +
                `**Usage:** \`${KiramekiConfig.prefix}osusetup <osuName>\`\n\n**Example:** \`${KiramekiConfig.prefix}osusetup Riya\``
            );
    }

    /**
     * Scan an image for its text using node-tesseract.
     * IMPORTANT: Kirameki (in production) uses a custom trained OCR LSTM module for better reliability. This module isn't part of this reposity and is private. 
     * @param {string} image An image path 
     * @returns {Promise<string>} A string containing the scanned image.
     */
    asyncTesseract(image) {
        return new Promise((resolve, reject) => {
            tesseract.process(image, (error, text) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(text);
                    fs.unlink(image, (error) => {
                        if (error) {
                            this.log(this.LogLevel.ERROR, 'FS UNLINK ERROR', `Couldn't unlink the OCR image because of: ${error}`);
                        }
                    });
                }
            });
        });
    }

    /**
     * Scan a message's content for an osu! screenshot
     * @param {string} message A message's content to check an osu! screenshot link for 
     */
    hasValidOsuScreenshot(message) {
        const osuRegex = new RegExp(/https:\/\/osu\.ppy\.sh\/ss\/[1-9]\d*/gi);
        return osuRegex.test(message);
    }

    /**
     * Convert a Unix epoch time stamp into a readable time of day
     * @param {string} timestamp A Unix epoch time stamp
     * @returns {string} A readable time of day
     */
    convertTimeStamp(timestamp) {
        let d = new Date(timestamp * 1000),
            yyyy = d.getFullYear(),
            mm = ('0' + (d.getMonth() + 1)).slice(-2),
            dd = ('0' + d.getDate()).slice(-2),
            hh = d.getHours(),
            h = hh,
            min = ('0' + d.getMinutes()).slice(-2),
            ampm = 'AM',
            time;

        if (hh > 12) {
            h = hh - 12;
            ampm = 'PM';
        } else if (hh === 12) {
            h = 12;
            ampm = 'PM';
        } else if (hh === 0) {
            h = 12;
        }

        time = `${h}:${min} ${ampm}`;

        return time;
    }

    /**
     * Get a random element from an array
     * @param {Array} elements An array of which a random element should be picked out of
     * @returns {any} A random element from the given array 
     */
    getRandomElementFromArray(elements) {
        return elements[Math.floor(Math.random() * elements.length)];
    }

    /**
     * Scrape Bing images for a given search query and NSFW filter
     * @param {string} query A search query 
     * @param {boolean} nsfw Whether the search should include NSFW images or not
     * @returns {Promise<string[]>} An array containing all fetched images
     */
    async scrapeBingImages(query, nsfw) {
        const sanitizedQuery = query.trim();
        const url = `http://www.bing.com/images/search?q=${encodeURIComponent(sanitizedQuery)}&view=detailv2&adlt=${(nsfw) ? 'off' : 'moderate'}`;
        const responseBody = await axios.get(url);
        const $ = cheerio.load(responseBody.data);
        
        let results = [];

        $('.item a[class="thumb"]').each(function(element) {
            const item = $(this).attr('href');
            results.push(item);
        });

        return results;
    }

    /**
     * Trim a Wikipedia description body to an adequate reading length for Discord's Rich Embed
     * @param {string} description A Wikipedia result set description
     * @param {string} name A valid Wikipedia definition keyword name 
     * @param {string} language A language in which the Wikipedia article should be displayed in
     * @returns {string} A sanitized and trimmed Wikipedia description body
     */
    trimWikipediaDescription(description, name, language) {
        return (description.length > 950) 
            ? `${description.substring(0, 950)}... [Read more](https://${language}.wikipedia.org/wiki/${name.replace(/ /g, '_')})` 
            : description;
    }

    /**
     * Filter out unwanted symbols from Urban Dictionary definitions picked up during parsing
     * @param {string} definition A passed Urban Dictionary definition
     * @returns {string} A sanitized and trimmed Urban Dictionary definition body 
     */
    sanitizeUrbanDefinition(definition) {
        const trimmed = (definition.length > 950) ? `${definition.substring(0, 950)}...` : definition;
        const slashed = trimmed.replace(/[\[\]']+/g, '');

        return slashed;
    }

    /**
     * Search Urban Dictionary by a provided query
     * @param {string} query A search query to search Urban Dictionary for
     * @returns {Promise} A promise resolving with the fetched data from Urban Dictionary
     */
    getUrbanDefinition(query) {
        return new Promise((resolve) => {
            const udFetcher = ud(query);
            
            udFetcher.first((data) => {
                resolve(data);
            });
        });
    }
    
    /**
     * Capitalize the first letter in a string
     * @param {string} text A string of which the first letter should be capitalized  
     * @returns {string} The originally passed string with its first letter capitalized
     */
    capitalize(text) {
        return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
    }

    /**
     * Manually reset the cooldown of a command for a specific user (e.g. in case the command wasn't fully executed yet).
     * @param {Eris.Collection} cooldowns Nested command cooldowns 
     * @param {string} commandName The name of the command for which the cooldown of the user should be reset
     * @param {string} userID The user ID of the user whose command cooldown should be reset
     */
    resetCommandCooldown(cooldowns, commandName, userID) {
        cooldowns.get(commandName).delete(userID);
    }

    /**
     * Abbreviate any number with appropriate units
     * @param {number} number A number that should get abbreviated 
     * @returns {string} The abbreviation of a given number
     */
    abbreviateNumber(number) {
        const tier = Math.log10(number) / 3 | 0;

        if (tier === 0) {
            return number;
        }

        const suffix = this.other.MATH_ADDITIONS.SI_SYMBOLS[tier];
        const scale  = Math.pow(10, tier * 3);
        const scaled = number / scale;
        
        return scaled.toFixed(1).replace(/\.0$/, '') + suffix;
    }

    /**
     * Check whether an image URL ends on an image suffix
     * @param {string} url A URL that should be checked
     * @returns {boolean} True if it's a valid image URL 
     */
    isValidImageURL(url) {
        return url.match(/\.(jpeg|jpg|gif|png)$/) != null;
    }

    /**
     * Render text on a canvas context with added line wrapping.
     * @param {object} context A 2d Canvas context
     * @param {string} text The text to be rendered on the canvas
     * @param {number} x The x coordinate
     * @param {number} y The y coordinate
     * @param {number} maxWidth The max width in pixels the text should be allowed to take up
     * @param {number} lineHeight The line height of the text
     */
    wrapCanvasText(context, text, x, y, maxWidth, lineHeight) {
        let words = text.split(' ');
        let line = '';

        for (let i = 0; i < words.length; i++) {
            let testLine = line + words[i] + ' ';
            let metrics = context.measureText(testLine);
            let testWidth = metrics.width;

            if (testWidth > maxWidth && i > 0) {
                context.fillText(line, x, y);
                line = words[i] + ' ';
                y += lineHeight;
            } else {
                line = testLine;
            }
        }

        context.fillText(line, x, y);
    }

    /**
     * Get a random image from the weeb.sh Toph image API
     * @async
     * @param {string} category The weeb.sh image category to fetch from
     * @returns {object} A weeb.sh image result
     */
    async getRandomAnimeImage(category) {
        return await this.weebSH.toph.getRandomImage(category);
    }

    /**
     * Obtain the first user mentioned from a message
     * @param {object} message A message emitted from the Discord API
     * @returns {object|false} The mentioned user or false if no user was mentioned
     */
    getFirstMention(message) {
        return (message.mentions.length) ? message.mentions[0] : false;
    }

    /**
     * Send an embed and delete it automatically after a set amount of time
     * @async
     * @param {object} message A message object emitted from the Discord API 
     * @param {KiramekiHelper#Embed} embed A new Kirameki Embed
     * @param {number} time A number in seconds when to delete the message
     */
    async createFlashEmbed(message, time, embed) {
        const createdMessage = await message.channel.createEmbed(embed);

        setTimeout(() => {
            createdMessage.delete();
        }, time * 1000);
    }

    /**
     * Generate a help embed for command help
     * @param {object} helpObject A help object whith information about the command
     * @param {string} helpObject.message A brief description about the command
     * @param {string} helpObject.usage A clear usage of the command
     * @param {string} helpObject.example A simple example of the command
     * @param {boolean} inline Whether the usage and example fields should be inline or not
     * @returns {object} A finished help Rich Embed
     */
    generateHelpEmbed(helpObject, inline = false) {
        let helpArray = [];
        let exampleText = '';

        if (Array.isArray(helpObject.example)) {
            helpArray = helpObject.example.map(helpItem => `\`${KiramekiConfig.prefix}${helpItem}\``);
            exampleText = helpArray.join(', ');
        } else {
            exampleText = `\`${KiramekiConfig.prefix}${helpObject.example}\``;
        }

        const helpEmbed = new this.Embed()
            .setAuthor("Kirameki Help", this.images.KIRAMEKI_MASCOT)
            .setColor("DEFAULT")
            .setDescription(helpObject.message)
            .addField("Usage", `\`${KiramekiConfig.prefix}${helpObject.usage}\``, inline)
            .addField(Array.isArray(helpObject.example) ? 'Examples' : 'Example', `${exampleText}`, inline);

        return helpEmbed;
    }

    /**
     * Generate a random hex color ready to plug in anywhere hexadecimal colors are supported
     * @returns {string} Random color in hex
     */
    getRandomColor() {
        return '#' + (Math.random() * 0xFFFFFF << 0).toString(16);
    }

    /**
     * Retrieve the latest registered beatmap ID of a channel
     * @async
     * @param {object} kirCore The main bot instance
     * @param {string} channelId A Discord channel ID snowflake
     */
    async getLatestBMID(kirAPI_DB, channelId) {
        const result = await this.preparedQuery(kirAPI_DB, 'SELECT * FROM osu_recents WHERE channel_id = ? ORDER BY id DESC LIMIT 1;', [channelId]);

        return (!result.length) ? -1 : result[0].beatmap_id;
    }

    /**
     * Convert a mod string into mod bitflag numbers
     * @param {string} str A string to be parsed for osu! mods
     * @returns {number} The converted modbit
     */
    modToNumbers(str) {
        let modMask         = 0;
        let sanitizedString = str.toLowerCase();
        let modBits         = {
            nomod: 0,
            nf: 1 << 0,
            ez: 1 << 1,
            td: 1 << 2,
            hd: 1 << 3,
            hr: 1 << 4,
            dt: 1 << 6,
            ht: 1 << 8,
            nc: 1 << 9,
            fl: 1 << 10,
            so: 1 << 12
        };

        while (sanitizedString) {
            let nChars = 1;

            for (let property in modBits) {
                if (property.length != 2) {
                    continue;
                }

                if (!modBits.hasOwnProperty(property)) {
                    continue;
                }

                if (sanitizedString.startsWith(property)) {
                    modMask |= modBits[property];
                    nChars = 2;
                    break;
                }
            }

            sanitizedString = sanitizedString.slice(nChars);
        }

        return modMask;
    }

    /**
     * Calculate the beatmap strain with customizable mods.
     * @param {string} beatmapData A .osu beatmap metadata file's content 
     * @param {number} mods Map modifiers. MUST BE A NUMBER!!
     */
    getBeatmapStrain(beatmapData, mods) {
        let speedStrain     = [];
        let aimStrain       = [];
        let totalStrain     = [];
        let strainTimings   = [];
        let seekingPoint    = 0;

        let beatmapParser   = new ojsama.parser();
            beatmapParser.feed(beatmapData);

        const parsedBeatmap = beatmapParser.map;
        const beatmapStars  = new ojsama.diff().calc({ map: parsedBeatmap, mods: mods });

        while (seekingPoint <= beatmapStars.objects[parsedBeatmap.objects.length - 1].obj.time) {
            let window = [];

            beatmapStars.objects.forEach(singleObject => {
                if (singleObject.obj.time >= seekingPoint && singleObject.obj.time <= seekingPoint + 3000) {
                    window.push(singleObject.strains);
                }
            });

            let windowSpeed = [];
            let windowAim   = [];
            let windowTotal = [];

            window.forEach(singleStrain => {
                windowSpeed.push(singleStrain[0]);
                windowAim.push(singleStrain[1]);
                windowTotal.push(singleStrain.reduce((a, b) => { return a + b; }, 0));
            });

            speedStrain.push(windowSpeed.reduce((a, b) => { return a + b; }, 0) / Math.max(window.length, 1));
            aimStrain.push(windowAim.reduce((a, b) => { return a + b; }, 0) / Math.max(window.length, 1));
            totalStrain.push(windowTotal.reduce((a, b) => { return a + b; }, 0) / Math.max(window.length, 1));
            strainTimings.push(seekingPoint);

            seekingPoint += 500;
        }

        return { speed: speedStrain, aim: aimStrain, total: totalStrain, timing: strainTimings, map: parsedBeatmap};
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

            fs.writeFile(osuFile, result, (err) => {
                if (err) {
                    this.log(this.LogLevel.ERROR, 'osu! BEATMAP CACHE ERROR', `Caching a new osu! Beatmap file failed because of: ${err}`);
                }

                this.log(this.LogLevel.EVENT, 'osu! BEATMAP CACHE', 'Successfully cached a new osu! Beatmap file!');
            });

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
            diffDesc = 'EASY';
        } else if (diffSanitized >= 1.51 && diffSanitized <= 2.25) {
            diffDesc = 'NORMAL';
        } else if (diffSanitized >= 2.26 && diffSanitized <= 3.75) {
            diffDesc = 'HARD';
        } else if (diffSanitized >= 3.76 && diffSanitized <= 5.25) {
            diffDesc = 'INSANE';
        } else if (diffSanitized >= 5.26 && diffSanitized <= 6.75) {
            diffDesc = 'EXPERT';
        } else if (diffSanitized >= 6.76) {
            diffDesc = 'EXPERT_PLUS';
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
    preparedQuery(database, userQuery, bindings) {
        return new Promise((resolve, reject) => {
            database.query(userQuery, bindings, (error, results, field) => {
                if (error) {
                    reject(error);
                }

                resolve(results);
            });
        });
    }

    /**
     * Utility method to promisify the regular mysql driver which originally uses callbacks
     * @async
     * @param {object} database A Kirameki database instance
     * @param {string} userQuery A raw SQL query to be executed
     * @returns {Promise} The found rows after doing the query asynchronously
     */
    query(database, userQuery) {
        return new Promise((resolve, reject) => {
            database.query(userQuery, (error, results, field) => {
                if (error) {
                    reject(error);
                }

                resolve(results);
            });
        });
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