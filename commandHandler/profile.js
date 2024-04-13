const handleProfile = async (interaction) => {
    const options = interaction.options;

    console.log(options);

    switch (options.getSubcommand()) {
        case "about":
            await interaction.reply(`Updated about me to: \`\`\`${options.get("about_me").value}\`\`\``);
            break;
        case "view":
            await interaction.reply(`Viewing <@${options.get("user").value}>'s about page.`);
            break;
    }
}

module.exports = { handleProfile };