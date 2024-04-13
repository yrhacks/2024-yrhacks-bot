const handleTeam = async (interaction) => {
    const options = interaction.options;

    console.log(options);

    switch (options.getSubcommand()) {
        case "create":
            await interaction.reply(`Created team with name \`${options.get("name").value}\`.`);
            break;
        case "invite":
            await interaction.reply(`Invited <@${options.get("user").value}> to team.`);
            break;
        case "accept":
            await interaction.reply(`Accepted invitation to <@${options.get("team").value}>.`);
            break;
        case "kick":
            await interaction.reply(`Kicked <@${options.get("user").value}> from team.`);
            break;
        case "leave":
            await interaction.reply(`Left from team.`);
            break;
        case "rename":
            await interaction.reply(`Renamed team to \`${options.get("name").value}\`.`);
            break;
        case "delete":
            await interaction.reply(`Deleted team.`);
            break;
    }
}

module.exports = { handleTeam };