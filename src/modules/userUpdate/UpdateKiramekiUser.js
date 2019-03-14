const KiramekiHelper = require('../../KiramekiHelper');

class UpdateKiramekiUser {
    constructor() {
        this.name = 'updatekiramekiuser';
        this.wsEvent = 'USER_UPDATE';
    }

    async execute(user, kirCore) {
        try {
            const userExists = await KiramekiHelper.preparedQuery(kirCore.DB, "SELECT * FROM profile_xp WHERE discord_id = ?;", [user.id]);

            if (userExists.length < 1) return;

            KiramekiHelper.preparedQuery(
				kirCore.DB, 
				'UPDATE profile_xp SET discord_id = ?, discord_tag = ?, discord_avatar = ? WHERE discord_id = ?;',
				[user.id, KiramekiHelper.getUserTag(user), user.staticAvatarURL, user.id]
			);

            KiramekiHelper.log(KiramekiHelper.LogLevel.DEBUG, "USER UPDATE", `${KiramekiHelper.userLogCompiler(user)} updated their Discord profile. Changes have been synced to the database!`);
        } catch (updatingUsersError) {
            KiramekiHelper.log(KiramekiHelper.LogLevel.ERROR, "USER UPDATE ERROR", `The user update event was fired but the database update failed because of: ${updatingUsersError}`);
        }
    }
}

module.exports = new UpdateKiramekiUser();