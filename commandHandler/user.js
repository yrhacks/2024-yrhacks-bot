const { mongoClient } = require("../mongodb");
const { logAction } = require("../helper/helper");
const { badges } = require("../json/badges.json")

const DATABASE = process.env.DATABASE;
const HACKER_COLLECTION = process.env.HACKER_COLLECTION;

const ABOUTME_CHARACTER_LIMIT = 150;

const handleUser = async (interaction) => {
    const OPTIONS = interaction.options;
    const USERNAME = interaction.user.username;

    try {
        const db = mongoClient.db(DATABASE);
        const hackerCollection = db.collection(HACKER_COLLECTION);

        const hacker = await hackerCollection.findOne({
            username: USERNAME,
        });

        switch (OPTIONS.getSubcommand()) {
            case "about":
                {
                    const ABOUT_ME = OPTIONS.get("about_me").value.replace(/\\n/g, '\n');

                    if (ABOUT_ME.length > ABOUTME_CHARACTER_LIMIT) {
                        ephemeralReply(interaction, "", `About me exceeds character limit (${ABOUTME_CHARACTER_LIMIT} chars).`);
                        break;
                    }

                    const hackerData = {
                        aboutMe: ABOUT_ME
                    }

                    const result = await hackerCollection.updateOne(
                        { username: USERNAME },
                        { $set: hackerData }
                    );

                    ephemeralReply(interaction, `Updated about me to:`, ABOUT_ME);
                    logAction(interaction, `**${hacker.fullName}** updated about me to:\n\`\`\`${ABOUT_ME}\`\`\``);
                }
                break;
            case "view":
                {
                    const USER = OPTIONS.get("user").user;

                    const hacker = await hackerCollection.findOne({
                        username: USER.username,
                    });

                    if (!hacker) {
                        ephemeralReply(interaction, "", `**${USER.username}**'s about page not found.`);
                        break;
                    }

                    let badgeMap = {}
                    badges.forEach(b => {
                        badgeMap[b.badge_emoji] = b
                    });


                    const badgeStrings = hacker.badges.map((b) => {
                        let bData = badgeMap[b]

                        return `${bData.badge_emoji} ${bData.badge_name} - ${bData.badge_desc}`
                    });

                    let shsmField = null;

                    if (hacker.sector !== "") {
                        shsmField = {
                            name: "SHSM Sector:",
                            value: hacker.sector,
                            inline: false,
                        };
                    }

                    let badgesField = null;

                    if (badgeStrings.length != 0) {
                        badgesField = {
                            name: "Badges:",
                            value: badgeStrings.join("\n"),
                            inline: true,
                        }
                    }

                    await interaction.reply({
                        embeds: [
                            {
                                title: `__${hacker.fullName}'s page:__`,
                                description: `\u200b\n<@${USER.id}> (@${hacker.username})\n\u200b`,
                                thumbnail: {
                                    url: `https://cdn.discordapp.com/avatars/${USER.id}/${USER.avatar}.webp`,
                                },
                                fields: [
                                    {
                                        name: "School:",
                                        value: hacker.school,
                                        inline: true,
                                    },
                                    {
                                        name: "Grade:",
                                        value: hacker.grade,
                                        inline: true,
                                    },
                                    {
                                        name: "Past Hacks:",
                                        value: hacker.hackathons,
                                        inline: true,
                                    },
                                    shsmField,
                                    {
                                        name: "Team:",
                                        value: hacker.inTeam ? `${hacker.team} (${hacker.leader ? "Admin :crown:" : "Member :computer:"})` : "None",
                                        inline: true,
                                    },
                                    badgesField,
                                    {
                                        name: "About Me:",
                                        value: hacker.aboutMe,
                                        inline: false,
                                    },
                                ].filter(field => field),
                                timestamp: new Date().toISOString(),
                                color: "8076741"
                            }
                        ],
                        ephemeral: false
                    }).catch(err => console.log(err));
                }
                break;
        }
    } catch (error) {
        console.error("Error inserting hacker:", error);
        ephemeralReply(interaction, interaction.user, `Error: Please try again later.`);
    }
}

const ephemeralReply = async (interaction, message, description = "") => {
    await interaction.reply({
        embeds: [
            {
                title: message,
                description: description,
                timestamp: new Date().toISOString(),
                color: "8076741"
            }
        ],
        ephemeral: true
    }).catch(err => console.log(err));
}

module.exports = { handleUser };