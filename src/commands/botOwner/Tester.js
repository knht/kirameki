const KiramekiHelper    = require('../../KiramekiHelper');
const KiramekiConfig    = require('../../../config/KiramekiConfig');
const fetch             = require('node-fetch');

class Tester {
    constructor() {
        this.name = 'tester';
        this.owner = true;
    }

    async execute(message, kirCore) {
        const [command, args] = KiramekiHelper.tailedArgs(message.content, ' ', 1);

        if (message.mentions.length) {
            message.channel.createMessage("yes");
        } else {
            message.channel.createMessage("nope");
        }
    }
}

module.exports = new Tester();