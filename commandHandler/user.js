const { mongoClient } = require("../mongodb");
const { badges } = require("../json/badges.json")

const DATABASE = process.env.DATABASE;
const HACKER_COLLECTION = process.env.HACKER_COLLECTION;
const TEAM_COLLECTION = process.env.TEAM_COLLECTION;

const ABOUTME_CHARACTER_LIMIT = 150;

const handleUser = async (interaction) => {
    const OPTIONS = interaction.options;
    const USERNAME = interaction.user.username;

    console.log(OPTIONS);


    try {
        const db = mongoClient.db(DATABASE);
        const hackerCollection = db.collection(HACKER_COLLECTION);
        const teamCollection = db.collection(TEAM_COLLECTION);

        const hacker = await hackerCollection.findOne({
            username: USERNAME,
        });

        switch (OPTIONS.getSubcommand()) {
            case "about":
                {
                    const ABOUT_ME = OPTIONS.get("about_me").value.replace(/\\n/g, '\n');

                    if (ABOUT_ME.length > ABOUTME_CHARACTER_LIMIT) {
                        ephemeralReply(interaction, interaction.user, "", `About me exceeds character limit (${ABOUTME_CHARACTER_LIMIT} chars).`);
                        break;
                    }

                    const hackerData = {
                        aboutMe: ABOUT_ME
                    }

                    const result = await hackerCollection.updateOne(
                        { username: USERNAME },
                        { $set: hackerData }
                    );
                    ephemeralReply(interaction, interaction.user, `Updated about me to:`, ABOUT_ME);
                }
                break;
            case "view":
                {
                    const USER = OPTIONS.get("user").user;

                    const hacker = await hackerCollection.findOne({
                        username: USER.username,
                    });

                    if (!hacker) {
                        ephemeralReply(interaction, interaction.user, `**__${USER.username}__**'s about page not found.`);
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
                    ephemeralReply(interaction, USER, `Viewing **__${hacker.fullName}__**'s about page:`,
                        `
                        (@${hacker.username})

                        __School:__ ${hacker.school}

                        __Grade:__ ${hacker.grade}

                        __SHSM Sector:__ ${hacker.sector == "" ? "None" : hacker.sector}

                        __Hackathons attended:__ ${hacker.hackathons}

                        __Team:__ ${hacker.inTeam ? `${hacker.team} (${hacker.leader ? "Admin :crown:" : "Member :computer:"})` : "None"}

                        __About Me:__
                        ${hacker.aboutMe}

                        ${badgeStrings.length == 0 ? "" : ("__Badges:__\n" + badgeStrings.join("\n"))}
                        `

                    );
                }
                break;
        }
    } catch (error) {
        console.error("Error inserting hacker:", error);
        ephemeralReply(interaction, interaction.user, `Error: Please try again later.`);
    }
}

const ephemeralReply = async (interaction, user, message, description = "") => {
    await interaction.reply({
        embeds: [
            {
                title: message,
                description: description,
                thumbnail:
                    (
                        description !== "" ? {
                            url: `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.webp`,
                        } : {}
                    ),
                timestamp: new Date().toISOString(),
                color: "8076741"
            }
        ],
        ephemeral: false
    }).catch(err => console.log(err));
}

module.exports = { handleUser };