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
		
		message.channel.createEmbed(new KiramekiHelper.Embed().setColor("RED").setTitle("XDD").setDescription("XDDDdioasjdk")).catch(e => {
			message.channel.createMessage("beep boop");
		});
	}
}

module.exports = new Tester();