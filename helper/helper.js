const LOG_CHANNEL_ID = process.env.LOG_CHANNEL_ID;

const logAction = async (interation, message) => {
    const channel = interation.client.channels.cache.find(c => c.id == LOG_CHANNEL_ID)

    channel.send({
        embeds: [{
            description: message,
            color: "8076741"
        }]
    }).catch(err => console.log(err));
}

module.exports = { logAction };