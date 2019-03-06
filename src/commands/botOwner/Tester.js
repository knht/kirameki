const KiramekiHelper = require('../../KiramekiHelper');
const KiramekiConfig = require('../../../config/KiramekiConfig');
const fetch             = require('node-fetch');

class Tester {
	constructor() {
        this.name = 'tester';
        this.owner = true;
	}

	async execute(message, kirCore) {
		const [command, args] = KiramekiHelper.tailedArgs(message.content, ' ', 1);
		
	}
}

module.exports = new Tester();