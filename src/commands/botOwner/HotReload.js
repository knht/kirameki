const KiramekiHelper = require('../../KiramekiHelper');
const KiramekiConfig = require('../../../config/KiramekiConfig');
const chalk = require('chalk');

class HotReload {
	constructor() {
		this.category = KiramekiHelper.categories.OWNER;
		this.name = 'reload';
		this.owner = true;
		this.permissions = ['manageMessages'];
	}

	async execute(message, kirCore) {
		const [command, args] = KiramekiHelper.tailedArgs(message.content, ' ', 1);
		
		if (!args) return message.channel.createEmbed(new KiramekiHelper.Embed().setColor("RED").setTitle("Please specify a command!"));

		try {
			delete require.cache[require.resolve(`./../${args}.js`)];

			const commandProp = require(`./../${args}.js`);

			kirCore.commands.delete(commandProp.name);
			kirCore.commands.set(commandProp.name, commandProp);

			message.channel.createEmbed(new KiramekiHelper.Embed().setColor("GREEN").setTitle(`Successfully reloaded command file **${args}!**`));
			message.delete();
			KiramekiHelper.log(KiramekiHelper.LogLevel.COMMAND, "HOT RELOAD", `${KiramekiHelper.userLogCompiler(message.author)} hot reloaded the ${chalk.bold(args)} file!`);
		} catch (hotReloadException) {
			KiramekiHelper.log(KiramekiHelper.LogLevel.ERROR, "HOT RELOAD ERROR", "Hot reloading a command failed because of: " + hotReloadException);
		}
	}
}

module.exports = new HotReload();