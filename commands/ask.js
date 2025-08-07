const axios = require('axios');

async function askCommand(sock, chatId, message) {
    try {
        const text = message.message?.conversation || message.message?.extendedTextMessage?.text;

        // Check if this is a reply to another message
        const quotedMessage = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;

        if (!quotedMessage) {
            return await sock.sendMessage(chatId, {
                text: `❓ *ASK ABOUT MESSAGE*

Please reply to any message and use this command to ask questions about it!

*Usage:*
1. Reply to any message
2. Type: \`.ask <your question>\`

*Examples:*
• Reply to a message and type: \`.ask what does this mean?\`
• Reply to a message and type: \`.ask explain this in simple terms\`
• Reply to a message and type: \`.ask is this true?\`
• Reply to a message and type: \`.ask summarize this\`

The AI will analyze the quoted message and answer your question! 🤖`
            }, { quoted: message });
        }

        if (!text || !text.startsWith('.ask ')) {
            return await sock.sendMessage(chatId, {
                text: "❌ Please provide a question after .ask\n\nExample: .ask what does this mean?"
            }, { quoted: message });
        }

        const question = text.slice(5).trim(); // Remove '.ask '

        if (!question) {
            return await sock.sendMessage(chatId, {
                text: "❌ Please provide a question after .ask\n\nExample: .ask what does this mean?"
            }, { quoted: message });
        }

        // Extract the quoted message content
        let quotedContent = '';

        if (quotedMessage.conversation) {
            quotedContent = quotedMessage.conversation;
        } else if (quotedMessage.extendedTextMessage?.text) {
            quotedContent = quotedMessage.extendedTextMessage.text;
        } else if (quotedMessage.imageMessage?.caption) {
            quotedContent = quotedMessage.imageMessage.caption;
        } else if (quotedMessage.videoMessage?.caption) {
            quotedContent = quotedMessage.videoMessage.caption;
        } else if (quotedMessage.documentMessage?.caption) {
            quotedContent = quotedMessage.documentMessage.caption;
        } else {
            quotedContent = "[This message contains media or unsupported content]";
        }

        // Show processing message
        await sock.sendMessage(chatId, {
            react: { text: '🤔', key: message.key }
        });

        try {
            // Prepare the prompt for AI
            const prompt = `Please analyze this message and answer the question about it:

MESSAGE TO ANALYZE: "${quotedContent}"

QUESTION: ${question}

Please provide a clear and helpful response about the message.`;

            // Call the GPT API
            const response = await axios.get(`https://api.giftedtech.web.id/api/ai/gpt4o?apikey=gifted&q=${encodeURIComponent(prompt)}`);

            if (response.data && response.data.success && response.data.result) {
                const answer = response.data.result;

                // Format the response
                const formattedResponse = `❓ *MESSAGE ANALYSIS*

📝 *Original Message:*
"${quotedContent.length > 100 ? quotedContent.substring(0, 100) + '...' : quotedContent}"

❔ *Your Question:*
${question}

🤖 *AI Response:*
${answer}

━━━━━━━━━━━━━━━━━━━━
Powered by AI Analysis 🧠`;

                await sock.sendMessage(chatId, {
                    text: formattedResponse
                }, { quoted: message });

                // React with success
                await sock.sendMessage(chatId, {
                    react: { text: '✅', key: message.key }
                });

            } else {
                throw new Error('Invalid response from AI API');
            }

        } catch (apiError) {
            console.error('Ask API Error:', apiError.message);

            await sock.sendMessage(chatId, {
                text: `❌ *AI ANALYSIS ERROR*

Sorry, I couldn't analyze the message right now.

*Possible reasons:*
• AI service temporarily unavailable
• Network connection issues
• Message content too complex

Please try again later. 🔄`
            }, { quoted: message });

            // React with error
            await sock.sendMessage(chatId, {
                react: { text: '❌', key: message.key }
            });
        }

    } catch (error) {
        console.error('Ask Command Error:', error);

        await sock.sendMessage(chatId, {
            text: `❌ *SYSTEM ERROR*

An unexpected error occurred while analyzing the message.

Please try again later. 🔧`
        }, { quoted: message });
    }
}

module.exports = askCommand;
