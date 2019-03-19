const KiramekiHelper = require('../../KiramekiHelper');
const Canvas = require('canvas');
const uniqid = require('uniqid');

class BirthdaySystem {
    constructor() {
        this.name = 'birthdaysystem';
        this.wsEvent = 'MESSAGE_CREATE';
    }

    async execute(message, kirCore) {
        if (message.channel.type != 0) return;
        if (message.author.bot) return;
        if (message.content.startsWith(kirCore.prefix)) return;
        if (message.content == kirCore.prefix) return;
        if (kirCore.eligibleForXp.has(message.author.id)) return;

        const isBanned  = await KiramekiHelper.preparedQuery(kirCore.DB, 'SELECT * FROM banned WHERE user_id = ? LIMIT 1;', [message.author.id]);

        // Immediately abort if a user is banned from using Kirameki
        if (isBanned.length > 0) return;

        const isIgnored = await KiramekiHelper.preparedQuery(kirCore.DB, 'SELECT * FROM birthday_ignores WHERE guild_id = ?;', [message.channel.guild.id]);
        const userXPObj = await KiramekiHelper.preparedQuery(kirCore.DB, 'SELECT * FROM profile_xp WHERE discord_id = ? LIMIT 1;', [message.author.id]);

        // Check if user already exists
        if (userXPObj.length < 1) {
            KiramekiHelper.preparedQuery(
                kirCore.DB, 
                'INSERT INTO `profile_xp` (`id`, `discord_id`, `discord_tag`, `discord_avatar`, `level`, `xp`, `accent_color`, `bg_img`) VALUES (NULL, ?, ?, ?, ?, ?, ?, ?);', 
                [message.author.id, KiramekiHelper.getUserTag(message.author), message.author.dynamicAvatarURL('jpg', 128), 0, 1, 'FF9185', KiramekiHelper.images.PROFILE_CARD.DEFAULT_BACKGROUND]
            );
        } else {
            let xpGainageRange	= {};

			if (userXPObj[0].level <= 10) {
				xpGainageRange = {
					min: 1,
					max: 3
				};
			} else if (userXPObj[0].level <= 20) {
				xpGainageRange = {
					min: 3,
					max: 7
				};
			} else if (userXPObj[0].level <= 30) {
				xpGainageRange = {
					min: 5,
					max: 9
				};
			} else if (userXPObj[0].level <= 40) {
				xpGainageRange = {
					min: 10,
					max: 15
				};
			} else if (userXPObj[0].level <= 50) {
				xpGainageRange = {
					min: 15,
					max: 20
				};
			} else {
				xpGainageRange = {
					min: 30,
					max: 100
				};
            }
            
            const xpGainage     = KiramekiHelper.randomIntFromInterval(xpGainageRange.min, xpGainageRange.max);
            const currentLevel  = Math.floor(0.1 * Math.sqrt(parseInt(userXPObj[0].xp) + xpGainage));

            // Check if it is a level-up!
            if (currentLevel > parseInt(userXPObj[0].level)) {
                await KiramekiHelper.preparedQuery(
                    kirCore.DB, 
                    'UPDATE profile_xp SET discord_tag = ?, discord_avatar = ?, xp = ?, level = ? WHERE discord_id = ?;',
                    [KiramekiHelper.getUserTag(message.author), message.author.dynamicAvatarURL('jpg', 128), parseInt(userXPObj[0].xp) + xpGainage, currentLevel, message.author.id]
                );

                const imgurlobjdb = await KiramekiHelper.preparedQuery(kirCore.DB, 'SELECT * FROM profile_xp WHERE discord_id = ? LIMIT 1;', [message.author.id]);

                // Check if the channel ignores level-up messages
                if (isIgnored.length > 0) {
                    return KiramekiHelper.log(KiramekiHelper.LogLevel.EVENT, 'LEVEL UP', `${KiramekiHelper.userLogCompiler(message.author)} has leveled up and is now level ${imgurlobjdb[0].level}`);
                }

                // Channel doesn't ignore level-up messages
                const canvas        = Canvas.createCanvas(484, 344);
                const ctx           = canvas.getContext('2d');
                const bgImg         = await Canvas.loadImage(imgurlobjdb[0].bg_img);
                const overlay       = await Canvas.loadImage(KiramekiHelper.images.LEVEL_UP_OVERLAY);
                const avatar        = await Canvas.loadImage(message.author.dynamicAvatarURL('jpg', 128));
                const levelPlural   = (imgurlobjdb[0].level > 1) ? 'years' : 'year';

                // Draw background and overlay
                ctx.drawImage(bgImg, 0, 0, 484, 154);
                ctx.drawImage(overlay, 0, 0, 484, 344);

                // Draw avatar arc
                ctx.save();
				ctx.beginPath();
				ctx.arc(243, 125, 84, 0, Math.PI * 2, true);
				ctx.closePath();
				ctx.clip();
				ctx.drawImage(avatar, 159, 41, 168, 168);
                ctx.restore();
                
                // Draw user info
                ctx.font = "24px Verdana";
				ctx.textAlign = "center";
                ctx.fillStyle = "rgba(255, 255, 255, 1)";
                ctx.fillText(`${message.author.username} is now ${imgurlobjdb[0].level} ${levelPlural} old!`, 242, 305, 480);

                // Try chain for sending the level-up message
                message.channel.createMessage('Woohoo! Type `&profile` to see your new profile card!', { file: canvas.toBuffer(), name: `${uniqid()}.png` }).catch(cantSendImage => {
                    // Can't send image, try text only
                    message.channel.createMessage(`Woohoo! **${message.author.username}** is now **${imgurlobjdb[0].level}** ${levelPlural} old!`).catch(cantSendMessages => {
                        KiramekiHelper.log(KiramekiHelper.LogLevel.ERROR, 'BIRTHDAY MESSAGE MUTE', `Kirameki seems to have insufficient permissions to send messages in guild ${message.channel.guild.name} (${message.channel.name})!`);
                    });
                    KiramekiHelper.log(KiramekiHelper.LogLevel.ERROR, 'BIRTHDAY ATTACHMENT MUTE', `Kirameki seems to have insufficient permissions to attach files in guild ${message.channel.guild.name} (${message.channel.name})!`);
                });
                
                KiramekiHelper.log(KiramekiHelper.LogLevel.EVENT, 'LEVEL UP',`${KiramekiHelper.userLogCompiler(message.author)} has leveled up and is now level ${imgurlobjdb[0].level}`);
            } else {
                // User hasn't leveled up, update XP nevertheless
                await KiramekiHelper.preparedQuery(
                    kirCore.DB,
                    'UPDATE profile_xp SET discord_tag = ?, discord_avatar = ?, xp = ? WHERE discord_id = ?;',
                    [KiramekiHelper.getUserTag(message.author), message.author.dynamicAvatarURL('jpg', 128), parseInt(userXPObj[0].xp) + xpGainage, message.author.id]
                );

                kirCore.eligibleForXp.add(message.author.id);
                setTimeout(() => kirCore.eligibleForXp.delete(message.author.id), 30000);
            }
        }
    }
}

module.exports = new BirthdaySystem();