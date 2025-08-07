const axios = require('axios');
const fetch = require('node-fetch');

async function aiCommand(sock, chatId, message) {
    try {
        const text = message.message?.conversation || message.message?.extendedTextMessage?.text;

        if (!text) {
            return await sock.sendMessage(chatId, {
                text: "Please provide a question after .gpt or .gemini\n\nExample: .gpt write a basic html code"
            });
        }

        // Get the command and query
        const parts = text.split(' ');
        const command = parts[0].toLowerCase();
        const query = parts.slice(1).join(' ').trim();

        if (!query) {
            return await sock.sendMessage(chatId, {
                text: "Please provide a question after .gpt or .gemini"
            });
        }

        try {
            // Show processing message
            await sock.sendMessage(chatId, {
                react: { text: '🤖', key: message.key }
            });

            if (command === '.gpt') {
                // Call the GPT API https://api.giftedtech.web.id/api/ai/gpt4o?apikey=gifted&q=Whats+Your+Model
                const response = await axios.get(`https://api.giftedtech.web.id/api/ai/gpt4o?apikey=gifted&q=${encodeURIComponent(query)}`);

                if (response.data && response.data.success && response.data.result) {
                    const answer = response.data.result;
                    await sock.sendMessage(chatId, {
                        text: answer
                    }, {
                        quoted: message
                    });

                } else {
                    throw new Error('Invalid response from API');
                }
            } else if (command === '.gemini') {

                /*   `https://api.siputzx.my.id/api/ai/gemini-pro?content=${encodeURIComponent(query)}`,
                    `https://api.ryzendesu.vip/api/ai/gemini?text=${encodeURIComponent(query)}`,
                    `https://api.dreaded.site/api/gemini2?text=${encodeURIComponent(query)}`,

                const apis = [
                    `https://api.giftedtech.web.id/api/ai/geminiai?apikey=gifted&q=${encodeURIComponent(query)}`,
                    
                ];*/

                const response = await fetch(`https://api.giftedtech.web.id/api/ai/geminiaipro?apikey=gifted&q=${encodeURIComponent(query)}`);
                const data = await response.json();

                if (data.result) {
                    const answer = data.message || data.data || data.answer || data.result;
                    await sock.sendMessage(chatId, {
                        text: answer
                    }, {
                        quoted: message
                    });
                } else {
                    throw new Error('Invalid response from Grok API');
                }
            } //add grok https://api.giftedtech.web.id/api/ai/groq-beta?apikey=gifted&q=Whats+your+model
            else if (command === '.grok') {
                const response = await fetch(`https://api.giftedtech.web.id/api/ai/groq-beta?apikey=gifted&q=${encodeURIComponent(query)}`);
                const data = await response.json();

                if (data.result) {
                    const answer = data.message || data.data || data.answer || data.result;
                    await sock.sendMessage(chatId, {
                        text: answer
                    }, {
                        quoted: message
                    });
                } else {
                    throw new Error('Invalid response from Grok API');
                }
            }
        } catch (error) {
            console.error('API Error:', error);
            await sock.sendMessage(chatId, {
                text: "❌ Failed to get response. Please try again later.",
                contextInfo: {
                    mentionedJid: [message.key.participant || message.key.remoteJid],
                    quotedMessage: message.message
                }
            });
        }
    } catch (error) {
        console.error('AI Command Error:', error);
        await sock.sendMessage(chatId, {
            text: "❌ An error occurred. Please try again later.",
            contextInfo: {
                mentionedJid: [message.key.participant || message.key.remoteJid],
                quotedMessage: message.message
            }
        });
    }
}

module.exports = aiCommand; 