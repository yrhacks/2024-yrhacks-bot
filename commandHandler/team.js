const { mongoClient } = require("../mongodb");

const DATABASE = process.env.DATABASE;
const HACKER_COLLECTION = process.env.HACKER_COLLECTION;
const TEAM_COLLECTION = process.env.TEAM_COLLECTION;

const ALLOWED_NAME_REGEX = RegExp("^[A-z0-9 ]*$");
const NAME_CHARACTER_LIMIT = 30;

const LOG_CHANNEL_ID = process.env.LOG_CHANNEL_ID;

const handleTeam = async (interaction) => {
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
            case "create":
                {
                    if (hacker.inTeam) {
                        ephemeralReply(interaction, `You are already in a team.`);
                        break;
                    }
                    const TEAM_NAME = OPTIONS.get("name").value;
 
                    const team = await teamCollection.findOne({
                        teamName: TEAM_NAME,
                    });

                    if (TEAM_NAME.length > NAME_CHARACTER_LIMIT) {
                        ephemeralReply(interaction, `Team name exceeds character limit (${NAME_CHARACTER_LIMIT} chars).`);
                        break;
                    }

                    if (!ALLOWED_NAME_REGEX.test(TEAM_NAME)) {
                        ephemeralReply(interaction, `Team name must only contain alphanumeric characters.`)
                        break;
                    }

                    if (team) {
                        ephemeralReply(interaction, `Team with name **${TEAM_NAME}** already exists.`);
                        break;
                    }

                    const hackerData = {
                        team: TEAM_NAME,
                        leader: true,
                        inTeam: true,
                    }

                    const teamData = {
                        teamName: TEAM_NAME,
                        leader: USERNAME,
                        members: [USERNAME],
                        invited: [],
                    }

                    const result = await hackerCollection.updateOne(
                        { username: USERNAME },
                        { $set: hackerData }
                    );

                    const result2 = await teamCollection.insertOne({ ...teamData });

                    ephemeralReply(interaction, `Created team with name **${TEAM_NAME}**.`);
                    logAction(interaction, `**${hacker.fullName}** created team **${TEAM_NAME}**`)
                }
                break;
            case "invite":
                {
                    const INVITED_USER = OPTIONS.get("user").user;

                    if (!hacker.inTeam) {
                        ephemeralReply(interaction, `You are not in a team to send an invite for.`)
                        break;
                    }

                    if (!hacker.leader) {
                        ephemeralReply(interaction, `You need to be a team leader to send an invite!`)
                        break;
                    }

                    const team = await teamCollection.findOne({
                        teamName: hacker.team
                    });

                    const invitedHacker = await hackerCollection.findOne({
                        username: INVITED_USER.username
                    });

                    if (team.members.includes(INVITED_USER.username)) {
                        ephemeralReply(interaction, `**${invitedHacker.fullName}** is already part of team **${hacker.team}**!`)
                        break;
                    }
                    
                    if (team.invited.includes(INVITED_USER.username)) {
                        ephemeralReply(interaction, `**${invitedHacker.fullName}** has already been invited to team **${hacker.team}**!`)
                        break;
                    }

                    if (invitedHacker.inTeam) {
                        ephemeralReply(interaction, `**${invitedHacker.fullName}** is already part of team **${invitedHacker.team}**!`)
                        break;
                    }

                    const inviteResult = await teamCollection.updateOne({teamName: hacker.team }, { $push: { invited: INVITED_USER.username } })
                                        
                    ephemeralReply(interaction, `Invited **${invitedHacker.fullName}** to team **${hacker.team}**.`);
                    logAction(interaction, `**${hacker.fullName}** invited **${invitedHacker.fullName}** to team **${hacker.team}**`)

                    await INVITED_USER.send(`**${hacker.fullName}** has invited you to team **${hacker.team}**!
                    
                    > Run \`/team accept ${hacker.team}\` to join the team.`).catch(err => console.log(err));;
                }
                break;
            case "accept":
                {
                    const teamName = OPTIONS.get("team").value;

                    if (hacker.inTeam) {
                        ephemeralReply(interaction, `You are already in a team!`);
                        break;
                    }

                    const team = await teamCollection.findOne({
                        teamName: teamName,
                    });
                    
                    if (!team.invited.includes(hacker.username)) {
                        ephemeralReply(interaction, `You do not have an invite to this team!`)
                        break;
                    }

                    if (team.members.length >= 4) {
                        ephemeralReply(interaction, `This team is currently full (4 members max).`)
                    }

                    const hackerData = {
                        team: teamName,
                        leader: false,
                        inTeam: true,
                    }

                    const result = await hackerCollection.updateOne(
                        { username: hacker.username },
                        { $set: hackerData }
                    );
                    

                    const result2 = await teamCollection.updateOne({teamName: teamName }, { $pull: { invited: hacker.username }, $push: { members: hacker.username }})

                    ephemeralReply(interaction, `Accepted invitation to **${teamName}**.`);
                    logAction(interaction, `**${hacker.fullName}** joined team **${teamName}**`)
                }
                break;
            case "kick":
                {
                    if (!hacker.inTeam) {
                        ephemeralReply(interaction, `You are not part of a team.`);
                        break;
                    }
                    if (!hacker.leader) {
                        ephemeralReply(interaction, `You cannot kick a team member as a member.`);
                        break;
                    }

                    const TEAM_MEMBER = OPTIONS.get("user").user.username;

                    if (hacker.username == TEAM_MEMBER) {
                        ephemeralReply(interaction, `You cannot kick yourself.`);
                        break;
                    }

                    const team = await teamCollection.findOne({
                        teamName: hacker.team,
                    });

                    if (!team.members.includes(TEAM_MEMBER)) {
                        ephemeralReply(interaction, `**${TEAM_MEMBER}** is not in team **${hacker.team}**`);
                        break;
                    }

                    const kickedHacker = await hackerCollection.findOne({
                        username: TEAM_MEMBER
                    })

                    const hackerData = {
                        team: "N/A",
                        leader: false,
                        inTeam: false,
                    }

                    const newMembers = team.members.filter((id) => id !== TEAM_MEMBER);
                    const newTeamData = {
                        members: newMembers,
                    }

                    const result = await hackerCollection.updateOne(
                        { username: TEAM_MEMBER },
                        { $set: hackerData }
                    );

                    const result2 = await teamCollection.updateOne(
                        { teamName: hacker.team },
                        { $set: newTeamData }
                    );

                    ephemeralReply(interaction, `Kicked **${kickedHacker.fullName}** from team **${hacker.team}**.`);
                    logAction(interaction, `**${hacker.fullName}** kicked **${kickedHacker.fullName}** from team **${hacker.team}**`)
                }
                break;
            case "leave":
                {
                    if (!hacker.inTeam) {
                        ephemeralReply(interaction, `You are not part of a team.`);
                        break;
                    }
                    if (hacker.leader) {
                        ephemeralReply(interaction, `You cannot leave a team as the leader.`);
                        break;
                    }
                    

                    const team = await teamCollection.findOne({
                        teamName: hacker.team,
                    });

                    const hackerData = {
                        team: "N/A",
                        leader: false,
                        inTeam: false,
                    }

                    const result = await hackerCollection.updateOne(
                        { username: USERNAME },
                        { $set: hackerData }
                    );

                    const result2 = await teamCollection.updateOne(
                        { teamName: team.teamName },
                        { $pull: { members: hacker.username }}
                    )

                    ephemeralReply(interaction, `Left from team **${hacker.team}**.`);
                    logAction(interaction, `**${hacker.fullName}** left team **${hacker.team}**`);
                }
                break;
            case "rename":
                {
                    if (!hacker.inTeam) {
                        ephemeralReply(interaction, `You are not in a team.`);
                        break;
                    }
                    if (!hacker.leader) {
                        ephemeralReply(interaction, `You are not the team leader.`);
                    }

                    const TEAM_NAME = OPTIONS.get("name").value;

                    const team = await teamCollection.findOne({
                        teamName: hacker.te,
                    });

                    if (TEAM_NAME.length > NAME_CHARACTER_LIMIT) {
                        ephemeralReply(interaction, `Team name exceeds character limit (${NAME_CHARACTER_LIMIT} chars).`);
                        break;
                    }

                    if (!ALLOWED_NAME_REGEX.test(TEAM_NAME)) {
                        ephemeralReply(interaction, `Team name must only contain alphanumeric characters.`)
                        break;
                    }

                    if (team) {
                        ephemeralReply(interaction, `Team with name **${TEAM_NAME}** already exists.`);
                        break;
                    }

                    const hackerData = {
                        team: TEAM_NAME,
                    }

                    const teamData = {
                        teamName: TEAM_NAME,
                    }

                    const oldTeam = await teamCollection.findOne({
                        teamName: hacker.team,
                    });

                    oldTeam.members.map(async (member) => {
                        const result = await hackerCollection.updateOne(
                            { username: member },
                            { $set: hackerData }
                        );
                    });

                    const result = await hackerCollection.updateOne(
                        { username: USERNAME },
                        { $set: hackerData }
                    );

                    const result2 = await teamCollection.updateOne(
                        { teamName: hacker.team },
                        { $set: teamData }
                    );

                    ephemeralReply(interaction, `Renamed team from **${hacker.team}** to **${OPTIONS.get("name").value}**.`);
                    logAction(interaction, `${hacker.fullName} renamed team **${hacker.team}** to **${OPTIONS.get("name").value}**`);
                }
                break;
            case "delete":
                {
                    if (!hacker.inTeam) {
                        ephemeralReply(interaction, `You are not part of a team.`);
                        break;
                    }
                    if (!hacker.leader) {
                        ephemeralReply(interaction, `You cannot leave a team as the leader.`);
                        break;
                    }
                    const team = await teamCollection.findOne({
                        teamName: hacker.team,
                    });

                    const hackerData = {
                        team: "N/A",
                        leader: false,
                        inTeam: false,
                    };

                    team.members.map(async (member) => {
                        const result = await hackerCollection.updateOne(
                            { username: member },
                            { $set: hackerData }
                        );
                    });

                    const result2 = await teamCollection.deleteOne({ teamName: hacker.team });
                    ephemeralReply(interaction, `Deleted team.`);
                    logAction(interaction, `**${hacker.fullName}** deleted team **${hacker.team}**`);

                }
                break;
            case "view":
                const teamName = OPTIONS.get("team")?.value || hacker.team;

                // User is not in a team & tried viewing own team
                if (teamName == "N/A") {
                    ephemeralReply(interaction, `You are not currently in a team. Please join one or specify a team name to view.`);
                    break;
                }

                const team = await teamCollection.findOne({
                    teamName: teamName
                });

                if (!team) {
                    ephemeralReply(interaction, `The team **${teamName}** does not exist.`)
                    break;
                }

                let { members } = team;

                members = await Promise.all(members.map(async (username, index) => {
                    const memberHacker = await hackerCollection.findOne({
                        username: username
                    })

                    return `${index == 0 ? ":crown:" : ":computer:"} <@${interaction.client.users.cache.find(user => user.username == username).id}>`
                }))

                ephemeralReply(interaction, `**Team Name:** ${teamName}\n**Members:**\n${members.join("\n")}`)

                break;
        }

    } catch (error) {
        console.error("Error inserting hacker:", error);
        ephemeralReply(interaction, `Error: Please try again later.`);
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
        ephemeral: false
    }).catch(err => console.log(err));
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

module.exports = { handleTeam };