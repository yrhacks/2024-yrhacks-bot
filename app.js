const { Client, REST, Routes, GatewayIntentBits, ApplicationCommandOptionType } = require("discord.js");
const { handleTeam } = require("./commandHandler/team");
const { handleProfile } = require("./commandHandler/profile");
const { mongoClient } = require("./mongodb");

require("dotenv").config();

const BOT_TOKEN = process.env.BOT_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;

const DATABASE = process.env.DATABASE;
const HACKER_COLLECTION = process.env.HACKER_COLLECTION;

const run = async () => {
    const commands = [
        {
            name: "ping",
            description: "Replies with Pong!",
        },
        {
            name: "team",
            description: "Team commands",
            options: [
                {
                    name: "create",
                    description: "Create a team",
                    type: ApplicationCommandOptionType.Subcommand,
                    options: [
                        {
                            name: "name",
                            description: "Team name",
                            type: ApplicationCommandOptionType.String,
                            required: true,
                        }
                    ]
                },
                {
                    name: "invite",
                    description: "Invite a user to the team",
                    type: ApplicationCommandOptionType.Subcommand,
                    options: [
                        {
                            name: "user",
                            description: "Invite user",
                            type: ApplicationCommandOptionType.User,
                            required: true,
                        }
                    ]
                },
                {
                    name: "accept",
                    description: "Accept an invitation to join a team",
                    type: ApplicationCommandOptionType.Subcommand,
                    options: [
                        {
                            name: "team",
                            description: "Accept invite",
                            type: ApplicationCommandOptionType.String,
                            required: true,
                        }
                    ]
                },
                {
                    name: "kick",
                    description: "Kick a user from the team",
                    type: ApplicationCommandOptionType.Subcommand,
                    options: [
                        {
                            name: "user",
                            description: "Kick user",
                            type: ApplicationCommandOptionType.User,
                            required: true,
                        }
                    ]
                },
                {
                    name: "leave",
                    description: "Leave the current team",
                    type: ApplicationCommandOptionType.Subcommand,
                },
                {
                    name: "rename",
                    description: "Rename the team name",
                    type: ApplicationCommandOptionType.Subcommand, options: [
                        {
                            name: "name",
                            description: "New team name",
                            type: ApplicationCommandOptionType.String,
                            required: true,
                        }
                    ]
                },
                {
                    name: "delete",
                    description: "Delete the team you're leading",
                    type: ApplicationCommandOptionType.Subcommand,
                },
            ],
        },
        {
            name: "profile",
            description: "Profile commands",
            options: [
                {
                    name: "about",
                    description: "Set or view your profile information",
                    type: ApplicationCommandOptionType.Subcommand,
                    options: [
                        {
                            name: "about_me",
                            description: "About me",
                            type: ApplicationCommandOptionType.String,
                            required: true,
                        }
                    ]
                },
                {
                    name: "view",
                    description: "View a user's profile",
                    type: ApplicationCommandOptionType.Subcommand,
                    options: [
                        {
                            name: "user",
                            description: "View user",
                            type: ApplicationCommandOptionType.User,
                            required: true,
                        }
                    ]
                },
            ],
        },
    ];

    const rest = new REST({ version: "10" }).setToken(BOT_TOKEN);

    try {
        console.log("Started refreshing application (/) commands.");

        await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });

        console.log("Successfully reloaded application (/) commands.");
    } catch (error) {
        console.error(error);
    }

    const client = new Client({ intents: [GatewayIntentBits.Guilds] });

    client.on("ready", () => {
        console.log(`Logged in as ${client.user.tag}!`);
    });

    client.on("interactionCreate", async interaction => {
        console.log(interaction.user.username);

        if (!interaction.isCommand()) return;

        if (!(await existsUser(interaction.user.username))) {
            await addUser(interaction.user.username);
        }

        if (interaction.commandName === "ping") {
            await interaction.reply("Pong! <@" + interaction.user.id + ">");
        }

        if (interaction.commandName === "team") {
            handleTeam(interaction);
        }

        if (interaction.commandName === "profile") {
            handleProfile(interaction);
        }
    });

    client.on("guildMemberAdd", async member => {
        console.log(member.user.username);

        addUser(member.user.username);
    });

    client.login(BOT_TOKEN);
}

const addUser = async (username) => {
    try {
        const db = mongoClient.db(DATABASE);
        const collection = db.collection(HACKER_COLLECTION);

        const existingHacker = await collection.findOne({
            username: username,
        });

        if (!existingHacker) {
            const hacker_data = {
                username: username,
                aboutMe: "No information provided...",
                team: "N/A",
                leader: false,
                inTeam: false,
            };

            const result = await collection.insertOne({ ...hacker_data });
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

run();
