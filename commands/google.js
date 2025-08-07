const axios = require('axios');

const googleCommand = {
    name: 'google',
    description: 'Search Google',
    category: 'search',

    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid;
        const senderId = msg.key.participant || msg.key.remoteJid;

        try {
            // Check if user provided a search query
            if (!args || args.length === 0) {
                await sock.sendMessage(chatId, {
                    text: `🔍 *GOOGLE SEARCH*

Please provide a search query!

*Usage:*
\`.google <search query>\`

*Examples:*
\`.google JavaScript tutorials\`
\`.google OpenAI ChatGPT\`
\`.google Node.js documentation\`

Powered by Google Search 🌐`
                }, { quoted: msg });
                return;
            }

            const query = args.join(' ');

            // Send searching message
            const searchingMsg = await sock.sendMessage(chatId, {
                text: '🔍 Searching Google... 📡'
            }, { quoted: msg });

            try {
                // API call to Google Search
                const response = await axios.get(`https://api.giftedtech.web.id/api/search/google`, {
                    params: {
                        apikey: 'gifted',
                        query: query
                    },
                    timeout: 30000 // 30 second timeout
                });

                if (response.data && response.data.status === 200 && response.data.results) {
                    const results = response.data.results;

                    if (results.length === 0) {
                        await sock.sendMessage(chatId, {
                            text: `🔍 *GOOGLE SEARCH*

❌ No results found for: "${query}"

Try using different keywords or check your spelling. 🔄`
                        }, { quoted: msg });
                        return;
                    }

                    // Format the search results (show top 5)
                    let formattedResponse = `🔍 *GOOGLE SEARCH RESULTS*

🔎 *Query:* ${query}

📋 *Top Results:*\n\n`;

                    const topResults = results.slice(0, 5);
                    topResults.forEach((result, index) => {
                        formattedResponse += `${index + 1}. 📄 *${result.title}*\n`;
                        formattedResponse += `🔗 ${result.link}\n`;
                        if (result.description) {
                            formattedResponse += `📝 ${result.description.substring(0, 100)}${result.description.length > 100 ? '...' : ''}\n`;
                        }
                        formattedResponse += `\n`;
                    });

                    formattedResponse += `━━━━━━━━━━━━━━━━━━━━\nPowered by Google Search 🌐`;

                    await sock.sendMessage(chatId, {
                        text: formattedResponse
                    }, { quoted: msg });

                } else {
                    throw new Error('Invalid response from Google Search API');
                }

            } catch (apiError) {
                console.error('Google Search API Error:', apiError.message);

                await sock.sendMessage(chatId, {
                    text: `❌ *GOOGLE SEARCH ERROR*

Sorry, I couldn't search Google right now.

*Possible reasons:*
• API is temporarily unavailable
• Network connection issues
• Rate limit exceeded

Please try again later. 🔄`
                }, { quoted: msg });
            }

        } catch (error) {
            console.error('Google Command Error:', error);

            await sock.sendMessage(chatId, {
                text: `❌ *SYSTEM ERROR*

An unexpected error occurred while searching Google.

Please try again later. 🔧`
            }, { quoted: msg });
        }
    }
};

module.exports = googleCommand;
