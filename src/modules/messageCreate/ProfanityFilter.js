const KiramekiHelper = require('../../KiramekiHelper');

class ProfanityFilter {
    constructor() {
        this.name = 'profanityfilterMC';
        this.wsEvent = 'MESSAGE_CREATE';
    }

    async execute(message, kirCore) {
        const wordExists        = await KiramekiHelper.preparedQuery(kirCore.DB, 'SELECT * FROM word_blacklist WHERE guild_id = ?;', [message.guild.id]);
        const sanitizedContent  = KiramekiHelper.sanitizeMarkdown(message.content);

        if (wordExists.length > 0) {
            for (let i = 0; i < wordExists.length; i++) {
                if (sanitizedContent.includes(wordExists[i].word.toLowerCase())) {
                    return message.delete();
                }
            }
        }
    }
}

module.exports = new ProfanityFilter();