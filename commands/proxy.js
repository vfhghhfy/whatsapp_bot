const fetch = require('node-fetch');

async function proxyCommand(sock, chatId, message) {
    try {
        // Send initial message indicating we're fetching proxies
        await sock.sendMessage(chatId, {
            text: '🔄 Fetching fresh proxy list...'
        }, { quoted: message });

        const response = await fetch('https://api.giftedtech.web.id/api/tools/proxy?apikey=gifted');

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        if (!data.success || !data.results || data.results.length === 0) {
            throw new Error('No proxies found in response');
        }

        // Filter out invalid entries and get top 10 fresh proxies
        const validProxies = data.results.filter(proxy =>
            proxy.ip &&
            proxy.port &&
            proxy.country &&
            proxy.ip !== '0.0.0.0' &&
            proxy.ip !== '127.0.0.7' &&
            !proxy.ip.includes('2025-') &&
            proxy.ip !== 'Total' &&
            proxy.ip !== 'US' &&
            proxy.ip !== 'SG' &&
            proxy.ip !== '' &&
            !isNaN(proxy.port) &&
            proxy.country !== 'Unknown' &&
            proxy.country !== ''
        ).slice(0, 10);

        if (validProxies.length === 0) {
            throw new Error('No valid proxies found');
        }

        // Format the proxy list
        let proxyMessage = `🌐 *FRESH PROXY LIST* 🌐\n\n`;
        proxyMessage += `📊 *Total Found:* ${data.results.length} proxies\n`;
        proxyMessage += `✅ *Showing Top:* ${validProxies.length} proxies\n\n`;

        validProxies.forEach((proxy, index) => {
            const httpsIcon = proxy.https === 'yes' ? '🔒' : '🔓';
            const googleIcon = proxy.google === 'yes' ? '✅' : '❌';
            const anonymityIcon = proxy.anonymity === 'elite proxy' ? '🔐' :
                proxy.anonymity === 'anonymous' ? '🕶️' : '👁️';

            proxyMessage += `*${index + 1}.* ${proxy.ip}:${proxy.port}\n`;
            proxyMessage += `   🌍 ${proxy.country} (${proxy.code})\n`;
            proxyMessage += `   ${anonymityIcon} ${proxy.anonymity}\n`;
            proxyMessage += `   ${httpsIcon} HTTPS: ${proxy.https}\n`;
            proxyMessage += `   ${googleIcon} Google: ${proxy.google}\n`;
            proxyMessage += `   ⏰ Last: ${proxy.last}\n\n`;
        });

        proxyMessage += `📝 *Legend:*\n`;
        proxyMessage += `🔐 Elite Proxy | 🕶️ Anonymous | 👁️ Transparent\n`;
        proxyMessage += `🔒 HTTPS Yes | 🔓 HTTPS No\n`;
        proxyMessage += `✅ Google Works | ❌ Google Blocked\n\n`;


        const buttons = [
            { buttonId: '.proxy', buttonText: { displayText: '🔄 Refresh List' }, type: 1 },
            { buttonId: '.help', buttonText: { displayText: '📋 Commands' }, type: 1 }
        ];

        await sock.sendMessage(chatId, {
            text: proxyMessage,
            buttons: buttons,
            headerType: 1
        }, { quoted: message });

    } catch (error) {
        console.error('Error in proxy command:', error);
        await sock.sendMessage(chatId, {
            text: `❌ *Failed to fetch proxy list*\n\n*Error:* ${error.message}\n\nPlease try again later or check your internet connection.`
        }, { quoted: message });
    }
}

module.exports = proxyCommand;
