const KiramekiHelper = require('../../KiramekiHelper');
const KiramekiConfig = require('../../../config/KiramekiConfig');

class OsuSetup {
	constructor() {
		this.name = 'osusetup';
        this.aliases = ['osulink'];
	}

	async execute(message, kirCore) {
		const [command, args] = KiramekiHelper.tailedArgs(message.content, ' ', 1);
        
        
	}
}

module.exports = new OsuSetup();