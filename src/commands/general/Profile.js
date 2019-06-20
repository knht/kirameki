const KiramekiHelper = require('../../KiramekiHelper');
const uniqid = require('uniqid');
const Canvas = require('canvas');

class Profile {
    constructor() {
        this.category = KiramekiHelper.categories.GENERAL;
        this.name = 'profile';
        this.aliases = ['level', 'lvl'];
        this.permissions = ['attachFiles'];
        this.cooldown = 15;
        this.help = {
            message: 'Generate a customizable profile card for the Birthday system',
            usage: 'profile',
            example: 'profile',
            inline: true
        }
    }

    /**
     * Main method getting executed upon command trigger
     * @param {object} message Message object emitted from the Discord API
     * @param {object} kirCore Kirameki instance 
     */
    async execute(message, kirCore, cooldowns) {
        const [command, target] = KiramekiHelper.tailedArgs(message.content, ' ', 1);
        let profileCardUser;

        if (target) {
            if (message.mentions.length) {
                profileCardUser = message.mentions[0];
            } else {
                profileCardUser = message.author;
            }
        } else {
            profileCardUser = message.author;
        }

        if (profileCardUser.bot) {
            KiramekiHelper.resetCommandCooldown(cooldowns, this.name, message.author.id);
            return message.channel.createEmbed(new KiramekiHelper.Embed()
                .setColor('RED')
                .setTitle('Bots don\'t have profile cards!')
            );
        }

        // Register all needed fonts
        Canvas.registerFont(__dirname + '/../../../fonts/ARIAL.TTF', { family: 'Arial' });
        Canvas.registerFont(__dirname + '/../../../fonts/ARIALBD.TTF', { family: 'Arial Bold' });
        Canvas.registerFont(__dirname + '/../../../fonts/ExoRegular.ttf', { family: 'Exo' });

        // Indicate loading
        message.channel.sendTyping();

        // Create canvas and its context
        const canvas = Canvas.createCanvas(400, 170);
        const ctx = canvas.getContext('2d');
        const userObject = await KiramekiHelper.preparedQuery(kirCore.DB, 'SELECT *, ( SELECT COUNT(*) FROM profile_xp AS x WHERE xp > profile_xp.xp ) + 1 AS `rank` FROM profile_xp WHERE discord_id = ?;', [profileCardUser.id]);
        const isGuruObject = await KiramekiHelper.preparedQuery(kirCore.DB, 'SELECT * FROM gurus WHERE discord_id = ? LIMIT 1;', [profileCardUser.id]);
        const isPeacekeeper = await KiramekiHelper.preparedQuery(kirCore.DB, 'SELECT * FROM peacekeepers WHERE discord_id = ? LIMIT 1;', [profileCardUser.id]);

        // If the user never has spoken before abort
        if (!userObject.length) {
            return message.channel.createEmbed(new KiramekiHelper.Embed()
                .setColor("RED")
                .setTitle("Profile Card")
                .setDescription(
                    `This is the very first time Kirameki has ever noticed ${(profileCardUser === message.author) ? 'your' : profileCardUser.username + '\'s'} presence. ` + 
                    `Please bear in mind one has to write at least once a regular message to have a new profile card generated!`
                )
            );
        }

        try {
            // Profile card data
            const bgImg                     = await Canvas.loadImage(userObject[0].bg_img);
            const avatar                    = await Canvas.loadImage(profileCardUser.dynamicAvatarURL('jpg', 128));
            const dbLevel                   = userObject[0].level;
            const dbXP                      = userObject[0].xp;
            const dbLevelMinPoints          = 0.01 * (Math.pow((dbLevel * 100), 2));
            const dbLevelNextLevelPoints    = 0.01 * (Math.pow(((dbLevel + 1) * 100), 2));
            const xpNeededForLevelUp        = dbLevelNextLevelPoints - dbLevelMinPoints;
            const currentXPToBeginWith      = dbXP - dbLevelMinPoints;
            const levelPercentageComplete   = Math.floor((currentXPToBeginWith / xpNeededForLevelUp) * 100);
            const scorebarWidth             = levelPercentageComplete * 2.8;
            const leaderboardRank           = userObject[0].rank;

            // Background Fill
            ctx.fillStyle = '#2d2d37';
            ctx.fillRect(0, 0, 400, 170);

            // Background Image
            ctx.drawImage(bgImg, 0, 0, 400, 105);

            // Background Image Overlay
            ctx.fillStyle = 'rgba(9, 9, 9, .5)';
            ctx.fillRect(0, 0, 400, 105);

            // Username
            ctx.font = '16px Arial';
            ctx.fillStyle = '#FFFFFF';
            ctx.fillText(profileCardUser.username, 136, 95);
            const usernameLength = ctx.measureText(profileCardUser.username).width;

            // Usertag
            ctx.font = '10px Exo';
            ctx.fillStyle = '#FFFFFF';
            ctx.fillText('#' + profileCardUser.discriminator, 136 + usernameLength, 95);

            // Levelbar Background
            ctx.fillStyle = "rgba(132, 132, 132, .4)";
            ctx.fillRect(120, 105, 280, 2);

            // Levelbar
            ctx.fillStyle = "#" + userObject[0].accent_color;
            ctx.fillRect(120, 105, scorebarWidth, 2);

            // Levelbar Text Now
            ctx.font = 'bold 9px Arial Bold';
            ctx.textAlign = 'right';
            ctx.fillStyle = '#FFFFFF';
            ctx.fillText(currentXPToBeginWith, 392 - ctx.measureText(' / ' + xpNeededForLevelUp + ' XP').width, 100);

            // Levelbar Text Needed
            ctx.font = '9px Arial';
            ctx.textAlign = 'right';
            ctx.fillStyle = '#FFFFFF';
            ctx.fillText(' / ' + xpNeededForLevelUp + ' XP', 392, 100);

            // Rank Label
            ctx.font = '10px Exo';
            ctx.textAlign = 'center';
            ctx.fillStyle = '#' + userObject[0].accent_color;
            ctx.fillText('RANK', 150, 133);

            // Rank Text
            ctx.font = '16px Exo';
            ctx.textAlign = 'center';
            ctx.fillStyle = '#FFFFFF';
            ctx.fillText(KiramekiHelper.abbreviateNumber(leaderboardRank), 150, 152);

            // Age Label
            ctx.font = "10px Exo";
            ctx.textAlign = 'center';
            ctx.fillStyle = '#' + userObject[0].accent_color;
            ctx.fillText('AGE', 210, 133);

            // Age Text
            ctx.font = "16px Exo";
            ctx.textAlign = 'center';
            ctx.fillStyle = '#FFFFFF';
            ctx.fillText(dbLevel, 210, 152);

            // Pats Label
            ctx.font = "10px Exo";
            ctx.textAlign = 'center';
            ctx.fillStyle = '#' + userObject[0].accent_color;
            ctx.fillText('PATS', 270, 133);

            // Pats Text
            ctx.font = "16px Exo";
            ctx.textAlign = 'center';
            ctx.fillStyle = '#FFFFFF';
            ctx.fillText(userObject[0].pats, 270, 152);

            // Guru Icon
            if (isGuruObject.length) {
                const guruBadge = await Canvas.loadImage(KiramekiHelper.images.PROFILE_CARD.GURU_BADGE);

                ctx.drawImage(guruBadge, 340, 123, 20, 20);
                ctx.font = "9px Exo";
                ctx.textAlign = 'center';
                ctx.fillStyle = '#FFFFFF';
                ctx.fillText('GURU', 350, 155);
            }

            // Peacekeeper Icon
            if (isPeacekeeper.length) {
                const peaceBadge = await Canvas.loadImage(KiramekiHelper.images.PROFILE_CARD.PEACEKEEPER_BADGE);

                ctx.drawImage(peaceBadge, 340, 123, 20, 20);
                ctx.font = "9px Exo";
                ctx.textAlign = 'center';
                ctx.fillStyle = '#FFFFFF';
                ctx.fillText('PEACEKEEPER', 350, 155);
            }

            // Bot Owner Icon
            if (KiramekiHelper.checkIfOwner(profileCardUser.id)) {
                const ownerBadge = await Canvas.loadImage(KiramekiHelper.images.PROFILE_CARD.OWNER_BADGE);

                ctx.drawImage(ownerBadge, 343, 126, 16, 12);
                ctx.font = "9px Exo";
                ctx.textAlign = 'center';
                ctx.fillStyle = '#FFFFFF';
                ctx.fillText('CREATOR', 350, 151);
            }

            // 100k XP Badge
            if (dbXP >= 100000) {
                if (!isGuruObject.length > 0 && !isPeacekeeper.length > 0 && !KiramekiHelper.checkIfOwner(profileCardUser.id)) {
                    const ohkBadge = await Canvas.loadImage(KiramekiHelper.images.PROFILE_CARD.OHK_BADGE);

                    ctx.drawImage(ohkBadge, 342, 129, 26, 20);
                }
            }

            // Background Avatar Circle
            ctx.beginPath();
            ctx.arc(74, 74, 57, 0, Math.PI * 2, true);
            ctx.fillStyle = "#2d2d37";
            ctx.fill();
            ctx.closePath();

            // Avatar Image
            ctx.save();
            ctx.beginPath();
            ctx.arc(74, 74, 53, 0, Math.PI * 2, true);
            ctx.closePath();
            ctx.clip();
            ctx.drawImage(avatar, 21, 21, 106, 106);
            ctx.restore();

            // Send profile card
            if (profileCardUser === message.author) {
                await message.channel.createEmbed(new KiramekiHelper.Embed()
                    .setDescription(`You can individualize your profile card on [Kirameki's Dashboard!](${KiramekiHelper.links.WEBSITE.DASHBOARD})`)
                    .setColor("#" + userObject[0].accent_color)
                );
            }

            message.channel.createMessage(undefined, { file: canvas.toBuffer(), name: `${uniqid()}.png` });
            KiramekiHelper.log(KiramekiHelper.LogLevel.COMMAND, 'PROFILE CARD', `${KiramekiHelper.userLogCompiler(message.author)} requested his profile card on Guild ${message.channel.guild.name} (${message.channel.name}).`);
        } catch (profileGeneratorError) {
            message.channel.createEmbed(new KiramekiHelper.Embed()
                .setColor("RED")
                .setDescription("Something went wrong when trying to generate your profile card. This is probably because of an unsuported image type set in the dashboard. Please try to use either a png, jpg or gif image for your profile card banner.")
            );

            KiramekiHelper.log(KiramekiHelper.LogLevel.ERROR, 'PROFILE CARD ERROR', `Generating a profile card failed because of: ${profileGeneratorError}`);
        }
    }
}

module.exports = new Profile();