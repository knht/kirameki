const KiramekiHelper = require('../../KiramekiHelper');

class OsuNetPP {
    constructor() {
        this.name = 'weighed';
        this.aliases = ['osunetpp', 'osunet', 'net', 'netpp'];
        this.permissions = ['externalEmojis'];
        this.category = KiramekiHelper.categories.OSU;
        this.owner = false;
        this.nsfw = false;
        this.cooldown = 3;
        this.help = {
            message: 'Calculate the theoretical weighed PP in your Top 100 plays of a new top play. Using this command requires a Kirameki osu! Linkage!',
            usage: 'netpp <pp>',
            example: ['netpp 365', 'netpp 727'],
            inline: true
        }
    }

    async execute(message, kirCore) {
        const [command, pp] = KiramekiHelper.tailedArgs(message.content, ' ', 1);
        const userLinkage = await KiramekiHelper.getOsuUser(kirCore.DB, message.author.id);

        if (!pp) return message.channel.createEmbed(KiramekiHelper.generateHelpEmbed(this.help));
        if (!userLinkage) return message.channel.createEmbed(KiramekiHelper.generateOsuLinkageEmbed('osu! Weighed PP'));

        message.channel.sendTyping();

        const osuUserBest = await kirCore.osu.raw('/get_user_best', { u: userLinkage.osu_id, m: 0, type: 'id', limit: 100 });
        const bestPlays = osuUserBest.map((bestResultItem) => Number(bestResultItem.pp));
        const ppToCheck = Number(pp);

        // Check if potential PP play would be outside of Top 100
        if (ppToCheck < bestPlays[bestPlays.length - 1]) {
            return message.channel.createEmbed(new KiramekiHelper.Embed()
                .setColor('OSU')
                .setThumbnail(KiramekiHelper.links.OSU.generateUserThumbnail(userLinkage.osu_id))
                .setAuthor('osu! Weighed PP', KiramekiHelper.images.OSU_LOGO)
                .setDescription(`A play worth **${ppToCheck}pp** wouldn't give any PP because it wouldn't be in your Top 100!`)
                .addField('Raw PP', `${pp}pp`, true)
                .addField('Weighed PP', '**0pp**', true)
                .addField('Spot in Top 100', '>100+', true)
            );
        }

        // Find spot in Top 100
        let spotInTop100 = -1;

        for (let i = 0; i < bestPlays.length; i++) {
            if (ppToCheck > bestPlays[0]) {
                spotInTop100 = 0;
                break;
            } else if (bestPlays[i] > ppToCheck && ppToCheck > bestPlays[i + 1]) {
                spotInTop100 = i + 1;
                break;
            } else if (bestPlays[i] === ppToCheck) {
                spotInTop100 = i;
            }
        }

        // Derive weighed PP from raw PP based off of position (NET_PP *  0.95^n)
        const weighedPP = ppToCheck * Math.pow(0.95, spotInTop100);

        message.channel.createEmbed(new KiramekiHelper.Embed()
            .setColor('OSU')
            .setThumbnail(KiramekiHelper.links.OSU.generateUserThumbnail(userLinkage.osu_id))
            .setAuthor('osu! Weighed PP', KiramekiHelper.images.OSU_LOGO)
            .setDescription(`A play worth **${ppToCheck}pp** *(raw)* would give you **${weighedPP.toFixed(2)}pp** *(weighed)* and place **#${spotInTop100 + 1}** in your Top 100!\n\n[Go to ${userLinkage.osu_username}'s osu! Profile](https://osu.ppy.sh/users/${userLinkage.osu_id})`)
            .addField('Raw PP', `${ppToCheck.toFixed(2)}pp`, true)
            .addField('Weighed PP', `**${weighedPP.toFixed(2)}pp**`, true)
            .addField('Spot in Top 100', `#${spotInTop100 + 1}`, true)
        );

        KiramekiHelper.log(KiramekiHelper.LogLevel.COMMAND, 'osu! NET PP', `${KiramekiHelper.userLogCompiler(message.author)} used the ${this.name} command.`);
    }
}

module.exports = new OsuNetPP();