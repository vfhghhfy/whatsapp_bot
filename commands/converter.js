/*
Currency and Unit Converter Command
Supports real-time currency conversion and various unit conversions
*/

const axios = require('axios');

// Exchange rate API endpoint (free tier)
const EXCHANGE_API_URL = 'https://api.exchangerate-api.com/v4/latest/USD';

// Unit conversion data
const UNIT_CONVERSIONS = {
    length: {
        name: 'Length',
        symbol: '📏',
        units: {
            mm: { name: 'Millimeter', factor: 1 },
            cm: { name: 'Centimeter', factor: 10 },
            m: { name: 'Meter', factor: 1000 },
            km: { name: 'Kilometer', factor: 1000000 },
            in: { name: 'Inch', factor: 25.4 },
            ft: { name: 'Foot', factor: 304.8 },
            yd: { name: 'Yard', factor: 914.4 },
            mi: { name: 'Mile', factor: 1609344 }
        }
    },
    weight: {
        name: 'Weight',
        symbol: '⚖️',
        units: {
            mg: { name: 'Milligram', factor: 1 },
            g: { name: 'Gram', factor: 1000 },
            kg: { name: 'Kilogram', factor: 1000000 },
            oz: { name: 'Ounce', factor: 28349.5 },
            lb: { name: 'Pound', factor: 453592 },
            ton: { name: 'Metric Ton', factor: 1000000000 }
        }
    },
    temperature: {
        name: 'Temperature',
        symbol: '🌡️',
        units: {
            c: { name: 'Celsius' },
            f: { name: 'Fahrenheit' },
            k: { name: 'Kelvin' }
        }
    },
    volume: {
        name: 'Volume',
        symbol: '🥤',
        units: {
            ml: { name: 'Milliliter', factor: 1 },
            l: { name: 'Liter', factor: 1000 },
            cup: { name: 'Cup', factor: 236.588 },
            pt: { name: 'Pint', factor: 473.176 },
            qt: { name: 'Quart', factor: 946.353 },
            gal: { name: 'Gallon', factor: 3785.41 },
            floz: { name: 'Fluid Ounce', factor: 29.5735 }
        }
    },
    area: {
        name: 'Area',
        symbol: '📐',
        units: {
            sqmm: { name: 'Square Millimeter', factor: 1 },
            sqcm: { name: 'Square Centimeter', factor: 100 },
            sqm: { name: 'Square Meter', factor: 1000000 },
            sqkm: { name: 'Square Kilometer', factor: 1000000000000 },
            sqin: { name: 'Square Inch', factor: 645.16 },
            sqft: { name: 'Square Foot', factor: 92903 },
            acre: { name: 'Acre', factor: 4046860000 }
        }
    }
};

// Popular currency codes
const POPULAR_CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'CNY', 'INR', 'KES', 'NGN', 'ZAR'];

async function converterCommand(sock, chatId, message) {
    try {
        const text = message.message?.conversation || message.message?.extendedTextMessage?.text;
        const args = text.split(' ').slice(1);
        const command = args[0]?.toLowerCase();

        if (!command || !['currency', 'convert', 'length', 'weight', 'temp', 'volume', 'area'].includes(command)) {
            const helpText = `*Currency & Unit Converter* 💱

*Currency Commands:*
• \`.convert currency <amount> <from> <to>\`
• \`.convert currency 100 USD EUR\`

*Unit Commands:*
• \`.convert length <amount> <from> <to>\`
• \`.convert weight <amount> <from> <to>\`
• \`.convert temp <amount> <from> <to>\`
• \`.convert volume <amount> <from> <to>\`
• \`.convert area <amount> <from> <to>\`

*Examples:*
• \`.convert currency 100 USD KES\`
• \`.convert length 5 ft m\`
• \`.convert weight 10 kg lb\`
• \`.convert temp 25 c f\`
• \`.convert volume 1 l ml\`

*Supported Units:*
📏 **Length:** mm, cm, m, km, in, ft, yd, mi
⚖️ **Weight:** mg, g, kg, oz, lb, ton  
🌡️ **Temperature:** c, f, k
🥤 **Volume:** ml, l, cup, pt, qt, gal, floz
📐 **Area:** sqmm, sqcm, sqm, sqkm, sqin, sqft, acre

*Popular Currencies:*
💰 USD, EUR, GBP, JPY, AUD, CAD, CHF, CNY, INR, KES, NGN, ZAR

> _Powered by Knight Bot MD_`;

            return await sock.sendMessage(chatId, { text: helpText });
        }

        // Currency Conversion
        if (command === 'currency') {
            const amount = parseFloat(args[1]);
            const fromCurrency = args[2]?.toUpperCase();
            const toCurrency = args[3]?.toUpperCase();

            if (!amount || isNaN(amount) || !fromCurrency || !toCurrency) {
                return await sock.sendMessage(chatId, {
                    text: "❌ Invalid format!\n\n*Usage:* `.convert currency <amount> <from> <to>`\n*Example:* `.convert currency 100 USD EUR`"
                });
            }

            try {
                await sock.sendMessage(chatId, {
                    text: "🔄 Getting latest exchange rates..."
                }, { quoted: message });

                // Fetch exchange rates
                const response = await axios.get(EXCHANGE_API_URL, { timeout: 10000 });
                const rates = response.data.rates;

                if (!rates[fromCurrency] && fromCurrency !== 'USD') {
                    return await sock.sendMessage(chatId, {
                        text: `❌ Currency "${fromCurrency}" not supported!\n\n*Popular currencies:* ${POPULAR_CURRENCIES.join(', ')}`
                    });
                }

                if (!rates[toCurrency] && toCurrency !== 'USD') {
                    return await sock.sendMessage(chatId, {
                        text: `❌ Currency "${toCurrency}" not supported!\n\n*Popular currencies:* ${POPULAR_CURRENCIES.join(', ')}`
                    });
                }

                // Convert currency
                let convertedAmount;
                if (fromCurrency === 'USD') {
                    convertedAmount = amount * (rates[toCurrency] || 1);
                } else if (toCurrency === 'USD') {
                    convertedAmount = amount / rates[fromCurrency];
                } else {
                    // Convert through USD
                    const usdAmount = amount / rates[fromCurrency];
                    convertedAmount = usdAmount * rates[toCurrency];
                }

                const rate = convertedAmount / amount;
                const resultText = `*Currency Conversion* 💱\n\n` +
                    `💰 **${amount.toLocaleString()} ${fromCurrency}** = **${convertedAmount.toFixed(2)} ${toCurrency}**\n\n` +
                    `📊 *Exchange Rate:* 1 ${fromCurrency} = ${rate.toFixed(4)} ${toCurrency}\n` +
                    `🕐 *Updated:* ${new Date().toLocaleString()}\n\n` +
                    `> _Powered by Knight Bot MD_`;

                await sock.sendMessage(chatId, { text: resultText });

            } catch (error) {
                console.error('Currency conversion error:', error);
                await sock.sendMessage(chatId, {
                    text: "❌ Failed to get exchange rates. Please try again later."
                });
            }
        }

        // Unit Conversions
        else if (['length', 'weight', 'temp', 'volume', 'area'].includes(command)) {
            const amount = parseFloat(args[1]);
            const fromUnit = args[2]?.toLowerCase();
            const toUnit = args[3]?.toLowerCase();

            if (!amount || isNaN(amount) || !fromUnit || !toUnit) {
                const category = UNIT_CONVERSIONS[command];
                const unitList = Object.keys(category.units).join(', ');
                return await sock.sendMessage(chatId, {
                    text: `❌ Invalid format!\n\n*Usage:* \`.convert ${command} <amount> <from> <to>\`\n*Example:* \`.convert ${command} 10 ${Object.keys(category.units)[0]} ${Object.keys(category.units)[1]}\`\n\n*Available units:* ${unitList}`
                });
            }

            const category = UNIT_CONVERSIONS[command];

            if (!category.units[fromUnit]) {
                const unitList = Object.keys(category.units).join(', ');
                return await sock.sendMessage(chatId, {
                    text: `❌ Unit "${fromUnit}" not supported for ${category.name}!\n\n*Available units:* ${unitList}`
                });
            }

            if (!category.units[toUnit]) {
                const unitList = Object.keys(category.units).join(', ');
                return await sock.sendMessage(chatId, {
                    text: `❌ Unit "${toUnit}" not supported for ${category.name}!\n\n*Available units:* ${unitList}`
                });
            }

            let convertedAmount;

            // Special handling for temperature
            if (command === 'temp') {
                convertedAmount = convertTemperature(amount, fromUnit, toUnit);
            } else {
                // Standard unit conversion using factors
                const fromFactor = category.units[fromUnit].factor;
                const toFactor = category.units[toUnit].factor;
                convertedAmount = (amount * fromFactor) / toFactor;
            }

            const resultText = `*${category.name} Conversion* ${category.symbol}\n\n` +
                `📏 **${amount} ${category.units[fromUnit].name}** = **${convertedAmount.toFixed(6).replace(/\.?0+$/, '')} ${category.units[toUnit].name}**\n\n` +
                `🔄 *Conversion:* ${amount} ${fromUnit.toUpperCase()} → ${convertedAmount.toFixed(6).replace(/\.?0+$/, '')} ${toUnit.toUpperCase()}\n\n` +
                `> _Powered by Knight Bot MD_`;

            await sock.sendMessage(chatId, { text: resultText });
        }

    } catch (error) {
        console.error('Converter Command Error:', error);
        await sock.sendMessage(chatId, {
            text: "❌ An error occurred while processing your request. Please try again."
        });
    }
}

// Temperature conversion function
function convertTemperature(amount, fromUnit, toUnit) {
    let celsius;

    // Convert to Celsius first
    switch (fromUnit) {
        case 'c':
            celsius = amount;
            break;
        case 'f':
            celsius = (amount - 32) * 5 / 9;
            break;
        case 'k':
            celsius = amount - 273.15;
            break;
    }

    // Convert from Celsius to target unit
    switch (toUnit) {
        case 'c':
            return celsius;
        case 'f':
            return celsius * 9 / 5 + 32;
        case 'k':
            return celsius + 273.15;
    }
}

module.exports = converterCommand;
