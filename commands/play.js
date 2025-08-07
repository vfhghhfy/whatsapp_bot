
const yts = require('yt-search');
const axios = require('axios');

async function playCommand(sock, chatId, message) {
    console.log('🎵 [DEBUG] playCommand called - Search only version 3.0');
    try {
        const text = message.message?.conversation || message.message?.extendedTextMessage?.text;
        const searchQuery = text.split(' ').slice(1).join(' ').trim();

        if (!searchQuery) {
            return await sock.sendMessage(chatId, {
                text: "What song do you want to search for?"
            });
        }

        // Search for the song using yt-search
        await sock.sendMessage(chatId, {
            react: { text: '🔍', key: message.key }
        });
        const { videos } = await yts(searchQuery);
        if (!videos || videos.length === 0) {
            return await sock.sendMessage(chatId, {
                text: "No songs found!"
            });
        }

        // Get the first video for download
        const firstVideo = videos[0];
        const urlYt = firstVideo.url;

        // Show search results first
        const topResults = videos.slice(0, 3);



        // Now download the first result
        await sock.sendMessage(chatId, {
            react: { text: '📥', key: message.key }
        });



        // Use Keith Vercel API for download
        try {
            console.log(`Using Keith Vercel API for: ${urlYt}`);
            const response = await axios.get(`https://apis-keith.vercel.app/download/dlmp3?url=${urlYt}`);
            const data = response.data;

            if (!data) {
                return await sock.sendMessage(chatId, {
                    text: "❌ Failed to fetch audio from API. Please try again later."
                });
            }

            const audioUrl = data.result.data.downloadUrl;
            const title = data.result.data.title;

            // Send the audio
            await sock.sendMessage(chatId, {
                audio: { url: audioUrl },
                mimetype: "audio/mpeg",
                fileName: `${title}.mp3`
            }, { quoted: message });

            // react to indicate success
            await sock.sendMessage(chatId, {
                react: { text: '✅', key: message.key }
            });
            console.log(`✅ Audio sent successfully: ${title}`);

        } catch (error) {
            console.log(`❌ Keith Vercel API failed:`, error.message);
            return await sock.sendMessage(chatId, {
                text: "❌ Failed to download audio. Please try again later."
            });
        }

    } catch (error) {
        console.error('Error in play search command:', error);
        await sock.sendMessage(chatId, {
            text: "❌ Search failed. Please try again later."
        });
    }
}

module.exports = playCommand; 