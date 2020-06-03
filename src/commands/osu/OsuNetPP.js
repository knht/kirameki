const KiramekiHelper = require('../../KiramekiHelper');

class OsuNetPP {
    constructor() {
        this.name = 'weighed';
        this.aliases = ['osunetpp', 'osunet', 'net', 'netpp'];
        this.permissions = ['externalEmojis'];
        this.category = KiramekiHelper.categories.OSU;
        this.owner = false;
        this.nsfw = false;
        this.cooldown = 5;
        this.help = {
            message: 'Calculate the theoretical weighted PP in your Top 100 plays of a new top play. Using this command requires a Kirameki osu! Linkage!',
            usage: 'netpp <pp>',
            example: ['netpp 365', 'netpp 727'],
            inline: true
        }
    }

    async execute(message, kirCore) {
        const [command, pp] = KiramekiHelper.tailedArgs(message.content, ' ', 1);
        const userLinkage = await KiramekiHelper.getOsuUser(kirCore.DB, message.author.id);

        if (!pp || isNaN(pp)) return message.channel.createEmbed(KiramekiHelper.generateHelpEmbed(this.help));
        if (!userLinkage) return message.channel.createEmbed(KiramekiHelper.generateOsuLinkageEmbed('osu! Weighted PP'));

        if (Number(pp) > 2500 || Number(pp) <= 0) {
            return message.channel.createEmbed(new KiramekiHelper.Embed()
                .setColor('RED')
                .setTitle('Only positive PP values ranging from 0pp to 2500pp are supported!')
            );
        }

        message.channel.sendTyping();

        const osuUserBest = await kirCore.osu.raw('/get_user_best', { u: userLinkage.osu_id, m: 0, type: 'id', limit: 100 });
        const osuUserObject = await kirCore.osu.user.get(userLinkage.osu_id, 0, undefined, 'id');
        const bestPlays = osuUserBest.map((bestResultItem) => Number(bestResultItem.pp));
        const ppToCheck = Number(pp);

        let bestPlaysWeighted = [];

        for (let i = 0; i < bestPlays.length; i++) {
            bestPlaysWeighted.push(Number(bestPlays[i]) * Math.pow(0.95, i));
        }

        const bestPlaysWeightedSum = bestPlaysWeighted.reduce((a, b) => a + b, 0);
        const bonusPP = Number(osuUserObject.pp_raw) - bestPlaysWeightedSum;

        // Check if potential PP play would be outside of Top 100
        if (ppToCheck < bestPlays[bestPlays.length - 1]) {
            return message.channel.createEmbed(new KiramekiHelper.Embed()
                .setColor('OSU')
                .setThumbnail(KiramekiHelper.links.OSU.generateUserThumbnail(userLinkage.osu_id))
                .setAuthor('osu! Weighted PP', KiramekiHelper.images.OSU_LOGO)
                .setDescription(`A play worth **${ppToCheck}pp** wouldn't give any PP because it wouldn't be in your Top 100!`)
                .addField('Raw PP', `${pp}pp`, true)
                .addField('Weighted PP', '**0pp**', true)
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

        bestPlays.splice(spotInTop100, 0, ppToCheck);
        bestPlays.splice(-1, 1);

        const weightedBestPlaysSum = bestPlays.map((bpnw, index) => bpnw * Math.pow(0.95, index));
        const accountPPGain = (weightedBestPlaysSum.reduce((a, b) => a + b, 0) + bonusPP) - osuUserObject.pp_raw;

        // Derive weighted PP from raw PP based off of position (NET_PP *  0.95^n)
        const weightedPP = ppToCheck * Math.pow(0.95, spotInTop100);

        message.channel.createEmbed(new KiramekiHelper.Embed()
            .setColor('OSU')
            .setThumbnail(KiramekiHelper.links.OSU.generateUserThumbnail(userLinkage.osu_id))
            .setAuthor('osu! Weighted PP', KiramekiHelper.images.OSU_LOGO)
            .setDescription(`A play worth **${ppToCheck}pp** *(raw)* would give you **${weightedPP.toFixed(2)}pp** *(weighted)* and place **#${spotInTop100 + 1}** in your Top 100 giving you **+${accountPPGain.toFixed(2)}pp** total!\n\n[Go to ${userLinkage.osu_username}'s osu! Profile](https://osu.ppy.sh/users/${userLinkage.osu_id})`)
            .addField('Raw PP', `${ppToCheck.toFixed(2)}pp`, true)
            .addBlankField(true)
            .addField('Weighted PP', `**${weightedPP.toFixed(2)}pp**`, true)
            .addField('Spot in Top 100', `#${spotInTop100 + 1}`, true)
            .addBlankField(true)
            .addField('Total account PP gain', `**+${accountPPGain.toFixed(2)}pp**`, true)
        );

        KiramekiHelper.log(KiramekiHelper.LogLevel.COMMAND, 'osu! NET PP', `${KiramekiHelper.userLogCompiler(message.author)} used the ${this.name} command.`);
    }
}

module.exports = new OsuNetPP();