const KiramekiHelper = require('../../KiramekiHelper');

class Eval {
	constructor() {
        this.category = KiramekiHelper.categories.OWNER;
		this.name = 'eval';
        this.owner = true;
    }
    
    sanitize(text) {
        if (typeof(text) === "string") {
            return text.replace(/`/g, "`" + String.fromCharCode(8203)).replace(/@/g, "@" + String.fromCharCode(8203));
        } else {
            return text;
        }
    }

	async execute(message, kirCore) {
        const [command, args] = KiramekiHelper.tailedArgs(message.content, ' ', 1);
        
        try {
            let evaled = await eval(args);

            if (typeof evaled !== "string") {
                evaled = require('util').inspect(evaled);
            }

            message.channel.createCode(this.sanitize(evaled), "js");
        } catch (evalError) {
            message.channel.createCode(this.sanitize(evalError), "js");
        }
	}
}

module.exports = new Eval();