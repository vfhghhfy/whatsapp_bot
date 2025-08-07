// Quick test for the 2pm format
const reminderCommand = require('./commands/reminder');

const mockSock = {
    sendMessage: async (chatId, message) => {
        console.log(`📤 Message:`, message.text);
        return { messageId: 'test' };
    }
};

function createMockMessage(text) {
    return {
        key: {
            remoteJid: '1234567890@s.whatsapp.net'
        },
        pushName: 'TestUser'
    };
}

async function testSpecific() {
    console.log('Testing: ".reminder set Team meeting at 2pm"');

    const args = ['set', 'Team', 'meeting', 'at', '2pm'];
    const message = createMockMessage();
    const context = {
        isGroup: false,
        isAdmin: true,
        groupMetadata: null,
        pushName: 'TestUser',
        sender: '1234567890@s.whatsapp.net'
    };

    try {
        await reminderCommand.execute(mockSock, message, args, context);
        console.log('✅ Test passed');
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

testSpecific();
