const { ApplicationCommandOptionType } = require("discord.js");

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
            {
                name: "viewall",
                description: "View all teams",
                type: ApplicationCommandOptionType.Subcommand,
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
                        required: true,
                        autocomplete: true
                    }
                ]
            }
        ]
    }
];

module.exports = { commands };