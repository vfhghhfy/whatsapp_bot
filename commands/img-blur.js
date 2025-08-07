const { downloadMediaMessage } = require('@whiskeysockets/baileys');
const axios = require('axios');
let sharp;
try {
    sharp = require('sharp');
} catch (error) {
    console.log('Sharp module not available, blur feature will be limited');
    sharp = null;
}

async function blurCommand(sock, chatId, message, quotedMessage) {
    try {
        if (!sharp) {
            await sock.sendMessage(chatId, {
                text: '❌ Sorry, blur feature is not available due to missing dependencies.'
            });
            return;
        }

        // Get the image to blur
        let imageBuffer;

        if (quotedMessage) {
            // If replying to a message
            if (!quotedMessage.imageMessage) {
                await sock.sendMessage(chatId, {
                    text: '❌ Please reply to an image message'
                });
                return;
            }

            const quoted = {
                message: {
                    imageMessage: quotedMessage.imageMessage
                }
            };

            imageBuffer = await downloadMediaMessage(
                quoted,
                'buffer',
                {},
                {}
            );
        } else if (message.message?.imageMessage) {
            // If image is in current message
            imageBuffer = await downloadMediaMessage(
                message,
                'buffer',
                {},
                {}
            );
        } else {
            await sock.sendMessage(chatId, {
                text: '❌ Please reply to an image or send an image with caption .blur'
            });
            return;
        }

        // Resize and optimize image
        const resizedImage = await sharp(imageBuffer)
            .resize(800, 800, { // Resize to max 800x800
                fit: 'inside',
                withoutEnlargement: true
            })
            .jpeg({ quality: 80 }) // Convert to JPEG with 80% quality
            .toBuffer();

        // Apply blur effect directly using sharp
        const blurredImage = await sharp(resizedImage)
            .blur(10) // Blur radius of 10
            .toBuffer();

        // Send the blurred image
        await sock.sendMessage(chatId, {
            image: blurredImage,
            caption: '*[ ✔ ] Image Blurred Successfully*',
            contextInfo: {
                forwardingScore: 1,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: '120363161513685998@newsletter',
                    newsletterName: 'KnightBot MD',
                    serverMessageId: -1
                }
            }
        });

    } catch (error) {
        console.error('Error in blur command:', error);
        await sock.sendMessage(chatId, {
            text: '❌ An error occurred while processing the blur command.'
        });
    }
}

module.exports = blurCommand;