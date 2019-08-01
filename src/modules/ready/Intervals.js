const KiramekiHelper = require('../../KiramekiHelper');
const KiramekiConfig = require('../../../config/KiramekiConfig');
const https = require('https');
const axios = require('axios');
class Intervals {
    constructor() {
        this.name = 'intervals';
        this.wsEvent = 'READY';
        this.agent = new https.Agent({ rejectUnauthorized: false });
    }

    /**
     * All continuously running utility methods e.g. database heartbeats, posting stats, et cetera.
     */
    async execute(message, kirCore) {
        KiramekiHelper.log(KiramekiHelper.LogLevel.EVENT, "INTERVALS", "Successfully registered all intervals!");

        setInterval(async () => {
            try {
                const databaseHeartbeat = await KiramekiHelper.query(kirCore.DB, "SELECT 1;");

                if (databaseHeartbeat) {
                    KiramekiHelper.log(KiramekiHelper.LogLevel.EVENT, "KIRAMEKI HEARTBEAT", "Queried the database to keep connection alive!");
                }
            } catch (kirDBError) {
                KiramekiHelper.log(KiramekiHelper.LogLevel.ERROR, "KIRAMEKI HEARTBEAT", `Querying the database failed because of ${kirDBError}!`);
            }

            axios({
                method: 'POST',
                url: `https://discord.bots.gg/api/v1/bots/${kirCore.user.id}/stats`,
                httpsAgent: this.agent,
                data: {
                    guildCount: kirCore.guilds.size
                },
                headers: {
                    Authorization: KiramekiConfig.dbggAuthToken,
                    'Content-Type': 'application/json'
                }
            }).catch((dbggError) => {
                KiramekiHelper.log(KiramekiHelper.LogLevel.ERROR, 'DBGG ERROR', `Failed to post data to DBGG because of: ${dbggError}`);
            });
        }, 1800000);
    }
}

module.exports = new Intervals();