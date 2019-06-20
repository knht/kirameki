const KiramekiHelper    = require('../../KiramekiHelper');

class OsuScoreScreensOCR {
    constructor() {
        this.name = 'osussocr';
        this.wsEvent = 'MESSAGE_CREATE';
    }

    async execute(message, kirCore) {
        if (message.channel.type != 0) return;
        if (message.author.bot) return;
        if (message.content.startsWith(kirCore.prefix)) return;
        if (message.content === kirCore.prefix) return;


    }
}   

module.exports = new OsuScoreScreensOCR();