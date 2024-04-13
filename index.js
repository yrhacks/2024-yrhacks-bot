const { Client, REST, Routes, GatewayIntentBits } = require("discord.js");
require("dotenv").config();
const BOT_TOKEN = process.env.BOT_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;

const run = async () => {
    const commands = [
        {
            name: 'ping',
            description: 'Replies with Pong!',
        },
    ];

    const rest = new REST({ version: '10' }).setToken(BOT_TOKEN);

    try {
        console.log('Started refreshing application (/) commands.');

        await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });

        console.log('Successfully reloaded application (/) commands.');
    } catch (error) {
        console.error(error);
    }

    const client = new Client({ intents: [GatewayIntentBits.Guilds] });

    client.on('ready', () => {
        console.log(`Logged in as ${client.user.tag}!`);
    });

    client.on('interactionCreate', async interaction => {
        console.log(interaction.user.username);

        if (!interaction.isChatInputCommand()) return;

        if (interaction.commandName === 'ping') {
            await interaction.reply('Pong!');
        }
    });


    client.on('guildMemberAdd', member => {
        console.log(member.user.username);
    });

    client.login(BOT_TOKEN);
}

run();
