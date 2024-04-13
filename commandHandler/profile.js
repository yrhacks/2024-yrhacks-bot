const { mongoClient } = require("../mongodb");

const DATABASE = process.env.DATABASE;
const HACKER_COLLECTION = process.env.HACKER_COLLECTION;
const TEAM_COLLECTION = process.env.TEAM_COLLECTION;


const handleProfile = async (interaction) => {
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
                        ephemeralReply(interaction, interaction.user, `**__${USER.username}__**'s not found.`);
                        break;
                    }

                    ephemeralReply(interaction, USER, `Viewing **__${USER.username}__**'s about page:`,
                        `
                    __About Me:__
                    ${hacker.aboutMe}
                    `);
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
                color: "8076741"
            }
        ],
        ephemeral: true
    });
}

module.exports = { handleProfile };