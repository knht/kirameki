module.exports = {
    INVITE: 'https://discord.gg/kKPZdA6',
    WEBSITE: {
        BASE: 'https://kirameki.one/',
        DASHBOARD: 'https://dashboard.kirameki.one',
        COMMANDS: 'https://kirameki.one/commands.php',
        CONTACT: 'https://kirameki.one/contact.php',
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