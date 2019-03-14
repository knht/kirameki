const KiramekiHelper = require('../../KiramekiHelper');

class BlacklistedGuild {
    constructor() {
        this.name = 'blgc';
        this.wsEvent = 'GUILD_CREATE';
    }

    async execute(guild, kirCore) {
        const isBlacklisted = await KiramekiHelper.preparedQuery(kirCore.DB, 'SELECT * FROM blacklisted_guild WHERE guild_id = ?;', [guild.id]);

        if (isBlacklisted.length > 0) {
            await kirCore.leaveGuild(guild.id);
            KiramekiHelper.log(KiramekiHelper.LogLevel.EVENT, "BLACKLISTED GUILD", `Someone tried to make Kirameki join a blacklisted guild: ${guild.name} (${guild.id})`);
        } else {
            KiramekiHelper.log(KiramekiHelper.LogLevel.EVENT, "GUILD JOIN", `Kirameki joined a new guild called: ${guild.name} (${guild.id})`);
        }
    }
}

module.exports = new BlacklistedGuild();