module.exports = {
    INVITE: 'https://discord.gg/kKPZdA6',
    WEBSITE: {
        BASE: 'https://kirameki.one/',
        DASHBOARD: 'https://dashboard.kirameki.one/',
        COMMANDS: 'https://kirameki.one/commands.php',
        CONTACT: 'https://kirameki.one/contact.php',
        TRANSLATIONS: 'https://kirameki.one/translate.php',
        EVENT_MODULES: 'https://kirameki.one/events.php',
        API: {
            OSU: {
                generateSpectatorLink: (osuUserId) => {
                    return `https://kirameki.one/api/osu/initSpectate.php?osu_player_id=${osuUserId}`
                }
            }
        },
        LEADERBOARDS: {
            XP: 'https://kirameki.one/leaderboard.php',
            OSU: {
                getLeaderboardURL: (guildID) => {
                    return `https://kirameki.one/osuleaderboard.php?guild=${Buffer.from(guildID).toString('base64')}`;
                }
            }
        }
    }
};