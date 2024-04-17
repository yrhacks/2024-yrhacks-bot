const { Client, REST, Routes, GatewayIntentBits, ApplicationCommandOptionType } = require("discord.js");
const { handleTeam } = require("./commandHandler/team");
const { handleUser } = require("./commandHandler/user");
const { handleDebug } = require("./commandHandler/debug");
const { mongoClient } = require("./mongodb");
const banList = require("./json/bannedwords.json");

require("dotenv").config();

const BOT_TOKEN = process.env.BOT_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;

const DATABASE = process.env.DATABASE;
const HACKER_COLLECTION = process.env.HACKER_COLLECTION;
const SIGNUPS_COLLECTION = process.env.SIGNUPS_COLLECTION;
const TEAM_COLLECTION = process.env.TEAM_COLLECTION;

const SERVER_ID = process.env.SERVER_ID;
const LOG_CHANNEL_ID = process.env.LOG_CHANNEL_ID;

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
                            autocomplete: true,
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
                {
                    name: "view",
                    description: "View members of your team",
                    type: ApplicationCommandOptionType.Subcommand,
                    options: [
                        {
                            name: "team",
                            description: "Name of team to view",
                            type: ApplicationCommandOptionType.String,
                            required: false,
                            autocomplete: true
                        }
                    ]
                },
            ],
        },
        {
            name: "user",
            description: "User commands",
            options: [
                {
                    name: "about",
                    description: "Set or view your user about information (Minimal md supported; \\n for new line)",
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
                    description: "View a user's information",
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
        {
            name: "debug",
            description: "Bot debug commands",
            options: [
                {
                    name: "forceregister",
                    description: "Force register a user's information from signup data",
                    type: ApplicationCommandOptionType.Subcommand,
                    options: [
                        {
                            name: "user",
                            description: "User to update",
                            type: ApplicationCommandOptionType.User,
                            required: true
                        }
                    ]
                },
                {
                    name: "forceupdate",
                    description: "Force update a user's information",
                    type: ApplicationCommandOptionType.Subcommand,
                    options: [
                        {
                            name: "user",
                            description: "User to update",
                            type: ApplicationCommandOptionType.User,
                            required: true
                        },
                        {
                            name: "key",
                            description: "Key to update",
                            type: ApplicationCommandOptionType.String,
                            required: true
                        },
                        {
                            name: "value",
                            description: "Value to update to",
                            type: ApplicationCommandOptionType.String,
                            required: true
                        }
                    ]
                },
                {
                    name: "userdata",
                    description: "Get a user's raw data",
                    type: ApplicationCommandOptionType.Subcommand,
                    options: [
                        {
                            name: "user",
                            description: "The user to get data from",
                            type: ApplicationCommandOptionType.User,
                            required: true
                        }
                    ]
                },
                {
                    name: "teamdata",
                    description: "Get a team's raw data",
                    type: ApplicationCommandOptionType.Subcommand,
                    options: [
                        {
                            name: "team",
                            description: "The team to get data from",
                            type: ApplicationCommandOptionType.String,
                            required: true,
                            autocomplete: true,
                        }
                    ]
                },
                {
                    name: "wipeuser",
                    description: "Deletes a user from the database",
                    type: ApplicationCommandOptionType.Subcommand,
                    options: [
                        {
                            name: "user",
                            description: "The user to get data from",
                            type: ApplicationCommandOptionType.User,
                            required: true
                        }
                    ]
                },
                {
                    name: "addbadge",
                    description: "Adds a badge to a user",
                    type: ApplicationCommandOptionType.Subcommand,
                    options: [
                        {
                            name: "user",
                            description: "The user to add the badge to",
                            type: ApplicationCommandOptionType.User,
                            required: true
                        },
                        {
                            name: "badge",
                            description: "The badge to add",
                            type: ApplicationCommandOptionType.String,
                            required: true
                        }
                    ]
                }
            ]
        }
    ];

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

        message.author.send("# Please refrain from using inappropriate language in the YRHacks Discord Server.");

        logAction(message, `<@${message.author.id}>'s message got flagged \`${message.content}\`.`);
    });

    client.on("interactionCreate", async interaction => {
        if (interaction.guildId != SERVER_ID) return;

        if (interaction.isAutocomplete()) {
            const db = mongoClient.db(DATABASE);
            const collection = db.collection(TEAM_COLLECTION);

            const focusedValue = interaction.options.getFocused();

            if (interaction.options.getSubcommand() == "accept") {
                const invited = await collection.find({ invited: interaction.user.username }).toArray()
                const names = invited.map(t => t.teamName)
                const filtered = names.filter((t) => t.startsWith(focusedValue))

                await interaction.respond(
                    filtered.map(v => ({ name: v, value: v }))
                )
            } else {
                const teams = await collection.distinct('teamName')
                const filtered = teams.filter((t) => t.startsWith(focusedValue))

                await interaction.respond(
                    filtered.map(v => ({ name: v, value: v }))
                )
            }

        }

        if (!interaction.isCommand()) return;

        console.log(interaction.options);

        if (!(await existsUser(interaction.user.username))) {
            await addUser(interaction.member);
        }

        if (interaction.commandName === "ping") {
            await interaction.reply("Pong! <@" + interaction.user.id + ">");
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
            });

            if (!whitelisted) {
                await member.user.send(
                    `
# Sorry!
                    
You are not whitelisted for YRHacks' Discord Server.
                    
> If you believe that this was a mistake:
> - Please use the contact form at [www.yrhacks.ca](https://yrhacks.ca/#contact).
> - Or fill out the Google Form posted on the YRHacks Google Classroom to sign up for a team.
                    `
                ).catch(err => console.log(err));;
                member.kick();
                return;
            }
        } catch (error) {
            console.error("Error validating hacker:", error);
        }

        addUser(member);
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

            const { firstName, lastName } = signupData;

            const hacker_data = {
                username: username,
                fullName: `${firstName} ${lastName}`,
                aboutMe: "No information provided...",
                team: "N/A",
                leader: false,
                inTeam: false,
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

const logAction = async (interation, message) => {
    const channel = interation.client.channels.cache.find(c => c.id == LOG_CHANNEL_ID)

    channel.send({
        embeds: [{
            description: message,
            color: "8076741"
        }]
    })
}

run();
