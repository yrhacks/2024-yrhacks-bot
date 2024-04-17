const { mongoClient } = require("../mongodb");
const { badges } = require("../json/badges.json");
const util = require("util");
const { PermissionsBitField } = require('discord.js');

const DATABASE = process.env.DATABASE;
const HACKER_COLLECTION = process.env.HACKER_COLLECTION;
const TEAM_COLLECTION = process.env.TEAM_COLLECTION;
const SIGNUPS_COLLECTION = process.env.SIGNUPS_COLLECTION;

const EXEC_ID = process.env.EXEC_ID;
const TEACHER_ID = process.env.TEACHER_ID;
const FORMER_EXEC_ID = process.env.FORMER_EXEC_ID;

const handleDebug = async (interaction) => {
    const OPTIONS = interaction.options;

    if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) { //ari i need to verify people
        ephemeralReply(interaction, "Access Denied.")
        return;
    }

    try {
        const db = mongoClient.db(DATABASE);
        const hackerCollection = db.collection(HACKER_COLLECTION);
        const teamCollection = db.collection(TEAM_COLLECTION);

        switch (OPTIONS.getSubcommand()) {
            case "forceregister":
                {
                    const member = interaction.guild.members.cache.get(OPTIONS.get("user").value);
                    const username = member.user.username;

                    if (username == interaction.user.username) {
                        ephemeralReply(interaction, "Registered user.");
                        break;
                    }

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
                        }, { collation: { strength: 2, locale: 'en' }});

                        let badges = [];

                        if (member.roles.cache.has(EXEC_ID)) {
                            badges.push("Executive");
                        }
                        if (member.roles.cache.has(TEACHER_ID)) {
                            badges.push("Teacher");
                        }
                        if (member.roles.cache.has(FORMER_EXEC_ID)) {
                            badges.push("Former Exec");
                        }

                        const { firstName, lastName } = signupData;

                        const hacker_data = {
                            username: username,
                            fullName: `${firstName} ${lastName}`,
                            aboutMe: "No information provided...",
                            team: "N/A",
                            leader: false,
                            inTeam: false,
                            badges: badges,
                            ...signupData
                        };

                        await member.setNickname(hacker_data.fullName)
                            .catch(err => console.log(err)); // Error catching without try catch

                        await member.roles.add("1229979079277678612")

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
                    const teamName = OPTIONS.get("team").value;

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
                    const user = OPTIONS.get("user").user.username;
                    const emoji = OPTIONS.get("badge").value;

                    if (!Object.keys(badges).includes(emoji)) {
                        ephemeralReply(interaction, "Invalid badge.");
                        break;
                    }

                    await hackerCollection.updateOne({ username: user }, { $push: { badges: emoji } });
                    ephemeralReply(interaction, `Added badge!`);
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
    }).catch(err => console.log(err));
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