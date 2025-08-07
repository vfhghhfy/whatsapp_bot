const axios = require('axios');

const playstoreCommand = {
    name: 'playstore',
    description: 'Search Google Play Store',
    category: 'search',

    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid;
        const senderId = msg.key.participant || msg.key.remoteJid;

        try {
            // Check if user provided a search query
            if (!args || args.length === 0) {
                await sock.sendMessage(chatId, {
                    text: `🏪 *PLAY STORE SEARCH*

Please provide an app name to search!

*Usage:*
\`.playstore <app name>\`

*Examples:*
\`.playstore WhatsApp\`
\`.playstore Instagram\`
\`.playstore Spotify\`
\`.playstore Netflix\`

Powered by Google Play Store 📱`
                }, { quoted: msg });
                return;
            }

            const query = args.join(' ');

            // Send searching message
            const searchingMsg = await sock.sendMessage(chatId, {
                text: '🏪 Searching Play Store... 🔍'
            }, { quoted: msg });

            try {
                // API call to Play Store Search
                const response = await axios.get(`https://api.giftedtech.web.id/api/search/playstore`, {
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
                            text: `🏪 *PLAY STORE SEARCH*

❌ No apps found for: "${query}"

Try using different app names or check your spelling. 🔄`
                        }, { quoted: msg });
                        return;
                    }

                    // Format the search results (show top 5)
                    let formattedResponse = `🏪 *PLAY STORE RESULTS*

🔎 *Query:* ${query}

📱 *Available Apps:*\n\n`;

                    const topResults = results.slice(0, 5);
                    topResults.forEach((result, index) => {
                        formattedResponse += `${index + 1}. 📱 *${result.name || result.title}*\n`;
                        if (result.developer) {
                            formattedResponse += `👨‍💻 Developer: ${result.developer}\n`;
                        }
                        if (result.rating) {
                            formattedResponse += `⭐ Rating: ${result.rating}\n`;
                        }
                        if (result.price) {
                            formattedResponse += `💰 Price: ${result.price}\n`;
                        }
                        if (result.category) {
                            formattedResponse += `📂 Category: ${result.category}\n`;
                        }
                        if (result.installs) {
                            formattedResponse += `📥 Installs: ${result.installs}\n`;
                        }
                        formattedResponse += `🔗 ${result.link}\n`;
                        if (result.description) {
                            formattedResponse += `📝 ${result.description.substring(0, 100)}${result.description.length > 100 ? '...' : ''}\n`;
                        }
                        formattedResponse += `\n`;
                    });

                    formattedResponse += `━━━━━━━━━━━━━━━━━━━━\nPowered by Google Play Store 🏪`;

                    await sock.sendMessage(chatId, {
                        text: formattedResponse
                    }, { quoted: msg });

                } else {
                    throw new Error('Invalid response from Play Store Search API');
                }

            } catch (apiError) {
                console.error('Play Store Search API Error:', apiError.message);

                await sock.sendMessage(chatId, {
                    text: `❌ *PLAY STORE SEARCH ERROR*

Sorry, I couldn't search the Play Store right now.

*Possible reasons:*
• API is temporarily unavailable
• Network connection issues
• App not available in your region

Please try again later. 🔄`
                }, { quoted: msg });
            }

        } catch (error) {
            console.error('Play Store Command Error:', error);

            await sock.sendMessage(chatId, {
                text: `❌ *SYSTEM ERROR*

An unexpected error occurred while searching Play Store.

Please try again later. 🔧`
            }, { quoted: msg });
        }
    }
};

module.exports = playstoreCommand;
