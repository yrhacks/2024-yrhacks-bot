const { Client, REST, Routes, GatewayIntentBits } = require("discord.js");
const { handleTeam } = require("./commandHandler/team");
const { handleUser } = require("./commandHandler/user");
const { handleDebug } = require("./commandHandler/debug");
const { mongoClient } = require("./mongodb");

const { badges } = require("./data/badges.json");
const banList = require("./data/bannedwords.json");
const { commands } = require("./data/commands.js");

require("dotenv").config();

const BOT_TOKEN = process.env.BOT_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;

const DATABASE = process.env.DATABASE;
const HACKER_COLLECTION = process.env.HACKER_COLLECTION;
const SIGNUPS_COLLECTION = process.env.SIGNUPS_COLLECTION;
const TEAM_COLLECTION = process.env.TEAM_COLLECTION;

const EXEC_ID = process.env.EXEC_ID;
const TEACHER_ID = process.env.TEACHER_ID;
const FORMER_EXEC_ID = process.env.FORMER_EXEC_ID;
const HACKER_ID = process.env.HACKER_ID;
const QUARANTINE_ID = process.env.QUARANTINE_ID;

const SERVER_ID = process.env.SERVER_ID;
const LOG_CHANNEL_ID = process.env.LOG_CHANNEL_ID;

const run = async () => {
    const handlerDictionary = {
        "team": handleTeam,
        "user": handleUser,
        "debug": handleDebug,
    }

    const rest = new REST({ version: "10" }).setToken(BOT_TOKEN);

    try {
        console.log("Started refreshing application (/) commands.");

        await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });

        console.log("Successfully reloaded application (/) commands.");
    } catch (error) {
        console.error(error);
    }

    const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMessages] });

    client.on("ready", () => {
        console.log(`Logged in as ${client.user.tag}!`);
    });

    client.on("messageCreate", (message) => {
        if (message.guildId != SERVER_ID) return;

        if (message.author.bot) return false;

        let flagged = false;

        message.content.split(" ").forEach((word) => {
            if (banList.includes(word)) {
                flagged = true;
            }
        });

        if (!flagged) {
            return;
        }

        message.delete();

        message.author.send("# Please refrain from using inappropriate language in the YRHacks Discord Server.").catch(err => console.log(err));

        logAction(message, `<@${message.author.id}>'s message got flagged \`${message.content}\`.`);
    });

    client.on("interactionCreate", async interaction => {
        if (interaction.guildId != SERVER_ID) {
            if (interaction.isCommand()) {
                await interaction.reply({
                    embeds: [
                        {
                            description: "You can only run commands in YRHacks Discord Server.",
                            timestamp: new Date().toISOString(),
                            color: "8076741"
                        }
                    ],
                    ephemeral: true
                }).catch(err => console.log(err));
            }
            return;
        }

        if (interaction.isAutocomplete()) {
            const db = mongoClient.db(DATABASE);
            const collection = db.collection(TEAM_COLLECTION);

            const focusedValue = interaction.options.getFocused();

            if (interaction.options.getSubcommand() == "accept") {
                const invited = await collection.find({ invited: interaction.user.username }).toArray();
                const names = invited.map(t => t.teamName);
                const filtered = names.filter((t) => t.startsWith(focusedValue));

                await interaction.respond(
                    filtered.slice(0, 25).map(v => ({ name: v, value: v }))
                ).catch(err => console.log(err));
            } else if (interaction.options.getSubcommand() == "view") {
                const teams = await collection.distinct("teamName");
                const filtered = teams.filter((t) => t.startsWith(focusedValue));

                await interaction.respond(
                    filtered.slice(0, 25).map(v => ({ name: v, value: v }))
                ).catch(err => console.log(err));
            } else if (interaction.options.getSubcommand() == "addbadge") {
                await interaction.respond(
                    Object.keys(badges).map(v => ({ name: v, value: v }))
                ).catch(err => console.log(err));
            }

        }

        if (!interaction.isCommand()) return;

        if (!(await existsUser(interaction.user.username))) {
            await addUser(interaction.member);
        }

        if (interaction.commandName === "ping") {
            await interaction.reply("Pong! <@" + interaction.user.id + ">").catch(err => console.log(err));
            return;
        }

        if (handlerDictionary.hasOwnProperty(interaction.commandName)) {
            handlerDictionary[interaction.commandName](interaction);
        } else {
            await interaction.reply({
                embeds: [{
                    description: `Command name ${interaction.commandName} not found.`,
                    color: "8076741"
                }]
            }).catch(err => console.log(err));
        }

    });

    client.on("guildMemberAdd", async member => {
        console.log(member.user.username);

        try {
            const db = mongoClient.db(DATABASE);
            const collection = db.collection(SIGNUPS_COLLECTION);

            const whitelisted = await collection.findOne({
                discord: member.user.username,
            }, { collation: { strength: 2, locale: 'en' } });

            if (!whitelisted) {
                await member.user.send(
                    `
# Sorry!
                    
You are not whitelisted for YRHacks' Discord Server.
                    
> If you believe that this was a mistake:
> - Please use the contact form at [www.yrhacks.ca](https://yrhacks.ca/#contact).
> - Or fill out the Google Form posted on the YRHacks Google Classroom to sign up for a team.
                    `
                ).catch(err => console.log(err));

                const role = member.guild.roles.cache.find(r => r.id == QUARANTINE_ID);
                member.roles.add(role);
                return;
            }

            const role = member.guild.roles.cache.find(r => r.id == HACKER_ID);
            member.roles.add(role);
        } catch (error) {
            console.error("Error validating hacker:", error);
        }

        addUser(member);
    });

    client.on("guildMemberUpdate", async (oldMember, newMember) => {
        const USERNAME = newMember.user.username;

        if (oldMember.roles.cache.size !== newMember.roles.cache.size) {
            const db = mongoClient.db(DATABASE);
            const hackerCollection = db.collection(HACKER_COLLECTION);

            let badges = [];

            if (newMember.roles.cache.has(EXEC_ID)) {
                badges.push("Executive");
            }
            if (newMember.roles.cache.has(TEACHER_ID)) {
                badges.push("Teacher");
            }
            if (newMember.roles.cache.has(FORMER_EXEC_ID)) {
                badges.push("Former Exec");
            }

            const result = await hackerCollection.updateOne(
                { username: USERNAME },
                { $set: { badges: badges } }
            );
        }
    });

    client.login(BOT_TOKEN);
}

const addUser = async (member) => {
    const username = member.user.username;

    try {
        const db = mongoClient.db(DATABASE);
        const hackerCollection = db.collection(HACKER_COLLECTION);
        const signupCollection = db.collection(SIGNUPS_COLLECTION);

        const existingHacker = await existsUser(username);

        if (!existingHacker) {
            const signupData = await signupCollection.findOne({
                discord: username,
            });

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

            member.setNickname(hacker_data.fullName)
                .catch(err => console.log(err)); // Error catching without try catch

            const result = await hackerCollection.insertOne({ ...hacker_data });
        }
    } catch (error) {
        console.error("Error inserting hacker:", error);
    }
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

const logAction = async (interaction, message) => {
    const channel = interaction.client.channels.cache.find(c => c.id == LOG_CHANNEL_ID)

    channel.send({
        embeds: [{
            description: message,
            color: "8076741"
        }]
    })
}

run();
