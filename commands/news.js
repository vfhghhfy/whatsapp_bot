const axios = require('axios');

module.exports = async function (sock, chatId) {
    try {
        const apiKey = 'pub_38c62896a67f497f8fc4f9f1cea820a5';  // Replace with your NewsAPI key
        const response = await axios.get(`https://newsdata.io/api/1/latest?&apiKey=${apiKey}&country=ke&language=en`);
        const articles = response.data.results.slice(0, 5); // Get top 5 articles
        let newsMessage = '📰 *Latest News*:\n\n';
        articles.forEach((article, index) => {
            newsMessage += `${index + 1}. *${article.title}*\n${article.description}\n* ${article.link}\n* ${article.source_name}\n\n`;
        });
        await sock.sendMessage(chatId, { text: newsMessage });
    } catch (error) {
        console.error('Error fetching news:', error);
        await sock.sendMessage(chatId, { text: 'Sorry, I could not fetch news right now.' });
    }
};
