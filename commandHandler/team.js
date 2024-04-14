const { mongoClient } = require("../mongodb");

const DATABASE = process.env.DATABASE;
const HACKER_COLLECTION = process.env.HACKER_COLLECTION;
const TEAM_COLLECTION = process.env.TEAM_COLLECTION;


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

                    if (team) {
                        ephemeralReply(interaction, `Team with name \`${TEAM_NAME}\` already exists.`);
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
                    }

                    const result = await hackerCollection.updateOne(
                        { username: USERNAME },
                        { $set: hackerData }
                    );

                    const result2 = await teamCollection.insertOne({ ...teamData });

                    ephemeralReply(interaction, `Created team with name \`${TEAM_NAME}\`.`);
                }
                break;
            case "invite":
                {
                    ephemeralReply(interaction, `Invited <@${OPTIONS.get("user").value}> to team.`);
                }
                break;
            case "accept":
                {
                    ephemeralReply(interaction, `Accepted invitation to <@${OPTIONS.get("team").value}>.`);
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
                        ephemeralReply(interaction, `\`${TEAM_MEMBER}\` is not in team \`${hacker.team}\``);
                        break;
                    }

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

                    ephemeralReply(interaction, `Kicked \`${TEAM_MEMBER}\` from team \`${hacker.team}\`.`);
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

                    const hackerData = {
                        team: "N/A",
                        leader: false,
                        inTeam: false,
                    }

                    const result = await hackerCollection.updateOne(
                        { username: USERNAME },
                        { $set: hackerData }
                    );
                    ephemeralReply(interaction, `Left from team \`${hacker.team}\`.`);
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
                        teamName: TEAM_NAME,
                    });

                    if (team) {
                        ephemeralReply(interaction, `Team with name \`${TEAM_NAME}\` already exists.`);
                        break;
                    }

                    const hackerData = {
                        team: TEAM_NAME,
                    }

                    const teamData = {
                        teamName: TEAM_NAME,
                    }

                    const result = await hackerCollection.updateOne(
                        { username: USERNAME },
                        { $set: hackerData }
                    );

                    const result2 = await teamCollection.updateOne(
                        { teamName: hacker.team },
                        { $set: teamData }
                    );

                    ephemeralReply(interaction, `Renamed team from \`${hacker.team}\` to \`${OPTIONS.get("name").value}\`.`);
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
                    const hackerData = {
                        team: "N/A",
                        leader: false,
                        inTeam: false,
                    }

                    const result = await hackerCollection.updateOne(
                        { username: USERNAME },
                        { $set: hackerData }
                    );


                    const result2 = await teamCollection.deleteOne({ teamName: hacker.team });
                    ephemeralReply(interaction, `Deleted team.`);

                }
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
                title: message,
                color: "8076741"
            }
        ],
        ephemeral: true
    });
}

module.exports = { handleTeam };