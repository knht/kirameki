const KiramekiHelper = require('../../KiramekiHelper');
const juration = require('juration');

class WeebPat {
    constructor() {
        this.name = 'pat';
        this.category = KiramekiHelper.categories.ANIME;
        this.help = {
            message: 'Pat someone who\'s dear to you every 3 hours! Pats are getting counted and are displayed on the recipient\'s profile card publicly for anyone to see.',
            usage: 'pat <target>',
            example: 'pat @Riya#0001',
            inline: true
        }
    }

    async execute(message, kirCore) {
        const [command, target] = KiramekiHelper.tailedArgs(message.content, ' ', 1);
        const options = ['thoroughly', 'lovely', 'delicately', 'delightfully', 'gracefully', 'pleasingly', 'passionately'];
        const adverb = options[Math.floor(Math.random() * options.length)];
        
        if (!target) {
            return message.channel.createEmbed(new KiramekiHelper.Embed()
                .setColor('RED')
                .setTitle('Please specify a user you want to pat (｡･ω･｡)ﾉ♡')
            );
        }

        const userToPat = KiramekiHelper.getFirstMention(message) || message.channel.guild.members.find(member => member.username.toLowerCase() === target.toLowerCase());

        // Check if either a user was mentioned or found by text based search
        if (!userToPat) {
            return message.channel.createEmbed(new KiramekiHelper.Embed()
                .setColor('RED')
                .setTitle('I couldn\'t find the user you want to pat  (︶ω︶)')
            );
        }

        // Check if the author wants to selftag
        if (userToPat.id === message.author.id) {
            return message.channel.createEmbed(new KiramekiHelper.Embed()
                .setColor('RED')
                .setTitle('You can\'t pat yourself, B..Baka!  (︶ω︶)')
            );
        }

        // Check if the target is Kirameki
        if (userToPat.id === kirCore.user.id) {
            return message.channel.createEmbed(new KiramekiHelper.Embed()
                .setColor('RED')
                .setTitle('I..I don\'t want to get patted! Thanks ( •⌄• ू )✧')
            );
        }

        const caster = await KiramekiHelper.preparedQuery(kirCore.DB, 'SELECT * FROM profile_xp WHERE discord_id = ?;', [message.author.id]);

        // Check if the user has a Kirameki account already
        if (!caster.length) {
            return message.channel.createEmbed(new KiramekiHelper.Embed()
                .setColor('DEFAULT')
                .setTitle('Please write a few words before using this command again ( •⌄• ू )✧')
            );
        }

        const result = await KiramekiHelper.getRandomAnimeImage('pat');
        const time = Math.floor(Date.now() / 1000);
        const timeFrame = 10800;
        const difference = parseInt(time) - parseInt(caster[0].last_pat);

        if (difference < timeFrame) {
            const cooldownPeriodStringified = juration.stringify(timeFrame - difference, { format: 'long' });

            return message.channel.createEmbed(new KiramekiHelper.Embed()
                .setColor('RED')
                .setTitle(`You can pat in ${cooldownPeriodStringified} again (｡･ω･｡)ﾉ♡`)
            );
        }

        await KiramekiHelper.preparedQuery(kirCore.DB, 'UPDATE profile_xp SET pats = pats + 1 WHERE discord_id = ?;', [userToPat.id]);
        await KiramekiHelper.preparedQuery(kirCore.DB, 'UPDATE profile_xp SET last_pat = ? WHERE discord_id = ?;', [time, message.author.id]);

        message.channel.createEmbed(new KiramekiHelper.Embed()
            .setColor(KiramekiHelper.getRandomColor())
            .setDescription(`**${message.author.username}** pats **${userToPat.mention}** ${adverb} (｡･ω･｡)ﾉ♡`)
            .setImage(result.url)
            .setFooter(`You can check how many pats you have with the ${kirCore.prefix}profile command!`)
        );

        KiramekiHelper.log(KiramekiHelper.LogLevel.COMMAND, 'WEEB PAT', `${KiramekiHelper.userLogCompiler(message.author)} used the pat command.`);
    }
}

module.exports = new WeebPat();