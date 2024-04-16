const { mongoClient } = require("../mongodb");
const util = require("util")
const { badges } = require("../json/badges.json")

const DATABASE = process.env.DATABASE;
const HACKER_COLLECTION = process.env.HACKER_COLLECTION;
const TEAM_COLLECTION = process.env.TEAM_COLLECTION;
const SIGNUPS_COLLECTION = process.env.SIGNUPS_COLLECTION;


const BOT_ADMINS = process.env.BOT_ADMINS.split(", ");


const handleDebug = async (interaction) => {
    const OPTIONS = interaction.options;
    const USERNAME = interaction.user.username;

    console.log(OPTIONS);

    if (!BOT_ADMINS.includes(interaction.user.id)) {
        ephemeralReply(interaction, "No.")
        return;
    }

    try {
        const db = mongoClient.db(DATABASE);
        const hackerCollection = db.collection(HACKER_COLLECTION);
        const teamCollection = db.collection(TEAM_COLLECTION);
        const signupCollection = db.collection(SIGNUPS_COLLECTION);

        const hacker = await hackerCollection.findOne({
            username: USERNAME,
        });

        switch (OPTIONS.getSubcommand()) {
            case "forceregister":
                {
                    const member = interaction.guild.members.cache.get(OPTIONS.get("user").value);
                    const username = member.user.username;

                    try {
                        const db = mongoClient.db(DATABASE);
                        const hackerCollection = db.collection(HACKER_COLLECTION);
                        const signupCollection = db.collection(SIGNUPS_COLLECTION);

                        const existingHacker = await existsUser(username);

                        if (existingHacker) {
                            ephemeralReply(interaction, "User already registered.");
                            break;
                        }
                        const signupData = await signupCollection.findOne({
                            discord: username,
                        });

                        const { firstName, lastName } = signupData;
                        let userBadges = []

                        badges.forEach((b) => {
                            if (b.users.includes(member.user.id)) {
                                userBadges.push(b.badge_emoji)
                            }
                        });

                        const hacker_data = {
                            username: username,
                            fullName: `${firstName} ${lastName}`,
                            aboutMe: "No information provided...",
                            team: "N/A",
                            leader: false,
                            inTeam: false,
                            badges: userBadges,
                            ...signupData
                        };

                        member.setNickname(hacker_data.fullName)
                            .catch(err => console.log(err)); // Error catching without try catch

                        const result = await hackerCollection.insertOne({ ...hacker_data });

                        ephemeralReply(interaction, "Registered user.");
                    } catch (error) {
                        console.error("Error inserting hacker:", error);
                    }
                }
                break;
            case "forceupdate":
                {
                    const username = OPTIONS.get("user").user.username;
                    const key = OPTIONS.get("key").value;
                    const value = OPTIONS.get("value").value.replace(/\\n/g, '\n');

                    const hacker_data = {
                        [key]: value,
                    };

                    const result = await hackerCollection.updateOne(
                        { username: username },
                        { $set: hacker_data }
                    );

                    ephemeralReply(interaction, `Updated value of \`${key}\` to \`${value}\`.`);
                }
                break;
            case "userdata":
                {
                    const username = OPTIONS.get("user").user.username

                    const targetHacker = await hackerCollection.findOne({
                        username: username,
                    });

                    const formatted = `\`\`\`json\n${util.inspect(targetHacker).replaceAll("'", "\"")}\`\`\``;

                    ephemeralReply(interaction, formatted);
                }
                break;
            case "teamdata":
                {
                    const teamName = OPTIONS.get("team").value

                    const targetTeam = await teamCollection.findOne({
                        teamName: teamName,
                    });

                    const formatted = `\`\`\`json\n${util.inspect(targetTeam).replaceAll("'", "\"")}\`\`\``;

                    ephemeralReply(interaction, formatted);
                }
                break;
            case "wipeuser":
                {
                    const toDelete = OPTIONS.get("user").user.username;

                    await hackerCollection.deleteOne({ username: toDelete });

                    ephemeralReply(interaction, `Deleted user.`);
                }
                break;
            case "addbadge":
                {
                    const user = OPTIONS.get("user").user.username
                    const emoji = OPTIONS.get("badge").value

                    await hackerCollection.updateOne({ username: user }, { $push: { badges: emoji } })
                    ephemeralReply(interaction, `Added badge!`)
                }
                break;


        }
    } catch (error) {
        console.error("Error inserting hacker:", error);
        ephemeralReply(interaction, interaction.user, `Error: Please try again later.`);
    }
}

const ephemeralReply = async (interaction, message) => {
    await interaction.reply({
        embeds: [
            {
                description: message,
                timestamp: new Date().toISOString(),
                color: "8076741"
            }
        ],
        ephemeral: true
    });
}

const existsUser = async (username) => {
    try {
        const db = mongoClient.db(DATABASE);
        const collection = db.collection(HACKER_COLLECTION);

        const existingHacker = await collection.findOne({
            username: username,
        });

        return existingHacker ? true : false;
    } catch (error) {
        console.error("Error checking hacker:", error);
    }
    return false;
}


module.exports = { handleDebug };