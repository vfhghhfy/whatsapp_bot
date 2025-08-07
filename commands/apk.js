const axios = require('axios');

const apkCommand = {
    name: 'apk',
    description: 'Search APK files',
    category: 'search',

    async execute(sock, msg, args) {
        const chatId = msg.key.remoteJid;
        const senderId = msg.key.participant || msg.key.remoteJid;

        try {
            // Check if user provided a search query
            if (!args || args.length === 0) {
                await sock.sendMessage(chatId, {
                    text: `📱 *APK SEARCH*

Please provide an app name to search!

*Usage:*
\`.apk <app name>\`

*Examples:*
\`.apk WhatsApp\`
\`.apk Instagram\`
\`.apk Telegram\`
\`.apk YouTube\`

Powered by APKMirror 📦`
                }, { quoted: msg });
                return;
            }

            const query = args.join(' ');

            // Send searching message
            const searchingMsg = await sock.sendMessage(chatId, {
                text: '📱 Searching APK files... 🔍'
            }, { quoted: msg });

            try {
                // API call to APK Search
                const response = await axios.get(`https://api.giftedtech.web.id/api/search/apkmirror`, {
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
                            text: `📱 *APK SEARCH*

❌ No APK files found for: "${query}"

Try using different app names or check your spelling. 🔄`
                        }, { quoted: msg });
                        return;
                    }

                    // Format the search results (show top 5)
                    let formattedResponse = `📱 *APK SEARCH RESULTS*

🔎 *Query:* ${query}

📦 *Available APKs:*\n\n`;

                    const topResults = results.slice(0, 5);
                    topResults.forEach((result, index) => {
                        formattedResponse += `${index + 1}. 📱 *${result.name || result.title}*\n`;
                        if (result.version) {
                            formattedResponse += `📋 Version: ${result.version}\n`;
                        }
                        if (result.size) {
                            formattedResponse += `💾 Size: ${result.size}\n`;
                        }
                        if (result.developer) {
                            formattedResponse += `👨‍💻 Developer: ${result.developer}\n`;
                        }
                        formattedResponse += `🔗 ${result.url || result.download_url}\n`;
                        if (result.description) {
                            formattedResponse += `📝 ${result.description.substring(0, 80)}${result.description.length > 80 ? '...' : ''}\n`;
                        }
                        formattedResponse += `\n`;
                    });

                    formattedResponse += `━━━━━━━━━━━━━━━━━━━━\nPowered by APKMirror 📦\n\n⚠️ *Note:* Download APKs only from trusted sources!`;

                    await sock.sendMessage(chatId, {
                        text: formattedResponse
                    }, { quoted: msg });

                } else {
                    throw new Error('Invalid response from APK Search API');
                }

            } catch (apiError) {
                console.error('APK Search API Error:', apiError.message);

                await sock.sendMessage(chatId, {
                    text: `❌ *APK SEARCH ERROR*

Sorry, I couldn't search for APK files right now.

*Possible reasons:*
• API is temporarily unavailable
• Network connection issues
• App not available

Please try again later. 🔄`
                }, { quoted: msg });
            }

        } catch (error) {
            console.error('APK Command Error:', error);

            await sock.sendMessage(chatId, {
                text: `❌ *SYSTEM ERROR*

An unexpected error occurred while searching APK files.

Please try again later. 🔧`
            }, { quoted: msg });
        }
    }
};

module.exports = apkCommand;
