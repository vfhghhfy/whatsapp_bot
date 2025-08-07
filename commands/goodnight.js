const fetch = require('node-fetch');

async function goodnightCommand(sock, chatId, message) {
    try {
        const res = await fetch(`https://api.giftedtech.web.id/api/fun/goodnight?apikey=gifted`);

        if (!res.ok) {
            throw await res.text();
        }

        const json = await res.json();

        // Check if the API response has the expected structure
        let goodnightMessage;
        if (json.status === 200 && json.result) {
            goodnightMessage = json.result;
        } else if (json.message) {
            goodnightMessage = json.message;
        } else if (json.data) {
            goodnightMessage = json.data;
        } else {
            goodnightMessage = "🌙 Good night! Sweet dreams and have a peaceful rest! 😴✨";
        }

        // Send the goodnight message with nice formatting
        const formattedMessage = `🌙 *Good Night Message*

${goodnightMessage}

Sweet dreams! 😴✨`;

        await sock.sendMessage(chatId, { text: formattedMessage }, { quoted: message });
    } catch (error) {
        console.error('Error in goodnight command:', error);

        // Fallback message if API fails
        const fallbackMessage = `🌙 *Good Night!*

The stars are shining bright tonight, just like your dreams will be. Have a peaceful sleep and wake up refreshed tomorrow! 

Sweet dreams! 😴✨🌟`;

        await sock.sendMessage(chatId, { text: fallbackMessage }, { quoted: message });
    }
}

module.exports = { goodnightCommand }; 