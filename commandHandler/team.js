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
                if (hacker.inTeam) {
                    await interaction.reply(`You are already in a team.`);
                } else {
                    const TEAM_NAME = OPTIONS.get("name").value;

                    const team = await teamCollection.findOne({
                        teamName: TEAM_NAME,
                    });

                    if (team) {
                        await interaction.reply(`Team with name \`${TEAM_NAME}\` already exists.`);
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

                    await interaction.reply(`Created team with name \`${TEAM_NAME}\`.`);
                }
                break;
            case "invite":
                await interaction.reply(`Invited <@${OPTIONS.get("user").value}> to team.`);
                break;
            case "accept":
                await interaction.reply(`Accepted invitation to <@${OPTIONS.get("team").value}>.`);
                break;
            case "kick":
                await interaction.reply(`Kicked <@${OPTIONS.get("user").value}> from team.`);
                break;
            case "leave":
                if (hacker.inTeam) {
                    if (hacker.leader) {
                        await interaction.reply(`You cannot leave a team as the leader.`);
                    } else {
                        const hackerData = {
                            team: "N/A",
                            leader: false,
                            inTeam: false,
                        }

                        const result = await hackerCollection.updateOne(
                            { username: USERNAME },
                            { $set: hackerData }
                        );
                        await interaction.reply(`Left from team \`${hacker.team}\`.`);
                    }
                } else {
                    await interaction.reply(`You are not part of a team.`);
                }
                break;
            case "rename":
                if (!hacker.inTeam) {
                    await interaction.reply(`You are not in a team.`);
                } else {
                    if (!hacker.leader) {
                        await interaction.reply(`You are not the team leader.`);
                    }

                    const TEAM_NAME = OPTIONS.get("name").value;

                    const team = await teamCollection.findOne({
                        teamName: TEAM_NAME,
                    });

                    if (team) {
                        await interaction.reply(`Team with name \`${TEAM_NAME}\` already exists.`);
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

                    await interaction.reply(`Renamed team from \`${hacker.team}\` to \`${OPTIONS.get("name").value}\`.`);
                }
                break;
            case "delete":
                if (hacker.inTeam) {
                    if (!hacker.leader) {
                        await interaction.reply(`You cannot leave a team as the leader.`);
                    } else {
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
                        await interaction.reply(`Deleted team.`);
                    }
                } else {
                    await interaction.reply(`You are not part of a team.`);
                }
                break;
        }

    } catch (error) {
        console.error("Error inserting hacker:", error);
        await interaction.reply(`Error: Please try again later.`);
    }
}

module.exports = { handleTeam };