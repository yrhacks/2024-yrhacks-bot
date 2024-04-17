const LOG_CHANNEL_ID = process.env.LOG_CHANNEL_ID;

const logAction = async (interaction, message) => {
    let channel = interaction.client.channels.cache.find(c => c.id == LOG_CHANNEL_ID)

    if (!channel) {
      channel = await interaction.client.channels.fetch(LOG_CHANNEL_ID)
    }
  
    channel.send({
        embeds: [{
            description: message,
            color: "8076741"
        }]
    }).catch(err => console.log(err));
}

module.exports = { logAction };