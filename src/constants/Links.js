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
                    return `https://kirameki.one/api/osu/initSpectate.php?osu_player_id=${osuUserId}`;
                },
                BEATMAP_DOWNLOADS: {
                    viaOsuDirect: (beatmapSetID) => {
                        return `https://kirameki.one/api/osu/osuDirectDownload.php?osu_bms_id=${beatmapSetID}`;
                    },
                    viaOsuWebsite: (beatmapID, mode) => {
                        return `https://osu.ppy.sh/b/${beatmapID}?m=${mode}`;
                    },
                    viaBloodcat: (beatmapSetID) => {
                        return `https://bloodcat.com/osu/s/${beatmapSetID}`;
                    }
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