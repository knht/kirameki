const KiramekiHelper = require('../../KiramekiHelper');
const uniqid = require('uniqid');

class SetWeather {
    constructor() {
        this.name = 'setweather';
        this.aliases = ['weathersetup', 'wset'];
        this.category = KiramekiHelper.categories.GENERAL;
        this.cooldown = 2;
        this.help = {
            message: 'Set your Weather location indefinitely for Kirameki to remember when using the Weather command.',
            usage: 'setweather <location>',
            example: ['setweather New York', 'setweather Takayama'],
            inline: false
        }
    }

    async execute(message, kirCore) {
        const [command, location] = KiramekiHelper.tailedArgs(message.content, ' ', 1);

        if (!location) {
            return message.channel.createEmbed(KiramekiHelper.generateHelpEmbed(this.help, this.help.inline));
        }

        try {
            const alreadyInserted = await KiramekiHelper.preparedQuery(kirCore.DB, 'SELECT * FROM weather_locations WHERE discord_id = ?;', [message.author.id]);

            if (alreadyInserted.length) {
                await KiramekiHelper.preparedQuery(kirCore.DB, 'UPDATE weather_locations SET location = ? WHERE discord_id = ?;', [location, message.author.id]);
            } else {
                await KiramekiHelper.preparedQuery(kirCore.DB, 'INSERT INTO weather_locations (id, discord_id, location) VALUES (NULL, ?, ?);', [message.author.id, location]);
            }

            message.channel.createEmbed(new KiramekiHelper.Embed()
                .setColor('GREEN')
                .setTitle(`Successfully updated your Weather Location to **${location}**!`)
            );
        } catch (databaseError) {
            const identifier = uniqid();

            message.channel.createEmbed(new KiramekiHelper.Embed()
                .setColor('RED')
                .setTitle('Something went wrong updating your Weather Location!')
                .setDescription(`If this problem persists please join the [Kirameki support server](${KiramekiHelper.links.INVITE}) and report this bug in the bug-report channel and provide following error code: **${identifier}**`)
            );

            return KiramekiHelper.log(KiramekiHelper.LogLevel.ERROR, 'SET WEATHER ERROR', `[ ${identifier} ] ${databaseError}`);
        }

        KiramekiHelper.log(KiramekiHelper.LogLevel.COMMAND, 'SET WEATHER', `${KiramekiHelper.userLogCompiler(message.author)} used the ${this.name} command.`);
    }
}

module.exports = new SetWeather();