const fetch = require('node-fetch');

async function lyricsCommand(sock, chatId, songTitle) {
    if (!songTitle) {
        await sock.sendMessage(chatId, {
            text: '🔍 Please enter a song name, artist, or search term to get lyrics!\n\n*Usage:* lyrics <search term>\n*Examples:*\n- lyrics God\'s Plan\n- lyrics Drake\n- lyrics Drake God\'s Plan'
        });
        return;
    }

    try {
        // Clean the search term
        const cleanSearch = songTitle.toLowerCase().replace(/[^\w\s]/gi, ' ').trim();

        // First, try to find songs using the suggest API
        const suggestUrl = `https://api.lyrics.ovh/suggest/${encodeURIComponent(cleanSearch)}`;
        const suggestRes = await fetch(suggestUrl);

        if (!suggestRes.ok) {
            // If suggest API fails, try direct search assuming it's "artist song" format
            const words = cleanSearch.split(' ');
            if (words.length >= 2) {
                const artist = words[0];
                const song = words.slice(1).join(' ');

                const directUrl = `https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(song)}`;
                const directRes = await fetch(directUrl);

                if (directRes.ok) {
                    const directJson = await directRes.json();
                    if (directJson.lyrics) {
                        let lyrics = directJson.lyrics.trim();
                        if (lyrics.length > 4000) {
                            lyrics = lyrics.substring(0, 4000) + "...\n\n*[Lyrics truncated due to length]*";
                        }

                        await sock.sendMessage(chatId, {
                            text: `🎵 *Song Lyrics* 🎶\n\n▢ *Search:* ${songTitle}\n▢ *Found:* ${artist} - ${song}\n\n📜 *Lyrics:*\n${lyrics}\n\nHope you enjoy the music! 🎧 🎶`
                        });
                        return;
                    }
                }
            }

            await sock.sendMessage(chatId, {
                text: `❌ Sorry, I couldn't find any songs matching "${songTitle}".\n\n💡 *Tips:*\n• Try including both artist and song name\n• Check spelling\n• Example: "Drake God's Plan"`
            });
            return;
        }

        const suggestJson = await suggestRes.json();

        if (!suggestJson.data || suggestJson.data.length === 0) {
            await sock.sendMessage(chatId, {
                text: `❌ No songs found for "${songTitle}". Try a different search term or check spelling.`
            });
            return;
        }

        // Get the first (best) match
        const bestMatch = suggestJson.data[0];
        const artist = bestMatch.artist.name;
        const song = bestMatch.title;

        // Now get the lyrics for this song
        const lyricsUrl = `https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(song)}`;
        const lyricsRes = await fetch(lyricsUrl);

        if (!lyricsRes.ok) {
            // Show other suggestions if available
            let suggestions = `❌ Couldn't get lyrics for the top match, but here are some options:\n\n`;
            suggestJson.data.slice(0, 5).forEach((item, index) => {
                suggestions += `${index + 1}. ${item.artist.name} - ${item.title}\n`;
            });
            suggestions += `\nTry searching with: "lyrics [Artist] [Song]"`;

            await sock.sendMessage(chatId, { text: suggestions });
            return;
        }

        const lyricsJson = await lyricsRes.json();

        if (!lyricsJson.lyrics) {
            await sock.sendMessage(chatId, {
                text: `❌ Found "${artist} - ${song}" but lyrics are not available.`
            });
            return;
        }

        // Format and send lyrics
        let lyrics = lyricsJson.lyrics.trim();
        if (lyrics.length > 4000) {
            lyrics = lyrics.substring(0, 4000) + "...\n\n*[Lyrics truncated due to length]*";
        }

        await sock.sendMessage(chatId, {
            text: `🎵 *Song Lyrics* 🎶\n\n▢ *Artist:* ${artist}\n▢ *Song:* ${song}\n\n📜 *Lyrics:*\n${lyrics}\n\nHope you enjoy the music! 🎧 🎶`
        });

    } catch (error) {
        console.error('Error in lyrics command:', error);
        await sock.sendMessage(chatId, {
            text: `❌ An error occurred while searching for lyrics. Please try again with a different search term.`
        });
    }
}

module.exports = { lyricsCommand };
